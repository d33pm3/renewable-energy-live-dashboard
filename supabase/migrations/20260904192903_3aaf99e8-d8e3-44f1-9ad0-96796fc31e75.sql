CREATE TABLE public.monthly_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  file_name TEXT NOT NULL,
  url TEXT NOT NULL,
  report_month TEXT,
  report_year INTEGER,
  sort_key INTEGER NOT NULL DEFAULT 0,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.monthly_reports TO anon;
GRANT SELECT ON public.monthly_reports TO authenticated;
GRANT ALL ON public.monthly_reports TO service_role;

ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published reports are readable by everyone"
ON public.monthly_reports FOR SELECT USING (true);

CREATE INDEX monthly_reports_sort_key_idx ON public.monthly_reports (sort_key DESC);