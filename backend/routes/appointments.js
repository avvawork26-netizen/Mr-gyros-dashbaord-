/**
 * Appointments Routes
 * GET    /api/appointments                — list all appointments (supports ?date= filter)
 * GET    /api/appointments/slots/:date    — get available slots for a given date
 * GET    /api/appointments/:id            — get single appointment
 * POST   /api/appointments               — book an appointment
 * PATCH  /api/appointments/:id           — update appointment status/notes
 * DELETE /api/appointments/:id           — cancel appointment
 */
const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Ayoub's availability: Mon–Fri, 9am–5pm EST in 1-hour slots
const WORK_DAYS = [1, 2, 3, 4, 5]; // Mon=1 ... Fri=5 (JS: 0=Sun)
const HOURS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

/**
 * Get available time slots for a specific date.
 * Removes slots already booked.
 */
function getAvailableSlots(dateStr) {
  const date = new Date(dateStr + 'T12:00:00'); // Use noon to avoid TZ edge cases
  const dayOfWeek = date.getDay();

  if (!WORK_DAYS.includes(dayOfWeek)) return []; // Weekends are unavailable

  const booked = db.prepare(`
    SELECT time FROM appointments
    WHERE date = ? AND status != 'cancelled'
  `).all(dateStr).map((r) => r.time);

  return HOURS.filter((h) => !booked.includes(h));
}

// GET /api/appointments
router.get('/', (req, res) => {
  try {
    const { date, lead_id, status } = req.query;
    const conditions = [];
    const params = [];

    if (date) { conditions.push('a.date = ?'); params.push(date); }
    if (lead_id) { conditions.push('a.lead_id = ?'); params.push(lead_id); }
    if (status) { conditions.push('a.status = ?'); params.push(status); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const appointments = db.prepare(`
      SELECT a.*, l.name as lead_name, l.phone as lead_phone, l.email as lead_email
      FROM appointments a
      JOIN leads l ON l.id = a.lead_id
      ${where}
      ORDER BY a.date ASC, a.time ASC
    `).all(...params);

    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/appointments/slots/:date — e.g. /api/appointments/slots/2025-06-10
router.get('/slots/:date', (req, res) => {
  try {
    const slots = getAvailableSlots(req.params.date);
    res.json({ date: req.params.date, availableSlots: slots });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/appointments/:id
router.get('/:id', (req, res) => {
  try {
    const appt = db.prepare(`
      SELECT a.*, l.name as lead_name, l.phone as lead_phone, l.email as lead_email
      FROM appointments a JOIN leads l ON l.id = a.lead_id
      WHERE a.id = ?
    `).get(req.params.id);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    res.json(appt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/appointments — book an appointment
router.post('/', (req, res) => {
  try {
    const { leadId, date, time, type, notes } = req.body;
    if (!leadId || !date || !time) {
      return res.status(400).json({ error: 'leadId, date, and time are required' });
    }

    // Verify lead exists
    const lead = db.prepare('SELECT id FROM leads WHERE id = ?').get(leadId);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    // Check slot availability
    const available = getAvailableSlots(date);
    if (!available.includes(time)) {
      return res.status(409).json({ error: `Time slot ${time} on ${date} is not available` });
    }

    const result = db.prepare(`
      INSERT INTO appointments (lead_id, date, time, type, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(leadId, date, time, type || 'consultation', notes || null);

    const appt = db.prepare(`
      SELECT a.*, l.name as lead_name FROM appointments a JOIN leads l ON l.id = a.lead_id
      WHERE a.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(appt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/appointments/:id
router.patch('/:id', (req, res) => {
  try {
    const appt = db.prepare('SELECT id FROM appointments WHERE id = ?').get(req.params.id);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });

    const FIELDS = { status: 'status', notes: 'notes', type: 'type' };
    const updates = [];
    const values = [];

    Object.entries(req.body).forEach(([key, val]) => {
      if (FIELDS[key]) { updates.push(`${FIELDS[key]} = ?`); values.push(val); }
    });

    if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });
    values.push(req.params.id);

    db.prepare(`UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    const updated = db.prepare(`
      SELECT a.*, l.name as lead_name FROM appointments a JOIN leads l ON l.id = a.lead_id
      WHERE a.id = ?
    `).get(req.params.id);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM appointments WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
