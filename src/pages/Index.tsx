import { useState, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import SourcesSection from '@/components/landing/SourcesSection';
import KPICards from '@/components/dashboard/KPICards';
import FilterBar from '@/components/dashboard/FilterBar';
import AnalyticsCharts from '@/components/dashboard/AnalyticsCharts';
import DataTable from '@/components/dashboard/DataTable';
import ApplicationsToday from '@/components/dashboard/ApplicationsToday';
import InsightsPanel from '@/components/dashboard/InsightsPanel';
import EmailModal from '@/components/dashboard/EmailModal';
import FreshnessBadge from '@/components/dashboard/FreshnessBadge';
import SourceStatusWidget from '@/components/dashboard/SourceStatusWidget';
import FieldMappingView from '@/components/dashboard/FieldMappingView';
import { Button } from '@/components/ui/button';
import { AlertCircle, FileText, Loader2, RotateCw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  buildFreshness,
  buildKPIs,
  cacheTimestamp,
  downloadCSV,
  fetchRecords,
  fetchRuns,
  recordsServedFromCache,
  triggerIngest,
} from '@/lib/ctuil';

/** Retries backend reads with exponential backoff so a blip never empties the dashboard. */
const RETRY = {
  retry: 3,
  retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 8000),
  staleTime: 60_000,
} as const;

const Index = () => {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [emailOpen, setEmailOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({
    region: 'all',
    genType: 'all',
    status: 'all',
    source: 'all',
  });

  const recordsQuery = useQuery({ queryKey: ['ctuil-records'], queryFn: fetchRecords, ...RETRY });
  const runsQuery = useQuery({ queryKey: ['ctuil-runs'], queryFn: () => fetchRuns(20), ...RETRY });

  const records = recordsQuery.data ?? [];
  const runs = runsQuery.data ?? [];

  const filteredData = useMemo(
    () =>
      records.filter((r) => {
        if (filters.region !== 'all' && r.region !== filters.region) return false;
        if (filters.genType !== 'all' && r.generationType !== filters.genType) return false;
        if (filters.status !== 'all' && (r.status ?? '').toLowerCase() !== filters.status.toLowerCase()) return false;
        if (filters.source !== 'all' && r.source !== filters.source) return false;
        return true;
      }),
    [records, filters],
  );

  const options = useMemo(() => {
    const uniq = (fn: (r: typeof records[number]) => string | null) =>
      [...new Set(records.map(fn).filter((v): v is string => Boolean(v)))].sort();
    return {
      regions: uniq((r) => r.region),
      genTypes: uniq((r) => r.generationType),
      statuses: uniq((r) => r.status),
      sources: uniq((r) => r.source),
    };
  }, [records]);

  const kpis = useMemo(() => buildKPIs(filteredData), [filteredData]);
  const freshness = useMemo(() => buildFreshness(runs), [runs]);
  const freshnessText = freshness
    .map((f) => `${f.type}: ${f.timestamp ? new Date(f.timestamp).toUTCString() : 'never'}${f.healthy ? '' : ' (unavailable)'}`)
    .join(' | ');

  const scrollToDashboard = () => dashboardRef.current?.scrollIntoView({ behavior: 'smooth' });
  const scrollToCharts = () => chartsRef.current?.scrollIntoView({ behavior: 'smooth' });


  const handleRefresh = async (force = false) => {
    setRefreshing(true);
    toast.info(
      force
        ? 'Full refresh — re-scraping every page and re-parsing the latest report…'
        : 'Checking CTUIL for new data (recently fetched sources are served from cache)…',
    );
    try {
      const res = await triggerIngest('all', force);
      const ok = res.results.filter((r) => r.status === 'success');
      const cached = res.results.filter((r) => r.status === 'cached' || r.skipped);
      const failed = res.results.filter((r) => r.status === 'failed' || r.status === 'stale');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ctuil-records'] }),
        queryClient.invalidateQueries({ queryKey: ['ctuil-runs'] }),
      ]);
      if (ok.length) {
        toast.success(
          `Fetched ${ok.reduce((s, r) => s + (r.found ?? 0), 0).toLocaleString()} records from ${ok.length} source(s)`,
        );
      }
      cached.forEach((c) =>
        toast.info(
          `${c.source}: already up to date${c.ageMinutes != null ? ` (refreshed ${c.ageMinutes} min ago)` : ''} — served from cache`,
        ),
      );
      const supplemental = res.results.filter((r) => r.status === 'unavailable');
      supplemental.forEach((f) =>
        toast.info(`${f.source}: supplemental feed publishes no open payload right now — skipped.`),
      );
      failed.forEach((f) =>
        toast.warning(
          `${f.source}: CTUIL did not respond after 4 retries${
            f.fallbackRecords ? ` — showing ${f.fallbackRecords.toLocaleString()} previously stored records` : ''
          }`,
        ),
      );
    } catch {
      toast.warning('CTUIL did not respond after several retries — the dashboard is still showing the last stored data.');
    } finally {
      setRefreshing(false);
    }
  };

  const lastFetch = records[0]?.fetchTime ?? runs.find((r) => r.status === 'success')?.finished_at ?? null;
  const offline = recordsServedFromCache && records.length > 0;
  // Only the two sources of record can warn here, and only when their most recent run
  // did not succeed. The supplemental NSWS probe never raises a dashboard warning.
  const failedSources = (['HTML', 'PDF'] as const).filter((src) => {
    const last = runs.find((r) => r.source === src);
    return Boolean(last) && last!.status !== 'success' && last!.status !== 'cached' && last!.status !== 'running';
  });

  return (
    <div className="min-h-screen">
      <HeroSection
        onScrollToDashboard={scrollToDashboard}
        onExploreTrends={scrollToCharts}
        fetching={refreshing}
        onFetchLatest={() => {
          scrollToDashboard();
          void handleRefresh(true);
        }}
      />

      <FeaturesSection />
      <SourcesSection freshness={freshness} />

      <section ref={dashboardRef} className="py-16 bg-background">
        <div className="container space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {recordsQuery.isLoading
                  ? 'Loading stored CTUIL records…'
                  : `${records.length.toLocaleString()} live CTUIL records · last fetched ${
                      lastFetch ? new Date(lastFetch).toLocaleString() : 'never'
                    }`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {freshness.map((s) => (
                <FreshnessBadge key={s.type} status={s} />
              ))}
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => handleRefresh(true)}
                disabled={refreshing}
              >
                <RotateCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Full refresh
              </Button>
              <Button asChild size="sm" variant="outline" className="gap-2">
                <Link to="/reports">
                  <FileText className="h-3.5 w-3.5" /> Monthly Reports
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="gap-2">
                <Link to="/admin">
                  <ShieldCheck className="h-3.5 w-3.5" /> Source Admin
                </Link>
              </Button>

            </div>
          </div>

          {(offline || failedSources.length > 0) && (
            <div className="flex items-start gap-3 rounded-lg border border-amber/40 bg-amber/5 p-4 text-sm">
              <AlertCircle className="h-4 w-4 text-amber mt-0.5 shrink-0" />
              <p className="text-muted-foreground">
                {offline
                  ? `Live connection unavailable — showing your last saved snapshot${
                      cacheTimestamp() ? ` from ${new Date(cacheTimestamp()!).toLocaleString()}` : ''
                    }.`
                  : `${failedSources.join(', ')} could not be reached on the last attempt — everything below is the most recent data successfully collected before that.`}
              </p>
            </div>
          )}

          <KPICards kpis={kpis} />

          <SourceStatusWidget runs={runs} records={records} />

          <FilterBar
            filters={filters}
            options={options}
            onFilterChange={setFilters}
            onEmailOpen={() => setEmailOpen(true)}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            onExport={() => {
              downloadCSV(filteredData, 'ctuil-dataset');
              toast.success(`${filteredData.length.toLocaleString()} records exported`);
            }}
          />

          {recordsQuery.isLoading ? (
            <div className="flex items-center justify-center gap-3 rounded-xl border bg-card p-16 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading CTUIL records…
            </div>
          ) : recordsQuery.isError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
              Could not load records: {(recordsQuery.error as Error).message}
            </div>
          ) : records.length === 0 ? (
            <div className="rounded-xl border bg-card p-12 text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                No CTUIL records stored yet. Run a live fetch to scrape the Connectivity Effective List and parse the
                latest monthly Connectivity Granted report.
              </p>
              <Button onClick={() => handleRefresh(true)} disabled={refreshing} className="bg-teal hover:bg-teal/90">
                {refreshing ? 'Fetching…' : 'Fetch Latest Data'}
              </Button>
            </div>
          ) : (
            <>
              <InsightsPanel data={filteredData} />
              <div ref={chartsRef}>
                <AnalyticsCharts data={filteredData} />
              </div>
              <ApplicationsToday data={filteredData} onEmailOpen={() => setEmailOpen(true)} />
              <DataTable data={filteredData} />
              <FieldMappingView records={records} />
            </>
          )}

          <div className="flex items-start gap-3 rounded-lg border border-amber/30 bg-amber/5 p-4 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 text-amber mt-0.5 shrink-0" />
            <p>
              Every record shown here is parsed directly from CTUIL's published Connectivity Effective List and monthly
              Connectivity Granted reports. Fields that CTUIL does not publish are shown as "Not published" rather than
              estimated. Verify independently before regulatory or commercial use.
            </p>
          </div>
        </div>
      </section>

      <footer className="gradient-hero py-12">
        <div className="container text-center">
          <p className="text-primary-foreground/40 text-sm">CTUIL GNA &amp; Connectivity Intelligence</p>
          <p className="text-primary-foreground/25 text-xs mt-2">
            Data sourced from publicly available CTUIL records. Not affiliated with CTUIL or CTU.
          </p>
        </div>
      </footer>

      <EmailModal
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        records={filteredData}
        filters={filters}
        freshness={freshnessText}
        chartsRef={chartsRef}
      />
    </div>
  );
};

export default Index;
