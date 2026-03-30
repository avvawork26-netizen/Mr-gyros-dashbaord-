/**
 * Chat Route — the core of Ava's lead engagement.
 *
 * POST /api/chat
 * Body (new lead):      { name, phone?, message }
 * Body (existing lead): { leadId, message }
 *
 * Flow:
 *   1. Identify or create the lead
 *   2. Save the user's message to conversation history
 *   3. Call Ava (Claude) to generate a response
 *   4. Save Ava's response to conversation history
 *   5. Every 2 messages, extract lead qualification data and update the lead record
 *   6. Schedule follow-ups if this is a new lead
 *   7. Return Ava's response + updated lead data
 */
const express = require('express');
const router = express.Router();
const db = require('../database/db');
const ava = require('../services/ava');
const { scheduleFollowUps, cancelFollowUps } = require('../services/followupScheduler');

// POST /api/chat
router.post('/', async (req, res) => {
  try {
    const { leadId, message, name, phone } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }

    let lead;
    let isNewLead = false;

    // ── 1. Get or create lead ─────────────────────────────────────────────
    if (leadId) {
      lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
      if (!lead) return res.status(404).json({ error: 'Lead not found' });
    } else {
      // New lead — we need at least a name
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'name is required for new leads' });
      }

      const result = db.prepare(`
        INSERT INTO leads (name, phone, source, status)
        VALUES (?, ?, 'chat', 'active')
      `).run(name.trim(), phone || null);

      lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid);
      isNewLead = true;

      // Schedule Day 1/3/7 follow-ups for new leads
      scheduleFollowUps(lead.id);
      console.log(`[Chat] New lead created: #${lead.id} — ${lead.name}`);
    }

    // ── 2. Save user message ──────────────────────────────────────────────
    db.prepare(
      'INSERT INTO conversations (lead_id, role, message) VALUES (?, ?, ?)'
    ).run(lead.id, 'user', message.trim());

    // Update last-active timestamp
    db.prepare(`UPDATE leads SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(lead.id);

    // ── 3. Fetch full conversation history ───────────────────────────────
    const history = db.prepare(`
      SELECT role, message FROM conversations
      WHERE lead_id = ? ORDER BY created_at ASC
    `).all(lead.id);

    // ── 4. Generate Ava's response ───────────────────────────────────────
    const avaResponse = await ava.chat(history);

    // ── 5. Save Ava's response ───────────────────────────────────────────
    db.prepare(
      'INSERT INTO conversations (lead_id, role, message) VALUES (?, ?, ?)'
    ).run(lead.id, 'assistant', avaResponse);

    // ── 6. Extract qualification data (every 2 user messages) ───────────
    // Count user messages to decide when to re-run extraction
    const userMsgCount = history.filter((m) => m.role === 'user').length;
    if (userMsgCount % 2 === 0 || userMsgCount >= 3) {
      // Run qualification extraction asynchronously — don't block the response
      extractAndUpdateQualification(lead.id);
    }

    // ── 7. Return response ───────────────────────────────────────────────
    // Refresh lead from DB to include any updates
    const updatedLead = db.prepare('SELECT * FROM leads WHERE id = ?').get(lead.id);

    res.json({
      leadId: lead.id,
      response: avaResponse,
      lead: updatedLead,
      isNewLead,
    });
  } catch (err) {
    console.error('[Chat] Error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

/**
 * Run lead qualification extraction in the background and update the lead record.
 * This is intentionally async/non-blocking so it doesn't delay the chat response.
 */
async function extractAndUpdateQualification(leadId) {
  try {
    const history = db.prepare(`
      SELECT role, message FROM conversations
      WHERE lead_id = ? ORDER BY created_at ASC
    `).all(leadId);

    const qualification = await ava.extractLeadQualification(history);
    if (!qualification) return;

    // Build update — only overwrite if we have new data (don't wipe existing values)
    const updates = [];
    const values = [];

    if (qualification.intent && qualification.intent !== 'unknown') {
      updates.push('intent = ?'); values.push(qualification.intent);
    }
    if (qualification.budget) {
      updates.push('budget = ?'); values.push(qualification.budget);
    }
    if (qualification.timeline) {
      updates.push('timeline = ?'); values.push(qualification.timeline);
    }
    if (qualification.area) {
      updates.push('area = ?'); values.push(qualification.area);
    }
    if (qualification.preApproval && qualification.preApproval !== 'unknown') {
      updates.push('pre_approval = ?'); values.push(qualification.preApproval);
    }

    updates.push('urgency = ?'); values.push(qualification.urgency);
    updates.push('escalation_ready = ?'); values.push(qualification.escalationReady ? 1 : 0);

    if (qualification.notes) {
      updates.push('notes = ?'); values.push(qualification.notes);
    }

    if (qualification.escalationReady) {
      updates.push("status = 'escalated'");
      // Cancel pending follow-ups — Ayoub will take it from here
      cancelFollowUps(leadId);
      console.log(`[Chat] Lead #${leadId} is escalation-ready!`);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(leadId);

    db.prepare(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  } catch (err) {
    console.error(`[Chat] Qualification extraction error for lead #${leadId}:`, err.message);
  }
}

module.exports = router;
