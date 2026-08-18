# Ingestion

Connectors that pull jobs from employer ATS feeds and normalize them. Do not
scrape LinkedIn.

```bash
npm run ingest
```

## Sources

1. **Workday** — paginated POST to `/wday/cxs/{tenant}/{site}/jobs`
2. **Phenom** — public career-site JSON (`/api/jobs` and fallbacks)
3. **Amazon Jobs** — `https://www.amazon.jobs/en/search.json`
4. **Greenhouse / Lever / Ashby** — documented public job-board GET APIs
5. **SuccessFactors** — public RMK search JSON when the career site exposes it
6. **SmartRecruiters** — public company postings API

## Normalized schema

title, department, location, remote, postedAt, applyUrl, description, salary,
source company, source hash.
