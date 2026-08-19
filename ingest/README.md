# Ingestion

Connectors that pull jobs from employer ATS feeds and normalize them. Do not
scrape LinkedIn.

```bash
npm run ingest
```

## Sources

1. **Workday** — paginated POST to `/wday/cxs/{tenant}/{site}/jobs`
2. **Phenom** — `POST {origin}/widgets` with `ddoKey: refineSearch` and tenant `refNum`
3. **Amazon Jobs** — `https://www.amazon.jobs/en/search.json`
4. **Greenhouse / Lever / Ashby** — documented public job-board GET APIs
5. **SuccessFactors** — public RMK search JSON when the career site exposes it
6. **SmartRecruiters** — public company postings API
7. **CWS / m-cloud** — JSONP `GET https://{host}/api/job` with `Organization` + search facets
8. **Jibe** — `GET /api/jobs?keywords=` and unwrap `jobs[].data` (PepsiCo)

## Normalized schema

title, department, location, remote, postedAt, applyUrl, description, salary,
source company, source hash.

## Classifier

Keep packaging engineer / package-development / packaging R&D titles. Drop
semiconductor “packaging”, warehouse/packer titles, procurement, sales,
converting-line supervision, and other non-engineer plant roles.
