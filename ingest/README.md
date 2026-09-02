# Ingestion

Connectors that pull jobs from employer ATS feeds and normalize them. Do not
scrape LinkedIn.

```bash
npm run ingest -- --vertical=packaging
```

Writes `data/{vertical}/jobs.json`. Packaging companies live in
`ingest/verticals/packaging/companies.ts`.

## United States only

Every board lists **US roles only**. After title classification, `run.ts`
filters with `isUsOrRemote()` (`ingest/classify.ts`):

- US state, explicit US/USA in location, or Workday `"N Locations"` for
  employers with `country: "USA"`.
- Drops foreign locations, foreign Workday path segments (`/job/Latin-America-…`),
  and foreign hybrid/remote postings.
- `remote: true` does **not** bypass the US check.

Mark US-focused employers with `country: "USA"` even when the ATS site is global.

## Sources

1. **Workday** — paginated POST to `/wday/cxs/{tenant}/{site}/jobs`
2. **Phenom** — `POST {origin}/widgets` with `ddoKey: refineSearch` and tenant `refNum`
3. **Amazon Jobs** — `https://www.amazon.jobs/en/search.json`
4. **Greenhouse / Lever / Ashby** — documented public job-board GET APIs
5. **SuccessFactors** — public RMK search JSON when the career site exposes it
6. **SmartRecruiters** — public company postings API
7. **CWS / m-cloud** — JSONP `GET https://{host}/api/job` with `Organization` + search facets
8. **Jibe** — `GET /api/jobs?keywords=` and unwrap `jobs[].data` (PepsiCo)
9. **UltiPro / UKG** — `POST …/JobBoardView/LoadSearchResults` (Smithers, credit unions)
10. **Rippling** — public job board HTML (`__NEXT_DATA__` job-posts query; Westpak)
11. **WP Job Openings** — WordPress `awsm_job_openings` REST (`/wp-json/wp/v2/awsm_job_openings`; Purple Diamond)

## Normalized schema

title, department, location, remote, postedAt, applyUrl, description, salary,
source company, source hash.

## Classifier

Keep packaging engineer / package-development / packaging R&D titles. Drop
semiconductor “packaging”, warehouse/packer titles, procurement, sales,
converting-line supervision, and other non-engineer plant roles.

### Resilience (`businesscontinuity`)

Employer waves and wedge-role growth plan:
[`docs/businesscontinuity-ingest-plan.md`](../docs/businesscontinuity-ingest-plan.md).

Keep corporate **BCM**, **IT disaster recovery**, and **operational/enterprise
resilience** roles at regulated employers. Drop:

- FEMA / field emergency management (NIMS, ICS, PSAP, humanitarian relief)
- Physical crisis response and fleet safety emergency ops
- Product/database engineering “disaster recovery” teams
- Manufacturing capacity / smart-factory resiliency without IT BCM program signals
- `BCP` acronym collisions (Business Cards & Payments, not continuity planning)

Descriptions are normalized to plain text: HTML entities decoded, section
headings split, lists preserved. Do not store raw ATS HTML.

## Analytics

Ingest metrics for marketing and infographic copy — raw ATS scan counts,
classifier drop reasons, and weekly snapshots — are specified in
[`docs/ingest-analytics-plan.md`](../docs/ingest-analytics-plan.md).

After ingest, `data/{vertical}/jobs.json` includes:

```ts
stats: {
  scanned: number;          // unique ATS postings seen before classification
  classifierPass: number;   // postings that passed title classifier
  kept: number;             // listed on board after US filter + dedup
  classifierDrops: Record<string, number>;
}
```

Per-employer `reports[]` rows mirror the same fields (`scanned`,
`classifierPass`, `kept`, `classifierDrops`). `fetched` remains as a deprecated
alias for `classifierPass`.

Weekly history is appended to `data/{vertical}/snapshots.json` (last 52 runs).
Export marketing-ready rollups:

```bash
node scripts/export-ingest-stats.mjs
node scripts/export-ingest-stats.mjs packaging
```
