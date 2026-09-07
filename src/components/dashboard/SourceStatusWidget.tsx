import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock, ExternalLink, Loader2, XCircle } from 'lucide-react';
import { CTUILRecord } from '@/lib/types';
import { describeStatus, IngestionRun, SOURCE_LABELS, SourceKey } from '@/lib/ctuil';

const SOURCES: SourceKey[] = ['HTML', 'PDF', 'API'];

const rel = (iso?: string | null) => {
  if (!iso) return 'never';
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  return `${Math.round(hrs / 24)} d ago`;
};

interface Props {
  runs: IngestionRun[];
  records: CTUILRecord[];
}

const SourceStatusWidget = ({ runs, records }: Props) => {
  const rows = useMemo(
    () =>
      SOURCES.map((source) => {
        const last = runs.find((r) => r.source === source);
        const lastOk = runs.find((r) => r.source === source && r.status === 'success' && r.records_upserted > 0);
        const stored = records.filter((r) => r.source === source);
        // A run that never reported back is abandoned after 2 minutes so the row
        // stops spinning forever; the Fetch Latest Data button starts a fresh one.
        const startedMs = last?.started_at ? new Date(last.started_at).getTime() : 0;
        const abandoned = last?.status === 'running' && Date.now() - startedMs > 120_000;
        const view = describeStatus({
          source,
          status: last?.status ?? 'never run',
          stored: stored.length,
          error: last?.error_message,
          abandoned,
        });
        return {
          source,
          label: SOURCE_LABELS[source],
          view,
          lastFetch: lastOk?.finished_at ?? null,
          lastAttempt: last?.finished_at ?? last?.started_at ?? null,
          found: last?.records_found ?? 0,
          stored: stored.length,
          url: last?.source_url ?? null,
        };
      }),
    [runs, records],
  );

  return (
    <section className="rounded-xl border bg-card shadow-card overflow-hidden">
      <div className="p-5 border-b">
        <h2 className="font-semibold">Source status</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Last fetch time, outcome, record counts and any error reported by each CTUIL connector. Every fetch retries up
          to 4 times with increasing waits before it is reported as degraded.
        </p>
      </div>
      <div className="divide-y">
        {rows.map((r) => {
          const { tone, label, message } = r.view;
          return (
            <div key={r.source} className="p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {tone === 'busy' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-amber" />
                  ) : tone === 'ok' ? (
                    <CheckCircle2 className="h-4 w-4 text-teal" />
                  ) : tone === 'degraded' ? (
                    <AlertCircle className="h-4 w-4 text-amber" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span className="font-mono text-xs font-semibold">{r.source}</span>
                  <Badge
                    variant="outline"
                    className={
                      tone === 'ok'
                        ? 'bg-teal/15 text-teal border-teal/30'
                        : tone === 'error'
                          ? 'bg-destructive/10 text-destructive border-destructive/30'
                          : 'bg-amber/15 text-amber border-amber/30'
                    }
                  >
                    {label}
                  </Badge>
                </div>
                <p className="text-sm mt-1.5">{r.label}</p>
                {r.url && (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mt-1 break-all"
                  >
                    {r.url} <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                )}
                {message && (
                  <p
                    className={`text-xs rounded p-2 mt-2 break-words ${
                      tone === 'error' ? 'text-destructive bg-destructive/5' : 'text-amber bg-amber/10'
                    }`}
                  >
                    {message}
                  </p>
                )}
              </div>
              <dl className="flex gap-6 shrink-0 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Records stored</dt>
                  <dd className="font-mono">{r.stored.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Last run found</dt>
                  <dd className="font-mono">{r.found.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Last successful fetch
                  </dt>
                  <dd className="font-mono">{rel(r.lastFetch)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Last attempt</dt>
                  <dd className="font-mono">{rel(r.lastAttempt)}</dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default SourceStatusWidget;
