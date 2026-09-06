# renewable-energy-live-dashboard

**Author:** DK Mendiratta

Unofficial Vite + React dashboard of **public CTUIL GNA / connectivity applications** for Indian renewable-energy projects. This is not CTUIL, POWERGRID, or CEA software.

Canonical source: https://github.com/d33pm3/renewable-energy-live-dashboard

Neighbour repo: [Powergrid-India](https://github.com/d33pm3/Powergrid-India) is the 10-sheet planning workbook. This repo is the live CTUIL applications dashboard.

The product spec (filters, schema, email workflow) lives in [docs/product-spec.md](docs/product-spec.md).

## This is / this is not

**This is** an unofficial Vite/React dashboard of public CTUIL GNA / connectivity applications for Indian RE projects.
**This is** a local web app that can ingest public HTML, API, and PDF sources and chart the normalized rows.
**This is** a proof-of-concept console with filters, tables, and export.
**This is not** CTUIL, POWERGRID, PGCIL, or CEA official software.
**This is not** the Powergrid-India 10-sheet planning workbook.
**This is not** a live national generation or sustainability KPI feed.
**This is not** a hosted SaaS or a working email-delivery product.
**This is not** a verified GNA/LTA filing or investment recommendation.

## Run locally

Requires Node.js 18+ and npm. Vite serves the app on port 8080.

Entry files under `src/` are on `main`. Dashboard pages, the CTUIL client, and the shadcn UI kit are still in `Codebase.zip`. Restore them once after clone:

```bash
git clone https://github.com/d33pm3/renewable-energy-live-dashboard.git
cd renewable-energy-live-dashboard
unzip -o Codebase.zip
cp -a "5_Renewable Energy/src/." src/
cp -a "5_Renewable Energy/public/." public/
cp .env.example .env
npm i
npm run dev
```

Put your Supabase project URL and anon key in `.env` if you want the fetch/cache path. Without those keys the UI still loads and degrades to whatever local/cached state the app has.

```bash
npm test
npm run build
```

## What is not deployed

- There is no hosted URL, GitHub Pages site, or Vercel project in this repository.
- Real email delivery is not live (`roadmap.md`: needs a sender domain and provider key).
- Live CTUIL fetch depends on those public pages remaining reachable and on valid `VITE_SUPABASE_*` values.
- Do not treat dashboard numbers as a CTUIL filing.

## License

MIT. See `LICENSE`.

You may use this code; the dashboard is not a CTUIL filing and not investment advice.
