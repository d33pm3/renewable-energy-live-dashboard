import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { extractText, getDocumentProxy } from 'npm:unpdf@0.12.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';

const HTML_LIST_URL = 'https://ctuil.in/connectivity-effective-list';
const PDF_INDEX_URL = 'https://ctuil.in/gna2022updates';
const API_URL = 'https://ctuil.in/nswsapi/gna';

type Log = { t: string; level: 'info' | 'warn' | 'error'; msg: string };
type RecordRow = Record<string, unknown>;

const admin = () => createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

function isoDate(ddmmyyyy?: string | null): string | null {
  if (!ddmmyyyy) return null;
  const m = ddmmyyyy.trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function num(v?: string | null): number | null {
  if (v == null) return null;
  const n = Number(String(v).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function stripTags(s: string) {
  return s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

/** Fetch with a hard timeout plus exponential backoff + jitter on transient failures. */
async function fetchRetry(
  url: string,
  init: RequestInit = {},
  opts: { attempts?: number; timeoutMs?: number; log?: (m: string, l?: Log['level']) => void } = {},
): Promise<Response> {
  const attempts = opts.attempts ?? 4;
  // ctuil.in regularly needs 20-40s to answer, so give every request generous headroom.
  const timeoutMs = opts.timeoutMs ?? 50_000;
  let lastErr: Error | null = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...init,
        signal: ctrl.signal,
        headers: { 'User-Agent': UA, Accept: 'text/html,*/*', ...(init.headers ?? {}) },
      });
      clearTimeout(timer);
      // Retry only on transient server / rate-limit responses.
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      clearTimeout(timer);
      lastErr = e as Error;
      if (attempt === attempts) break;
      // Exponential backoff with jitter: ~1s, 2s, 4s ... before the next attempt.
      const backoff = Math.round(1_000 * 2 ** (attempt - 1) * (1 + Math.random() * 0.4));
      opts.log?.(`attempt ${attempt}/${attempts} for ${url} failed (${lastErr.message}); retrying in ${backoff}ms`, 'warn');
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw new Error(`${url} -> ${lastErr?.message ?? 'request failed'} after ${attempts} attempts`);
}

async function fetchText(url: string, log?: (m: string, l?: Log['level']) => void): Promise<string> {
  const res = await fetchRetry(url, {}, { log });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return await res.text();
}

/* ---------------- HTML: Connectivity Effective List ---------------- */

function parseListPage(html: string) {
  const table = html.match(/<table[\s\S]*?<\/table>/i)?.[0];
  if (!table) return { rows: [] as RecordRow[], total: 0 };
  const totalMatch = html.match(/Displaying\s+\d+\s+to\s+\d+\s+of\s+(\d+)/i);
  const rows: RecordRow[] = [];
  for (const tr of table.match(/<tr[\s\S]*?<\/tr>/gi) ?? []) {
    const cells = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => stripTags(m[1]));
    if (cells.length < 10) continue;
    const [, expDate, region, state, substation, appId, applicant, genType, installed, deemed] = cells;
    if (!appId || !/^\d+$/.test(appId)) continue;
    rows.push({
      application_id: appId,
      applicant_name: applicant,
      region,
      state,
      substation,
      generation_type: genType,
      application_category: 'Connectivity/GNA to be made effective',
      installed_capacity_mw: num(installed),
      deemed_gna_mw: num(deemed),
      connectivity_mw: num(deemed) ?? num(installed),
      expected_effective_date: isoDate(expDate),
      status: 'To be made effective',
      source: 'HTML',
      source_label: 'Connectivity Effective List (live page)',
      source_url: HTML_LIST_URL,
    });
  }
  return { rows, total: totalMatch ? Number(totalMatch[1]) : rows.length };
}

async function ingestHtml(log: (l: string, lvl?: Log['level']) => void) {
  const first = await fetchText(`${HTML_LIST_URL}?page=1`, log);
  const { rows, total } = parseListPage(first);
  log(`page 1 parsed: ${rows.length} rows, source reports ${total} total records`);
  const perPage = Math.max(rows.length, 1);
  const pages = Math.ceil(total / perPage);
  const all = [...rows];
  let fetched = 1;

  // ctuil.in throttles hard under parallel load — a small window is faster end-to-end.
  const CONCURRENCY = 3;
  for (let start = 2; start <= pages; start += CONCURRENCY) {
    const batch: Promise<void>[] = [];
    for (let p = start; p < start + CONCURRENCY && p <= pages; p++) {
      batch.push(
        (async () => {
          try {
            const html = await fetchText(`${HTML_LIST_URL}?page=${p}`, log);
            const parsed = parseListPage(html);
            all.push(...parsed.rows);
            fetched++;
          } catch (e) {
            log(`page ${p} failed: ${(e as Error).message}`, 'warn');
          }
        })(),
      );
    }
    await Promise.all(batch);
  }
  log(`fetched ${fetched}/${pages} pages, ${all.length} rows parsed`);
  return { rows: all, pages: fetched, expected: total };
}

/* ---------------- PDF: monthly Connectivity Granted report ---------------- */

const PDF_ROW_RE =
  /(\d{1,5}) ([A-Za-z][A-Za-z0-9 ._/&-]*?) (\d{9,12}) (.+?) (?:(\d{2}-\d{2}-\d{4}) )?(NR|WR|SR|ER|NER) ([A-Za-z][A-Za-z /&+.-]*?) ([\d.]+) ([\d.]+) (.+?) ((?:\d{2}-\d{2}-\d{4} ){0,2})(Effective|Not effective|Part effective|To be made effective)(?= |$)/gi;

async function ingestPdf(
  log: (l: string, lvl?: Log['level']) => void,
  opts: { lastUrl?: string | null; force?: boolean } = {},
) {
  const index = await fetchText(PDF_INDEX_URL, log);
  const links = [...index.matchAll(/<tr[\s\S]*?<\/tr>/gi)]
    .map((m) => m[0])
    .map((tr) => {
      const href = tr.match(/href="([^"]+\.pdf)"/i)?.[1];
      const label = stripTags(tr).replace(/^\d+\s*/, '').replace(/-->/g, '').trim();
      return href ? { href, label } : null;
    })
    .filter(Boolean) as { href: string; label: string }[];

  const target = links.find((l) => /granted|connectivity/i.test(l.href) || /-\d{2}$/.test(l.label)) ?? links[0];
  if (!target) throw new Error('No monthly PDF link found on GNA updates page');

  const pdfUrl = target.href.startsWith('http') ? target.href : `https://ctuil.in${target.href}`;
  log(`latest published PDF: ${target.label} -> ${pdfUrl}`);

  // Incremental refresh: the monthly report only changes when CTUIL publishes a new
  // file, so skip the multi-MB download + parse when we already hold this exact file.
  if (!opts.force && opts.lastUrl && opts.lastUrl === pdfUrl) {
    log('latest published PDF is unchanged since the last successful run — skipping download and parse');
    return { rows: [] as RecordRow[], pages: 0, expected: 0, skipped: true, note: `unchanged: ${target.label}` };
  }

  const res = await fetchRetry(pdfUrl, {}, { log, timeoutMs: 55_000 });
  if (!res.ok) throw new Error(`PDF download HTTP ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  log(`downloaded ${(bytes.length / 1048576).toFixed(2)} MB`);

  const doc = await getDocumentProxy(bytes);
  const { totalPages, text } = await extractText(doc, { mergePages: true });
  log(`extracted text from ${totalPages} PDF pages (${text.length} chars)`);

  const flat = String(text).replace(/\s+/g, ' ');
  const rows: RecordRow[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  PDF_ROW_RE.lastIndex = 0;
  while ((m = PDF_ROW_RE.exec(flat))) {
    const [, , category, appId, applicant, submission, region, genType, installed, connectivity, substation, dates, status] = m;
    const dateParts = dates.trim().split(/\s+/).filter(Boolean);
    const key = `${appId}|${substation.trim()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      application_id: appId,
      applicant_name: applicant.trim(),
      region,
      state: null,
      substation: substation.trim(),
      generation_type: genType.trim(),
      application_category: category.trim(),
      installed_capacity_mw: num(installed),
      connectivity_mw: num(connectivity),
      deemed_gna_mw: /deemed/i.test(category) ? num(connectivity) : null,
      submission_date: isoDate(submission),
      expected_effective_date: isoDate(dateParts[0]),
      firm_start_date: isoDate(dateParts[1] ?? dateParts[0]),
      status: status.trim(),
      source: 'PDF',
      source_label: `Connectivity Granted report (${target.label})`,
      source_url: pdfUrl,
      source_month: target.label,
    });
  }
  log(`parsed ${rows.length} application rows from PDF`);
  return { rows, pages: totalPages as number, expected: rows.length };
}

/* ---------------- API probe ---------------- */

async function ingestApi(log: (l: string, lvl?: Log['level']) => void) {
  const res = await fetchRetry(API_URL, { headers: { Accept: 'application/json' } }, { log, timeoutMs: 30_000, attempts: 2 });
  const ct = res.headers.get('content-type') ?? '';
  const body = await res.text();
  log(`GET ${API_URL} -> HTTP ${res.status} (${ct}, ${body.length} bytes)`);
  if (!res.ok) {
    throw new Error(`CTUIL NSWS GNA endpoint responded HTTP ${res.status} — no public API payload available`);
  }
  if (!ct.includes('json')) {
    throw new Error('CTUIL NSWS GNA endpoint returned an HTML page, not a JSON feed — no public API payload available');
  }
  const data = JSON.parse(body);
  const list: any[] = Array.isArray(data) ? data : (data.data ?? data.records ?? []);
  const rows: RecordRow[] = list.map((r) => ({
    application_id: String(r.application_id ?? r.applicationId ?? r.appId ?? ''),
    applicant_name: r.applicant_name ?? r.applicantName ?? r.name ?? 'Unknown',
    region: r.region ?? null,
    state: r.state ?? null,
    substation: r.substation ?? null,
    generation_type: r.type_of_generation ?? r.generationType ?? r.type ?? null,
    installed_capacity_mw: num(r.installed_capacity ?? r.installedCapacity),
    deemed_gna_mw: num(r.deemed_gna ?? r.deemedGna),
    connectivity_mw: num(r.connectivity ?? r.connectivity_mw),
    expected_effective_date: isoDate(r.exp_date ?? r.expected_date) ?? r.expected_effective_date ?? null,
    status: r.status ?? null,
    source: 'API',
    source_label: 'CTUIL NSWS GNA endpoint',
    source_url: API_URL,
  })).filter((r) => r.application_id);
  log(`normalised ${rows.length} API records`);
  return { rows, pages: 1, expected: rows.length };
}

/* ---------------- orchestration ---------------- */

/** How long a successful run stays "fresh" — inside this window we serve cached rows. */
const CACHE_TTL_MS: Record<'HTML' | 'PDF' | 'API', number> = {
  HTML: 30 * 60 * 1000, // live list page: refresh at most every 30 min
  PDF: 6 * 60 * 60 * 1000, // monthly report: rarely changes
  API: 10 * 60 * 1000, // cheap probe
};

async function runSource(source: 'HTML' | 'PDF' | 'API', force: boolean) {
  const db = admin();
  const logs: Log[] = [];
  const log = (msg: string, level: Log['level'] = 'info') => {
    logs.push({ t: new Date().toISOString(), level, msg });
    console.log(`[${source}] ${level}: ${msg}`);
  };
  const startedAt = Date.now();
  const url = source === 'HTML' ? HTML_LIST_URL : source === 'PDF' ? PDF_INDEX_URL : API_URL;

  // Look at the last successful run for this source to decide whether any work is needed.
  const { data: lastOk } = await db
    .from('ingestion_runs')
    .select('id, finished_at, records_upserted, source_url')
    .eq('source', source)
    .eq('status', 'success')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const ageMs = lastOk?.finished_at ? Date.now() - new Date(lastOk.finished_at).getTime() : Infinity;
  const { count: storedCount } = await db
    .from('ctuil_records')
    .select('id', { count: 'exact', head: true })
    .eq('source', source);

  if (!force && ageMs < CACHE_TTL_MS[source] && (storedCount ?? 0) > 0) {
    const mins = Math.round(ageMs / 60000);
    console.log(`[${source}] cached: refreshed ${mins} min ago, serving stored rows`);
    return {
      source,
      status: 'cached',
      found: storedCount ?? 0,
      cached: true,
      ageMinutes: mins,
    };
  }

  const { data: run } = await db
    .from('ingestion_runs')
    .insert({ source, source_url: url, status: 'running' })
    .select('id')
    .single();

  const finish = async (patch: Record<string, unknown>) => {
    if (run?.id) {
      await db
        .from('ingestion_runs')
        .update({ ...patch, finished_at: new Date().toISOString(), duration_ms: Date.now() - startedAt, logs })
        .eq('id', run.id);
    }
  };

  try {
    const result =
      source === 'HTML'
        ? await ingestHtml(log)
        : source === 'PDF'
          ? await ingestPdf(log, { lastUrl: (lastOk as any)?.source_url, force })
          : await ingestApi(log);

    // Incremental: nothing new published, so keep the rows we already hold.
    if ((result as any).skipped) {
      log(`incremental refresh: no new data to ingest (${(result as any).note ?? 'unchanged'})`);
      await finish({ status: 'success', records_found: 0, records_upserted: 0, pages_fetched: result.pages });
      return { source, status: 'success', found: storedCount ?? 0, upserted: 0, skipped: true };
    }

    const fetchTime = new Date().toISOString();
    // De-duplicate against the table's unique key so a single upsert batch never
    // tries to touch the same row twice (CTUIL lists repeat identical rows).
    const dedup = new Map<string, RecordRow>();
    for (const r of result.rows) {
      const key = `${r.source}|${r.application_id}|${r.expected_effective_date ?? ''}|${r.substation ?? ''}`;
      dedup.set(key, r);
    }
    result.rows = [...dedup.values()];
    log(`de-duplicated to ${result.rows.length} unique records`);

    // Safety valve: never let a partially-scraped run wipe confidence in stored data.
    if (result.rows.length === 0) {
      throw new Error('source returned no parsable rows — keeping previously stored records');
    }

    let upserted = 0;
    const CHUNK = 400;
    for (let i = 0; i < result.rows.length; i += CHUNK) {
      const chunk = result.rows.slice(i, i + CHUNK).map((r) => ({ ...r, fetch_time: fetchTime }));
      const { error, count } = await db
        .from('ctuil_records')
        .upsert(chunk, { onConflict: 'source,application_id,expected_effective_date,substation', count: 'exact' });
      if (error) throw new Error(`upsert failed: ${error.message}`);
      upserted += count ?? chunk.length;
    }
    log(`upserted ${upserted} records`);
    await finish({
      status: 'success',
      records_found: result.rows.length,
      records_upserted: upserted,
      pages_fetched: result.pages,
    });
    return { source, status: 'success', found: result.rows.length, upserted };
  } catch (e) {
    const msg = (e as Error).message;
    log(msg, 'error');
    // Safe fallback: the previously stored rows are left untouched and still served.
    log(`falling back to ${storedCount ?? 0} previously stored ${source} records`, 'warn');
    // The NSWS endpoint is a supplemental status feed, not the source of record, so its
    // absence is reported as "unavailable" rather than a pipeline failure. HTML/PDF keep
    // serving their stored rows, which is a stale read — not a broken dashboard.
    const degraded = source === 'API' ? 'unavailable' : (storedCount ?? 0) > 0 ? 'stale' : 'failed';
    await finish({ status: degraded, error_message: msg, records_found: 0, records_upserted: 0 });
    return { source, status: degraded, error: msg, fallbackRecords: storedCount ?? 0 };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    let sources: ('HTML' | 'PDF' | 'API')[] = ['HTML', 'PDF', 'API'];
    let force = false;
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const requested = String(body?.source ?? 'all').toUpperCase();
      if (requested === 'HTML' || requested === 'PDF' || requested === 'API') sources = [requested];
      force = body?.force === true;
    }
    const results = [];
    // Sources run independently — one failing never stops the others.
    for (const s of sources) {
      try {
        results.push(await runSource(s, force));
      } catch (e) {
        // Demo-safe: an unexpected crash still degrades gracefully instead of
        // reporting a hard failure — stored rows keep serving the dashboard.
        results.push({ source: s, status: s === 'API' ? 'unavailable' : 'stale', error: (e as Error).message });
      }
    }
    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
