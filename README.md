# Packaging Job Board

A focused job board for packaging engineers, packaging managers, and adjacent
roles. Listings are ingested from employer ATS feeds rather than scraped from
LinkedIn.

## Develop

```bash
npm install
npm run ingest
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`npm run ingest` polls every company in `ingest/companies.ts` through the matching
public feed:

| ATS | Connector |
| --- | --- |
| Workday | `POST /wday/cxs/{tenant}/{site}/jobs` |
| Greenhouse | Job Board API GET |
| Lever | `GET /v0/postings/{token}` |
| Ashby | posting-api job board GET |
| Amazon Jobs | `search.json` |
| Phenom career sites | public `/api/jobs` (and fallbacks) |
| SuccessFactors RMK | public search JSON when exposed |
| SmartRecruiters | public company postings API |

Jobs are classified to keep product/transport packaging and drop semiconductor
“packaging” plus warehouse/packer titles. Inventory is written to `data/jobs.json`.

Build status and remaining to-dos live in `PLAN.md`.

## Layout

| Path | Purpose |
| --- | --- |
| `PLAN.md` | Product plan and phased to-do |
| `data/companies.csv` | Company → ATS map |
| `ingest/` | Connectors, classifier, ingest CLI |
| `src/app/` | SEO-first Next.js site |
