/**
 * Follow-up Routes
 * GET   /api/followups         — list follow-ups (supports ?status= ?lead_id= filters)
 * PATCH /api/followups/:id     — update follow-up status (mark sent/cancelled)
 * POST  /api/followups/process — manually trigger due follow-up processing (admin)
 */
const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { processDueFollowUps } = require('../services/followupScheduler');

// GET /api/followups
router.get('/', (req, res) => {
  try {
    const { status, lead_id } = req.query;
    const conditions = [];
    const params = [];

    if (status) { conditions.push('f.status = ?'); params.push(status); }
    if (lead_id) { conditions.push('f.lead_id = ?'); params.push(lead_id); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const followups = db.prepare(`
      SELECT f.*, l.name as lead_name, l.phone as lead_phone, l.urgency as lead_urgency
      FROM followups f
      JOIN leads l ON l.id = f.lead_id
      ${where}
      ORDER BY f.scheduled_date ASC
    `).all(...params);

    res.json(followups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/followups/:id
router.patch('/:id', (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['pending', 'sent', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'status must be pending | sent | cancelled' });
    }

    const followup = db.prepare('SELECT id FROM followups WHERE id = ?').get(req.params.id);
    if (!followup) return res.status(404).json({ error: 'Follow-up not found' });

    db.prepare(`
      UPDATE followups SET status = ?, sent_at = CASE WHEN ? = 'sent' THEN datetime('now') ELSE sent_at END
      WHERE id = ?
    `).run(status, status, req.params.id);

    const updated = db.prepare('SELECT * FROM followups WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/followups/process — manually trigger follow-up processing
router.post('/process', async (req, res) => {
  try {
    await processDueFollowUps();
    res.json({ success: true, message: 'Follow-up processing complete' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
