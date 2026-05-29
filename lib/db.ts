import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

declare global {
  // eslint-disable-next-line no-var
  var __db: DatabaseSync | undefined;
}

// Lazy — opens the database on first call, not at module load.
// This prevents "database is locked" errors during `next build` when
// multiple route modules are analysed in parallel by the bundler.
export function getDb(): DatabaseSync {
  if (global.__db) return global.__db;

  const DATA_DIR = path.join(process.cwd(), 'data');
  const DB_PATH  = path.join(DATA_DIR, 'enviel.db');

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const database = new DatabaseSync(DB_PATH);

  database.exec("PRAGMA journal_mode = WAL");
  database.exec("PRAGMA foreign_keys = ON");

  database.exec(`
    CREATE TABLE IF NOT EXISTS sensor_nodes (
      id            TEXT    PRIMARY KEY,
      name          TEXT    NOT NULL,
      zone          TEXT    NOT NULL DEFAULT 'Unassigned',
      gps_lat       REAL    DEFAULT 0,
      gps_lon       REAL    DEFAULT 0,
      battery_level INTEGER DEFAULT 100,
      status        TEXT    DEFAULT 'online'
                      CHECK(status IN ('online','offline','maintenance')),
      last_seen     TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS poaching_events (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      node_id             TEXT    NOT NULL,
      timestamp           TEXT    DEFAULT (datetime('now')),
      event_type          TEXT    NOT NULL,
      confidence          REAL    NOT NULL,
      severity            TEXT    NOT NULL
                            CHECK(severity IN ('low','medium','high','critical')),
      verification_status TEXT    DEFAULT 'pending'
                            CHECK(verification_status IN
                              ('pending','verified_poaching','false_positive','under_review')),
      verified_at         TEXT,
      raw_amplitude       INTEGER,
      audio_url           TEXT,
      notes               TEXT,
      response_dispatched INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS patrol_units (
      id     TEXT PRIMARY KEY,
      name   TEXT NOT NULL,
      status TEXT DEFAULT 'standby'
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id         TEXT PRIMARY KEY,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_events_ts     ON poaching_events(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_events_node   ON poaching_events(node_id);
    CREATE INDEX IF NOT EXISTS idx_events_status ON poaching_events(verification_status);
    CREATE INDEX IF NOT EXISTS idx_events_sev    ON poaching_events(severity);
  `);

  global.__db = database;
  return database;
}
