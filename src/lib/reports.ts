import { supabase } from '@/integrations/supabase/client';

export interface MonthlyReport {
  slug: string;
  label: string;
  fileName: string;
  url: string;
  month: string | null;
  year: number | null;
  sortKey: number;
}

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ctuil-reports`;

export interface MonthlyReportsResponse {
  reports: MonthlyReport[];
  fetchedAt: string;
  source: string;
  cached?: boolean;
  warning?: string;
}

export async function fetchMonthlyReports(): Promise<MonthlyReportsResponse> {
  const { data, error } = await supabase.functions.invoke('ctuil-reports', { method: 'GET' });
  if (error) throw new Error(error.message);
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as MonthlyReportsResponse;
}

export function reportFileUrl(pdfUrl: string, download = false) {
  const u = new URL(FUNCTIONS_BASE);
  u.searchParams.set('file', pdfUrl);
  if (download) u.searchParams.set('download', '1');
  return u.toString();
}

export function reportPeriodLabel(r: MonthlyReport) {
  if (r.month && r.year) return `${r.month} ${r.year}`;
  if (r.year) return String(r.year);
  return 'Period not stated';
}
