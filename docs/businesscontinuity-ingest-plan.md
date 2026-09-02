# Resilience (BCM & DR) ingest plan

**Vertical:** `businesscontinuity` · **Subdomain:** `businesscontinuity.nicheboardjobs.com`  
**Brand:** Resilience Jobs — *BCM & disaster recovery — not generic IT.*

**Purpose:** Grow **on-wedge** BCM / IT disaster recovery / enterprise resilience inventory to clear the **~30+ classified roles** launch gate (currently **21 listed**), then sustain **50+** for credible SEO and sponsor renewals.

**Related docs:** [`PLAN.md`](../PLAN.md) §1c · [`AGENTS.md`](../AGENTS.md) · [`docs/ingest-analytics-plan.md`](ingest-analytics-plan.md) · [`ingest/README.md`](../ingest/README.md)

---

## 1. Wedge definition

The Resilience board is **not** a generic IT or risk job board. On-wedge roles are corporate **business continuity management (BCM)**, **IT disaster recovery (DR)**, and **operational / enterprise resilience** program owners at regulated employers.

### Headline wedge (homepage sort tier 3)

Titles that match `promiseRankBusinessContinuity()` core patterns in `src/lib/rank.ts`:

- Business Continuity Manager / Director
- BCM Manager / Director / Lead
- Disaster Recovery Manager / Architect / Specialist
- Operational / Enterprise Resilience Manager / Director
- DR Architect, Resilience Architect

### Keep-but-sort-lower (tier 1–2)

- Risk Associate / VP Risk with **BCM in title or description** (Capital One pattern)
- Crisis Management paired with BCM / resiliency in title
- Healthcare **EMBC** (Emergency Management & Business Continuity) program managers
- Credit-union **Disaster Recovery Specialist** (MSU FCU / Visions pattern)

### Always drop (classifier gates)

See `ingest/classify-businesscontinuity.ts` and `AGENTS.md`:

| Noise type | Examples |
| --- | --- |
| Field / FEMA EM | NIMS, ICS, PSAP, humanitarian relief, Starlink crisis |
| Product / database engineering DR | *Member of Technical Staff (Disaster Recovery)* in Engineering |
| Manufacturing capacity resiliency | Smart factory, IIoT — without IT BCM program signals |
| SRE / product resilience | Chaos engineering, application resilience without BCM title |
| BCP acronym collision | Business Cards & Payments at Capital One–class banks |
| Generic IT | Help desk, network engineer, software engineer — unless continuity in title |

**US-only gate:** every kept job must pass `isUsOrRemote()` — set `country: "USA"` on global ATS tenants.

---

## 2. Baseline (2 Sep 2026 ingest)

| Metric | Value |
| --- | ---: |
| Employers wired | 42 |
| Classifier-pass (`fetched`) | 40 |
| Listed after US filter + dedup | **21** |
| Employers with ≥1 listed role | 17 (40%) |
| Employers with 0 classifier-pass | 14 (33%) |
| Launch gate | ~30+ on-wedge roles |
| **Gap to launch** | **~9 roles** |

### Sector mix (listed)

| Sector | Listed |
| --- | ---: |
| Finance | 10 |
| Healthcare | 4 |
| Insurance | 2 |
| Untagged | 5 |

### Top contributors today

| Employer | Kept | Example on-wedge title |
| --- | ---: | --- |
| Capital One | 3 | Principal Risk Associate - Business Continuity Management |
| State Street | 2 | Enterprise Resiliency Office, Vice President |
| Waymo | 2 | Resilience / continuity-titled roles |
| MSU FCU, Visions FCU | 1 each | Disaster Recovery Specialist |
| Target, Duke, Hartford, Freddie Mac, Horizon BCBSNJ, Intermountain, Roche, AbbVie, Solventum, Pax8, AEP, BMO | 1 each | BCM / DR / resilience titles |

### Wired but zero kept this cycle (25)

**Finance:** BoA, Wells Fargo, Citi, Morgan Stanley, U.S. Bank, TD Bank, PayPal, Neuberger Berman  
**Insurance / payers:** Elevance, Cigna, Humana, Travelers, AIG, BCBST  
**Healthcare / pharma:** Gilead, Dick's (non-healthcare)  
**Tech (Greenhouse full-board):** Twilio, Cockroach Labs, Jamf, SpaceX  
**Other:** Airbus, RTX, SchoolsFirst FCU, BECU, Navy Federal

### Diagnosis buckets (before adding employers)

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `fetched: 0` | No ATS hits for DR queries, or connector/site misconfig | Verify Workday site slug; add search terms |
| `fetched > 0`, `kept: 0` | Classifier drop or non-US location | Check title patterns; set `country: "USA"` |
| Greenhouse `fetched: 0–1` | Full-board pull; rare BCM titles | Keep wired; low priority unless title hits appear |
| Big-bank `fetched: 1–3`, `kept: 0` | Risk titles without BCM in title; US filter | May need description-aware keep (already supported) |

**Blocker:** ingest does not yet log pre-classifier scan counts or drop reasons. Implement [`docs/ingest-analytics-plan.md`](ingest-analytics-plan.md) Phase A before tuning classifier or claiming funnel stats in marketing.

---

## 3. Search keywords

Current queries in `ingest/verticals/businesscontinuity/companies.ts` (`DR_QUERIES`):

```
business continuity, disaster recovery, operational resilience,
continuity of business, BCM, business resilience, technology resilience,
technology disaster recovery, DR architect, continuity planning, resiliency
```

### Add (Wave A — low risk)

| Query | Rationale |
| --- | --- |
| `enterprise resiliency` | State Street / bank naming |
| `enterprise resilience` | Same, alternate spelling |
| `crisis management` | Capital One network crisis roles (classifier filters field EM) |
| `EMBC` | Healthcare emergency mgmt + BC paired programs |
| `business resiliency` | Insurer / utility phrasing |
| `continuity of operations` | Federal / healthcare COOP |
| `IT disaster recovery` | Explicit IT DR vs product DR |

### Add cautiously (Wave B — monitor drop rate)

| Query | Risk |
| --- | --- |
| `third party risk` | Sometimes owns BCM; often pure TPRM |
| `operational risk` | Broad; many non-BCM risk roles |
| `crisis response` | Field / Starlink-style noise |

**Rule:** new queries increase **scanned** volume; classifier must stay strict. Review top drop reasons after first ingest with analytics.

---

## 4. Employer waves

Employers live in `ingest/verticals/businesscontinuity/companies.ts`. Add in waves; verify one title hit on careers site before merging.

### Wave 0 — repairs (do first, ~0 new employers)

| Task | Employers | Notes |
| --- | --- | --- |
| Set `country: "USA"` | TD Bank, BMO, Airbus | Required for US `"N Locations"` collapse and foreign-posting drop |
| Re-verify Workday site slugs | BoA, Wells, Citi, U.S. Bank, Elevance | Zero `fetched` may indicate stale site path |
| Audit big-bank drops | Citi (3 fetched, 0 kept), MS (2/0), Wells (1/0) | Manual spot-check: BCM in description but not title? |
| Consider removing | Airbus | Global tenant; `Prepared @` field EM noise; low US BCM yield |

**Expected yield:** 2–5 roles if misconfig + US filter fixes unlock existing hits.

### Wave 4 — tier-1 finance (missing entirely)

High BCM program density; all Workday unless noted.

| Employer | ATS (expected) | `niche` | Priority |
| --- | --- | --- | --- |
| JPMorgan Chase | Workday | finance | P0 |
| Goldman Sachs | Workday | finance | P0 |
| PNC | Workday | finance | P1 |
| Truist | Workday | finance | P1 |
| Charles Schwab | Workday | finance | P1 |
| BlackRock | Workday | finance | P1 |
| Fidelity Investments | Workday | finance | P1 |
| Discover | Workday | finance | P2 |
| American Express | Workday | finance | P2 |

**Expected yield:** 8–15 on-wedge roles at steady state (1–3 per P0 employer).

### Wave 5 — insurers & payers

| Employer | ATS | `niche` | Priority |
| --- | --- | --- | --- |
| UnitedHealth / Optum | Workday | insurance | P0 |
| Kaiser Permanente | Workday | healthcare | P0 |
| MetLife | Workday | insurance | P1 |
| Chubb | Workday | insurance | P1 |
| Zurich North America | Workday | insurance | P1 |
| Liberty Mutual | Workday | insurance | P1 |
| Progressive | Workday | insurance | P2 |
| Anthem / Elevance peers | Workday | insurance | P2 — Elevance already wired at 0 |

**Expected yield:** 4–10 roles; payers often title programs **resilience** or **EMBC**.

### Wave 6 — healthcare systems & pharma

| Employer | ATS | `niche` | Priority |
| --- | --- | --- | --- |
| HCA Healthcare | Workday | healthcare | P0 |
| Ascension | Workday | healthcare | P1 |
| CommonSpirit Health | Workday | healthcare | P1 |
| Mayo Clinic | Workday | healthcare | P1 |
| Pfizer | Workday / Phenom | healthcare | P1 — check packaging graph |
| Johnson & Johnson | Workday | healthcare | P1 — already in packaging ingest |
| Merck | Workday | healthcare | P2 |
| Bristol Myers Squibb | Workday | healthcare | P2 |

**Expected yield:** 3–8 roles; Intermountain / Roche / AbbVie prove health-system hits.

### Wave 7 — utilities & critical infrastructure

| Employer | ATS | Priority |
| --- | --- | --- |
| Southern Company | Workday | P1 |
| Exelon | Workday | P1 |
| Dominion Energy | Workday | P1 |
| PG&E | Workday | P2 |
| NextEra Energy | Workday | P2 |
| Xcel Energy | Workday | P2 |

Duke Energy and AEP already contribute 1 each.

**Expected yield:** 2–6 roles.

### Wave 8 — credit unions (MSUFCU read-across)

Proven micro-wedge: explicit **Disaster Recovery Specialist** titles.

| Employer | ATS | Priority |
| --- | --- | --- |
| PenFed | Oracle / Ultipro | P1 |
| Alliant Credit Union | Workday / Ultipro | P2 |
| Golden 1 Credit Union | Workday | P2 |
| America First Credit Union | Ultipro | P2 |

SchoolsFirst, BECU, Navy Federal already wired at 0 — recheck after Wave A fixes.

**Expected yield:** 2–4 roles.

### Wave 9 — tech & SaaS (Greenhouse / Lever)

Only add after title spot-check; Greenhouse pulls **entire board** then classifies.

| Employer | ATS | Notes |
| --- | --- | --- |
| Stripe | Greenhouse | Enterprise resilience team |
| Cloudflare | Greenhouse | BC/DR program |
| Datadog | Greenhouse | Resilience engineering vs SRE — classifier must drop SRE |
| Snowflake | Greenhouse | |
| ServiceNow | Workday | |

Keep existing Twilio / SpaceX / Jamf wired; do not expect volume.

---

## 5. ATS connector priorities

| Priority | Connector | Action |
| --- | --- | --- |
| P0 | **Workday** | Default for Waves 4–8; verify tenant + site per employer |
| P1 | **Ultipro / Oracle** | Credit unions (Navy Federal Oracle at 0 — debug search) |
| P1 | **SmartRecruiters** | AbbVie works; add other SR boards if verified |
| P2 | **Greenhouse** | Optional title pre-filter before `content=true` fetch (perf) |
| P3 | **Phenom / SuccessFactors** | Reuse packaging employer graph for J&J, Pfizer, etc. |
| — | Phenom / Jibe / CWS | Not needed until a verified BCM employer requires them |

**Do not** ingest whole TIC / consulting boards (Deloitte, Accenture) without strict keyword + classifier — huge noise surface.

---

## 6. Implementation checklist

Ordered by **impact ÷ effort**. Check off in PRs tied to ingest commits.

### Phase A — clear launch gate (~30+ roles)

- [ ] **A1** Wave 0 repairs: `country: "USA"` on TD Bank, BMO; Workday site audit on zero-`fetched` banks
- [ ] **A2** Expand `DR_QUERIES` with Wave A keywords (§3)
- [ ] **A3** Add Wave 4 P0 finance: JPMorgan Chase, Goldman Sachs
- [ ] **A4** Add Wave 5 P0 payers: UnitedHealth/Optum, Kaiser Permanente
- [ ] **A5** Run full ingest; confirm **≥30 listed** on-wedge roles
- [ ] **A6** Spot-check homepage sort: tier-3 BCM/DR titles above generic risk

### Phase B — sustain density (50+ roles)

- [ ] **B1** Complete Wave 4 P1 finance (PNC, Truist, Schwab, BlackRock, Fidelity)
- [ ] **B2** Complete Wave 5 P1 insurers (MetLife, Chubb, Zurich, Liberty Mutual)
- [ ] **B3** Add Wave 6 P0–P1 health systems (HCA, Ascension, Mayo)
- [ ] **B4** Add Wave 7 utilities (Southern, Exelon, Dominion)
- [ ] **B5** Add Wave 8 credit unions (PenFed, Alliant)
- [ ] **B6** Implement ingest analytics Phase A ([`docs/ingest-analytics-plan.md`](ingest-analytics-plan.md)) — scanned / drop reasons

### Phase C — optimize funnel

- [ ] **C1** Greenhouse title pre-filter (optional `searchTexts` client-side match before detail fetch)
- [ ] **C2** Classifier tune only with analytics evidence — e.g. if `operational risk` query adds keepable bank BCM
- [ ] **C3** Quarterly ATS re-verify pass (sites drift)
- [ ] **C4** Remove chronic zero-yield employers after 90 days with analytics proof (`scanned: 0`)

---

## 7. Validation

After each wave merge:

```bash
npm run ingest -- --vertical=businesscontinuity
```

**Acceptance checks:**

1. `total` in `data/businesscontinuity/jobs.json` trends toward gate (30+, then 50+).
2. No foreign locations in listed jobs (Latin America, EMEA, Canada paths).
3. No FEMA / field EM / product-engineering DR titles in listed set.
4. Homepage `promiseRankBusinessContinuity` sorts BCM Manager / DR Architect above Risk Associate.
5. `reports[].kept === 0` employers either get repaired or deprioritized — do not accumulate dead weight past ~60 wired without yield.

**Classifier regression:**

```bash
npm test -- ingest/classify-businesscontinuity.test.ts
```

---

## 8. Success metrics

| Milestone | Target | Status |
| --- | --- | --- |
| Launch gate | ≥30 on-wedge listed | 21 — **9 short** |
| Credible SEO floor | ≥50 on-wedge listed | Not yet |
| Employer hit rate | ≥50% of wired with ≥1 kept | 40% |
| Wedge density | ≥60% of listed are rank-3 titles | TBD — manual sample |
| Sector balance | Finance + healthcare + insurance all represented | Yes (thin insurance) |
| Ingest analytics | Scanned → pass → kept funnel logged | Planned |

---

## 9. Out of scope

- FEMA / field emergency management employers
- Humanitarian disaster response NGOs
- Manufacturing smart-factory “resiliency” unless IT BCM signals in JD
- International roles (non-US locations, foreign remote/hybrid)
- Consulting firm full-board ingest without keyword scoping
- Classifier loosening to pad inventory — noise kills sponsor renewals

---

## Changelog

| Date | Note |
| --- | --- |
| 2026-09-02 | Initial plan from Sep 2026 ingest baseline (21 listed / 42 wired) |
