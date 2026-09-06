# India Renewable Energy Connectivity Live

## Build a Firecrawl-style real-time web data landing page for CTUIL GNA / Connectivity intelligence

You are an elite full-stack product engineer, data engineer, scraping architect, visualization designer, and workflow automation builder.

Your task is to design and generate a production-grade landing page and web app that behaves like a simplified Firecrawl-style data intelligence product for **real-time / latest-available CTUIL GNA and Connectivity application data** related to renewable energy projects in India.

The product must:
- fetch public web data from the specified CTUIL sources,
- normalize and structure the data into a clean analytical model,
- present it through interactive dashboards, filters, tables, charts, and quick-action buttons,
- allow visitors to trigger actions such as emailing datasets and visualizations,
- make the experience feel modern, premium, fast, and executive-ready.

The site should look like a polished SaaS landing page plus an operational analytics console combined into one experience.

---

## 1) BUSINESS GOAL

Create a landing page and interactive data intelligence experience that provides visibility into GNA / Connectivity applications and effectiveness status for renewable energy projects across India.

The page should allow visitors to:
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

Use the following public sources as the primary upstream sources:

1. `https://ctuil.in/connectivity-effective-list`
2. `https://www.ctuil.in/nswsapi/gna`
3. `https://ctuil.in/uploads/assets/176586179123pdf_RE%20effectiveness%20Aug%2025.pdf`

Also support crawling of the linked month-wise archive files that are discoverable from the CTUIL connectivity/GNA listing page.

Important:
- Treat the CTUIL website as the source of truth.
- If the API endpoint response contract is different from expectation, inspect and adapt dynamically.
- If a source is temporarily unavailable, show a graceful degraded state and continue using the most recent successfully ingested dataset.
- Distinguish clearly between:
 - live API data,
 - latest scraped HTML data,
 - latest published PDF/archive data.
- Every dashboard view must display a **Data Freshness Badge** such as:
 - “Live API”
 - “Latest Scrape”
 - “Latest Published PDF”
 - “Cached Snapshot”

---

## 3) PRODUCT POSITIONING

Build the product as:
- **Firecrawl-like in spirit** for web data acquisition, structuring, and usability,
- but focused specifically on **CTUIL GNA / Connectivity intelligence for Indian renewable energy**.

The user experience should combine:
- premium landing page,
- live data fetch actions,
- structured data tables,
- analytics dashboards,
- export/share workflows,
- email-delivery actions.

---

## 4) REQUIRED TECHNICAL OUTCOME

Generate a modern web app with the following stack preference unless Emergent has a better native path:
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

If some tools are not available in Emergent runtime, implement the cleanest possible substitute.

---

## 5) CORE PRODUCT MODULES

### A. Public Landing Page
The top section should clearly communicate:
- what the product does,
- that it fetches and structures CTUIL GNA / connectivity data,
- that users can analyze renewable energy application trends across India,
- that they can email selected datasets and charts.

Landing page sections should include:
1. Hero section
2. Value proposition strip
3. Source coverage section
4. Feature grid
5. “Try the dashboard” CTA
6. Live data freshness strip
7. Screenshot / mock dashboard preview
8. Email dataset workflow demo section
9. Footer with disclaimer

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
Provide a dashboard that supports slicing, filtering, grouping, ranking, and trending.

---

## 6) REQUIRED FILTERS / BUTTONS / DROPDOWNS

Provide a clean top control bar with:
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

## 7) ANALYTICS REQUIREMENTS

The app must organize the data into meaningful information on the following:

### 1. Region-wise and state-wise installed capacities and Deemed GNA
Create:
- summary cards,
- state map or ranked table,
- region-wise stacked bar chart,
- state-wise sortable table.

### 2. Substation-wise connectivity applications made
Create:
- ranked table of substations,
- application count by substation,
- total MW by substation,
- filters by region and state.

### 3. Installed capacity and Deemed GNA by generation type
Support categories including:
- Solar
- Wind
- Hybrid
- Pump Storage / PSP
- Standalone ESS
- FDRE
- Others

Create:
- stacked bars,
- donut / treemap,
- sortable detail table.

### 4. Applicant-wise installed capacity and Deemed GNA and generation split
For each applicant, show:
- application count,
- total MW,
- region spread,
- state spread,
- type-of-generation split,
- expected effectiveness timeline distribution.

### 5. Top 5 applicants and Top 5 substations where maximum applications were made
Show:
- by application count,
- by MW capacity,
- switchable ranking mode.

### 6. Bar chart of applicant-wise expected timeline for GNA to be made effective
Use the effective date field to build:
- applicant-wise future timeline bars,
- effective-date bucket views,
- quarter and year buckets,
- overdue / near-term / long-tail indicators if applicable.

### 7. Trends on generation types being applied for
Synthesize the data to derive:
- which generation types are dominating recent filings,
- whether hybrid / ESS / PSP / FDRE are increasing,
- regional concentration of specific technologies,
- substation-level concentration by generation type.

### 8. Top applicants – quarter-wise, YoY, YTD, MoM
Create trend views for:
- quarter-wise top applicants,
- year-on-year change,
- year-to-date totals,
- month-on-month movement,
- rolling 3-month view if the data allows.

---

## 8) “APPLICATIONS MADE TODAY” REQUIREMENT

Create a dedicated section titled:

## Applications Made Today

This section must display:
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

## 9) EMAIL WORKFLOW REQUIREMENT

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

Required email actions:
- Email Current Dataset
- Email Current Visualization
- Share All Applications for Selected Day
- Share Applications Made Today

Add validation:
- valid email required,
- show success/error states,
- rate-limit excessive submissions,
- log send history in admin/debug mode.

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

The product must not only display tables but also synthesize insights.

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

## 12) DASHBOARD UX REQUIREMENTS

The dashboard should feel premium, modern, and executive-grade.

### Visual style
- dark-on-light or premium neutral palette,
- clean typography,
- strong spacing,
- soft cards,
- subtle borders,
- polished hover effects,
- no clutter.

### Layout
- sticky top action bar,
- left-side filters on desktop,
- responsive collapsible filters on mobile,
- hero + dashboard preview above the fold,
- analytics cards at the top,
- charts in a clean grid,
- large table section below,
- email action panel on right or modal.

### Required components
- KPI summary cards
- chart cards
- interactive table
- trend summary callout
- source freshness badge
- last fetched timestamp
- ingestion health indicator

---

## 13) REQUIRED KPI CARDS

Show headline metrics such as:
- Total Applications
- Total Connectivity MW
- Total Deemed GNA MW
- Total Installed Capacity MW
- Active Applicants
- Active Substations
- States Covered
- Latest Effective Timeline
- Applications Made Today

If a KPI is not directly available from source, clearly show:
- `Not available from current source`
- or `Derived from latest published records`
- never fabricate.

---

## 14) TABLE REQUIREMENTS

Create a powerful data grid with:
- search,
- sort,
- column hide/show,
- pagination,
- export,
- filter retention,
- copy-to-clipboard,
- drill-down from charts into rows.

Columns should include as many of the following as available:
- Application ID
- Applicant Name
- Region
- State
- Substation
- Generation Type
- Connectivity MW
- Deemed GNA MW
- Installed Capacity MW
- Expected Effective Date
- Effective Quarter
- Effective Year
- Source
- Source Month
- Fetch Time

---

## 15) ERROR HANDLING / DATA TRUST / AUDITABILITY

This product is for serious business users. Build trust into the experience.

Must include:
- source provenance at row level or on detail drawer,
- parser status,
- freshness timestamp,
- data source badge,
- warning if any fields are derived,
- warning if source is unavailable,
- warning if latest dataset is from cached snapshot.

Never silently fail.

---

## 16) PERFORMANCE REQUIREMENTS

- The landing page should load fast.
- The dashboard should feel responsive.
- Use caching with explicit freshness status.
- Defer heavy reprocessing where needed.
- Support incremental refresh where possible.

---

## 17) ADMIN / DEBUG MODE

Include an admin/debug panel that can be enabled via env flag.

Show:
- last successful fetch time,
- last failed fetch time,
- source status,
- record counts by source,
- parser logs,
- schema discovery notes,
- duplicate counts,
- email send logs,
- cache age,
- ingestion warnings.

---

## 18) SECURITY / COMPLIANCE REQUIREMENTS

- Use server-side email sending only.
- Validate all email addresses.
- Sanitize all outbound content.
- Protect against scraper abuse.
- Rate-limit refresh and email actions.
- Do not expose secrets on frontend.
- Add a public disclaimer that the app is based on public CTUIL data and should be independently verified for regulatory or commercial decisions.

---

## 19) COPY / MESSAGING REQUIREMENTS

Use crisp SaaS-style copy.

### Suggested hero headline
“Live CTUIL GNA & Connectivity Intelligence for Renewable Energy in India”

### Suggested sub-headline
“Fetch, structure, analyze, and share CTUIL connectivity application data through interactive dashboards, trend views, and one-click email workflows.”

CTA buttons:
- View Dashboard
- Fetch Latest Data
- Explore Trends

---

## 20) DELIVERABLES TO GENERATE

Generate:
1. landing page UI,
2. analytics dashboard UI,
3. scraping / ingestion logic,
4. normalization layer,
5. charting logic,
6. data table logic,
7. email workflow,
8. source freshness system,
9. graceful fallback handling,
10. sample seeded mode for local preview if live fetch is unavailable.

Also generate:
- clear file structure,
- environment variables template,
- setup instructions,
- comments where source introspection is required,
- modular architecture for future extension.

---

## 21) IMPLEMENTATION PRIORITIES

Priority order:
1. Source ingestion and schema discovery
2. Canonical data model
3. Dashboard filters and data table
4. Core charts
5. Applications Made Today section
6. Email workflows
7. Premium landing page polish
8. Admin/debug mode
9. Export and sharing enhancements

---

## 22) NON-NEGOTIABLE RULES

- Do not fabricate CTUIL data.
- Do not assume fields that the source does not provide.
- If installed capacity and deemed GNA are not explicitly present, label them carefully as unavailable or derived.
- Preserve source lineage.
- Keep the UX premium and business-ready.
- Build active buttons and dropdowns that actually trigger workflows.
- The app must be usable even when one of the upstream sources fails.
- The code must be modular, production-minded, and clean.

---

## 23) OUTPUT EXPECTATION

Produce the complete app implementation, including:
- frontend pages,
- backend/API utilities,
- source parsers,
- data model,
- chart components,
- email action flow,
- loading, success, and error states,
- documentation for setup and deployment.

Where direct live access to a source is blocked during generation, still implement the source connector with:
- schema discovery placeholders,
- resilient parsing strategy,
- mock fallback data adapter,
- comments showing exactly where live CTUIL response mapping must occur.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://renewable-energy-live.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8ac0da77-47fd-4795-8e16-21243340692d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
