# Packaging ingest improvement plan

**Status:** Phase 1 complete — Phase 2 next  
**Baseline (2026-09-01 ingest):** 49 live roles · 73 classifier-pass · 57 wired employers · 21 with listings  
**Classifier:** `ingest/classify.ts` · **Employer list:** `ingest/verticals/packaging/companies.ts`  
**Related:** [`docs/ingest-analytics-plan.md`](ingest-analytics-plan.md) · [`PLAN.md`](../PLAN.md) §3

---

## Objective

Grow **on-wedge packaging roles** (package development / packaging engineering at brand-side CPG, food, pharma, and test-lab employers) without widening the classifier to plant ops, procurement, or semiconductor “packaging.”

**North star:** The right jobs, not all the jobs.

---

## Current funnel

| Stage | Count | Notes |
| --- | ---: | --- |
| Employers wired | 57 | `ingest/verticals/packaging/companies.ts` |
| Classifier-pass (`fetched`) | 73 | Post-`classifyJob()` only |
| US-listed (`kept`) | 49 | After `isUsOrRemote()` + dedup |
| Employers with ≥1 listing | 21 | 37% yield |
| Employers with 0 classifier-pass | 30 | 53% dark |

### Top yield today (launch wedge)

| Employer | Listed | Sector |
| --- | ---: | --- |
| Clorox | 6 | CPG |
| Thermo Fisher Scientific | 5 | Pharma |
| Conagra Brands | 4 | Food |
| General Mills, Autoliv, PepsiCo | 3 each | Food / auto |
| Menasha | 7 | Custom packaging design |

Food + household CPG have the best pass → listed ratio. Pharma passes more titles but loses more to the US gate.

---

## Three levers (priority order)

```text
Phase 1  Fix real US-location bugs          (~0–2 roles; correctness)
Phase 2  Reactivate dark wired majors      (+15–25 roles; connector/search)
Phase 3  Add net-new high-signal employers (+15–30 roles; labs + school-gap CPG)
Phase 0  Ingest analytics (parallel)       (measure every change)
```

---

## Phase 1 — US location gate audit & fixes

**Goal:** Recover classifier-pass jobs incorrectly dropped by `isUsOrRemote()` — not foreign roles we should keep dropping.

### 1.1 Audit (2026-09-02)

Re-fetched employers with `fetched > kept` on the baseline run:

| Employer | Pass | Listed | Audit result |
| --- | ---: | ---: | --- |
| **3M** | 3 | 0 | ✅ Correct drop — all 3 in Taguig, Philippines |
| **Reckitt** | 2 | 0 | ✅ Correct drop — Nottingham & Hull, GB |
| **Kenvue** | 3 | 1 | ✅ Correct drop — China + Colombia hybrid; NJ role kept |
| **Sonoco** | 1 | 0 | ✅ Correct drop — Wantage, United Kingdom |
| **GSK** | 1 | 0 | ⚠️ 0 pass on re-fetch — role likely closed; not a location bug |
| **Eastman** | 1 | 0 | 🐛 **Bug** — `Nationwide, US` not recognized as US |

**Finding:** The baseline “8 US-filter losses” were mostly **correct foreign drops**. One real bug: SuccessFactors-style locations ending in `, US` (bare `US`, not `USA` / `U.S.`).

### 1.2 Fix

- [x] Extend `US_MENTION` in `ingest/classify.ts` to treat trailing `, US` as a US country anchor (e.g. `Nationwide, US`, `Remote, US`).
- [x] Add regression tests in `ingest/classify.test.ts`.
- [x] Set `country: "USA"` on 3M Workday tenant (hygiene; current pass roles are Philippines-only).

### 1.3 Verify

```bash
npm test -- ingest/classify.test.ts
npm run ingest -- --vertical=packaging
```

**Result (2026-09-02):** 49 → **55** listed roles · 21 → **25** employers with listings.

| New / recovered | Listed |
| --- | ---: |
| Eastman | 1 (Phase 1 location fix) |
| Tyson Foods | 1 |
| Medtronic | 1 |
| Kenvue | 1 (was 0 on baseline; NJ role) |
| Church & Dwight, J.M. Smucker | 2 each (was 1) |

Foreign drops unchanged: 3M (PH), Reckitt (GB), Sonoco (UK), Kenvue (CN/CO).

---

## Phase 2 — Reactivate dark wired employers

**Goal:** Fix search/connector config on majors already in `companies.ts` with 0 classifier-pass.

### Tier A — Brand-side CPG / food (fix first)

| Employer | ATS | Action |
| --- | --- | --- |
| Kimberly-Clark | Workday | Verify site slug + search |
| Procter & Gamble | Phenom | Audit `PGBPGNGLOBAL` refineSearch |
| Mars | Phenom | Audit `MARSGLOBAL` — CSV notes Franklin TN packaging dev |
| WK Kellogg Co | Phenom | Audit `WKNWKIUS` |
| Unilever | Workday | Switch to `ENGINEER_ONLY` queries |
| Hershey, E&J Gallo | SuccessFactors | Recheck SF RSS search |
| Pfizer, Medtronic, Target, Tyson | Workday | Recheck + `country: "USA"` |
| Constellation Brands | Workday | Already wired; recheck titles |

**Expected yield:** +15–25 roles if P&G / Mars / K-C behave like Clorox.

### Tier B — Connector fixes

| Employer | Issue |
| --- | --- |
| Nestlé | SF public JSON unavailable |
| Coca-Cola | CWS org `2110` search audit |
| DuPont | Phenom 0 pass |

### Tier C — Monitor only (low wedge expectation)

Silgan, Aptar, Ball, Sealed Air, Berlin, Ernest, International Paper, Colgate (operators), GM, CHEP.

---

## Phase 3 — Add net-new employers

**Seed file:** `data/companies.csv` (25 employers not yet wired).

### Priority 1 — Packaging test labs

Smithers, TEN-E, Westpak, Packaging Compliance Labs, DDL, Gaynes, Purple Diamond, Applus+ Keystone, Modality Solutions.

- High signal, low plant noise; same talent pool as MSU / Cal Poly / Stout pipelines.
- Need ATS discovery; Smithers → UltiPro, Westpak → Rippling.

### Priority 2 — School-gap CPG (brand-side)

Amway, Altria, LiDestri, Wegmans, Wonderful Company, Driscoll's.

### Priority 3 — Automotive expansion (not homepage lead)

Ford, Adient — returnable/dunnage; watch electronics-packaging leaks.

### Deprioritize

Graphic Packaging, WestRock, Green Bay Packaging, ISOFlex, large TIC firms (Intertek, SGS, Nelson) — converter plant noise or board too broad.

---

## Phase 0 — Ingest analytics (parallel)

Ship [`docs/ingest-analytics-plan.md`](ingest-analytics-plan.md) Phase A before marketing “X scanned → Y listed” copy.

- Log `scanned`, `classifierPass`, `classifierDrops` per employer.
- Enables data-driven employer add/fix decisions.

---

## Employer selection rules

1. **Brand-side R&D** beats converter roster.
2. **Pre-screen** career site — page-one `Packaging Operator` / `Corrugator Supervisor` = low yield.
3. **Workday + `ENGINEER_QUERIES`** for CPG; **`ENGINEER_ONLY`** for converters/labs.
4. **`country: "USA"`** on global Workday tenants.
5. **Do not widen** the classifier for volume.

---

## Targets

| Milestone | Listed roles | Employers with listings |
| --- | ---: | ---: |
| Baseline | 49 | 21 |
| After Phase 1 | **55** | **25** |
| After Phase 2 | 65–75 | 28–32 |
| After Phase 3 | 80–100 | 35–40 |

---

## Changelog

| Date | Phase | Change |
| --- | --- | --- |
| 2026-09-02 | — | Plan created from Sep 2026 baseline analysis |
| 2026-09-02 | 1 | Audit: 7/8 “US losses” are correct foreign drops; fix `, US` location suffix |
| 2026-09-02 | 1 | Shipped: `US_MENTION` trailing `, US`; Eastman +1; ingest 49→55 (+ Tyson, Medtronic, Kenvue, Smucker, Church & Dwight inventory shifts) |
