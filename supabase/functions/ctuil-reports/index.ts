import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const admin = () =>
  createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';

const PDF_INDEX_URL = 'https://ctuil.in/gna2022updates';

const MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

function stripTags(s: string) {
  return s
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchRetry(url: string, timeoutMs = 55_000, attempts = 2): Promise<Response> {
  let lastErr: Error | null = null;
  for (let i = 1; i <= attempts; i++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { 'User-Agent': UA, Accept: 'text/html,application/pdf,*/*' },
      });
      clearTimeout(timer);
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      clearTimeout(timer);
      lastErr = e as Error;
      if (i < attempts) await new Promise((r) => setTimeout(r, 500 * 2 ** (i - 1) + Math.random() * 300));
    }
  }
  throw lastErr ?? new Error('fetch failed');
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Derive report month/year from the label or file name (e.g. "…_July26.pdf"). */
function detectPeriod(text: string): { month: string | null; year: number | null; sortKey: number } {
  const t = text.toLowerCase();
  let month: string | null = null;
  let monthIdx = -1;
  for (let i = 0; i < MONTHS.length; i++) {
    const abbr = MONTHS[i].slice(0, 3);
    // Matches "july", "jul", "jul26", "jul_2026" — CTUIL file names use all of these.
    if (new RegExp(`(?:^|[^a-z])${abbr}[a-z]*(?![a-z])`).test(t)) {
      month = MONTHS[i][0].toUpperCase() + MONTHS[i].slice(1);
      monthIdx = i;
      break;
    }
  }
  // A 2-digit year sitting next to the month name is more reliable than any stray 20xx.
  const monthNames = MONTHS.map((m) => m.slice(0, 3)).join('|');
  const near = t.match(new RegExp(`(?:${monthNames})[a-z]*[\\s_-]?(\\d{4}|\\d{2})(?!\\d)`))?.[1];
  const y4 = t.match(/\b(20[0-4]\d)\b/)?.[1];
  const year = near ? (near.length === 4 ? Number(near) : 2000 + Number(near)) : y4 ? Number(y4) : null;
  const sortKey = (year ?? 0) * 100 + (monthIdx >= 0 ? monthIdx + 1 : 0);
  return { month, year, sortKey };
}

function isAllowedPdf(url: string) {
  try {
    const u = new URL(url);
    return (
      (u.hostname === 'ctuil.in' || u.hostname === 'www.ctuil.in') &&
      u.protocol === 'https:' &&
      u.pathname.toLowerCase().endsWith('.pdf')
    );
  } catch {
    return false;
  }
}

// Warm in-memory cache so repeat visits are instant and survive a slow CTUIL page.
let cache: { at: number; reports: MonthlyReportRow[] } | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000;

type MonthlyReportRow = {
  slug: string;
  label: string;
  fileName: string;
  url: string;
  month: string | null;
  year: number | null;
  sortKey: number;
};

async function listReports() {
  const res = await fetchRetry(PDF_INDEX_URL);
  if (!res.ok) throw new Error(`Index page HTTP ${res.status}`);
  const html = await res.text();

  const seen = new Set<string>();
  const reports: MonthlyReportRow[] = [];

  // Prefer table rows (label + link live together); fall back to bare anchors.
  const blocks = [...html.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((m) => m[0]);
  const candidates: { href: string; label: string }[] = [];
  for (const b of blocks) {
    const href = b.match(/href="([^"]+\.pdf)"/i)?.[1];
    if (!href) continue;
    candidates.push({ href, label: stripTags(b).replace(/^\d+\s*/, '').replace(/-->/g, '').trim() });
  }
  for (const m of html.matchAll(/<a[^>]+href="([^"]+\.pdf)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    candidates.push({ href: m[1], label: stripTags(m[2]) });
  }

  // Only monthly GNA / Connectivity / RE Effectiveness publications belong on this page.
  const RELEVANT = /(gna|connectivity|granted|effectiv|planning report)/i;
  const EXCLUDE =
    /(advertis|recruit|holiday|calender|calendar|tender|vacan|notice inviting|compensation|procedure|draft|\bsop\b|regulations|inquiry|consultation|annex)/i;

  for (const c of candidates) {
    const url = c.href.startsWith('http') ? c.href : `https://ctuil.in${c.href.startsWith('/') ? '' : '/'}${c.href}`;
    if (!isAllowedPdf(url) || seen.has(url)) continue;
    seen.add(url);
    const fileName = decodeURIComponent(url.split('/').pop() ?? 'report.pdf');
    const cleanName = fileName
      .replace(/\.pdf$/i, '')
      .replace(/^\d{8,}/, '')
      .replace(/[_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    // CTUIL prefixes uploads with a numeric id and some rows carry only "Jul-26".
    let label = (c.label || '').replace(/^\d{8,}/, '').replace(/\s+/g, ' ').trim();
    if (label.length < 8) label = cleanName;
    label = (label || cleanName || 'Published report').slice(0, 160);
    const period = detectPeriod(`${label} ${fileName}`);
    if (!RELEVANT.test(`${label} ${fileName}`) || EXCLUDE.test(`${label} ${fileName}`)) continue;
    reports.push({
      slug: slugify(fileName.replace(/\.pdf$/i, '')),
      label,
      fileName,
      url,
      month: period.month,
      year: period.year,
      sortKey: period.sortKey,
    });
  }

  reports.sort((a, b) => b.sortKey - a.sortKey || a.label.localeCompare(b.label));
  if (reports.length) {
    cache = { at: Date.now(), reports };
    // Persist so the page keeps working when ctuil.in is slow or unreachable.
    await admin()
      .from('monthly_reports')
      .upsert(
        reports.map((r) => ({
          slug: r.slug,
          label: r.label,
          file_name: r.fileName,
          url: r.url,
          report_month: r.month,
          report_year: r.year,
          sort_key: r.sortKey,
          last_seen_at: new Date().toISOString(),
        })),
        { onConflict: 'slug' },
      );
  }
  return reports;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const file = url.searchParams.get('file');

  try {
    // Proxy a single published PDF so it can be embedded / downloaded from our origin.
    if (file) {
      if (!isAllowedPdf(file)) {
        return new Response(JSON.stringify({ error: 'Only CTUIL-hosted PDF URLs are allowed' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const res = await fetchRetry(file, 45_000);
      if (!res.ok) throw new Error(`PDF download HTTP ${res.status}`);
      const bytes = new Uint8Array(await res.arrayBuffer());
      const name = decodeURIComponent(file.split('/').pop() ?? 'report.pdf');
      const disposition = url.searchParams.get('download') === '1' ? 'attachment' : 'inline';
      return new Response(bytes, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `${disposition}; filename="${name.replace(/"/g, '')}"`,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    if (cache && Date.now() - cache.at < CACHE_TTL_MS && url.searchParams.get('force') !== '1') {
      return new Response(
        JSON.stringify({
          reports: cache.reports,
          fetchedAt: new Date(cache.at).toISOString(),
          source: PDF_INDEX_URL,
          cached: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    let reports: MonthlyReportRow[];
    try {
      reports = await listReports();
    } catch (e) {
      // Safe fallback: keep serving the last known list rather than an empty page.
      const { data: stored } = await admin()
        .from('monthly_reports')
        .select('slug,label,file_name,url,report_month,report_year,sort_key,last_seen_at')
        .order('sort_key', { ascending: false });
      const fallback: MonthlyReportRow[] =
        cache?.reports ??
        (stored ?? []).map((r: any) => ({
          slug: r.slug,
          label: r.label,
          fileName: r.file_name,
          url: r.url,
          month: r.report_month,
          year: r.report_year,
          sortKey: r.sort_key,
        }));
      if (fallback.length) {
        return new Response(
          JSON.stringify({
            reports: fallback,
            fetchedAt: new Date(cache?.at ?? Date.now()).toISOString(),
            source: PDF_INDEX_URL,
            cached: true,
            warning: (e as Error).message,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      throw e;
    }
    return new Response(JSON.stringify({ reports, fetchedAt: new Date().toISOString(), source: PDF_INDEX_URL }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=600' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
