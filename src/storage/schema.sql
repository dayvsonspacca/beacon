CREATE TABLE IF NOT EXISTS jobs (
  id         TEXT PRIMARY KEY,
  topic      TEXT NOT NULL,
  payload    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'queued',
  attempts   INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs (status, created_at);
