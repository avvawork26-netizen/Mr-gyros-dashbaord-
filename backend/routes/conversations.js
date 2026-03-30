/**
 * Conversations Routes
 * GET  /api/conversations/:leadId  — get full conversation history for a lead
 * POST /api/conversations/:leadId  — manually add a message (for testing/admin)
 */
const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/conversations/:leadId
router.get('/:leadId', (req, res) => {
  try {
    const lead = db.prepare('SELECT id FROM leads WHERE id = ?').get(req.params.leadId);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const messages = db.prepare(`
      SELECT * FROM conversations
      WHERE lead_id = ?
      ORDER BY created_at ASC
    `).all(req.params.leadId);

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/conversations/:leadId — manually insert a message
router.post('/:leadId', (req, res) => {
  try {
    const { role, message } = req.body;
    if (!role || !message) return res.status(400).json({ error: 'role and message are required' });
    if (!['user', 'assistant'].includes(role)) {
      return res.status(400).json({ error: 'role must be "user" or "assistant"' });
    }

    const lead = db.prepare('SELECT id FROM leads WHERE id = ?').get(req.params.leadId);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const result = db.prepare(
      'INSERT INTO conversations (lead_id, role, message) VALUES (?, ?, ?)'
    ).run(req.params.leadId, role, message);

    const msg = db.prepare('SELECT * FROM conversations WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
