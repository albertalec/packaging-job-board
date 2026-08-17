# Ingestion

Connectors that pull jobs from employer ATS feeds and normalize them to one
schema. Do not scrape LinkedIn.

## Priority

1. **Workday** (`workday_post`) — one POST integration reused across tenants.
2. SAP SuccessFactors
3. Custom parsers (Amazon public search API first)
4. Greenhouse / Lever / Ashby public GET feeds (packaging startups only)

## Normalized job schema

| Field | Notes |
| --- | --- |
| title | Raw ATS title |
| department | When the ATS exposes it |
| location | City / region / country |
| remote | Boolean when detectable |
| posted_date | Prefer ATS `postedOn` / equivalent |
| apply_url | Canonical apply / requisition URL |
| description | HTML or text from the ATS |
| salary | Only when the feed includes it |
| source_company | `data/companies.csv` company name |
| source_hash | Stable hash for dedupe + “new since last run” |

Workday jobs endpoint shape (per tenant):

`https://{co}.wd{N}.myworkdayjobs.com/wday/cxs/{tenant}/{site}/jobs`
