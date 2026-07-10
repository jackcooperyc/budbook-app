-- Extend scan_jobs input_kind for text paste and raw QR payloads.
ALTER TABLE scan_jobs DROP CONSTRAINT IF EXISTS scan_jobs_input_kind_check;
ALTER TABLE scan_jobs ADD CONSTRAINT scan_jobs_input_kind_check
  CHECK (input_kind IN ('qr_url', 'manual_url', 'text', 'qr_payload'));
