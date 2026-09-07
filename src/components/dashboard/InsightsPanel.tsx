import { useMemo } from 'react';
import { CTUILRecord } from '@/lib/types';
import { Lightbulb } from 'lucide-react';

const InsightsPanel = ({ data }: { data: CTUILRecord[] }) => {
  const insights = useMemo(() => {
    const results: string[] = [];
    
    // Top state
    const stateCounts: Record<string, number> = {};
    data.forEach(r => { stateCounts[r.state] = (stateCounts[r.state] || 0) + 1; });
    const topState = Object.entries(stateCounts).sort((a, b) => b[1] - a[1])[0];
    if (topState) results.push(`${topState[0]} leads with ${topState[1]} applications (${((topState[1] / data.length) * 100).toFixed(0)}% of total).`);

    // Top applicant by MW
    const appMW: Record<string, number> = {};
    data.forEach(r => { appMW[r.applicantName] = (appMW[r.applicantName] || 0) + r.connectivityMW; });
    const topApp = Object.entries(appMW).sort((a, b) => b[1] - a[1])[0];
    if (topApp) results.push(`${topApp[0]} has the highest aggregate connectivity at ${Math.round(topApp[1]).toLocaleString()} MW.`);

    // Dominant gen type
    const genCounts: Record<string, number> = {};
    data.forEach(r => { genCounts[r.generationType] = (genCounts[r.generationType] || 0) + 1; });
    const topGen = Object.entries(genCounts).sort((a, b) => b[1] - a[1])[0];
    if (topGen) results.push(`${topGen[0]} is the most applied-for generation type with ${topGen[1]} applications.`);

    // Most active substation
    const subCounts: Record<string, number> = {};
    data.forEach(r => { subCounts[r.substation] = (subCounts[r.substation] || 0) + 1; });
    const topSub = Object.entries(subCounts).sort((a, b) => b[1] - a[1])[0];
    if (topSub) results.push(`${topSub[0]} is the most sought-after substation with ${topSub[1]} applications.`);

    return results;
  }, [data]);

  if (!insights.length) return null;

  return (
    <div className="rounded-xl border bg-teal/5 border-teal/20 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="h-4 w-4 text-teal" />
        <h3 className="font-semibold text-sm">Synthesized Insights</h3>
      </div>
      <ul className="space-y-2">
        {insights.map((insight, i) => (
          <li key={i} className="text-sm text-muted-foreground flex gap-2">
            <span className="text-teal font-mono text-xs mt-0.5">{i + 1}.</span>
            {insight}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InsightsPanel;
