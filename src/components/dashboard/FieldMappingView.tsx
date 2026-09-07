import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CTUILRecord } from '@/lib/types';
import { SourceKey } from '@/lib/ctuil';
import { coverage, FIELD_MAPS } from '@/lib/field-mapping';

const SOURCES: SourceKey[] = ['HTML', 'PDF', 'API'];

interface Props {
  records: CTUILRecord[];
}

const FieldMappingView = ({ records }: Props) => {
  const [scope, setScope] = useState<SourceKey | 'all'>('all');

  return (
    <section className="rounded-xl border bg-card shadow-card overflow-hidden">
      <div className="p-5 border-b flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Schema discovery &amp; field mapping</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Which original CTUIL field feeds each dashboard attribute, how it is normalised, and how often it is
            actually published.
          </p>
        </div>
        <div className="flex gap-1.5">
          {(['all', ...SOURCES] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={scope === s ? 'default' : 'outline'}
              className="h-7 text-xs"
              onClick={() => setScope(s)}
            >
              {s === 'all' ? 'All sources' : s}
            </Button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-4 py-3">Dashboard attribute</th>
              {SOURCES.map((s) => (
                <th key={s} className="text-left font-medium px-4 py-3">
                  Original field · {s}
                </th>
              ))}
              <th className="text-left font-medium px-4 py-3">Normalisation</th>
              <th className="text-left font-medium px-4 py-3 whitespace-nowrap">Populated</th>
            </tr>
          </thead>
          <tbody>
            {FIELD_MAPS.map((m) => {
              const pct = coverage(records, m, scope === 'all' ? undefined : scope);
              return (
                <tr key={m.canonical} className="border-t align-top hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{m.canonical}</td>
                  {SOURCES.map((s) => (
                    <td key={s} className="px-4 py-3 text-xs text-muted-foreground max-w-[220px]">
                      {m.origin[s] ?? <span className="italic">not published</span>}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[260px]">{m.transform}</td>
                  <td className="px-4 py-3">
                    {pct === null ? (
                      <span className="text-xs text-muted-foreground">no rows</span>
                    ) : (
                      <Badge
                        variant="outline"
                        className={
                          pct >= 90
                            ? 'bg-teal/15 text-teal border-teal/30'
                            : pct >= 40
                              ? 'bg-amber/15 text-amber border-amber/30'
                              : 'bg-destructive/10 text-destructive border-destructive/30'
                        }
                      >
                        {pct}%
                      </Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="px-5 py-3 border-t text-xs text-muted-foreground">
        "Populated" is measured on the records currently stored — blank cells mean CTUIL did not publish that field, not
        that a value was lost. Nothing is inferred or filled in.
      </p>
    </section>
  );
};

export default FieldMappingView;
