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
| Phenom career sites | `POST /widgets` (`ddoKey: refineSearch` + `refNum`) |
| SuccessFactors RMK | public search JSON when exposed |
| SmartRecruiters | public company postings API |
| CWS (m-cloud) | JSONP `GET /api/job` (`orgId` + facets) |
| Jibe | `GET /api/jobs?keywords=` (`jobs[].data`) |

Jobs are classified to keep packaging engineer / package-development titles
and drop semiconductor “packaging”, warehouse/packer titles, procurement,
sales, and converting-line supervision. Descriptions are decoded and split
into sections before they are written to `data/jobs.json`.

Build status and remaining to-dos live in `PLAN.md`.

## Sponsorship (Stripe)

Employers can sponsor a live listing for **$100** (30 days, credit card). Sponsored
jobs rank first and show a badge.

### Configure Stripe

1. Copy `.env.example` to `.env.local` and set:
   - `STRIPE_SECRET_KEY` — from [Stripe Dashboard → API keys](https://dashboard.stripe.com/test/apikeys)
   - `STRIPE_WEBHOOK_SECRET` — from a webhook endpoint (see below)
   - `SITE_URL` — e.g. `http://localhost:3000` or your production URL
   - `SITE_NAME`, `SITE_DOMAIN`, `CONTACT_EMAIL` — brand and custom domain (see `PLAN.md` §1d); set matching `NEXT_PUBLIC_*` vars for the masthead
2. **Local webhook testing** (Stripe CLI):

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Use the signing secret printed by `stripe listen` as `STRIPE_WEBHOOK_SECRET`.

3. **Production (Vercel):**
   - Add the same env vars in the Vercel project settings.
   - Create a Stripe webhook for `https://your-domain/api/webhooks/stripe` listening to
     `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
   - Add a **Vercel Blob** store and set `BLOB_READ_WRITE_TOKEN` so sponsorships persist
     (the serverless filesystem is read-only). Without Blob, local dev writes to
     `data/sponsorships.json` instead.

### Routes

| Path | Purpose |
| --- | --- |
| `/sponsor` | Pick a listing to sponsor |
| `/sponsor/[jobId]` | Checkout landing ($100) |
| `/api/checkout` | Creates Stripe Checkout session |
| `/api/webhooks/stripe` | Activates sponsorship after payment |

## Layout

| Path | Purpose |
| --- | --- |
| `PLAN.md` | Product plan and phased to-do |
| `data/companies.csv` | Company → ATS map |
| `ingest/` | Connectors, classifier, ingest CLI |
| `src/app/` | SEO-first Next.js site |
