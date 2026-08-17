# Packaging Job Board — Project Plan & To-Do

A niche job board for packaging roles (packaging engineer / packaging manager),
built as a cashflow side project. Aggregates listings automatically from
employers' own ATS feeds, differentiating on freshness, clean role
classification, and depth in underserved sub-niches.

---

## 1. Concept & Positioning

- **What it is:** A focused job board for the packaging profession, seeded by
  auto-ingesting jobs directly from employer ATS platforms.
- **Why it can work:** The packaging-specific field is thin. The one credible
  incumbent (IoPP Career Center) is association-run, low-volume, and features
  months-old listings. No one runs a modern, well-filtered, auto-refreshed
  packaging board.
- **The wedge (pick one to launch):**
  - [ ] **Midwest CPG + automotive** — highest density, least title ambiguity
  - [ ] **Automotive service-part / returnable / dunnage packaging** — narrowest,
        least served, strongest personal domain edge (Autoliv-adjacent)
  - [ ] **General US packaging** — broadest, hardest to stand out
- **Core differentiators:** daily freshness vs. stale incumbent; accurate role
  classification (see title-ambiguity risk); sub-niche filters (automotive /
  pharma / CPG).

## 2. Competitive Baseline (IoPP Career Center)

- Closest direct competitor; association-run, powered by white-label vendor
  (Web Scribble) — no custom tech moat.
- Thin inventory: homepage features a handful of jobs spanning several months
  (stale). Low posting velocity.
- Leans on syndicating OUT to LinkedIn to compensate for small native audience.
- **Pricing (per-posting, non-member):** Basic $300 / Enhanced $400 /
  Premium $500. Member rates: $150 / $250 / $350. Durations 60–90 days.
- **Takeaway:** Employers demonstrably pay $300–500 per packaging posting. The
  freshness gap and lack of a real tech moat are the openings.

## 3. Data Sourcing Strategy

- **Do NOT scrape LinkedIn.** Prohibited by ToS (contract, not just CFAA);
  LinkedIn is actively litigating scrapers in 2026. Commercial resale is the
  highest-risk profile. Unnecessary anyway — target employers post on their own
  ATS pages, which are richer and safer.
- **Key finding — Workday is the critical path, not the "easy four."** The big
  CPG and old-line packaging employers live on Workday / SAP SuccessFactors /
  iCIMS. Greenhouse/Lever/Ashby public feeds skew tech/startup and will catch
  almost none of the top targets.

### Ingestion methods (by priority for this niche)
1. **Workday** (`workday_post`) — POST to
   `https://{co}.wd{N}.myworkdayjobs.com/wday/cxs/{tenant}/{site}/jobs` with a
   paginated JSON body. One integration reused across all Workday employers.
   **Build this first.**
2. **SAP SuccessFactors** (`successfactors`) — semi-predictable career-site API;
   fiddlier than Workday. (Nestlé, Amcor.)
3. **Custom scrape** — proprietary front ends (Amazon, P&G, L'Oréal,
   Georgia-Pacific). One parser each; Amazon exposes a public search API.
4. **Public GET feeds** (Greenhouse/Lever/Ashby) — thin supplementary layer for
   packaging startups only.

### Seed data
- Seed file created: `data/companies.csv` (starter list tagged with
  likely ATS, ingestion method, confidence).
- The asset is the **company list + ATS mapping**, maintained over time.

## 4. Monetization (in the order it typically unlocks)

1. [ ] Featured / priority placement — easiest first dollar, no self-serve needed
2. [ ] Paid job postings (anchor: $300–500/posting, per IoPP benchmark)
3. [ ] Lead-gen / quote requests — often highest value once traffic is real
4. [ ] Employer memberships / enhanced profiles
- Early on, **aggregated listings** (not paid posts) make the board look full.
  Paid revenue comes only after traffic exists.

---

## 5. Build Plan (phased)

### Phase 0 — Validation (before writing ingestion code)
- [ ] Watch IoPP board for 2–4 weeks to measure true posting velocity
      (new jobs/week) — the real demand signal
- [ ] Confirm search demand: are people Googling packaging roles by niche/region?
- [ ] Choose the launch wedge (section 1)
- [ ] Careers-page pass: resolve every `verify` row in the seed CSV to a real
      ATS + token/tenant (watch where each careers page redirects)

### Phase 1 — Ingestion engine (MVP core)
- [ ] Build the Workday connector (POST body, pagination, per-tenant subdomain)
- [ ] Seed with the ~15 high/medium-confidence Workday companies
- [ ] Normalize to one schema: title, dept, location, remote flag, posted date,
      apply URL, description, salary (where available)
- [ ] Dedupe + diff (hash per posting; "new since last run" = product hook)
- [ ] Daily scheduled poll

### Phase 2 — Role classification (critical data-quality step)
- [ ] Build a classifier/allow-list to separate PRODUCT/transport packaging from
      semiconductor & electronics "packaging" (major noise source, esp. West Coast)
- [ ] Sub-niche tagging: automotive / pharma / CPG / food & beverage

### Phase 3 — Site (SEO-first)
- [ ] Server-rendered pages (Next.js/Astro; static/ISR) — one indexable page per
      job and per category
- [ ] Postgres or flat data store to start; no auth/dashboards/payments yet
- [ ] Job alerts (email) to build a return audience

### Phase 4 — Add sources
- [ ] SuccessFactors connector (Nestlé, Amcor)
- [ ] Custom parsers (Amazon first — public API)
- [ ] Greenhouse/Lever/Ashby GET layer for packaging startups

### Phase 5 — Monetize
- [ ] Featured placement (manual/self-serve)
- [ ] Self-serve paid postings + checkout
- [ ] Lead-gen / quote-request flow

## 6. Open Questions / Risks

- [ ] **Chicken-and-egg:** need ~50–100 listings + some traffic before charging.
      Aggregation seeds it so it looks alive first. (Kills most directories.)
- [ ] **Title ambiguity** is the #1 data-quality risk — must be solved in Phase 2.
- [ ] **ATS drift:** platforms change schemas/deprecate endpoints without notice;
      companies switch ATS. Re-verify seed mapping ~quarterly.
- [ ] **Traffic > build:** "simple to build" ≠ "simple to get traffic." Edge comes
      from the niche and SEO, not the code.
- [ ] Confirm which sub-niche has both enough open roles AND employers who pay.

## 7. Next Action

Verify ATS live for the high-value Workday candidates (General Mills,
Kimberly-Clark, PepsiCo, Coca-Cola, Kenvue, Berry Global, Sealed Air) and fill
in real tenant slugs + subdomains, so the Workday connector has confirmed targets.
