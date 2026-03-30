/**
 * Leads Routes — CRUD for lead management
 * GET    /api/leads          — list all leads (supports ?status= ?urgency= filters)
 * GET    /api/leads/:id      — get single lead
 * POST   /api/leads          — create lead manually
 * PATCH  /api/leads/:id      — update lead fields
 * DELETE /api/leads/:id      — delete lead
 */
const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/leads
router.get('/', (req, res) => {
  try {
    const { status, urgency, escalation_ready } = req.query;
    const conditions = [];
    const params = [];

    if (status) { conditions.push('status = ?'); params.push(status); }
    if (urgency) { conditions.push('urgency = ?'); params.push(urgency); }
    if (escalation_ready !== undefined) {
      conditions.push('escalation_ready = ?');
      params.push(escalation_ready === 'true' || escalation_ready === '1' ? 1 : 0);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const leads = db.prepare(`SELECT * FROM leads ${where} ORDER BY updated_at DESC`).all(...params);
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/leads/:id
router.get('/:id', (req, res) => {
  try {
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/leads
router.post('/', (req, res) => {
  try {
    const { name, email, phone, source, intent, budget, timeline, area, preApproval, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const result = db.prepare(`
      INSERT INTO leads (name, email, phone, source, intent, budget, timeline, area, pre_approval, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      email || null,
      phone || null,
      source || 'manual',
      intent || 'unknown',
      budget || null,
      timeline || null,
      area || null,
      preApproval || 'unknown',
      notes || null
    );

    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/leads/:id — partial update, accepts camelCase or snake_case field names
router.patch('/:id', (req, res) => {
  try {
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    // Map of accepted body keys (camelCase) → DB column names (snake_case)
    const FIELD_MAP = {
      name: 'name',
      email: 'email',
      phone: 'phone',
      source: 'source',
      intent: 'intent',
      budget: 'budget',
      timeline: 'timeline',
      area: 'area',
      preApproval: 'pre_approval',
      pre_approval: 'pre_approval',
      status: 'status',
      urgency: 'urgency',
      escalationReady: 'escalation_ready',
      escalation_ready: 'escalation_ready',
      notes: 'notes',
    };

    const updates = [];
    const values = [];

    Object.entries(req.body).forEach(([key, value]) => {
      const col = FIELD_MAP[key];
      if (col) {
        updates.push(`${col} = ?`);
        // Coerce booleans for the escalation_ready column
        values.push(col === 'escalation_ready' ? (value ? 1 : 0) : value);
      }
    });

    if (updates.length === 0) return res.status(400).json({ error: 'No valid fields to update' });

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);

    db.prepare(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    const updated = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/leads/:id
router.delete('/:id', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Lead not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
