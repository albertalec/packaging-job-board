# Packaging Job Board

A focused job board for packaging engineers, packaging managers, and adjacent
roles. Listings are ingested from employer ATS feeds (Workday first) rather than
scraped from LinkedIn.

## Status

Phase 0 — validation and ATS verification. See `PLAN.md`.

## Repo layout

| Path | Purpose |
| --- | --- |
| `PLAN.md` | Product plan, positioning, and phased to-do |
| `data/companies.csv` | Company → ATS map (the long-term asset) |
| `ingest/` | Connectors and normalization (Workday first) |
| `src/` | SEO-first site (Next.js, when the board is ready to render) |

## Rules

- Do not scrape LinkedIn.
- Workday is the first ingestion target, not Greenhouse/Lever/Ashby.
- Classify product/transport packaging separately from semiconductor “packaging”.

## Next

1. Watch IoPP Career Center posting velocity for 2–4 weeks.
2. Pick a launch wedge (Midwest CPG + automotive, automotive dunnage, or general US).
3. Fill blank tenant/site fields in `data/companies.csv` from live careers-page redirects.
