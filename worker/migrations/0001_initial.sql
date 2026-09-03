PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('buyer','seller','admin')), name TEXT NOT NULL,
  phone TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY, buyer_id TEXT NOT NULL REFERENCES users(id), seller_id TEXT REFERENCES users(id), seller_email TEXT,
  title TEXT NOT NULL, description TEXT, structured_terms_json TEXT, total_amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PKR', status TEXT NOT NULL DEFAULT 'draft', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS funding_requests (
  id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id), amount REAL NOT NULL, screenshot_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', admin_note TEXT, reviewed_by TEXT REFERENCES users(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS milestones (
  id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id), title TEXT NOT NULL, description TEXT,
  amount REAL NOT NULL, order_index INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending', due_date TEXT,
  submission_note TEXT, submitted_at TEXT, approved_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS payout_requests (
  id TEXT PRIMARY KEY, milestone_id TEXT NOT NULL REFERENCES milestones(id), seller_id TEXT NOT NULL REFERENCES users(id),
  amount REAL NOT NULL, status TEXT NOT NULL DEFAULT 'pending_admin_payout', admin_note TEXT, paid_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS seller_bank_details (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), project_id TEXT NOT NULL REFERENCES projects(id),
  bank_name TEXT NOT NULL, account_title TEXT NOT NULL, account_number TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, project_id)
);
CREATE TABLE IF NOT EXISTS disputes (
  id TEXT PRIMARY KEY, milestone_id TEXT NOT NULL REFERENCES milestones(id), raised_by TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'awaiting_other_party', buyer_statement TEXT, seller_statement TEXT,
  ai_recommendation_json TEXT, final_ruling_json TEXT, resolved_by_admin_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, resolved_at TEXT
);
CREATE TABLE IF NOT EXISTS evidence_files (
  id TEXT PRIMARY KEY, dispute_id TEXT NOT NULL REFERENCES disputes(id), uploaded_by TEXT NOT NULL REFERENCES users(id),
  file_url TEXT NOT NULL, description TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY, actor_id TEXT REFERENCES users(id), action TEXT NOT NULL, entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL, meta_json TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS transcription_rate_limits (
  id TEXT PRIMARY KEY, user_key TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_projects_buyer ON projects(buyer_id);
CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id, order_index);
CREATE INDEX IF NOT EXISTS idx_funding_status ON funding_requests(status);
CREATE INDEX IF NOT EXISTS idx_payout_status ON payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_transcription_rate ON transcription_rate_limits(user_key, created_at);
