-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- sat_jobs
CREATE TABLE IF NOT EXISTS sat_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfc text NOT NULL,
  type text NOT NULL, -- issued | received
  date_start date NOT NULL,
  date_end date NOT NULL,
  status text NOT NULL DEFAULT 'queued', -- queued|running|done|error
  requested_packages integer DEFAULT 0,
  available_packages integer DEFAULT 0,
  downloaded_packages integer DEFAULT 0,
  imported_xml integer DEFAULT 0,
  error_message text,
  created_at timestamp DEFAULT now(),
  started_at timestamp,
  finished_at timestamp
);

-- sat_packages
CREATE TABLE IF NOT EXISTS sat_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES sat_jobs(id) ON DELETE CASCADE,
  sat_package_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending|available|downloading|downloaded|imported|error
  zip_path text,
  downloaded_at timestamp,
  error_message text,
  created_at timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sat_packages_job_id ON sat_packages(job_id);

-- sat_files
CREATE TABLE IF NOT EXISTS sat_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES sat_packages(id) ON DELETE CASCADE,
  uuid text,
  xml_path text,
  parsed boolean DEFAULT false,
  invoice_id varchar, -- optional link to invoices.id (varchar in schema)
  error_message text,
  created_at timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sat_files_package_id ON sat_files(package_id);

-- sat_logs
CREATE TABLE IF NOT EXISTS sat_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES sat_jobs(id) ON DELETE CASCADE,
  level text NOT NULL DEFAULT 'info', -- info|warn|error
  message text NOT NULL,
  ts timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sat_logs_job_id ON sat_logs(job_id);
