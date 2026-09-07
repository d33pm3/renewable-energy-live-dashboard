import { CTUILRecord } from './types';
import { SourceKey } from './ctuil';

export interface FieldMap {
  /** Canonical dashboard attribute name shown to users. */
  canonical: string;
  /** Where the value comes from on each source, or null when the source never publishes it. */
  origin: Record<SourceKey, string | null>;
  /** How the raw value is normalised into the canonical model. */
  transform: string;
  /** Reads the canonical value off a record for live coverage stats. */
  read: (r: CTUILRecord) => unknown;
}

const filled = (v: unknown) =>
  v !== null && v !== undefined && v !== '' && v !== '—' && v !== 'Not published' && v !== 'NA' && v !== 0;

export const FIELD_MAPS: FieldMap[] = [
  {
    canonical: 'Application ID',
    origin: {
      HTML: 'Application ID column',
      PDF: '"Application ID" field in each granted-application block',
      API: 'applicationId (endpoint returns no JSON today)',
    },
    transform: 'Trimmed, whitespace collapsed; used with source + substation + date for de-duplication',
    read: (r) => r.applicationId,
  },
  {
    canonical: 'Applicant',
    origin: { HTML: 'Name of Applicant column', PDF: 'Name of the applicant', API: 'applicantName' },
    transform: 'Trimmed; multi-line names joined into a single line',
    read: (r) => r.applicantName,
  },
  {
    canonical: 'Application Category',
    origin: { HTML: null, PDF: 'Category heading above each block (e.g. Connectivity Granted)', API: 'category' },
    transform: 'Carried through verbatim; blank for the live list page',
    read: (r) => r.applicationCategory,
  },
  {
    canonical: 'Region',
    origin: { HTML: 'Region column', PDF: 'Region field', API: 'region' },
    transform: 'Upper-cased short code (NR, WR, SR, ER, NER)',
    read: (r) => r.region,
  },
  {
    canonical: 'State',
    origin: { HTML: 'State column', PDF: 'Not printed in most monthly reports', API: 'state' },
    transform: 'Title case; shown as "Not published" when the source omits it',
    read: (r) => r.state,
  },
  {
    canonical: 'Substation',
    origin: { HTML: 'Substation / ISTS node column', PDF: 'Name of the sub-station', API: 'substation' },
    transform: 'Trimmed; voltage suffixes preserved as published',
    read: (r) => r.substation,
  },
  {
    canonical: 'Generation Type',
    origin: { HTML: 'Type of Generation column', PDF: 'Type of project', API: 'projectType' },
    transform: 'Matched case-insensitively to Solar, Wind, BESS, FDRE, Thermal, Nuclear; rest grouped as Others',
    read: (r) => r.generationType,
  },
  {
    canonical: 'Connectivity MW',
    origin: { HTML: 'Installed capacity column', PDF: 'Connectivity capacity (MW)', API: 'connectivityMw' },
    transform: 'Parsed to a number, commas removed; falls back to installed capacity when absent',
    read: (r) => r.connectivityMW,
  },
  {
    canonical: 'Installed Capacity MW',
    origin: { HTML: 'Installed capacity column', PDF: 'Installed capacity (MW)', API: 'installedCapacityMw' },
    transform: 'Parsed to a number; left empty rather than guessed',
    read: (r) => r.installedCapacityMW,
  },
  {
    canonical: 'Deemed GNA MW',
    origin: { HTML: 'Deemed GNA column', PDF: 'Not printed in the monthly reports', API: 'deemedGnaMw' },
    transform: 'Parsed to a number where published',
    read: (r) => r.deemedGnaMW,
  },
  {
    canonical: 'Submission Date',
    origin: { HTML: null, PDF: 'Date of submission of application', API: 'submissionDate' },
    transform: 'Parsed from DD-MM-YYYY / DD.MM.YYYY into a calendar date; drives "Applications Today"',
    read: (r) => r.applicationDate,
  },
  {
    canonical: 'Expected Effective Date',
    origin: {
      HTML: 'Connectivity to be made effective (expected date) column',
      PDF: 'Date of connectivity being made effective',
      API: 'effectiveDate',
    },
    transform: 'Parsed to a calendar date; also derives effective quarter and year for the trend charts',
    read: (r) => r.expectedEffectiveDate,
  },
  {
    canonical: 'Status',
    origin: { HTML: null, PDF: 'Status / remarks field', API: 'status' },
    transform: 'Carried through verbatim and used as a dashboard filter',
    read: (r) => r.status,
  },
  {
    canonical: 'Source Provenance',
    origin: { HTML: 'Page URL and page number', PDF: 'PDF file name and report month', API: 'Endpoint URL' },
    transform: 'Stored with every row so each figure can be traced back to its published page or file',
    read: (r) => r.sourceLabel,
  },
  {
    canonical: 'Fetched At',
    origin: { HTML: 'Time of scrape', PDF: 'Time of PDF download', API: 'Time of request' },
    transform: 'Server timestamp of the ingestion run; powers the freshness badges',
    read: (r) => r.fetchTime,
  },
];

/** Percentage of rows (per source) where the canonical attribute actually carries a published value. */
export function coverage(records: CTUILRecord[], map: FieldMap, source?: SourceKey) {
  const scope = source ? records.filter((r) => r.source === source) : records;
  if (scope.length === 0) return null;
  const ok = scope.filter((r) => filled(map.read(r))).length;
  return Math.round((ok / scope.length) * 100);
}
