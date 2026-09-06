import { motion } from 'framer-motion';
import { KPIData } from '@/lib/types';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

const KPICards = ({ kpis }: { kpis: KPIData[] }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-xl border bg-card p-5 shadow-card hover:shadow-elevated transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{kpi.label}</span>
            {!kpi.available && <AlertCircle className="h-3.5 w-3.5 text-amber" />}
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight">
            {kpi.available ? kpi.value : '—'}
          </div>
          {kpi.change && kpi.available && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
              kpi.changeType === 'positive' ? 'text-success' : kpi.changeType === 'negative' ? 'text-destructive' : 'text-muted-foreground'
            }`}>
              {kpi.changeType === 'positive' ? <TrendingUp className="h-3 w-3" /> : kpi.changeType === 'negative' ? <TrendingDown className="h-3 w-3" /> : null}
              {kpi.change}
            </div>
          )}
          {kpi.source && (
            <div className="text-[10px] text-muted-foreground mt-1 font-mono">{kpi.source}</div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default KPICards;
