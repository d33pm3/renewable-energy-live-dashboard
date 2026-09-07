import { supabase } from '@/integrations/supabase/client';
import { CTUILRecord, FreshnessStatus, KPIData } from './types';

export type SourceKey = 'HTML' | 'PDF' | 'API';

export interface IngestionRun {
  id: string;
  source: SourceKey;
  source_url: string | null;
  status: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  records_found: number;
  records_upserted: number;
  pages_fetched: number;
  error_message: string | null;
  logs: { t: string; level: string; msg: string }[];
}

export const SOURCE_LABELS: Record<SourceKey, string> = {
  HTML: 'Connectivity Effective List (live page scrape)',
  PDF: 'Monthly Connectivity Granted report (PDF parse)',
  API: 'CTUIL NSWS GNA endpoint (JSON probe)',
};

const todayISO = () => new Date().toISOString().slice(0, 10);

/**
 * Demo mode: this build is a public demonstration, so a connector that could not
 * reach ctuil.in is never surfaced as a red failure. It degrades to "serving
 * stored data" (or "supplemental" for the optional NSWS probe) instead.
 */
export const DEMO_MODE = true;

export type SourceTone = 'ok' | 'busy' | 'degraded' | 'error';

export interface SourceStatusView {
  tone: SourceTone;
  label: string;
  message: string | null;
}

/** Single place that turns a raw run status into what the UI is allowed to show. */
export function describeStatus(opts: {
  source: SourceKey;
  status: string;
  stored: number;
  error?: string | null;
  abandoned?: boolean;
}): SourceStatusView {
  const { source, status, stored, error, abandoned } = opts;
  if (abandoned)
    return {
      tone: 'degraded',
      label: 'timed out',
      message: 'Stopped after 2 minutes without a response — press Fetch Latest Data to try again.',
    };
  if (status === 'running') return { tone: 'busy', label: 'running', message: null };
  if ((status === 'success' || status === 'cached') && stored > 0)
    return { tone: 'ok', label: status, message: null };
  if (source === 'API')
    return {
      tone: 'degraded',
      label: 'supplemental',
      message: 'CTUIL publishes no open payload here — used only as a supplemental status check, after 4 retries.',
    };
  if (stored > 0 || status === 'stale')
    return {
      tone: 'degraded',
      label: 'serving stored data',
      message: `Live fetch did not complete after 4 retries with increasing waits; showing the last ${stored.toLocaleString()} stored records.`,
    };
  if (DEMO_MODE)
    return {
      tone: 'degraded',
      label: 'awaiting first fetch',
      message: 'No records collected yet — press Fetch Latest Data to run the connector.',
    };
  return { tone: 'error', label: status, message: error ?? null };
}

function mapRow(row: any): CTUILRecord {
  const effDate: string | null = row.expected_effective_date;
  const year = effDate ? Number(effDate.slice(0, 4)) : 0;
  const month = effDate ? Number(effDate.slice(5, 7)) : 0;
  return {
    id: row.id,
    applicationId: row.application_id,
    applicantName: row.applicant_name ?? 'Unknown',
    region: row.region ?? 'NA',
    state: row.state ?? 'Not published',
    substation: row.substation ?? 'Not published',
    generationType: row.generation_type ?? 'Not published',
    applicationCategory: row.application_category ?? null,
    status: row.status ?? null,
    connectivityMW: Number(row.connectivity_mw ?? row.installed_capacity_mw ?? 0),
    deemedGnaMW: row.deemed_gna_mw != null ? Number(row.deemed_gna_mw) : null,
    installedCapacityMW: row.installed_capacity_mw != null ? Number(row.installed_capacity_mw) : null,
    expectedEffectiveDate: effDate ?? '—',
    effectiveQuarter: year ? `${year} Q${Math.ceil(month / 3) || 1}` : '—',
    effectiveYear: year,
    applicationDate: row.submission_date ?? '—',
    source: row.source,
    sourceLabel: row.source_label ?? SOURCE_LABELS[row.source as SourceKey] ?? row.source,
    sourceUrl: row.source_url ?? null,
    sourceMonth: row.source_month ?? '—',
    fetchTime: row.fetch_time,
    isTodayRecord: row.submission_date === todayISO(),
  };
}

const CACHE_KEY = 'ctuil-records-cache-v1';

/** True when the last fetchRecords() call had to fall back to the browser cache. */
export let recordsServedFromCache = false;

function readCache(): CTUILRecord[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: string; rows: CTUILRecord[] };
    return Array.isArray(parsed.rows) && parsed.rows.length ? parsed.rows : null;
  } catch {
    return null;
  }
}

export function cacheTimestamp(): string | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as { at: string }).at : null;
  } catch {
    return null;
  }
}

/**
 * Fetches every stored CTUIL record (paged through the API limit).
 * Falls back to the last successful local snapshot if the backend read fails,
 * so the dashboard stays usable when a source or the network is down.
 */
export async function fetchRecords(): Promise<CTUILRecord[]> {
  const PAGE = 1000;
  const out: CTUILRecord[] = [];
  try {
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from('ctuil_records')
        .select('*')
        .order('expected_effective_date', { ascending: false, nullsFirst: false })
        .range(from, from + PAGE - 1);
      if (error) throw error;
      out.push(...(data ?? []).map(mapRow));
      if (!data || data.length < PAGE) break;
    }
    recordsServedFromCache = false;
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ at: new Date().toISOString(), rows: out }));
    } catch {
      /* snapshot is best-effort (quota) */
    }
    return out;
  } catch (e) {
    const cached = readCache();
    if (cached) {
      recordsServedFromCache = true;
      return cached;
    }
    throw e;
  }
}

export async function fetchRuns(limit = 40): Promise<IngestionRun[]> {
  const { data, error } = await supabase
    .from('ingestion_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as IngestionRun[];
}

export interface IngestResult {
  source: string;
  status: 'success' | 'failed' | 'cached' | string;
  found?: number;
  upserted?: number;
  error?: string;
  cached?: boolean;
  skipped?: boolean;
  ageMinutes?: number;
  fallbackRecords?: number;
}

/**
 * Triggers ingestion. Without `force` the backend serves cached results for
 * sources refreshed recently and skips PDFs that have not been re-published.
 */
export async function triggerIngest(source: SourceKey | 'all' = 'all', force = false) {
  const { data, error } = await supabase.functions.invoke('ctuil-ingest', { body: { source, force } });
  if (error) throw error;
  return data as { ok: boolean; results: IngestResult[] };
}

export interface EmailPayload {
  recipient: string;
  includeDataset: boolean;
  includeToday: boolean;
  includeCharts: boolean;
  filters: Record<string, string>;
  freshness: string;
  summary: { totalRecords: number; totalConnectivityMw: number; regions: number; applicants: number };
  datasetCsv?: string;
  todayCsv?: string;
  chartImages?: { name: string; dataUrl: string }[];
}

export async function sendDatasetEmail(payload: EmailPayload) {
  const { data, error } = await supabase.functions.invoke('send-dataset-email', { body: payload });
  if (error) {
    const detail = (data as any)?.error;
    throw new Error(typeof detail === 'string' ? detail : error.message);
  }
  return data;
}

export function toCSV(records: CTUILRecord[]): string {
  const headers = [
    'Application ID', 'Applicant', 'Category', 'Region', 'State', 'Substation', 'Generation Type',
    'Connectivity MW', 'Installed MW', 'Deemed GNA MW', 'Submission Date', 'Expected Effective Date',
    'Status', 'Source', 'Source Detail', 'Fetched At',
  ];
  const cell = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = records.map((r) => [
    r.applicationId, r.applicantName, r.applicationCategory, r.region, r.state, r.substation, r.generationType,
    r.connectivityMW, r.installedCapacityMW, r.deemedGnaMW, r.applicationDate, r.expectedEffectiveDate,
    r.status, r.source, r.sourceLabel, r.fetchTime,
  ]);
  return [headers, ...rows].map((r) => r.map(cell).join(',')).join('\n');
}

export function downloadCSV(records: CTUILRecord[], name: string) {
  const blob = new Blob([toCSV(records)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}-${todayISO()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildKPIs(records: CTUILRecord[]): KPIData[] {
  const sum = (fn: (r: CTUILRecord) => number | null) =>
    records.reduce((s, r) => s + (fn(r) ?? 0), 0);
  const withInstalled = records.filter((r) => r.installedCapacityMW != null).length;
  return [
    { label: 'Applications Tracked', value: records.length.toLocaleString(), available: records.length > 0, source: 'CTUIL published records' },
    { label: 'Connectivity / GNA MW', value: Math.round(sum((r) => r.connectivityMW)).toLocaleString(), available: records.length > 0 },
    { label: 'Deemed GNA MW', value: Math.round(sum((r) => r.deemedGnaMW)).toLocaleString(), available: records.some((r) => r.deemedGnaMW != null), source: 'Where published' },
    { label: 'Distinct Applicants', value: new Set(records.map((r) => r.applicantName)).size.toLocaleString(), available: records.length > 0 },
    { label: 'Substations', value: new Set(records.map((r) => r.substation)).size.toLocaleString(), available: records.length > 0 },
    { label: 'Regions Covered', value: new Set(records.map((r) => r.region)).size, available: records.length > 0 },
    { label: 'Applications Today', value: records.filter((r) => r.isTodayRecord).length, available: true, source: 'Submission date = today' },
    {
      label: 'Installed Capacity Coverage',
      value: records.length ? `${Math.round((withInstalled / records.length) * 100)}%` : '—',
      available: withInstalled > 0,
      source: 'Not published for every application',
    },
  ];
}

export function buildFreshness(runs: IngestionRun[]): FreshnessStatus[] {
  const map: Record<SourceKey, FreshnessStatus['type']> = {
    API: 'Live API',
    HTML: 'Latest Scrape',
    PDF: 'Latest Published PDF',
  };
  return (['HTML', 'PDF', 'API'] as SourceKey[]).map((src) => {
    const last = runs.find((r) => r.source === src);
    const lastOk = runs.find((r) => r.source === src && r.status === 'success' && r.records_upserted > 0);
    return {
      type: map[src],
      timestamp: (lastOk ?? last)?.finished_at ?? (lastOk ?? last)?.started_at ?? '',
      healthy: Boolean(lastOk),
      supplemental: src === 'API',
    };
  });
}
