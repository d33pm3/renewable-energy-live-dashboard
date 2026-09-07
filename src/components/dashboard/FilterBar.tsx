import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { REGION_NAMES } from '@/lib/types';
import { RefreshCw, Download, Mail } from 'lucide-react';

interface FilterBarProps {
  filters: Record<string, string>;
  options: { regions: string[]; genTypes: string[]; statuses: string[]; sources: string[] };
  onFilterChange: (filters: Record<string, string>) => void;
  onEmailOpen: () => void;
  onRefresh: () => void;
  onExport: () => void;
  refreshing?: boolean;
}

const FilterBar = ({ filters, options, onFilterChange, onEmailOpen, onRefresh, onExport, refreshing }: FilterBarProps) => {
  const set = (key: string, val: string) => onFilterChange({ ...filters, [key]: val });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" className="bg-teal hover:bg-teal/90 gap-2" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Fetching live data…' : 'Fetch Latest Data'}
        </Button>
        <Button size="sm" variant="outline" className="gap-2" onClick={onExport}>
          <Download className="h-3.5 w-3.5" /> Export CSV
        </Button>
        <Button size="sm" variant="outline" className="gap-2" onClick={onEmailOpen}>
          <Mail className="h-3.5 w-3.5" /> Email Dataset
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={filters.region} onValueChange={(v) => set('region', v)}>
          <SelectTrigger className="w-[170px] h-9 text-sm"><SelectValue placeholder="Region" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {options.regions.map((r) => (
              <SelectItem key={r} value={r}>{REGION_NAMES[r] ? `${r} — ${REGION_NAMES[r]}` : r}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.genType} onValueChange={(v) => set('genType', v)}>
          <SelectTrigger className="w-[190px] h-9 text-sm"><SelectValue placeholder="Generation Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {options.genTypes.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.status} onValueChange={(v) => set('status', v)}>
          <SelectTrigger className="w-[170px] h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {options.statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.source} onValueChange={(v) => set('source', v)}>
          <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {options.sources.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-2">
        {options.genTypes.slice(0, 8).map((g) => (
          <Badge
            key={g}
            variant={filters.genType === g ? 'default' : 'outline'}
            className={`cursor-pointer transition-colors text-xs ${filters.genType === g ? 'bg-primary' : 'hover:bg-muted'}`}
            onClick={() => set('genType', filters.genType === g ? 'all' : g)}
          >
            {g}
          </Badge>
        ))}
        <span className="mx-2 border-l border-border" />
        {options.regions.map((r) => (
          <Badge
            key={r}
            variant={filters.region === r ? 'default' : 'outline'}
            className={`cursor-pointer transition-colors text-xs ${filters.region === r ? 'bg-teal text-primary-foreground' : 'hover:bg-muted'}`}
            onClick={() => set('region', filters.region === r ? 'all' : r)}
          >
            {r}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default FilterBar;
