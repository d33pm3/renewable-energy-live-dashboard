import { FreshnessStatus } from '@/lib/types';

const colorMap: Record<FreshnessStatus['type'], string> = {
  'Live API': 'bg-teal/10 text-teal border-teal/30',
  'Latest Scrape': 'bg-primary/10 text-primary border-primary/30',
  'Latest Published PDF': 'bg-amber/10 text-amber border-amber/30',
  'Cached Snapshot': 'bg-muted text-muted-foreground border-border',
};

const FreshnessBadge = ({ status }: { status: FreshnessStatus }) => {
  const stamp = status.timestamp ? new Date(status.timestamp).toLocaleString() : 'never fetched';
  const soft = !status.healthy && status.supplemental;
  const cls = status.healthy
    ? colorMap[status.type]
    : soft
      ? 'bg-muted text-muted-foreground border-border'
      : 'bg-destructive/10 text-destructive border-destructive/30';
  return (
    <span
      title={
        status.healthy
          ? `Last successful fetch: ${stamp}`
          : soft
            ? `Supplemental status feed — CTUIL publishes no open payload here (last attempt: ${stamp})`
            : `No data available from this source (last attempt: ${stamp})`
      }
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-mono ${cls}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status.healthy ? 'bg-current animate-pulse-glow' : soft ? 'bg-muted-foreground' : 'bg-destructive'
        }`}
      />
      {status.type}
      {!status.healthy && (soft ? ' · supplemental' : ' · unavailable')}
    </span>
  );
};

export default FreshnessBadge;
