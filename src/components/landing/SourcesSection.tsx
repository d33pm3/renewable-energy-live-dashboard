import { motion } from 'framer-motion';
import { FreshnessStatus } from '@/lib/types';
import FreshnessBadge from '@/components/dashboard/FreshnessBadge';

const SourcesSection = ({ freshness }: { freshness: FreshnessStatus[] }) => {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-sm font-mono text-teal tracking-widest uppercase">Data Sources</span>
          <h2 className="text-3xl font-bold mt-3 mb-4">Multi-source intelligence pipeline</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">Continuously monitoring CTUIL endpoints for the freshest connectivity data.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { name: 'Connectivity Effective List', url: 'ctuil.in/connectivity-effective-list' },
            { name: 'Monthly Connectivity Granted PDFs', url: 'ctuil.in/gna2022updates' },
            { name: 'CTUIL NSWS GNA endpoint', url: 'ctuil.in/nswsapi/gna' },
          ].map((source, i) => (
            <motion.div
              key={source.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border bg-card p-6 shadow-card"
            >
              <div className="flex items-center justify-between mb-4">
                {freshness[i] && <FreshnessBadge status={freshness[i]} />}
              </div>
              <h3 className="font-semibold mb-1">{source.name}</h3>
              <p className="text-xs font-mono text-muted-foreground truncate">{source.url}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SourcesSection;
