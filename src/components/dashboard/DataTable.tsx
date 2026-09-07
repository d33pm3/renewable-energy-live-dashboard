import { useState, useMemo } from 'react';
import { CTUILRecord } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import { toast } from 'sonner';

const PAGE_SIZE = 15;

const DataTable = ({ data }: { data: CTUILRecord[] }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<keyof CTUILRecord>('applicationId');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter(r =>
      r.applicantName.toLowerCase().includes(q) ||
      r.applicationId.toLowerCase().includes(q) ||
      r.substation.toLowerCase().includes(q) ||
      r.state.toLowerCase().includes(q)
    );
  }, [data, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === 'number' ? av - (bv as number) : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  const toggleSort = (key: keyof CTUILRecord) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(0);
  };

  const columns: { key: keyof CTUILRecord; label: string; width?: string }[] = [
    { key: 'applicationId', label: 'App ID', width: 'w-28' },
    { key: 'applicantName', label: 'Applicant', width: 'w-40' },
    { key: 'region', label: 'Region', width: 'w-16' },
    { key: 'state', label: 'State', width: 'w-28' },
    { key: 'substation', label: 'Substation', width: 'w-36' },
    { key: 'generationType', label: 'Type', width: 'w-28' },
    { key: 'connectivityMW', label: 'MW' },
    { key: 'expectedEffectiveDate', label: 'Eff. Date', width: 'w-24' },
    { key: 'source', label: 'Source', width: 'w-20' },
  ];

  const copyRow = (r: CTUILRecord) => {
    navigator.clipboard.writeText(JSON.stringify(r, null, 2));
    toast.success('Row copied');
  };

  return (
    <div className="rounded-xl border bg-card shadow-card overflow-hidden">
      <div className="p-4 border-b flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applicant, ID, substation, state..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="pl-9 h-9"
          />
        </div>
        <span className="text-xs text-muted-foreground font-mono">{sorted.length} records</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-3 py-2.5 text-left font-medium text-muted-foreground text-xs cursor-pointer hover:text-foreground select-none ${col.width || ''}`}
                  onClick={() => toggleSort(col.key)}
                >
                  {col.label}
                  {sortKey === col.key && <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </th>
              ))}
              <th className="px-3 py-2.5 w-10" />
            </tr>
          </thead>
          <tbody>
            {paged.map(r => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-3 py-2.5 font-mono text-xs">{r.applicationId}</td>
                <td className="px-3 py-2.5 text-xs font-medium truncate max-w-[160px]">{r.applicantName}</td>
                <td className="px-3 py-2.5 text-xs">{r.region}</td>
                <td className="px-3 py-2.5 text-xs">{r.state}</td>
                <td className="px-3 py-2.5 text-xs truncate max-w-[140px]">{r.substation}</td>
                <td className="px-3 py-2.5 text-xs">{r.generationType}</td>
                <td className="px-3 py-2.5 text-xs font-mono text-right">{r.connectivityMW}</td>
                <td className="px-3 py-2.5 text-xs font-mono">{r.expectedEffectiveDate}</td>
                <td className="px-3 py-2.5">
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    r.source === 'API' ? 'bg-teal/10 text-teal' :
                    r.source === 'HTML' ? 'bg-primary/10 text-primary' :
                    r.source === 'PDF' ? 'bg-amber/10 text-amber' : 'bg-muted text-muted-foreground'
                  }`}>{r.source}</span>
                </td>
                <td className="px-2 py-2.5">
                  <button onClick={() => copyRow(r)} className="p-1 rounded hover:bg-muted transition-colors">
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-3 border-t flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
