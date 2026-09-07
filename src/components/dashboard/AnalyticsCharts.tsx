import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { CTUILRecord } from '@/lib/types';

const CHART_COLORS = [
  'hsl(210, 100%, 40%)', 'hsl(160, 70%, 40%)', 'hsl(35, 95%, 55%)',
  'hsl(280, 60%, 50%)', 'hsl(0, 70%, 55%)', 'hsl(190, 80%, 45%)', 'hsl(45, 90%, 50%)',
];

const AnalyticsCharts = ({ data }: { data: CTUILRecord[] }) => {
  const regionData = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach(r => { map[r.region] = (map[r.region] || 0) + r.connectivityMW; });
    return Object.entries(map).map(([name, mw]) => ({ name, mw: Math.round(mw) })).sort((a, b) => b.mw - a.mw);
  }, [data]);

  const genTypeData = useMemo(() => {
    const PRIMARY = ['Solar', 'Wind', 'BESS', 'FDRE', 'Thermal', 'Nuclear'];
    const map: Record<string, number> = {};
    data.forEach(r => { map[r.generationType] = (map[r.generationType] || 0) + 1; });

    const matchPrimary = (name: string) =>
      PRIMARY.find(p => new RegExp(`\\b${p}\\b`, 'i').test(name)) ?? null;

    const primaryCounts: Record<string, number> = {};
    const others: { name: string; count: number }[] = [];
    Object.entries(map).forEach(([name, count]) => {
      const p = matchPrimary(name);
      if (p) primaryCounts[p] = (primaryCounts[p] || 0) + count;
      else others.push({ name, count });
    });

    const result = PRIMARY.filter(p => primaryCounts[p])
      .map(p => ({ name: p, count: primaryCounts[p], detail: '' }))
      .sort((a, b) => b.count - a.count);

    if (others.length) {
      const top3 = others.sort((a, b) => b.count - a.count).slice(0, 3);
      const label = `Others (${top3.map(o => o.name).join(', ')}${others.length > 3 ? ` +${others.length - 3}` : ''})`;
      result.push({
        name: label,
        count: others.reduce((s, o) => s + o.count, 0),
        detail: others.map(o => `${o.name}: ${o.count}`).join(' · '),
      });
    }
    return result;
  }, [data]);

  const topApplicants = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach(r => { map[r.applicantName] = (map[r.applicantName] || 0) + r.connectivityMW; });
    return Object.entries(map).map(([name, mw]) => ({ name: name.split(' ').slice(0, 2).join(' '), mw: Math.round(mw) }))
      .sort((a, b) => b.mw - a.mw).slice(0, 5);
  }, [data]);

  const topSubstations = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach(r => { map[r.substation] = (map[r.substation] || 0) + 1; });
    return Object.entries(map).map(([name, count]) => ({ name: name.split(' ')[0], count }))
      .sort((a, b) => b.count - a.count).slice(0, 5);
  }, [data]);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Region-wise MW */}
      <div className="rounded-xl border bg-card p-5 shadow-card">
        <h3 className="font-semibold text-sm mb-4">Connectivity MW by Region</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={regionData}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => [`${v.toLocaleString()} MW`, 'Connectivity']} />
            <Bar dataKey="mw" fill="hsl(210, 100%, 40%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Generation type distribution */}
      <div className="rounded-xl border bg-card p-5 shadow-card">
        <h3 className="font-semibold text-sm mb-4">Applications by Generation Type</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={genTypeData}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={88}
              paddingAngle={2}
              label={({ name, percent }: any) =>
                percent >= 0.04 ? `${String(name).split(' (')[0]} ${(percent * 100).toFixed(0)}%` : ''
              }
              labelLine={false}
              fontSize={11}
            >
              {genTypeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip
              formatter={(v: number, _n, item: any) => [
                `${v.toLocaleString()} applications`,
                item?.payload?.detail ? `${item.payload.name}\n${item.payload.detail}` : item?.payload?.name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-xs text-muted-foreground">
          {genTypeData.map((g, i) => (
            <span key={g.name} className="inline-flex items-center gap-1.5" title={g.detail || undefined}>
              <span className="h-2 w-2 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
              {g.name} · {g.count.toLocaleString()}
            </span>
          ))}
        </div>
      </div>

      {/* Top 5 applicants */}
      <div className="rounded-xl border bg-card p-5 shadow-card">
        <h3 className="font-semibold text-sm mb-4">Top 5 Applicants by MW</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={topApplicants} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
            <Tooltip formatter={(v: number) => [`${v.toLocaleString()} MW`, 'Connectivity']} />
            <Bar dataKey="mw" fill="hsl(160, 70%, 40%)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top 5 substations */}
      <div className="rounded-xl border bg-card p-5 shadow-card">
        <h3 className="font-semibold text-sm mb-4">Top 5 Substations by Applications</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={topSubstations} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
            <Tooltip />
            <Bar dataKey="count" fill="hsl(35, 95%, 55%)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
