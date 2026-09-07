import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Mail, Send } from 'lucide-react';
import { toPng } from 'html-to-image';
import { CTUILRecord } from '@/lib/types';
import { sendDatasetEmail, toCSV } from '@/lib/ctuil';
import { RefObject } from 'react';

interface EmailModalProps {
  open: boolean;
  onClose: () => void;
  records: CTUILRecord[];
  filters: Record<string, string>;
  freshness: string;
  chartsRef: RefObject<HTMLDivElement>;
}

const EmailModal = ({ open, onClose, records, filters, freshness, chartsRef }: EmailModalProps) => {
  const [email, setEmail] = useState('');
  const [includeDataset, setIncludeDataset] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(false);
  const [includeTodayApps, setIncludeTodayApps] = useState(false);
  const [sending, setSending] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const todayRecords = records.filter(r => r.isTodayRecord);

  const handleSend = async () => {
    if (!isValidEmail) return;
    setSending(true);
    try {
      let chartImages: { name: string; dataUrl: string }[] | undefined;
      if (includeCharts && chartsRef.current) {
        const dataUrl = await toPng(chartsRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
        chartImages = [{ name: 'dashboard-charts.png', dataUrl }];
      }

      await sendDatasetEmail({
        recipient: email,
        includeDataset,
        includeToday: includeTodayApps,
        includeCharts,
        filters,
        freshness,
        summary: {
          totalRecords: records.length,
          totalConnectivityMw: Math.round(records.reduce((s, r) => s + r.connectivityMW, 0)),
          regions: new Set(records.map(r => r.region)).size,
          applicants: new Set(records.map(r => r.applicantName)).size,
        },
        datasetCsv: includeDataset ? toCSV(records) : undefined,
        todayCsv: includeTodayApps ? toCSV(todayRecords) : undefined,
        chartImages,
      });
      toast.success(`Data sent to ${email}`);
      onClose();
      setEmail('');
    } catch (e) {
      toast.error(`Could not send email: ${(e as Error).message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Email Dataset & Visualizations
          </DialogTitle>
          <DialogDescription>
            Send filtered CTUIL data and charts to any email address.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="email">Recipient Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="analyst@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label>Include in email</Label>
            <div className="flex items-center gap-2">
              <Checkbox id="dataset" checked={includeDataset} onCheckedChange={v => setIncludeDataset(!!v)} />
              <label htmlFor="dataset" className="text-sm">Current filtered dataset ({records.length.toLocaleString()} rows, CSV)</label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="charts" checked={includeCharts} onCheckedChange={v => setIncludeCharts(!!v)} />
              <label htmlFor="charts" className="text-sm">Dashboard visualizations</label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="today" checked={includeTodayApps} onCheckedChange={v => setIncludeTodayApps(!!v)} />
              <label htmlFor="today" className="text-sm">Applications Made Today ({todayRecords.length})</label>
            </div>
          </div>

          <div className="text-xs text-muted-foreground p-3 rounded-lg bg-muted/50">
            Email will include: source provenance, generation timestamp, active filters, and data freshness status.
          </div>

          <Button
            className="w-full gap-2"
            disabled={!isValidEmail || sending || (!includeDataset && !includeCharts && !includeTodayApps)}
            onClick={handleSend}
          >
            {sending ? (
              <>Sending...</>
            ) : (
              <><Send className="h-4 w-4" /> Send Email</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailModal;
