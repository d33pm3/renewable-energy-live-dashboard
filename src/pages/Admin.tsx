import { Fragment, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Database, Loader2, RefreshCw } from 'lucide-react';
import { DEMO_MODE, fetchRecords, fetchRuns, IngestionRun, SOURCE_LABELS, SourceKey, triggerIngest } from '@/lib/ctuil';
import FieldMappingView from '@/components/dashboard/FieldMappingView';

const SOURCES: SourceKey[] = ['HTML', 'PDF', 'API'];

// Demo mode: a missed fetch is a degraded read (stored rows still serve the app),
// never a red failure.
const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    success: 'bg-teal/15 text-teal border-teal/30',
    cached: 'bg-teal/15 text-teal border-teal/30',
    failed: DEMO_MODE ? 'bg-amber/15 text-amber border-amber/30' : 'bg-destructive/10 text-destructive border-destructive/30',
    stale: 'bg-amber/15 text-amber border-amber/30',
    unavailable: 'bg-amber/15 text-amber border-amber/30',
    running: 'bg-amber/15 text-amber border-amber/30',
  };
  return map[status] ?? 'bg-muted text-muted-foreground';
};

const statusText = (status: string) => (DEMO_MODE && status === 'failed' ? 'degraded' : status);

const fmt = (v?: string | null) => (v ? new Date(v).toLocaleString() : '—');

const Admin = () => {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [openRun, setOpenRun] = useState<string | null>(null);

  const runsQuery = useQuery({ queryKey: ['admin-runs'], queryFn: () => fetchRuns(60), refetchInterval: 30_000 });
  const recordsQuery = useQuery({ queryKey: ['ctuil-records'], queryFn: fetchRecords });

  const runs = runsQuery.data ?? [];
  const records = recordsQuery.data ?? [];

  const bySource = useMemo(() => {
    return SOURCES.map((src) => {
      const srcRuns = runs.filter((r) => r.source === src);
      const lastSuccess = srcRuns.find((r) => r.status === 'success');
      const srcRecords = records.filter((r) => r.source === src);
      return {
        source: src,
        label: SOURCE_LABELS[src],
        lastRun: srcRuns[0] as IngestionRun | undefined,
        lastSuccess,
        recordCount: srcRecords.length,
        capacityMw: Math.round(srcRecords.reduce((s, r) => s + r.connectivityMW, 0)),
      };
    });
  }, [runs, records]);

  const run = async (source: SourceKey | 'all') => {
    setBusy(source);
    try {
      // Admin runs bypass the cache window on purpose.
      const res = await triggerIngest(source, true);
      res.results.forEach((r) =>
        r.status === 'success'
          ? toast.success(
              r.skipped
                ? `${r.source}: nothing new published — kept ${(r.found ?? 0).toLocaleString()} stored records`
                : `${r.source}: ${(r.found ?? 0).toLocaleString()} records`,
            )
          : r.status === 'cached'
            ? toast.info(`${r.source}: served from cache (${r.ageMinutes ?? 0} min old)`)
            : toast.error(
                `${r.source}: ${r.error ?? 'failed'}${
                  r.fallbackRecords ? ` — ${r.fallbackRecords.toLocaleString()} stored records kept` : ''
                }`,
              ),
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-runs'] }),
        queryClient.invalidateQueries({ queryKey: ['ctuil-records'] }),
        queryClient.invalidateQueries({ queryKey: ['ctuil-runs'] }),
      ]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="gradient-hero py-10">
        <div className="container">
          <Button asChild variant="ghost" size="sm" className="text-primary-foreground/70 hover:text-primary-foreground -ml-3 mb-3">
            <Link to="/"><ArrowLeft className="h-4 w-4 mr-1.5" /> Back to dashboard</Link>
          </Button>
          <h1 className="text-2xl font-bold text-primary-foreground">Source &amp; Parser Admin</h1>
          <p className="text-primary-foreground/60 text-sm mt-1">
            Fetch health, record counts by source, and full parser logs for every ingestion run.
          </p>
        </div>
      </header>

      <main className="container py-10 space-y-8">
        <div className="flex flex-wrap gap-3">
          <Button className="bg-teal hover:bg-teal/90 gap-2" onClick={() => run('all')} disabled={busy !== null}>
            <RefreshCw className={`h-4 w-4 ${busy === 'all' ? 'animate-spin' : ''}`} /> Run all sources
          </Button>
          {SOURCES.map((s) => (
            <Button key={s} variant="outline" className="gap-2" onClick={() => run(s)} disabled={busy !== null}>
              {busy === s ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />} Run {s}
            </Button>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {bySource.map((s) => (
            <div key={s.source} className="rounded-xl border bg-card p-5 shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold font-mono text-sm">{s.source}</h3>
                <Badge variant="outline" className={statusBadge(s.lastRun?.status ?? 'unknown')}>
                  {statusText(s.lastRun?.status ?? 'never run')}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <dl className="text-sm space-y-1.5">
                <div className="flex justify-between"><dt className="text-muted-foreground">Records stored</dt><dd className="font-mono">{s.recordCount.toLocaleString()}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Capacity tracked</dt><dd className="font-mono">{s.capacityMw.toLocaleString()} MW</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Last success</dt><dd className="font-mono text-xs">{fmt(s.lastSuccess?.finished_at)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Last attempt</dt><dd className="font-mono text-xs">{fmt(s.lastRun?.finished_at ?? s.lastRun?.started_at)}</dd></div>
              </dl>
              {s.lastRun?.error_message && (
                <p className="text-xs text-destructive bg-destructive/5 rounded p-2">{s.lastRun.error_message}</p>
              )}
            </div>
          ))}
        </div>

        <FieldMappingView records={records} />

        <div className="rounded-xl border bg-card shadow-card overflow-hidden">
          <div className="p-5 border-b flex items-center justify-between">
            <h2 className="font-semibold">Ingestion run history</h2>
            {runsQuery.isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  {['Source', 'Status', 'Started', 'Duration', 'Pages', 'Found', 'Stored', 'Logs'].map((h) => (
                    <th key={h} className="text-left font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runs.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No ingestion runs recorded yet.</td></tr>
                )}
                {runs.map((r) => (
                  <Fragment key={r.id}>
                    <tr className="border-t hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-mono">{r.source}</td>
                      <td className="px-4 py-2.5"><Badge variant="outline" className={statusBadge(r.status)}>{statusText(r.status)}</Badge></td>
                      <td className="px-4 py-2.5 text-xs whitespace-nowrap">{fmt(r.started_at)}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">{r.duration_ms ? `${(r.duration_ms / 1000).toFixed(1)}s` : '—'}</td>
                      <td className="px-4 py-2.5 font-mono">{r.pages_fetched}</td>
                      <td className="px-4 py-2.5 font-mono">{r.records_found.toLocaleString()}</td>
                      <td className="px-4 py-2.5 font-mono">{r.records_upserted.toLocaleString()}</td>
                      <td className="px-4 py-2.5">
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setOpenRun(openRun === r.id ? null : r.id)}>
                          {openRun === r.id ? 'Hide' : `View (${r.logs?.length ?? 0})`}
                        </Button>
                      </td>
                    </tr>
                    {openRun === r.id && (
                      <tr className="border-t bg-secondary/40">
                        <td colSpan={8} className="px-4 py-3">
                          <p className="text-xs text-muted-foreground mb-2 font-mono break-all">{r.source_url}</p>
                          <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed">
                            {(r.logs ?? []).map((l) => `[${new Date(l.t).toLocaleTimeString()}] ${l.level.toUpperCase()} ${l.msg}`).join('\n') || 'No logs recorded.'}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;
