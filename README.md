# Niche Board

A multi-niche specialist job platform: one Next.js app, one Stripe account,
one subdomain per vertical. The first live board is **packaging engineers /
package development**.

Listings are ingested from employer ATS feeds rather than scraped from
LinkedIn. Candidates apply on the source career site.

## Develop

```bash
npm install
npm run ingest -- --vertical=packaging
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the packaging board.

Parent hub (after `/etc/hosts` or `.localhost`):

- [http://packaging.localhost:3000](http://packaging.localhost:3000) — packaging jobs
- [http://nicheboard.localhost:3000](http://nicheboard.localhost:3000) — Niche Board hub

Or preview the hub on localhost with `TENANT_HOST=nicheboardjobs.com npm run dev`.

`npm run ingest -- --vertical=packaging` polls every company in
`ingest/verticals/packaging/companies.ts` through the matching public feed:

| ATS | Connector |
| --- | --- |
| Workday | `POST /wday/cxs/{tenant}/{site}/jobs` |
| Greenhouse | Job Board API GET |
| Lever | `GET /v0/postings/{token}` |
| Ashby | posting-api job board GET |
| Amazon Jobs | `search.json` |
| Phenom career sites | `POST /widgets` (`ddoKey: refineSearch` + `refNum`) |
| SuccessFactors RMK | public search JSON when exposed |
| SmartRecruiters | public company postings API |
| CWS (m-cloud) | JSONP `GET /api/job` (`orgId` + facets) |
| Jibe | `GET /api/jobs?keywords=` (`jobs[].data`) |

Jobs are classified to keep packaging engineer / package-development titles
and drop semiconductor “packaging”, warehouse/packer titles, procurement,
sales, and converting-line supervision. Descriptions are decoded and split
into sections before they are written to `data/packaging/jobs.json`.

Build status and remaining to-dos live in `PLAN.md`. Tenant config lives in
`config/`.

## Sponsorship (Stripe)

Employers can sponsor a live listing on **one vertical** (packaging is $100 /
30 days). Sponsored jobs rank first on that subdomain only.

Checkout metadata includes `jobId`, `vertical`, `tier`, and `host`. The
webhook writes to `sponsorships/{vertical}.json` (Vercel Blob in production).

### Configure Stripe

1. Copy `.env.example` to `.env.local` and set:
   - `STRIPE_SECRET_KEY` — from [Stripe Dashboard → API keys](https://dashboard.stripe.com/apikeys)
   - `STRIPE_WEBHOOK_SECRET` — from a webhook endpoint (see below)
   - `SITE_URL` — local fallback origin (`http://localhost:3000`). Production
     success/cancel URLs use the request host.
2. **Local webhook testing** (Stripe CLI):

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Use the signing secret printed by `stripe listen` as `STRIPE_WEBHOOK_SECRET`.

3. **Production (Vercel):**
   - Add the same env vars in the Vercel project settings.
   - Create a Stripe webhook for `https://your-domain/api/webhooks/stripe` listening to
     `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
     One webhook URL serves every subdomain.
   - Add a **Vercel Blob** store and set `BLOB_READ_WRITE_TOKEN` so sponsorships persist
     (the serverless filesystem is read-only). Without Blob, local dev writes to
     `data/sponsorships/{vertical}.json` instead.

### Routes

| Path | Purpose |
| --- | --- |
| `/sponsor` | Pick a listing to sponsor (vertical hosts) |
| `/sponsor/[jobId]` | Checkout landing |
| `/api/checkout` | Creates Stripe Checkout session |
| `/api/webhooks/stripe` | Activates sponsorship after payment |
| `/` `/niches` `/employers` | Parent hub (on `nicheboardjobs.com`) |

## SEO & analytics

Job pages include `JobPosting` JSON-LD, Open Graph / Twitter cards, and
canonical URLs on the production hosts. Sponsor routes are `noindex`.

**Vercel Web Analytics:** enable under the project **Analytics** tab (no env
var). Page views are automatic; Apply clicks send a custom `Apply` event.

**Search Console (after deploy):** add both hosts as properties and submit
`https://packaging.nicheboardjobs.com/sitemap.xml` and
`https://nicheboardjobs.com/sitemap.xml`.

## Layout

| Path | Purpose |
| --- | --- |
| `PLAN.md` | Product plan and phased to-do |
| `config/` | Tenant registry (hosts, brand, theme, sponsor SKU) |
| `data/companies.csv` | Company → ATS map |
| `data/packaging/jobs.json` | Packaging listings |
| `ingest/` | Connectors, classifier, ingest CLI |
| `src/app/` | SEO-first Next.js site |
| `src/middleware.ts` | Host → tenant |
