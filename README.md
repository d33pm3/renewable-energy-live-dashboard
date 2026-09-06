# India Renewable Energy Connectivity Live

## A Firecrawl-style real-time web data landing page for CTUIL GNA / Connectivity intelligence

A production-grade landing page and web app that behaves like a simplified Firecrawl-style data intelligence product for **real-time / latest-available CTUIL GNA and Connectivity application data** related to renewable energy projects in India.

Product features:
- fetch public web data from the specified CTUIL sources,
- normalize and structure the data into a clean analytical model,
- present it through interactive dashboards, filters, tables, charts, and quick-action buttons,
- allow visitors to trigger actions such as emailing datasets and visualizations,
- make the experience feel modern, premium, fast, and executive-ready.

The site would look like a SaaS landing page plus an operational analytics console combined into one experience.

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

---

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
- Important to Distinguish clearly between:
 - live API data,
 - latest scraped HTML data,
 - latest published PDF/archive data.
- Every dashboard view displays a **Data Freshness Badge** such as:
 - “Live API”
 - “Latest Scrape”
 - “Latest Published PDF”
 - “Cached Snapshot”

---

## 3) PRODUCT POSITIONING

The product is built as:
- **Firecrawl-like in spirit** for web data acquisition, structuring, and usability,
- but focused specifically on **CTUIL GNA / Connectivity intelligence for Indian renewable energy**.

The user experience combines:
- premium landing page,
- live data fetch actions,
- structured data tables,
- analytics dashboards,
- export/share workflows,
- email-delivery actions.

---

## 4) DESIRED TECHNICAL OUTCOMES

A modern web app with the following stack preference unless you decide for a better native path:
- Frontend: Next.js / React / TypeScript
- Styling: Tailwind CSS
- UI: clean premium SaaS interface
- Charts: Recharts or equivalent
- Data orchestration: server routes / background fetch handlers
- Parsing:
 - HTML scraping/parsing,
 - API ingestion,
 - PDF text extraction / table extraction,
 - normalization layer
- Email action: Resend / SMTP / equivalent transactional email provider
- Storage:
 - lightweight relational DB or structured JSON persistence
 - include source snapshot metadata
- Export:
 - CSV / XLSX / PDF-ready chart image downloads if feasible

If some tools are not available in your development environment, you can still implement the cleanest possible substitute.

---

## 5) CORE PRODUCT MODULES

### A. Public Landing Page
1. Source coverage section
2. “Try the dashboard” CTA
3. Live data freshness strip
4. Email dataset workflow demo section

### B. Data Operations Console
The page must have active buttons and dropdowns that trigger real data actions:
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
A Live dashboard that supports slicing, filtering, grouping, ranking, and trending.

---

## 6) FILTERS / BUTTONS / DROPDOWNS

A clean top control bar with:
- Date selector
- Source selector
- Region selector
- State selector
- Substation selector
- Applicant selector
- Generation Type selector
- Effective Timeline selector
- Capacity range selector
- “Applications Made Today” toggle
- “Top 5” mode toggle
- “Compare QoQ / YoY / YTD / MoM” mode toggle

Quick filter chips:
- Solar
- Wind
- Hybrid
- Standalone ESS
- PSP
- Pumped Storage
- FDRE
- Others

Quick regional chips:
- NR
- WR
- SR
- ER
- NER
- All India

---

## 7) ANALYTICS SUPPORTED

The app organizes the data into meaningful information on the following:

### 1. Region-wise and state-wise installed capacities and Deemed GNA
- summary cards,
- state map or ranked table,
- region-wise stacked bar chart,
- state-wise sortable table.

### 2. Substation-wise connectivity applications made
- ranked table of substations,
- application count by substation,
- total MW by substation,
- filters by region and state.

### 3. Installed capacity and Deemed GNA by generation type
Supports categories including:
- Solar
- Wind
- Hybrid
- Pump Storage / PSP
- Standalone ESS
- FDRE
- Others

---

## 8) “APPLICATIONS MADE TODAY” VIEW

## Applications Made Today
- list of all applications made today,
- applicant names,
- application ID,
- project type,
- substation,
- state,
- region,
- MW capacity applied for,
- expected date of connectivity / GNA to be made effective,
- source tag,
- fetch timestamp.

Include:
- download CSV button,
- email this table button,
- share-to-email action.

If the source does not explicitly expose same-day applications in a machine-readable form:
- infer “today” based on the latest application listing updates available from source,
- clearly label the result as either:
 - “Applications Made Today”
 - or “Latest Applications Published Today”
 - or “No same-day application data published by source”
- never fabricate daily application data.

---

## 9) EMAIL WORKFLOW FEATURES

The visitor must be able to:
1. enter an email address,
2. choose a dataset,
3. optionally choose one or more charts,
4. click send,
5. trigger an email containing:
 - selected filters,
 - dataset attachment or table extract,
 - chart image(s),
 - generation timestamp,
 - source provenance,
 - freshness status.

---

## 10) DATA INGESTION AND NORMALIZATION LOGIC

Create a robust data pipeline that can ingest from:
1. HTML pages
2. API responses
3. PDF archives
4. linked monthly source documents

### First step: source discovery / introspection
Before building parsers:
- inspect each primary source,
- identify available fields,
- identify month archive links,
- identify whether the API is JSON, HTML, or requires a fallback,
- document the actual schema used by the implementation.

### Normalize all incoming records into a canonical schema such as:

- source_type
- source_url
- source_file_month
- source_fetch_timestamp
- record_hash
- serial_no
- application_id
- applicant_name
- region
- substation
- state
- generation_type_raw
- generation_type_normalized
- connectivity_mw
- deemed_gna_mw
- installed_capacity_mw
- expected_effective_date
- application_date
- effective_year
- effective_quarter
- effective_month
- is_today_record
- raw_text
- parser_version
- ingestion_status

### Normalization rules
- standardize applicant names,
- standardize state names,
- standardize generation types,
- deduplicate across API / HTML / PDF records,
- preserve provenance,
- retain raw values for auditability,
- parse dates into ISO format,
- parse MW values as numeric,
- retain original source text snapshot.

### Important business rule
If a source gives only connectivity MW and not installed capacity or deemed GNA separately:
- do not invent values,
- instead derive only where an explicit mapping is justified by source structure,
- otherwise mark the metric as unavailable and surface the limitation transparently.

---

## 11) SYNTHESIS ENGINE

Create an insight engine that generates plain-language summaries such as:
- top states by applications,
- top applicants by MW,
- most active substations,
- fastest-growing generation categories,
- expected future connectivity concentration by quarter/year,
- unusual concentration of one applicant at one substation,
- shifts from solar-only to hybrid / ESS / FDRE if supported by source history.

These insights should update dynamically based on active filters.

---

## 12) SECURITY / COMPLIANCE REQUIREMENTS

- Use server-side email sending only.
- Validate all email addresses.
- Sanitize all outbound content.
- Protect against scraper abuse.
- Rate-limit refresh and email actions.
- Do not expose secrets on frontend.
- Add a public disclaimer that the app is based on public CTUIL data and should be independently verified for regulatory or commercial decisions.

---
## Build with Lovable

Continue developing this project in Lovable 

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
