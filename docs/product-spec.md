# Product spec — India Renewable Energy Connectivity Live

Moved out of the repository README. See [README.md](../README.md) for what this repo is, how to run it, and what is not deployed. Build status is in `roadmap.md`.

This file is the original product specification. It is not a claim that every module is live.

---

## 1) BUSINESS GOALS ADDRESSED

A landing page and interactive data intelligence experience that provides visibility into GNA / Connectivity applications and effectiveness status for renewable energy projects across India.

The page allows visitors to:
1. fetch the latest available CTUIL source data with one click,
2. inspect structured GNA / connectivity application data,
3. filter the data using buttons and dropdowns,
4. see charts and synthesized trends,
5. export filtered data,
6. email selected datasets and visualizations to a recipient email address,
7. review a dedicated “Applications Made Today” section,
8. share the list of applications made on a day to a specified email address.

## 2) PRIMARY DATA SOURCES

Following public sources were used as the primary upstream sources (You can always add more sources as per business needs):

1. `https://ctuil.in/connectivity-effective-list`
2. `https://www.ctuil.in/nswsapi/gna`
3. `https://ctuil.in/uploads/assets/176586179123pdf_RE%20effectiveness%20Aug%2025.pdf`

A support crawling of the linked month-wise archive files that are discoverable from the CTUIL connectivity/GNA listing page.

Important:
- Treat the CTUIL website as the source of truth.
- If the API endpoint response contract is different from expectation, inspect and adapt dynamically.
- If a source is temporarily unavailable, the dashboard shows a graceful degraded state and continue using the most recent successfully ingested dataset.
- Distinguish clearly between live API data, latest scraped HTML data, and latest published PDF/archive data.
- Every dashboard view displays a **Data Freshness Badge** such as “Live API”, “Latest Scrape”, “Latest Published PDF”, or “Cached Snapshot”.

## 3) PRODUCT POSITIONING

The product is built as Firecrawl-like in spirit for web data acquisition, structuring, and usability, focused on CTUIL GNA / Connectivity intelligence for Indian renewable energy.

The user experience combines a premium landing page, live data fetch actions, structured data tables, analytics dashboards, export/share workflows, and email-delivery actions.

## 4) DESIRED TECHNICAL OUTCOMES

- Frontend: React / TypeScript (Vite)
- Styling: Tailwind CSS
- Charts: Recharts or equivalent
- Data orchestration: server routes / background fetch handlers
- Parsing: HTML, API, PDF table extraction, normalization layer
- Email action: Resend / SMTP / equivalent (not live — see `roadmap.md`)
- Storage: lightweight relational DB or structured JSON persistence with source snapshot metadata
- Export: CSV / XLSX / chart image downloads if feasible

## 5) CORE PRODUCT MODULES

### A. Public Landing Page
1. Source coverage section
2. “Try the dashboard” CTA
3. Live data freshness strip
4. Email dataset workflow demo section

### B. Data Operations Console
- `Fetch Latest Data`
- `Refresh API`
- `Refresh CTUIL Archive`
- `Load Latest Published PDF`
- `Normalize & Rebuild Dashboard`
- `Export Current View`
- `Email Current Dataset`
- `Email Current Visualization`
- `Share Applications Made Today`

### C. Dashboard & Analytics Area
A live dashboard that supports slicing, filtering, grouping, ranking, and trending.

## 6) FILTERS / BUTTONS / DROPDOWNS

Top control bar: Date, Source, Region, State, Substation, Applicant, Generation Type, Effective Timeline, Capacity range, “Applications Made Today” toggle, “Top 5” mode, “Compare QoQ / YoY / YTD / MoM” mode.

Quick filter chips: Solar, Wind, Hybrid, Standalone ESS, PSP, Pumped Storage, FDRE, Others.

Quick regional chips: NR, WR, SR, ER, NER, All India.

## 7) ANALYTICS SUPPORTED

1. Region-wise and state-wise installed capacities and Deemed GNA — summary cards, ranked table, region stacked bar, state sortable table.
2. Substation-wise connectivity applications — ranked table, application count, total MW, region/state filters.
3. Installed capacity and Deemed GNA by generation type — Solar, Wind, Hybrid, Pump Storage / PSP, Standalone ESS, FDRE, Others.

## 8) “APPLICATIONS MADE TODAY” VIEW

List applicant names, application ID, project type, substation, state, region, MW applied, expected effective date, source tag, fetch timestamp. Include CSV download and email/share actions.

If the source does not expose same-day applications in a machine-readable form, infer “today” from the latest listing updates and label the result “Applications Made Today”, “Latest Applications Published Today”, or “No same-day application data published by source”. Never fabricate daily application data.

## 9) EMAIL WORKFLOW FEATURES

Visitor enters an email address, chooses a dataset and optional charts, and sends an email containing selected filters, dataset extract, chart images, generation timestamp, source provenance, and freshness status. This workflow is specified here; real delivery is not live.

## 10) DATA INGESTION AND NORMALIZATION LOGIC

Ingest from HTML pages, API responses, PDF archives, and linked monthly source documents.

Canonical fields include: source_type, source_url, source_file_month, source_fetch_timestamp, record_hash, serial_no, application_id, applicant_name, region, substation, state, generation_type_raw, generation_type_normalized, connectivity_mw, deemed_gna_mw, installed_capacity_mw, expected_effective_date, application_date, effective_year, effective_quarter, effective_month, is_today_record, raw_text, parser_version, ingestion_status.

Normalization rules: standardize applicant, state, and generation type; deduplicate across API / HTML / PDF; preserve provenance and raw values; parse dates to ISO and MW as numeric.

If a source gives only connectivity MW and not installed capacity or deemed GNA separately: do not invent values; derive only where the source structure justifies it; otherwise mark the metric unavailable.

## 11) SYNTHESIS ENGINE

Plain-language summaries such as top states by applications, top applicants by MW, most active substations, fastest-growing generation categories, expected future connectivity concentration by quarter/year, unusual concentration of one applicant at one substation, and shifts from solar-only to hybrid / ESS / FDRE if supported by source history. Insights update with active filters.

## 12) SECURITY / COMPLIANCE REQUIREMENTS

- Use server-side email sending only.
- Validate all email addresses.
- Sanitize all outbound content.
- Protect against scraper abuse.
- Rate-limit refresh and email actions.
- Do not expose secrets on frontend.
- Add a public disclaimer that the app is based on public CTUIL data and should be independently verified for regulatory or commercial decisions.
