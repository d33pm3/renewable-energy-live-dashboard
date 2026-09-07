import { motion } from 'framer-motion';
import { Database, BarChart3, Filter, Mail, FileDown, Shield, Globe, Clock } from 'lucide-react';

const features = [
  { icon: Database, title: 'Multi-Source Ingestion', desc: 'API, HTML scrape, and PDF archive parsing from CTUIL sources with automatic normalization.' },
  { icon: BarChart3, title: 'Interactive Analytics', desc: 'Region, state, substation, and applicant analytics with filterable charts and trend views.' },
  { icon: Filter, title: 'Precision Filters', desc: 'Filter by generation type, region, state, substation, applicant, and effective timeline.' },
  { icon: Mail, title: 'Email Workflows', desc: 'Share datasets, visualizations, and daily application lists directly via email.' },
  { icon: FileDown, title: 'Export Anywhere', desc: 'Download filtered data as CSV with full source provenance and timestamps.' },
  { icon: Shield, title: 'Data Trust', desc: 'Source lineage, freshness badges, and transparent labeling for derived metrics.' },
  { icon: Globe, title: 'All-India Coverage', desc: 'NR, WR, SR, ER, NER — complete regional and state-level visibility.' },
  { icon: Clock, title: 'Applications Today', desc: 'Dedicated view of latest applications with instant share capabilities.' },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-mono text-teal tracking-widest uppercase">Capabilities</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">
            Everything you need for <span className="text-gradient">connectivity intelligence</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From raw CTUIL data to executive-ready insights — structured, visualized, and shareable.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-xl border bg-card p-6 shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
