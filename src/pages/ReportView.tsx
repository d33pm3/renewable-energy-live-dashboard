import { useQuery } from '@tanstack/react-query';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Download, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchMonthlyReports, MonthlyReport, reportFileUrl, reportPeriodLabel } from '@/lib/reports';

const ReportView = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const passed = (location.state as { report?: MonthlyReport } | null)?.report;

  const reportsQuery = useQuery({
    queryKey: ['monthly-reports'],
    queryFn: fetchMonthlyReports,
    enabled: !passed,
    retry: 2,
    staleTime: 10 * 60 * 1000,
  });

  const report = passed ?? reportsQuery.data?.reports.find((r) => r.slug === slug);

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-hero border-b border-border text-primary-foreground">
        <div className="container mx-auto flex flex-wrap items-end justify-between gap-4 px-4 py-6">
          <div className="min-w-0">
            <Link
              to="/reports"
              className="mb-2 inline-flex items-center gap-2 text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> All monthly reports
            </Link>
            <h1 className="truncate font-display text-xl font-bold md:text-2xl">
              {report?.label ?? 'Published report'}
            </h1>
            {report && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="font-mono text-[11px]">
                  {reportPeriodLabel(report)}
                </Badge>
                <span className="break-all font-mono text-xs text-primary-foreground/60">{report.fileName}</span>
              </div>
            )}
          </div>
          {report && (
            <div className="flex flex-wrap gap-2">
              <Button asChild className="gap-2">
                <a href={reportFileUrl(report.url, true)}>
                  <Download className="h-4 w-4" /> Download PDF
                </a>
              </Button>
              <Button asChild variant="secondary" className="gap-2">
                <a href={report.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" /> Open on CTUIL
                </a>
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!report && reportsQuery.isLoading && (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Locating this report on the CTUIL publications page…
          </div>
        )}

        {!report && !reportsQuery.isLoading && (
          <div className="rounded-lg border border-border bg-card p-8">
            <p className="font-medium">This report is no longer listed by CTUIL.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {reportsQuery.isError
                ? (reportsQuery.error as Error).message
                : 'It may have been renamed or replaced by a newer monthly publication.'}
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link to="/reports">Back to the report list</Link>
            </Button>
          </div>
        )}

        {report && (
          <>
            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <object data={reportFileUrl(report.url)} type="application/pdf" className="h-[80vh] w-full">
                <iframe
                  src={reportFileUrl(report.url)}
                  title={report.label}
                  className="h-[80vh] w-full border-0"
                />
              </object>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Served straight from the CTUIL file at {report.url}. If your browser cannot display PDFs inline, use
              Download PDF above.
            </p>
          </>
        )}
      </main>
    </div>
  );
};

export default ReportView;
