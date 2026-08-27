# Niche Board — Project Plan & To-Do

A **multi-niche specialist job platform**: one codebase, one Stripe account,
subdomain per vertical (e.g. `packaging.nicheboardjobs.com`,
`businesscontinuity.nicheboardjobs.com`). Each vertical has its own ingest rules,
classifier, filters, theme, and sponsorship pool. Parent site
(`nicheboardjobs.com`) is the employer hub and bundle-sales surface.

**Launch vertical:** packaging engineers / package development (CPG wedge).
**Platform wedge:** jobs in professional slices too narrow for LinkedIn —
classified daily from employer ATS feeds, apply on the source listing.

Differentiate on **classification, freshness, apply-out, and vertical-scoped
sponsor SKUs** — not on matching industry-board volume.

---

## 1. Concept & Positioning

### 1a. Platform (what we are building)

- **What it is:** A network of **precision job boards** — one subdomain per
  niche — backed by shared ingest, classification, and Stripe infrastructure.
  Candidates discover via subdomain SEO; employers pin listings they already
  have on Workday/Greenhouse.
- **What it is not:** A generic job aggregator, a career platform with
  profiles/employer dashboards, or a single site with niche as a filter
  dropdown.
- **Why the platform model:** Employers buy **audience precision** (“packaging
  engineers,” not “jobs”). Subdomains sell that without separate codebases.
  One Stripe account + vertical metadata enables per-niche pricing and
  multi-vertical bundle upsells.
- **Parent vs subdomain roles:**

| Surface | Audience | Purpose |
| --- | --- | --- |
| `nicheboardjobs.com` | Employers | Network story, bundle pricing, `/employers` |
| `packaging.nicheboardjobs.com` | Candidates + sponsors | SEO, listings, checkout |
| `businesscontinuity.nicheboardjobs.com` | Candidates + sponsors | Same pattern, phase 3 |
| `supplychain.nicheboardjobs.com` | Candidates + sponsors | Same pattern, phase 2 |

### 1b. Vertical #1 — Packaging (live)

- **What it is:** The board for people who **design and engineer packages**
  (packaging engineer, package development, packaging R&D / manager). Seeded
  by auto-ingesting jobs from employer ATS platforms. Applications stay on
  the source ATS — no login wall.
- **What it is not:** A catch-all board for every role at a converter (oiler,
  night-shift finishing, HRIS, EHS intern, plant electrician). That is My
  Packaging Career’s game; copying it makes a worse version of them.
- **Why it can work:** The real packaging-engineer / package-dev pool is
  small (~100 roles on the incumbent’s 1,150-listing board). They bury it
  under plant ops and corporate jobs. No one is the default destination for
  that slice with daily ATS freshness.
- **The wedge (pick one and make it unmissable on the homepage):**
  - [ ] **Automotive service-part / returnable / dunnage packaging** —
        expansion wedge. Narrowest, least served, Autoliv-adjacent domain
        edge. Keep ingesting; do not headline until inventory is denser.
  - [x] **CPG brand-side packaging R&D** — **launch wedge (2026-08).**
        General Mills / Kenvue / Kimberly-Clark package development, not
        plant converting. Matches live inventory; incumbent is converter-heavy.
  - [ ] ~~General US packaging / all jobs at packaging companies~~ — **do
        not pick this.** Broadest, hardest to stand out, identical to My
        Packaging Career.
- **Core differentiators (product, not skin):**
  1. **Classification** — packaging engineer / package development only;
     drop semiconductor “packaging” and warehouse/ops titles.
  2. **Freshness** — daily ATS ingest + posted-date / “new” stamps vs.
     45-day paid posts that can sit stale.
  3. **Apply-out** — candidate goes to Workday/Greenhouse, not a fake apply.
  4. **Sub-niche filters** — automotive / pharma / CPG / food & beverage
     (and later material: corrugated / flexibles / folding carton).
  5. **Price** — $100 to pin a listing that already exists vs. $149–299/mo
     to post it on their board.

**Homepage copy (live, 2026-08-18):** packaging engineers / package
development — not plant ops. Candidate list vs. employer pin are split:
Apply on cards, Sponsor in the mast and on `/sponsor`. Their noisy page-1
is the contrast.

### 1c. Vertical rollout (sequence)

Only show niches with live inventory on the parent hub. Hard gate: **~30+
classified roles** before public launch of a new subdomain.

| Phase | Vertical | Subdomain | Wedge | Sponsor price |
| --- | --- | --- | --- | --- |
| **1 (now)** | Packaging | `packaging.nicheboardjobs.com` | CPG brand-side package dev | $100 / 30d |
| **2** | Supply chain / S&OP | `supplychain.nicheboardjobs.com` | Demand planning, S&OP — not warehouse | $125 / 30d |
| **3** | Business continuity / BCM | `businesscontinuity.nicheboardjobs.com` | DR architect, BCM manager, resilience | $150–200 / 30d |

Scorecard for vertical #4+: classification moat, ATS coverage, ~30+ roles
at launch, long-tail search demand, weak/stale incumbent, sponsor WTP,
distribution channel (LinkedIn groups, associations).

### 1d. Brand & domain architecture

**Parent brand (locked):** **Niche Board** — `nicheboardjobs.com`

- Positioning: *Precision job boards for specialists.*
- Tagline: *The right jobs, not all the jobs.*
- Employer pitch: *Pin the listing you already have on your ATS — scoped to
  the specialty board that reaches the role you are hiring.*
- Hub visual (v1): navy/teal Brand Guide palette, Inter Tight + Inter,
  geometric logo mark. Packaging vertical keeps legacy kraft theme until
  phase 2 vertical rebrand.
- Contact: `hello@nicheboardjobs.com` (all boards). Outbound alerts:
  `alerts@nicheboardjobs.com` via Resend (`ALERTS_FROM_EMAIL`).

**Vertical brands (subdomain mastheads)**

| Vertical | Masthead | Example tagline |
| --- | --- | --- |
| Packaging | **Packaging** / **Jobs** | Packaging engineer jobs at top employers. |
| Supply chain | **Supply Chain** / **Jobs** | Demand planning & S&OP — not warehouse ops. |
| Disaster recovery | **Resilience** / **Jobs** | BCM & disaster recovery — not generic IT. |

Packaging subdomain owns packaging-engineer SEO; parent owns “niche job
boards” and bundle sales. Do not put packaging-only copy on `nicheboardjobs.com`.

**DNS (one Vercel project)**
- [x] Register `nicheboardjobs.com` (apex + www live on Vercel)
- [ ] Add `packaging.nicheboardjobs.com` in Vercel → Production
- [ ] `packaging.nicheboardjobs.com` → packaging tenant (first cutover)
- [ ] 301 `packaging-job-board.vercel.app` → packaging subdomain
- [ ] Stripe webhook stays at one URL, e.g.
      `https://nicheboardjobs.com/api/webhooks/stripe` (or any subdomain — same app)

**Tenant resolution (hostname → config)**

Middleware reads `Host` and loads a vertical config:

```ts
// config/verticals/packaging.ts (shape)
{
  id: "packaging",
  host: "packaging.nicheboardjobs.com",
  brand: { markLine1: "Packaging", markLine2: "Jobs" },
  theme: { accent: "#b42318", kraft: "#c4a484", paper: "#f3eadb" },
  ingest: { companies: "ingest/verticals/packaging/companies.ts",
            classifier: "packaging" },
  dataFile: "data/packaging/jobs.json",
  sponsor: { priceCents: 10_000, durationDays: 30, maxFeatured: 3 },
  filters: ["cpg", "pharma", "automotive", "state", "remote"],
  copy: { hero: "...", contrast: "Package development — not plant ops." },
}
```

- [x] **`config/verticals/`** — one module per niche (brand, theme, ingest,
      classifier key, data path, sponsor pricing, copy, filters)
- [x] **Middleware** — `Host` → vertical id; 404 unknown hosts
- [x] **Per-vertical job data** — `data/{vertical}/jobs.json` (ingest writes
      per vertical; packaging migrated from `data/jobs.json`)
- [x] **Per-vertical ingest** — `ingest/run.ts` accepts `--vertical=packaging`;
      GitHub Action runs one job per live vertical
- [x] **Theme via CSS variables** — set on `<html data-vertical="packaging">`
      from tenant config; shared `globals.css`, different accent/kraft per site
- [x] **Scoped sponsorship store** — Blob key `sponsorships/{vertical}.json`
      or single file with `vertical` field; sponsor boosts **only that subdomain**

**Env vars during migration**

Today’s `SITE_URL` env pattern stays as a local fallback; production
resolves from hostname + vertical config. Optional `DEFAULT_VERTICAL=packaging`
for localhost. `TENANT_HOST=nicheboardjobs.com` previews the parent hub.

- [ ] Cut over packaging tenant env + DNS
- [x] Re-verify Stripe success/cancel URLs use request host (`siteUrl()` per tenant)
- [ ] Search Console: separate properties per subdomain + parent

---

## 2. Competitive Baseline

### 2a. Primary — My Packaging Career (mypackagingcareer.com)

Reviewed 2026-08-18 (`/job-listings/`, about, post-a-job). This is the
**real product competitor**, not IoPP.

- Full career platform since 2023: 1,150 listings, profiles, job alerts,
  employer dashboard, featured, founding membership, polished brand.
- **Volume is inflated by adjacency.** Category mix (approx.): Operations
  & Plant 315, Sales & Marketing 140, Supply Chain 113, **Packaging Design
  & Development 104**, Management 98, plus General (oiler, product builder,
  night finishing). Page 1 mixes real R&D with HRIS / EHS intern / plant
  electrician. They claim “quality over volume” and “only packaging jobs.”
- Filters are category / state / job type. Hero copy names corrugated,
  flexibles, folding carton, sustainability — **those are not filters.**
- No posted-date / freshness on cards. Apply + login on their site.
- Employers must post. SKUs: **$149 / 45 days** standard, **$299** featured,
  **$199/mo founding** (5 featured listings, price locked, 25 spots).
- Converter coverage we still lack: Graphic Packaging, Avery Dennison,
  Pregis, Mondi, Cascades, Plastipak, ProAmpac, Ardagh.
- **Do not copy their IA or career-platform stack** (profiles, employer
  dashboard, “post a job” as the first SKU). Steal **employer names for
  ATS ingest**, not their product shape.
- **Takeaway:** They are the default *packaging-industry* board. Packaging
  vertical should be the default board for **people who design and engineer
  packages.** Platform play: repeat that “narrow slice” model on other
  subdomains (supply chain, DR) under Niche Board.

### 2b. Secondary — IoPP Career Center

- Association-run, Web Scribble white-label; thin, stale inventory;
  syndicates out to LinkedIn. No custom tech moat.
- **Pricing (per-posting, non-member):** Basic $300 / Enhanced $400 /
  Premium $500. Member: $150 / $250 / $350. Durations 60–90 days.
- **Takeaway:** Confirms employers will pay $300–500 to *post*. Our $100
  sponsor is a cheaper wedge for a listing that is already live on ATS.

### 2c. What not to build (yet)

- Candidate profiles, employer accounts, “post a job” as the primary SKU
- Matching 1,150-role volume by ingesting every plant/ops title
- Material-sector marketing copy without matching filters
- Separate Stripe accounts or codebases per vertical
- A single mega-site where niche is only a filter (kills sponsor pricing power)

---

## 3. Data Sourcing Strategy

- **Do NOT scrape LinkedIn.** Prohibited by ToS (contract, not just CFAA);
  LinkedIn is actively litigating scrapers in 2026. Commercial resale is the
  highest-risk profile. Unnecessary anyway — target employers post on their
  own ATS pages, which are richer and safer.
- **Key finding — Workday is the critical path, not the "easy four."** The
  big CPG and old-line packaging employers live on Workday / SAP
  SuccessFactors / iCIMS. Greenhouse/Lever/Ashby public feeds skew
  tech/startup and will catch almost none of the top targets.
- **Ingest their employer list for relevant roles only.** Use My Packaging
  Career’s converter roster as a seed, then **run our classifier** so we
  keep package engineering / development and drop oiler / HRIS / EHS.

### Ingestion methods (by priority for this niche)
1. **Workday** (`workday_post`) — POST to
   `https://{co}.wd{N}.myworkdayjobs.com/wday/cxs/{tenant}/{site}/jobs` with a
   paginated JSON body. One integration reused across all Workday employers.
2. **CWS / m-cloud** (`cws`) — JSONP `GET /api/job` used by WordPress career
   widgets (Coca-Cola org `2110`, Workday-backed). Public search JSON, not
   HTML scrape.
3. **SAP SuccessFactors** (`successfactors`) — RSS/search JSON when the RMK
   site exposes it. Aptar live; Ball / Sealed Air / Amcor
   (`jobs-sf.amcor.com`) retagged and live (0 packaging-engineer titles in
   the latest pull). Nestlé still closed.
4. **Phenom CareerConnect** — `POST {origin}/widgets` with `ddoKey:
   refineSearch` + tenant `refNum`. Live: P&G `PGBPGNGLOBAL`, DuPont
   `DUPOUS`, WK Kellogg `WKNWKIUS`, Mars `MARSGLOBAL`. PepsiCo is Jibe JSON
   at `/api/jobs` (`jobs[].data.title`), not Phenom.
5. **Jibe** — `GET /api/jobs?keywords=` unwrap `jobs[].data` (PepsiCo).
6. **Public GET feeds** (Greenhouse/Lever/Ashby) — thin supplementary layer
   for packaging startups only. Amazon `search.json` is live.

### Seed data
- Seed file created: `data/companies.csv` (starter list tagged with
  likely ATS, ingestion method, confidence).
- The asset is the **company list + ATS mapping**, maintained over time.
- School-adjacent gaps and packaging test labs are listed below. Converter
  names (GPI, Pregis, Mondi, etc.) stay on the list **only** with the
  classifier on — they are how this board becomes My Packaging Career.

### School-adjacent employer gaps
Talent map: MSU 180, Clemson 56, RIT 43, UW-Stout 26, Virginia Tech 17,
Cal Poly 13, Rutgers 6 (IPEDS 2023–24). Proximity is a pipeline signal,
not a license to ingest every plant near campus. VT is unit-load / pallet
/ protective, not CPG carton R&D.

**Now on the board (by cluster)**
- MSU / Midwest: Autoliv, Magna, Menasha, GM (0 kept), General Mills,
  Kimberly-Clark, Clorox, Conagra, Pepsi, WK Kellogg, SC Johnson, Smucker
- Rutgers / NJ CPG: Kenvue, Campbell's, Church & Dwight, P&G, J&J, Mars
  (Unilever ingested; US packaging hits were operators, kept 0)
- Cal Poly: Clorox (Pleasanton / Oakland)
- Clemson / VT: International Paper, Menasha co-ops, Pepsi/Sabra
  (Chesterfield). Sealed Air retagged to SuccessFactors; 0 engineer titles
  this pull.

**Still missing (ingest these, not GPI plant oilers)**

| Cluster | Gap employers | Notes |
| --- | --- | --- |
| MSU | Amway, Perrigo; Ford / Adient as expansion | Ada / Allegan CPG; auto dunnage is not the headline |
| Virginia Tech | CHEP, WestRock, Graphic Packaging, Eastman, Altria R&D | I-81 / Richmond / Carolinas; unit-load + protective |
| Clemson | Graphic Packaging, Pregis, ISOFlex | Sealed Air is wired; converter plant titles stay filtered |
| Rutgers | Colgate | SF RMK; operators only this pull |
| UW-Stout | Green Bay Packaging, Sargento | Corrugated + Wisconsin CPG; GPI only with tight filter |
| RIT | Constellation Brands, LiDestri, Wegmans brand packaging | No packaging-titled roles this pull; recheck |
| Cal Poly | E&J Gallo, The Wonderful Company, Driscoll’s | No packaging-titled roles this pull; recheck |

**Do next (existing connectors, on-wedge titles)**
1. [x] SC Johnson, J.M. Smucker — Midwest CPG Workday
2. [x] Sealed Air / Ball / Amcor SuccessFactors retag
3. [x] J&J Workday, Mars Phenom (`MARSGLOBAL`), Unilever Workday
4. Gallo / Constellation — no packaging-titled roles this pull; recheck
5. Colgate SF — operators only; skip until engineer titles appear
6. Packaging test labs — UltiPro (Smithers) / Rippling (Westpak) need
   connectors; others are resume inboxes

### Packaging testing labs
Independent ISTA / ISO 17025 / Amazon APASS labs hire packaging
engineers, package-development, and validation roles — same talent pool
as the schools (Smithers Lansing ↔ MSU; PCL Grand Rapids ↔ MSU; TEN-E
Newport ↔ Stout / Twin Cities; Westpak ↔ Cal Poly). This is **not**
converter plant ops. Keep titles like packaging engineer / package
testing / ISTA / ISO 11607 validation; drop generic lab techs.

**Specialist packaging labs (add first — they are the Smithers / TEN-E class)**
- **Smithers** (ex-Pira) — Akron OH, Lansing MI; distribution + materials
- **TEN-E Packaging Services** — Newport MN, plus NC; DG + medical + ISTA
- **Westpak** — San Jose / San Diego; ISTA + medical + APASS
- **Packaging Compliance Labs** — Grand Rapids / Billerica; medical ISO 11607
- **DDL** — Eden Prairie MN / Fountain Valley CA; medical device packaging
- **Gaynes Labs** — Bridgeview IL; ISTA 1–6 including Amazon SIOC
- **Purple Diamond** — Bethlehem PA; ISTA + cold chain + e-commerce
- **Advanced Packaging Technology Laboratories** — Buffalo Grove IL; ISTA + APASS
- **Applus+ Keystone** — New Castle PA / Durham NC; ISTA + APASS (ex-Keystone Compliance)
- **Modality Solutions** — Bloomington IN; pharma / cold-chain transport simulation

**Larger TIC firms with a packaging-test practice (search `packaging` only)**
Nelson Labs (sterile barrier / ISO 11607), Intertek, SGS, Bureau Veritas,
Element, UL Solutions, TÜV SÜD. Huge boards — do not ingest the whole
company; keyword + classifier or skip.

Lansmont (Monterey) is test-equipment, not a commercial ISTA lab. MSU /
VT / RIT campus labs are not employers for this board.

## 4. Monetization (vertical-scoped, one Stripe)

**Principle:** Employers buy **audience precision on a subdomain**, not a
slot on a generic board. Sponsorships are scoped to the vertical where checkout
happens. Cross-vertical visibility is a **paid bundle**, not a free side effect.

**One Stripe account.** Checkout metadata: `{ jobId, vertical, tier, host }`.
Webhook writes to vertical-scoped sponsorship store. Report revenue by
`vertical` in Stripe Dashboard.

Price wedge vs. My Packaging Career (packaging vertical): **$100 one-time to
pin an ATS listing** vs. $149–299/month to post on their board. Sell “you’re
already hiring; we put you first **on the board packaging engineers use**.”

### SKU ladder (in unlock order)

| # | SKU | Price | Status | Notes |
| --- | --- | --- | --- | --- |
| 1 | **Sponsor (single vertical)** | $100–200 / 30d | [x] packaging wired | Price from tenant config; badge + rank first on **that subdomain only** |
| 2 | **Featured (top 3)** | +$99 or $199 flat | [ ] | Cap ~3 active featured per vertical — scarcity on small boards |
| 3 | **Dual pin (2 verticals)** | $175 | [ ] | After vertical #2 live; same employer, one invoice |
| 4 | **Network pin (all live verticals)** | $299 | [ ] | Upsell on `nicheboardjobs.com/employers` |
| 5 | **Lead-gen / intro requests** | Highest $/deal | [ ] | After ~500 organic visits/mo per subdomain |
| 6 | **Paid job postings** | $200–500 | [ ] | Only when role isn’t on ATS; do not lead with this |
| 7 | **Employer memberships / profiles** | — | **not near-term** | MPC owns this stack |

**Per-vertical sponsor pricing (suggested)**

| Vertical | Price / 30d | Rationale |
| --- | --- | --- |
| Packaging | $100 | Wedge; undercut MPC ($149+) |
| Supply chain / S&OP | $125 | Same CPG buyer graph; slightly broader titles |
| Disaster recovery / BCM | $150–200 | Enterprise IT; higher cost-to-fill |

**Monetization rules**
- Cap visible sponsored slots at **~5 per vertical homepage** — drives renewals
  and future Featured tier.
- **Renewal rate** is the success metric for SKU #1, not first purchase alone.
- Aggregated ATS listings stay free — they fill the board and make sponsor credible.
- Classification quality is a **revenue feature** — noise kills sponsor renewals.

**Stripe implementation to-do**
- [x] Checkout + webhook for packaging (test mode)
- [x] Add `vertical` (+ optional `tier`) to session metadata and sponsorship records
- [x] Scope `getActiveSponsoredJobIds()` to current tenant vertical
- [x] `unit_amount` from tenant config, not global constant
- [ ] Bundle checkout (multi-vertical metadata) when vertical #2 ships
- [ ] One live payment test per vertical; then `sk_live_`

---

## 5. Build Plan (phased)

### Phase 0 — Validation
- [ ] Watch **My Packaging Career** weekly: how many new *Packaging Design
      & Development* roles vs. plant/ops noise (the real demand signal for
      our slice). IoPP velocity is secondary.
- [ ] Confirm search demand: packaging engineer / package development /
      chosen wedge (automotive dunnage or CPG packaging R&D), not generic
      “packaging jobs”
- [x] **Choose the launch wedge** (section 1) — CPG brand-side packaging
      R&D is on the homepage; automotive dunnage is the expansion path
- [x] Careers-page pass: resolve every `verify` row in the seed CSV to a
      real ATS + token/tenant (watch where each careers page redirects)
      — Live Workday: General Mills (`genmills` / `GMI_External_Careers`),
      Kimberly-Clark, Sonoco, 3M, Kenvue, Silgan, Clorox, Conagra,
      Campbell's, Church & Dwight, SC Johnson, Smucker, Unilever, J&J,
      GM, Magna, Menasha.
      Coca-Cola is CWS/m-cloud (not Phenom). PepsiCo is Jibe `/api/jobs`.
      P&G / DuPont / WK Kellogg / Mars are Phenom widgets (`refNum` known).
      Ball / Sealed Air / Amcor (`jobs-sf.amcor.com`) are SuccessFactors.
      `amcor.com/careers` is marketing only. Berry Global careers redirect
      to Amcor.

### Phase 1 — Ingestion engine (MVP core)
- [x] Build the Workday connector (POST body, pagination, per-tenant subdomain)
- [x] Seed with verified Workday companies (Kimberly-Clark, General Mills,
      Sonoco, 3M, Kenvue, Silgan) plus Phenom / Greenhouse / Amazon /
      SuccessFactors / Teamtailor / Oracle rows in `ingest/verticals/packaging/companies.ts`
- [x] Normalize to one schema: title, dept, location, remote flag, posted date,
      apply URL, description, salary (where available)
- [x] Dedupe (hash per posting)
- [x] Posted date / “New” stamp on cards — **freshness vs. MPC**; hash is
      stored. Optional later: a “new since last run” digest, not just dates.
- [x] Daily scheduled poll — GitHub Action `.github/workflows/ingest.yml`
      (12:00 UTC), commits `data/packaging/jobs.json`, Vercel redeploys
- [x] **Per-vertical ingest** — `--vertical=packaging` writes
      `data/packaging/jobs.json`; Action matrix one job per live vertical
- [x] US-only ingest — keep US-located or remote; drop Canada/UK/PH.
      Trailing Workday country codes like `, CA` are not treated as California.
      Workday “N Locations” on a USA-home-country employer is kept (Smucker
      multi-site R&D was being dropped). Req IDs are not parsed as ZIP codes.

### Phase 2 — Role classification (the product, not just data quality)
This is the hole in My Packaging Career. Keep tightening so we never look
like “jobs at GPI.”
- [x] Classifier/allow-list: PRODUCT/transport packaging vs. semiconductor
      & electronics "packaging"; drop warehouse/packer titles; drop GM-style
      application packaging / HUD / mechanical-electronics packaging titles
- [x] Sub-niche tagging: automotive / pharma / CPG / food & beverage /
      industrial
- [x] **Audit the live board for off-target titles and tighten
      ingest/classifier rules.** Dropped procurement, corrugator
      supervisors, DuPont sales, packaging-equipment, plant process, and
      other non-engineer / non-package-dev titles in `ingest/classify.ts`.
      Homepage sort remains a safety net. Do this before adding GPI /
      Pregis / Mondi.
- [ ] Optional later: material tags (corrugated / flexibles / folding
      carton / sustainability) **with filters**, not just hero copy

### Phase 3 — Site (SEO-first, apply-out)

**Today:** multi-tenant Next.js app; vercel.app still serves the packaging
tenant until DNS cutover. **Target:** `packaging.nicheboardjobs.com` + parent hub.

- [x] Server-rendered pages (Next.js static/ISR) — one indexable page per job
      plus filters on the index
- [x] Flat data store (`data/{vertical}/jobs.json`); Stripe checkout for sponsorships
      (no employer accounts / dashboards — **intentional**, not a gap vs. MPC)
- [x] Search / filter jobs by US state (in addition to title/company/city and
      niche)
- [x] Public deploy: https://packaging-job-board.vercel.app (`SITE_URL` set)
- [x] **Rewrite homepage positioning** to packaging engineer / package
      development + CPG brand-side wedge (contrast line live; cards Apply-
      only; engineer / package-dev titles sorted above procurement / plant
      / sales)
- [x] Sponsor index: searchable picker of all live jobs (not newest 12);
      $100 / 30-day H1; employer mast copy; sponsored-card preview on
      checkout
- [x] **Readable job descriptions (2026-08-19).** Decode HTML entities
      (`&#39;` → `'`, `&#43;` → `+`), restore section breaks, and render
      ATS labels as headings plus lists. See §3a. Do not store raw ATS
      HTML (XSS).
- [x] **Multi-tenant platform (§1d)** — middleware, vertical config, per-vertical
      data + sponsorship scope, theme vars, hostname-aware `siteUrl()`
- [x] **`nicheboardjobs.com` parent pages** — `/`, `/niches`, `/employers` (bundle
      pricing, network pitch); no competing packaging SEO on apex
- [ ] Filter counts, shorter ATS location strings, a real 404 — UX pass 3
- [x] **Job alerts (email) before profiles** — per-vertical lists; optional
      “all niches” on parent later
- [ ] **DNS cutover** — `packaging.nicheboardjobs.com` + 301 from vercel.app
- [ ] **Google Search Console** — parent + packaging subdomain; submit sitemaps

### Phase 3b — SEO & traffic (technical)

Foundation is shipped (SSR job pages, sitemap, robots). These layers turn
the catalog into discoverable long-tail landing pages and measurable traffic.
**Traffic > build:** edge comes from the niche and distribution, not the code —
but these items make Google and shares work harder.

**Phase A — ship before pushing traffic**
- [x] **`JobPosting` JSON-LD** on `/jobs/[id]` — Google for Jobs eligibility
      (`title`, `description`, `datePosted`, `hiringOrganization`, `jobLocation`,
      `directApply`, apply URL; `baseSalary` when present)
- [x] **Open Graph + Twitter cards** — title, description, URL on home and job
      pages so LinkedIn/Slack shares show a rich preview (primary audience channel)
- [x] **`alternates.canonical`** on every indexable page — especially important
      during vercel.app → custom domain migration
- [x] **`noindex` sponsor routes** (`/sponsor`, `/sponsor/*`) — crawl budget
      and SERP slots for candidate-intent pages only
- [x] **Analytics + apply-click events** — Vercel Web Analytics page views +
      custom `Apply` event on outbound apply links (enable in project Analytics)
- [ ] **Search Console + sitemap submit** — add properties for
      `nicheboardjobs.com` and `packaging.nicheboardjobs.com`; submit
      `/sitemap.xml` on each (human step after deploy)

**Phase B — after ~50+ on-wedge jobs (avoid thin pages)**
- [ ] **Indexable filter routes** (server-rendered, not client-only):
      `/jobs/state/[code]`, `/jobs/niche/[slug]`, `/jobs/company/[slug]`,
      `/jobs/remote` — each with unique H1, intro, job count, internal links;
      `noindex` when fewer than ~3 listings in a group
- [ ] **Expand sitemap** to include filter/company pages with `lastModified`
      from the newest job in each group
- [ ] **Site-generated intro** above ATS description on job pages — one sentence
      (“Packaging engineer role at {Co} in {City} — apply on their careers site”)
      to reduce near-duplicate boilerplate across employers

**Phase C — distribution (parallel, not sequential)**
- [x] **Job-alert email** — daily digest when new roles appear (double opt-in,
      niche/state filters, branded HTML matching the board); Vercel Cron +
      optional post-ingest GitHub Action trigger
- [ ] **LinkedIn sharing** — 2–3 fresh listings/week with OG preview; packaging
      engineer groups and company tags
- [ ] **University outreach** — MSU School of Packaging, Clemson, RIT: “curated
      engineer/package-dev roles, not plant ops” + link to filtered pages
- [ ] **RSS feed** (`/feed.xml`) — optional; syndication and alert services

**Phase D — scale (100+ jobs)**
- [ ] **Evergreen content** — e.g. packaging engineer salary by company (from
      listings), “engineer vs plant operator” explainer (reinforces classifier)
- [ ] **Salary extraction** into meta row + structured data where ATS text
      includes ranges
- [ ] **Collapse EEO / visa boilerplate** into `<details>` if listings still
      feel noisy (see §3a)

**Keyword strategy (packaging subdomain — do not chase MPC head terms)**
- Win: `{company} packaging engineer`, `packaging engineer jobs {state}`,
  `CPG packaging engineer`, `package development jobs`
- Avoid head-on: generic “packaging jobs”, material sectors without filters
- Parent (`nicheboardjobs.com`): “niche job boards”, “specialist jobs”, employer
  intent only — not packaging head terms

---

Workday and other ATS feeds give HTML. Ingest used to flatten every tag to a
space and only decode a few named entities, so seekers saw one wall of text
with `Bachelor&#39;s` and `PREFERRED QUALIFICATIONS` jammed into the previous
sentence.

**What job seekers need on the listing page**
1. Scan in 10 seconds: role summary, what you’ll do, qualifications.
2. Trust the text: real apostrophes, plus signs, quotes — no entity codes.
3. Apply without hunting: CTA at top and bottom; the rest is the employer’s
   words, not a career-platform rewrite.

**v1 (shipped)** — normalize at ingest, parse at render
- Decode numeric and named entities (`&#39;`, `&#xa;`, `&amp;`, …).
- Convert HTML blocks to paragraphs / `•` lists instead of one line.
- Split known ATS labels (Company Overview, Preferred Qualifications,
  What’s in it for you, …) into headings. Only ALL-CAPS labels, line-start
  titles, colon labels, or labels after a sentence break count — so “The
  salary range for this role” stays a sentence. Teamtailor bullets without
  a space (`•Attractive`) become a real list. EEO copy after Autoliv perks
  becomes its own section.
- Render headings + lists in the kraft listing style. Repeat Apply at the
  bottom. Keep plain text in `jobs.json` (not raw HTML).

**Later, only if listings still feel noisy**
- Collapse EEO / accommodation / visa boilerplate into a compact legal
  footer or `<details>`.
- Pull salary ranges out of description body into the meta row.
- Optional “About the company” fold when the manifesto is longer than the
  role. Do not hide qualifications.

Do not reintroduce unsanitized ATS HTML. Connector HTML varies too much to
style as-is, and it is an XSS surface.

### Phase 4 — Add sources (relevant roles only)
- [ ] SuccessFactors public JSON still not exposed (Nestlé) — Aptar RSS works
- [x] Amazon Jobs public `search.json`
- [x] Greenhouse / Lever / Ashby GET layer (Greenhouse live; Lever/Ashby ready
      for board tokens)
- [x] Coca-Cola CWS/m-cloud connector (`ingest/sources/cws.ts`, org `2110`,
      US + Workday-external facets). Latest pull: 0 on-niche US roles
      (plant/sourcing hits dropped by classifier)
- [x] GM / Magna / Menasha Workday (US). Magna: 4 packaging engineers.
      Menasha: custom packaging design co-ops. GM packaging hits were
      electronics/software — kept 0
- [x] Kenvue Workday (`kenvue.wd5` / `kenvue`)
- [x] Silgan Containers + Silgan Dispensing Workday
- [x] Aptar SuccessFactors RSS (`jobs.aptar.com`)
- [x] Autoliv US Teamtailor (`careerunitedstates.autoliv.com/jobs.json`)
- [x] International Paper Oracle CE API (packaging/corrugated roles)
- [x] Phenom widgets connector (`POST /widgets`, `ddoKey: refineSearch`) —
      P&G `PGBPGNGLOBAL`, DuPont `DUPOUS`, WK Kellogg `WKNWKIUS`
- [x] PepsiCo Jibe parser — `/api/jobs?keywords=packaging`; unwrap
      `jobs[].data`
- [x] Campbell's Workday (`campbellsoup` / `ExternalCareers_GlobalSite`)
- [x] Church & Dwight Workday (`churchdwight` / `chdcareers`)
- [x] WK Kellogg Phenom widgets (`jobs.wkkellogg.com`, `WKNWKIUS`)
- [x] SC Johnson Workday (`scj` / `External_Career_Site`)
- [x] J.M. Smucker Workday (`smucker` / `US_External_Careers`)
- [x] Johnson & Johnson Workday (`jj` / `JJ`)
- [x] Mars Phenom widgets (`MARSGLOBAL`)
- [x] Unilever Workday (`Unilever_Experienced_Professionals`) — US
      packaging hits are plant operators
- [ ] School-gap CPG still dark: Gallo / Constellation (no packaging titles
      this pull); Colgate SF is operators only; Sargento Phenom wired
      (`SFINUS`) but no engineer titles this pull
- [ ] Packaging test labs: Smithers (UltiPro), Westpak (Rippling), TEN-E /
      PCL / DDL / Gaynes / Purple Diamond / APTL / Keystone / Modality —
      no public JSON on the connectors we have; resume/email boards
- [x] Retag Ball / Sealed Air / Amcor (`jobs-sf.amcor.com`) as SuccessFactors
- [x] Moonshot employer expansion (2026-08-20) — Abbott, Pfizer, Baxter,
      Stryker, Catalent, BD, Thermo Fisher (Workday), Tyson, Target, CHEP,
      Edwards, Medtronic, Zimmer Biomet, GSK; SF seeds Hershey / Eastman /
      Molson / Reckitt / Gallo / Colgate / Perrigo. Multi-query Workday /
      Phenom / SF search (`searchTexts`). Classifier drops plant
      “Manufacturing Packaging / Process & Packaging” and category-
      management titles.
- [ ] Graphic Packaging, Pregis, Mondi, Cascades, Plastipak, ProAmpac,
      Ardagh — ATS map + classifier (do not ingest plant oilers)
- [x] CHEP Workday wired (`brambles` / `Brambles_Careers`) — 0 returnable /
      packaging engineer titles this pull
- [ ] Smurfit Westrock, Crown, O-I, Eastman, Altria R&D — same rule
- [ ] Avery Dennison Springboard widget — no public JSON, not Workday

### Phase 5 — Monetize (vertical-scoped)

- [x] Self-serve **sponsor a job for $100** — Stripe Checkout; webhook
      activates a 30-day sponsored listing (badge + ranked first).
      Employers search any live listing to pin; checkout shows a card
      preview. Production: Vercel env + webhook
      `https://packaging-job-board.vercel.app/api/webhooks/stripe` + Blob.
      Still test-mode keys until going live.
- [x] **Vertical-scoped sponsorships** — metadata + store partition; sponsor
      only ranks on checkout subdomain (§4)
- [x] **Tenant-aware pricing** — `unit_amount` from vertical config
- [ ] One live-URL test payment on `packaging.nicheboardjobs.com` then `sk_live_`
- [ ] Featured tier (top 3 cap per vertical) — after renewals exist
- [ ] Dual / network bundle SKUs — when vertical #2 is live
- [x] `nicheboardjobs.com/employers` — bundle landing + contact (page shipped; DNS pending)
- [ ] Lead-gen / quote-request flow — per vertical with traffic
- [ ] Do **not** prioritize employer dashboard / candidate profiles

### Phase 6 — Additional verticals

**After packaging sponsor renewals + DNS cutover.**

- [ ] **Supply chain vertical** — `supplychain.nicheboardjobs.com`; demand-planning
      / S&OP classifier; overlap CPG employer graph for bundle upsell
- [ ] **Business continuity vertical** — `businesscontinuity.nicheboardjobs.com`; BCM /
      DR / resilience classifier; finance + healthcare employer seed
- [ ] Per-vertical: companies module, classifier, ingest Action job, GSC property,
      sponsor price, theme tint
- [ ] Parent `/niches` lists only verticals above inventory gate

---

## 6. Open Questions / Risks

- [ ] **Chicken-and-egg:** need enough *on-wedge* listings (engineer /
      package-dev, not 1,150 plant jobs) + traffic before charging feels
      fair. Moonshot ingest (2026-08-20): **53 US on-wedge roles** after
      dropping plant manufacturing-packaging, procurement/category-
      management, sales, corrugator supervision, and other off-target
      titles. Co-ops stay (sorted below experienced engineer / package-dev).
- [ ] **Competing as a general packaging-industry board** — losing strategy.
      If inventory growth starts looking like MPC page 1, stop and retighten
      the classifier.
- [x] **Title ambiguity** (v1 classifier in `ingest/classify.ts`) — keep
      iterating as semiconductor / warehouse / plant-ops false-positives
      show up (worse as we add converters).
- [ ] **ATS drift:** platforms change schemas/deprecate endpoints without
      notice; companies switch ATS. Re-verify seed mapping ~quarterly.
- [ ] **Traffic > build:** edge comes from the niche, SEO layers (§3b), and
      distribution — not the code alone.
- [ ] **Platform cutover** — vercel.app still serves packaging until
      `nicheboardjobs.com` is registered and `packaging.` is cut over
- [ ] **Multi-tenant complexity** — keep vertical configs declarative; do not
      fork the app per niche
- [ ] **Sponsor scope bugs** — global sponsor pool would destroy bundle leverage
      and vertical trust; test cross-host isolation
- [ ] Confirm packaging vertical has both enough on-wedge roles AND employers
      who will pay $100 to pin before launching vertical #2

## 7. Next Action

1. [x] **Choose the wedge** — CPG brand-side packaging R&D — and rewrite
   homepage copy so we are not “another packaging job board.”
2. [x] **Grow listing count toward ~50** — moonshot ingest cleared the
   bar with on-wedge CPG + medtech adds (Target, Abbott, Stryker, BD,
   Edwards, Thermo Fisher, Silgan, Tyson systems). Remaining wins are
   quality, not volume: UltiPro (Smithers) and Rippling (Westpak) for test
   labs; recheck Gallo / Constellation / Colgate / Sargento / Medtronic US
   when they post package-dev titles. GPI / Pregis / WestRock only with
   the classifier on. Auto dunnage (Ford / Adient / CHEP) is expansion.
3. [x] **Posted date / New** on cards (freshness vs. MPC).
4. [x] Homepage + sponsor UX pass 1–2 — audience split, $100 H1, full
   searchable picker, promise-ranked list.
5. [x] **Review off-target jobs and tighten ingest/classifier rules** so
   procurement, plant supervision, sales, and other non-engineer /
   non-package-dev titles do not stay in `jobs.json`.
6. [x] **Multi-tenant platform (§1d)** — `config/verticals/`, middleware,
   per-vertical data path, theme CSS vars, vertical-scoped sponsorship store,
   hostname-aware Stripe URLs.
7. **Add `packaging.nicheboardjobs.com` in Vercel** — Production; then 301
   from vercel.app; apex hub pages (`/`, `/employers`) are already in the app.
8. [x] **Stripe vertical metadata** — scope sponsors to subdomain; tenant pricing
   from config (§4).
9. [x] **SEO Phase A** (§3b) — JSON-LD, Open Graph, canonical, sponsor noindex,
   Vercel Analytics. **Still human:** Search Console (parent + packaging) +
   sitemap submit; enable Analytics in the Vercel project.
10. [x] **Job-alert emails** on packaging subdomain (free, double opt-in,
    branded digest when new roles appear).
11. **Distribution** — LinkedIn shares + 1–2 university packaging programs.
12. Live-mode Stripe on `packaging.nicheboardjobs.com` when an employer is ready.
13. **Vertical #2 (supply chain)** — only after packaging sponsor renewals;
    bundle SKU on parent.
14. UX pass 3 (later): niche/state counts, shorter locations, a real 404.
