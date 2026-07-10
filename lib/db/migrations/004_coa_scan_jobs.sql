CREATE TABLE IF NOT EXISTS scan_jobs (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  input_kind      TEXT NOT NULL CHECK (input_kind IN ('qr_url', 'manual_url')),
  source_url      TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'processing', 'resolved', 'partial', 'needs_review', 'failed')),
  provider        TEXT,
  attempt_count   INTEGER NOT NULL DEFAULT 0,
  error_code      TEXT,
  error_message   TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS scan_jobs_user_id_idx ON scan_jobs(user_id);
CREATE INDEX IF NOT EXISTS scan_jobs_user_status_idx ON scan_jobs(user_id, status);
CREATE INDEX IF NOT EXISTS scan_jobs_created_at_idx ON scan_jobs(created_at DESC);

CREATE TABLE IF NOT EXISTS coa_reports (
  id                  TEXT PRIMARY KEY,
  scan_job_id         TEXT NOT NULL REFERENCES scan_jobs(id) ON DELETE CASCADE,
  user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider            TEXT NOT NULL,
  parser_version      TEXT NOT NULL,
  source_url          TEXT NOT NULL,
  content_hash        TEXT,
  raw_metadata        JSONB NOT NULL DEFAULT '{}',
  normalized_payload  JSONB NOT NULL,
  confidence_payload  JSONB NOT NULL DEFAULT '{}',
  extracted_at        TIMESTAMPTZ NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coa_reports_user_id_idx ON coa_reports(user_id);
CREATE INDEX IF NOT EXISTS coa_reports_scan_job_id_idx ON coa_reports(scan_job_id);
CREATE INDEX IF NOT EXISTS coa_reports_content_hash_idx ON coa_reports(content_hash)
  WHERE content_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS coa_report_stash_links (
  coa_report_id   TEXT NOT NULL REFERENCES coa_reports(id) ON DELETE CASCADE,
  product_id      TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (coa_report_id, product_id)
);

CREATE INDEX IF NOT EXISTS coa_report_stash_links_user_id_idx ON coa_report_stash_links(user_id);
CREATE INDEX IF NOT EXISTS coa_report_stash_links_product_id_idx ON coa_report_stash_links(product_id);
