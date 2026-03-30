/**
 * Follow-up Scheduler Service
 *
 * When a new lead is created, schedules automatic follow-up messages at:
 *   Day 1  — gentle check-in
 *   Day 3  — value nudge
 *   Day 7  — final re-engagement
 *
 * A cron job runs every hour to check for due follow-ups and "send" them
 * (inserts them as assistant messages in the conversation and marks the
 * follow-up record as sent).
 */
const cron = require('node-cron');
const db = require('../database/db');
const ava = require('./ava');

// Follow-up message templates — Ava will personalize these via Claude
const FOLLOWUP_TEMPLATES = {
  day1: "Hi {name}! Just wanted to check in and see if you had any questions from our chat. I'm here whenever you're ready to take the next step on your Florida real estate journey! 🌴",
  day3: "Hey {name}! Ayoub asked me to reach out — the market is moving fast right now, especially in the areas you mentioned. Would love to get you set up with a quick call so he can share some listings that might be a perfect fit!",
  day7: "Hi {name}! It's Ava again. I know life gets busy, but I didn't want you to miss out on some great opportunities coming up. Are you still thinking about {intent} in Florida? Even a quick 15-minute chat with Ayoub could make all the difference. What do you say?",
};

/**
 * Schedule Day 1, 3, and 7 follow-ups for a newly created lead.
 * @param {number} leadId
 */
function scheduleFollowUps(leadId) {
  const now = new Date();

  const followups = [
    { days: 1, template: 'day1' },
    { days: 3, template: 'day3' },
    { days: 7, template: 'day7' },
  ];

  const insert = db.prepare(`
    INSERT INTO followups (lead_id, scheduled_date, message_template)
    VALUES (?, ?, ?)
  `);

  followups.forEach(({ days, template }) => {
    const scheduledDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    insert.run(leadId, scheduledDate.toISOString(), template);
  });

  console.log(`[Scheduler] Scheduled 3 follow-ups for lead #${leadId}`);
}

/**
 * Cancel all pending follow-ups for a lead (e.g., when they re-engage or escalate).
 * @param {number} leadId
 */
function cancelFollowUps(leadId) {
  db.prepare(`
    UPDATE followups SET status = 'cancelled'
    WHERE lead_id = ? AND status = 'pending'
  `).run(leadId);
}

/**
 * Process all follow-ups that are due right now.
 * Called by the cron job every hour.
 */
async function processDueFollowUps() {
  const due = db.prepare(`
    SELECT f.*, l.name, l.intent, l.area, l.budget
    FROM followups f
    JOIN leads l ON l.id = f.lead_id
    WHERE f.status = 'pending'
      AND f.scheduled_date <= datetime('now')
      AND l.status NOT IN ('escalated', 'closed')
  `).all();

  if (due.length === 0) return;

  console.log(`[Scheduler] Processing ${due.length} due follow-up(s)...`);

  for (const followup of due) {
    try {
      // Check if lead has messaged us since the follow-up was scheduled
      // (if so, they re-engaged and we can skip)
      const recentActivity = db.prepare(`
        SELECT COUNT(*) as cnt FROM conversations
        WHERE lead_id = ? AND role = 'user'
          AND created_at > ?
      `).get(followup.lead_id, followup.created_at);

      if (recentActivity.cnt > 0) {
        // Lead re-engaged — cancel remaining follow-ups
        db.prepare(`UPDATE followups SET status = 'cancelled' WHERE id = ?`).run(followup.id);
        continue;
      }

      // Calculate actual days since last contact
      const lastMsg = db.prepare(`
        SELECT MAX(created_at) as last FROM conversations WHERE lead_id = ?
      `).get(followup.lead_id);

      const daysSince = lastMsg?.last
        ? Math.floor((Date.now() - new Date(lastMsg.last).getTime()) / (1000 * 60 * 60 * 24))
        : 1;

      // Generate a personalized follow-up message via Ava
      const lead = { name: followup.name, intent: followup.intent, area: followup.area, budget: followup.budget };
      const message = await ava.generateFollowUp(lead, daysSince);

      // Insert follow-up message into conversation history
      db.prepare(`
        INSERT INTO conversations (lead_id, role, message) VALUES (?, 'assistant', ?)
      `).run(followup.lead_id, message);

      // Mark as sent
      db.prepare(`
        UPDATE followups SET status = 'sent', sent_at = datetime('now') WHERE id = ?
      `).run(followup.id);

      console.log(`[Scheduler] Sent follow-up to lead #${followup.lead_id} (${followup.name})`);
    } catch (err) {
      console.error(`[Scheduler] Error processing follow-up #${followup.id}:`, err.message);
    }
  }
}

/**
 * Start the cron job that checks for due follow-ups every hour.
 */
function startScheduler() {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', () => {
    processDueFollowUps().catch((err) =>
      console.error('[Scheduler] Cron error:', err.message)
    );
  });

  console.log('[Scheduler] Follow-up scheduler started (runs hourly)');
}

module.exports = { scheduleFollowUps, cancelFollowUps, startScheduler, processDueFollowUps };
