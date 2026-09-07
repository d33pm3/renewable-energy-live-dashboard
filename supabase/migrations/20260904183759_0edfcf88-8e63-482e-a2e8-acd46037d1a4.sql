CREATE TABLE public.ctuil_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id text NOT NULL,
  applicant_name text NOT NULL,
  region text,
  state text,
  substation text,
  generation_type text,
  application_category text,
  connectivity_mw numeric,
  installed_capacity_mw numeric,
  deemed_gna_mw numeric,
  submission_date date,
  expected_effective_date date,
  firm_start_date date,
  status text,
  source text NOT NULL,
  source_label text,
  source_url text,
  source_month text,
  fetch_time timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, application_id, expected_effective_date, substation)
);

GRANT SELECT ON public.ctuil_records TO anon;
GRANT SELECT ON public.ctuil_records TO authenticated;
GRANT ALL ON public.ctuil_records TO service_role;
ALTER TABLE public.ctuil_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CTUIL records are public" ON public.ctuil_records FOR SELECT USING (true);

CREATE INDEX idx_ctuil_records_source ON public.ctuil_records (source);
CREATE INDEX idx_ctuil_records_region ON public.ctuil_records (region);
CREATE INDEX idx_ctuil_records_expected ON public.ctuil_records (expected_effective_date);

CREATE TABLE public.ingestion_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source text NOT NULL,
  source_url text,
  status text NOT NULL DEFAULT 'running',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  duration_ms integer,
  records_found integer NOT NULL DEFAULT 0,
  records_upserted integer NOT NULL DEFAULT 0,
  pages_fetched integer NOT NULL DEFAULT 0,
  error_message text,
  logs jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ingestion_runs TO anon;
GRANT SELECT ON public.ingestion_runs TO authenticated;
GRANT ALL ON public.ingestion_runs TO service_role;
ALTER TABLE public.ingestion_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ingestion runs are public" ON public.ingestion_runs FOR SELECT USING (true);

CREATE INDEX idx_ingestion_runs_source_started ON public.ingestion_runs (source, started_at DESC);

CREATE TABLE public.email_send_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id text,
  template_name text,
  recipient_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.email_send_log TO service_role;
ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_ctuil_records_updated_at BEFORE UPDATE ON public.ctuil_records
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ingestion_runs_updated_at BEFORE UPDATE ON public.ingestion_runs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();