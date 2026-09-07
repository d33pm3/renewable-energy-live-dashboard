import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Download, ExternalLink, FileText, Loader2, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { fetchMonthlyReports, reportFileUrl, reportPeriodLabel } from '@/lib/reports';

const Reports = () => {
  const [query, setQuery] = useState('');
  const reportsQuery = useQuery({
    queryKey: ['monthly-reports'],
    queryFn: fetchMonthlyReports,
    retry: 2,
    staleTime: 10 * 60 * 1000,
  });

  const reports = reportsQuery.data?.reports ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter((r) => `${r.label} ${r.fileName} ${reportPeriodLabel(r)}`.toLowerCase().includes(q));
  }, [reports, query]);

  const years = useMemo(
    () => Array.from(new Set(reports.map((r) => r.year).filter(Boolean))).sort((a, b) => (b as number) - (a as number)),
    [reports],
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-hero border-b border-border text-primary-foreground">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-6">
          <div>
            <Link
              to="/"
              className="mb-2 inline-flex items-center gap-2 text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back to dashboard
            </Link>
            <h1 className="font-display text-2xl font-bold md:text-3xl">Monthly RE Effectiveness reports</h1>
            <p className="mt-1 max-w-2xl text-sm text-primary-foreground/70">
              Every Connectivity Granted / RE Effectiveness PDF published by CTUIL, listed live from the source page.
              Open a report to read it in the browser or download the original file.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => reportsQuery.refetch()}
            disabled={reportsQuery.isFetching}
            className="gap-2"
          >
            {reportsQuery.isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh list
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by month, year or file name"
              className="pl-9"
            />
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {filtered.length} report{filtered.length === 1 ? '' : 's'}
          </Badge>
          {years.length > 0 && (
            <span className="text-xs text-muted-foreground">
              Covering {years[years.length - 1]}–{years[0]}
            </span>
          )}
        </div>

        {reportsQuery.data?.warning && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber/40 bg-amber/5 p-4 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
            <p className="text-muted-foreground">
              CTUIL's publications page did not respond just now, so this is the last list we successfully read. Files
              still download straight from CTUIL.
            </p>
          </div>
        )}

        {reportsQuery.isLoading && (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Reading the CTUIL publications page…
          </div>
        )}

        {reportsQuery.isError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
            <p className="font-medium text-destructive">Could not read the CTUIL publications page</p>
            <p className="mt-1 text-sm text-muted-foreground">{(reportsQuery.error as Error).message}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => reportsQuery.refetch()}>
              Try again
            </Button>
          </div>
        )}

        {!reportsQuery.isLoading && !reportsQuery.isError && filtered.length === 0 && (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            No published report matches this search.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <article
              key={r.slug}
              className="flex flex-col justify-between rounded-lg border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-teal/10 text-teal">
                    <FileText className="h-5 w-5" />
                  </span>
                  <Badge variant="outline" className="font-mono text-[11px]">
                    {reportPeriodLabel(r)}
                  </Badge>
                </div>
                <h2 className="font-display text-base font-semibold leading-snug text-foreground">{r.label}</h2>
                <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{r.fileName}</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button asChild size="sm" className="gap-2">
                  <Link to={`/reports/${r.slug}`} state={{ report: r }}>
                    <FileText className="h-4 w-4" /> View
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="gap-2">
                  <a href={reportFileUrl(r.url, true)}>
                    <Download className="h-4 w-4" /> Download
                  </a>
                </Button>
                <Button asChild size="sm" variant="ghost" className="gap-2">
                  <a href={r.url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" /> Source
                  </a>
                </Button>
              </div>
            </article>
          ))}
        </div>

        {reportsQuery.data && (
          <p className="mt-8 text-xs text-muted-foreground">
            Listed live from {reportsQuery.data.source} · read {new Date(reportsQuery.data.fetchedAt).toLocaleString()}.
            Files are served exactly as published by CTUIL; nothing is rewritten.
          </p>
        )}
      </main>
    </div>
  );
};

export default Reports;
