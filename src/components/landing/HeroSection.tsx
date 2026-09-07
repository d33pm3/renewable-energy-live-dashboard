import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Zap, BarChart3, Send, Loader2 } from 'lucide-react';

interface HeroSectionProps {
  onScrollToDashboard: () => void;
  onFetchLatest?: () => void;
  onExploreTrends?: () => void;
  fetching?: boolean;
}

const HeroSection = ({ onScrollToDashboard, onFetchLatest, onExploreTrends, fetching = false }: HeroSectionProps) => {
  return (
    <section className="gradient-hero relative overflow-hidden min-h-[90vh] flex items-center">
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(hsl(210, 100%, 55%) 1px, transparent 1px), linear-gradient(90deg, hsl(210, 100%, 55%) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      <div className="container relative z-10 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal/10 px-4 py-1.5 text-sm mb-8"
          >
            <span className="h-2 w-2 rounded-full bg-teal animate-pulse-glow" />
            <span className="text-teal-light font-mono text-xs tracking-wide">LIVE DATA INTELLIGENCE</span>
          </motion.div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            <span className="text-primary-foreground">Live CTUIL GNA &</span>
            <br />
            <span className="text-gradient">Connectivity Intelligence</span>
            <br />
            <span className="text-primary-foreground/70 text-3xl md:text-4xl lg:text-5xl">for Renewable Energy in India</span>
          </h1>

          <p className="text-lg md:text-xl text-primary-foreground/60 max-w-2xl mb-10 leading-relaxed">
            Fetch, structure, analyze, and share CTUIL connectivity application data through interactive dashboards, trend views, and one-click email workflows.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button
              size="lg"
              className="bg-teal hover:bg-teal/90 text-primary-foreground gap-2 text-base px-8 h-12 shadow-glow"
              onClick={onScrollToDashboard}
            >
              <BarChart3 className="h-5 w-5" />
              View Dashboard
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 gap-2 text-base px-8 h-12 disabled:opacity-60"
              onClick={onFetchLatest}
              disabled={fetching}
            >
              {fetching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
              {fetching ? 'Fetching…' : 'Fetch Latest Data'}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 gap-2 text-base px-8 h-12"
              onClick={onExploreTrends}
            >
              <Send className="h-5 w-5" />
              Explore Trends
            </Button>
          </div>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl"
        >
          {[
            { label: 'Sources Monitored', value: '3+' },
            { label: 'Records Indexed', value: '10K+' },
            { label: 'States Covered', value: '15+' },
            { label: 'Real-time Updates', value: '24/7' },
          ].map((stat) => (
            <div key={stat.label} className="text-center md:text-left">
              <div className="text-2xl md:text-3xl font-bold text-primary-foreground font-mono">{stat.value}</div>
              <div className="text-sm text-primary-foreground/40 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
