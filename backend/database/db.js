/**
 * SQLite database setup using better-sqlite3.
 * Creates all tables if they don't exist and enables WAL mode for performance.
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'ava.db');

// Ensure the data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// WAL mode gives much better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ──────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    name             TEXT    NOT NULL,
    email            TEXT,
    phone            TEXT,
    source           TEXT    DEFAULT 'chat',
    -- Qualification fields
    intent           TEXT    DEFAULT 'unknown',      -- buy | sell | rent | invest | unknown
    budget           TEXT,
    timeline         TEXT,
    area             TEXT,
    pre_approval     TEXT    DEFAULT 'unknown',       -- yes | no | in_progress | unknown
    -- Status & urgency
    status           TEXT    DEFAULT 'new',           -- new | active | escalated | closed
    urgency          TEXT    DEFAULT 'cold',          -- hot | warm | cold
    escalation_ready INTEGER DEFAULT 0,               -- boolean (0/1)
    notes            TEXT,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id    INTEGER NOT NULL,
    role       TEXT    NOT NULL,   -- user | assistant
    message    TEXT    NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id    INTEGER NOT NULL,
    date       TEXT    NOT NULL,   -- YYYY-MM-DD
    time       TEXT    NOT NULL,   -- HH:MM (24-hour)
    type       TEXT    DEFAULT 'consultation',  -- consultation | showing | follow_up
    status     TEXT    DEFAULT 'scheduled',     -- scheduled | completed | cancelled
    notes      TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS followups (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id           INTEGER NOT NULL,
    scheduled_date    DATETIME NOT NULL,
    message_template  TEXT     NOT NULL,
    status            TEXT     DEFAULT 'pending',  -- pending | sent | cancelled
    sent_at           DATETIME,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
  );
`);

module.exports = db;
