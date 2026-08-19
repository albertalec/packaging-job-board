# Packaging Job Board — Project Plan & To-Do

A niche job board for **packaging engineers and package development**
(not “any job at a packaging company”), built as a cashflow side project.
Aggregates listings automatically from employers' own ATS feeds.
Differentiate on classification, freshness, apply-on-ATS, and a cheap
sponsor SKU — not on matching industry-board volume.

---

## 1. Concept & Positioning

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

### 1d. Brand & custom domain

Working title today is **Packaging Job Board** on
`packaging-job-board.vercel.app`. That reads like a side project, not the
default board for packaging engineers. A recognizable name + custom domain
are prerequisites for SEO trust, LinkedIn shares, university outreach, and
employer sponsorship.

**Provisional defaults (until a final name is chosen)**
- Display name: `Packaging Job Board` (`SITE_NAME`)
- Domain candidate: `packagingjobboard.com` (`SITE_DOMAIN`) — matches the
  contact email already on `/sponsor`
- Contact: `hello@packagingjobboard.com` (`CONTACT_EMAIL`)

**Name criteria (pick one, then buy the domain)**
1. Says **packaging engineer / package development**, not generic
   “packaging jobs” (My Packaging Career owns that head term).
2. Short enough for a two-line masthead and email (`hello@…`).
3. `.com` available; avoid names that collide with converters or IoPP.
4. Works in a title tag: `{Job title} at {Company} · {Brand}`.

**Candidates to evaluate**

| Name | Example domain | Pros | Cons |
| --- | --- | --- | --- |
| **Packaging Job Board** | packagingjobboard.com | Descriptive; email already wired | Generic; long |
| **PackageDev Jobs** | packagedevjobs.com | Matches CPG wedge; distinct from MPC | Less obvious to cold traffic |
| **PackEngineer** | packengineer.com | Short; role-specific | May read as individual brand, not a board |
| **The Package Board** | packageboard.com | Brandable; memorable | “Package” alone is ambiguous |
| **Engineered Packaging** | engineeredpackaging.com | Premium / specialist tone | Long; less “job board” obvious |

- [ ] **Choose final name + domain** — lock one row above; register `.com`.
- [ ] **Point DNS** — Vercel project → custom domain; set `SITE_URL=https://{domain}`.
- [ ] **Set brand env vars** — `SITE_NAME`, `SITE_DOMAIN`, `CONTACT_EMAIL`, and
      matching `NEXT_PUBLIC_*` copies (masthead is a client component). See
      `.env.example` and `src/lib/site.ts`.
- [ ] **301 from vercel.app** — keep old URL redirecting after cutover so any
      early links and Stripe webhook docs do not break.
- [ ] **Update Stripe webhook + Checkout** — success/cancel URLs follow
      `SITE_URL`; re-verify after domain switch.

Code is provisioned: one env change renames the site everywhere titles,
Stripe copy, masthead, and contact email render.

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
- **Takeaway:** They are the default *packaging-industry* board. We should
  be the default board for **people who design and engineer packages.**
  Their homepage is the ad for why we exist — if we stay narrow.

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

## 4. Monetization (in the order it typically unlocks)

Price wedge vs. My Packaging Career: **$100 one-time to pin an ATS listing
that is already live** vs. $149–299/month to post on their board. Sell
“you’re already hiring; we put you first.”

1. [x] **Sponsored job — $100, credit card** — Stripe Checkout at `/sponsor`;
      30-day priority placement + badge. Test payment succeeded locally and
      production is wired (Vercel env vars, webhook, Blob). Still Stripe
      **test mode** until live keys are switched on.
2. [ ] Featured / priority placement beyond the $100 sponsor (upsell) —
      only after the engineer/package-dev inventory looks full
3. [ ] Paid job postings at a higher tier (IoPP $300–500; MPC $149–299/mo)
      — **after** sponsor SKU has demand; do not lead with “post a job”
4. [ ] Lead-gen / quote requests — often highest value once traffic is real
5. [ ] Employer memberships / enhanced profiles — **not** a near-term copy
      of their dashboard
- Early on, **aggregated listings** (not paid posts) make the board look
  full. Paid revenue comes only after traffic exists.

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
      SuccessFactors / Teamtailor / Oracle rows in `ingest/companies.ts`
- [x] Normalize to one schema: title, dept, location, remote flag, posted date,
      apply URL, description, salary (where available)
- [x] Dedupe (hash per posting)
- [x] Posted date / “New” stamp on cards — **freshness vs. MPC**; hash is
      stored. Optional later: a “new since last run” digest, not just dates.
- [x] Daily scheduled poll — GitHub Action `.github/workflows/ingest.yml`
      (12:00 UTC), commits `data/jobs.json`, Vercel redeploys
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
- [x] Server-rendered pages (Next.js static/ISR) — one indexable page per job
      plus filters on the index
- [x] Flat data store (`data/jobs.json`); Stripe checkout for sponsorships
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
- [ ] Filter counts, shorter ATS location strings, a real 404 — UX pass 3
- [ ] **Job alerts (email) before profiles** — return audience; they have
      the full career-platform stack, we need this one loop
- [ ] **Custom domain** — see §1d; env-driven rename is wired; DNS + Stripe
      cutover remain
- [ ] **Google Search Console** — register property once domain is set (or
      vercel.app now to start indexing data); submit sitemap

### Phase 3b — SEO & traffic (technical)

Foundation is shipped (SSR job pages, sitemap, robots). These layers turn
the catalog into discoverable long-tail landing pages and measurable traffic.
**Traffic > build:** edge comes from the niche and distribution, not the code —
but these items make Google and shares work harder.

**Phase A — ship before pushing traffic**
- [ ] **`JobPosting` JSON-LD** on `/jobs/[id]` — Google for Jobs eligibility
      (`title`, `description`, `datePosted`, `hiringOrganization`, `jobLocation`,
      `directApply`, apply URL; `baseSalary` when present)
- [ ] **Open Graph + Twitter cards** — title, description, URL on home and job
      pages so LinkedIn/Slack shares show a rich preview (primary audience channel)
- [ ] **`alternates.canonical`** on every indexable page — especially important
      during vercel.app → custom domain migration
- [ ] **`noindex` sponsor routes** (`/sponsor`, `/sponsor/*`) — crawl budget
      and SERP slots for candidate-intent pages only
- [ ] **Analytics + apply-click events** — Plausible or GA4; track “Apply on
      employer site” as the conversion that matters
- [ ] **Search Console + sitemap submit** — monitor indexing, queries, and CTR

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
- [ ] **Job-alert email** — weekly or daily digest when new roles appear; best
      return-traffic loop before profiles exist
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

**Keyword strategy (do not chase MPC head terms)**
- Win: `{company} packaging engineer`, `packaging engineer jobs {state}`,
  `CPG packaging engineer`, `package development jobs`
- Avoid head-on: generic “packaging jobs”, material sectors without filters

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
      this pull); Colgate SF is operators only
- [ ] Packaging test labs: Smithers (UltiPro), Westpak (Rippling), TEN-E /
      PCL / DDL / Gaynes / Purple Diamond / APTL / Keystone / Modality —
      no public JSON on the connectors we have; resume/email boards
- [x] Retag Ball / Sealed Air / Amcor (`jobs-sf.amcor.com`) as SuccessFactors
- [ ] Graphic Packaging, Pregis, Mondi, Cascades, Plastipak, ProAmpac,
      Ardagh — ATS map + classifier (do not ingest plant oilers)
- [ ] Smurfit Westrock, Crown, O-I, CHEP, Eastman, Altria R&D — same rule
- [ ] Avery Dennison Springboard widget — no public JSON, not Workday

### Phase 5 — Monetize
- [x] Self-serve **sponsor a job for $100** — Stripe Checkout; webhook
      activates a 30-day sponsored listing (badge + ranked first).
      Employers search any live listing to pin; checkout shows a card
      preview. Production: Vercel env + webhook
      `https://packaging-job-board.vercel.app/api/webhooks/stripe` + Blob.
      Still test-mode keys until going live.
- [ ] One live-URL test payment (card `4242…`) then switch to `sk_live_`
      when ready for real charges
- [ ] Featured placement beyond the $100 sponsor — after inventory looks
      like an engineer board, not an empty board
- [ ] Higher-tier paid postings + checkout — lag this; sponsor-an-ATS-job
      is the wedge vs. their post-to-list SKU
- [ ] Lead-gen / quote-request flow
- [ ] Do **not** prioritize employer dashboard / candidate profiles

## 6. Open Questions / Risks

- [ ] **Chicken-and-egg:** need enough *on-wedge* listings (engineer /
      package-dev, not 1,150 plant jobs) + traffic before charging feels
      fair. Latest ingest (2026-08-19): **43 US roles** after dropping
      procurement, sales, corrugator supervision, and other off-target
      titles. Co-ops stay (sorted below experienced engineer / package-dev).
- [ ] **Competing as a general packaging-industry board** — losing strategy.
      If inventory growth starts looking like MPC page 1, stop and retighten
      the classifier.
- [x] **Title ambiguity** (v1 classifier in `ingest/classify.ts`) — keep
      iterating as semiconductor / warehouse / plant-ops false-positives
      show up (worse as we add converters).
- [ ] **ATS drift:** platforms change schemas/deprecate endpoints without
      notice; companies switch ATS. Re-verify seed mapping ~quarterly.
- [ ] **Traffic > build:** "simple to build" ≠ "simple to get traffic."
      Edge comes from the niche, SEO layers (§3b), and distribution — not
      the code alone.
- [ ] **Brand/domain unset** — vercel.app subdomain limits SERP click-through
      and employer trust until §1d is closed.
- [ ] Confirm the chosen wedge has both enough open roles AND employers
      who will pay $100 to pin.

## 7. Next Action

1. [x] **Choose the wedge** — CPG brand-side packaging R&D — and rewrite
   homepage copy so we are not “another packaging job board.”
2. [x] **Grow listing count toward ~50** — latest ingest **43 on-target
   US roles** after the classifier audit. Remaining ingest wins are
   quality, not volume: UltiPro (Smithers) and Rippling (Westpak) for test
   labs; recheck Gallo / Constellation / Colgate when they post package-dev
   titles. GPI / Pregis / WestRock only with the classifier on. Auto
   dunnage (Ford / Adient / CHEP) is expansion.
3. [x] **Posted date / New** on cards (freshness vs. MPC).
4. [x] Homepage + sponsor UX pass 1–2 — audience split, $100 H1, full
   searchable picker, promise-ranked list.
5. [x] **Review off-target jobs and tighten ingest/classifier rules** so
   procurement, plant supervision, sales, and other non-engineer /
   non-package-dev titles do not stay in `jobs.json`.
6. **Choose final name + domain** (§1d) — register, point DNS, set env vars,
   301 from vercel.app.
7. **SEO Phase A** (§3b) — JSON-LD, Open Graph, canonical, sponsor noindex,
   Search Console, analytics.
8. **Job-alert emails** once the relevant list stays above ~50 — before
   profiles or an employer dashboard.
9. **SEO Phase B** filter pages once inventory supports them without thin
   content.
10. **Distribution** — LinkedIn shares + 1–2 university packaging programs.
11. Live-mode Stripe when a real employer is ready to pay.
12. UX pass 3 (later): niche/state counts, shorter locations, a real 404.
