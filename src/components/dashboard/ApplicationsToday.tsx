import { useMemo } from 'react';
import { CTUILRecord } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Download, Mail, CalendarCheck } from 'lucide-react';
import { toast } from 'sonner';

const ApplicationsToday = ({ data, onEmailOpen }: { data: CTUILRecord[]; onEmailOpen: () => void }) => {
  const todayRecords = useMemo(() => data.filter(r => r.isTodayRecord), [data]);

  const exportCSV = () => {
    const headers = ['Application ID', 'Applicant', 'Type', 'Substation', 'State', 'Region', 'MW', 'Effective Date', 'Source'];
    const rows = todayRecords.map(r => [r.applicationId, r.applicantName, r.generationType, r.substation, r.state, r.region, r.connectivityMW, r.expectedEffectiveDate, r.source]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications-today-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  return (
    <div className="rounded-xl border bg-card shadow-card overflow-hidden">
      <div className="p-5 border-b flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CalendarCheck className="h-5 w-5 text-teal" />
          <div>
            <h3 className="font-semibold">Applications Made Today</h3>
            <p className="text-xs text-muted-foreground">
              {todayRecords.length > 0
                ? `${todayRecords.length} applications identified from latest source data`
                : 'No same-day application data published by source'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={exportCSV}>
            <Download className="h-3 w-3" /> Download CSV
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={onEmailOpen}>
            <Mail className="h-3 w-3" /> Email This List
          </Button>
        </div>
      </div>

      {todayRecords.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {['App ID', 'Applicant', 'Type', 'Substation', 'State', 'MW', 'Eff. Date', 'Source'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {todayRecords.map(r => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-2 font-mono text-xs">{r.applicationId}</td>
                  <td className="px-3 py-2 text-xs font-medium">{r.applicantName}</td>
                  <td className="px-3 py-2 text-xs">{r.generationType}</td>
                  <td className="px-3 py-2 text-xs">{r.substation}</td>
                  <td className="px-3 py-2 text-xs">{r.state}</td>
                  <td className="px-3 py-2 text-xs font-mono text-right">{r.connectivityMW}</td>
                  <td className="px-3 py-2 text-xs font-mono">{r.expectedEffectiveDate}</td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      r.source === 'API' ? 'bg-teal/10 text-teal' : 'bg-primary/10 text-primary'
                    }`}>{r.source}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-10 text-center text-muted-foreground text-sm">
          No same-day application data published by source.
        </div>
      )}
    </div>
  );
};

export default ApplicationsToday;
