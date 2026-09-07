export interface CTUILRecord {
  id: string;
  applicationId: string;
  applicantName: string;
  region: string;
  state: string;
  substation: string;
  generationType: string;
  applicationCategory: string | null;
  status: string | null;
  connectivityMW: number;
  deemedGnaMW: number | null;
  installedCapacityMW: number | null;
  expectedEffectiveDate: string;
  effectiveQuarter: string;
  effectiveYear: number;
  applicationDate: string;
  source: 'API' | 'HTML' | 'PDF' | 'Cache';
  sourceLabel: string;
  sourceUrl: string | null;
  sourceMonth: string;
  fetchTime: string;
  isTodayRecord: boolean;
}

export interface KPIData {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  available: boolean;
  source?: string;
}

export interface FreshnessStatus {
  type: 'Live API' | 'Latest Scrape' | 'Latest Published PDF' | 'Cached Snapshot';
  timestamp: string;
  healthy: boolean;
  /** Supplemental feeds (CTUIL's NSWS probe) are optional — never shown as a failure. */
  supplemental?: boolean;
}

export type RegionCode = 'NR' | 'WR' | 'SR' | 'ER' | 'NER';
export type GenerationType = 'Solar' | 'Wind' | 'Hybrid' | 'Standalone ESS' | 'PSP' | 'FDRE' | 'Others';

export const REGIONS: RegionCode[] = ['NR', 'WR', 'SR', 'ER', 'NER'];
export const GENERATION_TYPES: GenerationType[] = ['Solar', 'Wind', 'Hybrid', 'Standalone ESS', 'PSP', 'FDRE', 'Others'];

export const REGION_NAMES: Record<RegionCode, string> = {
  NR: 'Northern Region',
  WR: 'Western Region',
  SR: 'Southern Region',
  ER: 'Eastern Region',
  NER: 'North-Eastern Region',
};
