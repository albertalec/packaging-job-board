# Ingest analytics plan

**Purpose:** Collect defensible metrics for marketing, LinkedIn proof posts, and a future “what’s behind the board” infographic — without inventing numbers.

**Context:** Baseline stats brief (Sep 2026) showed we can cite connected employers and live role counts today, but **cannot** yet claim “X postings scanned → Y listed” or “top noise types dropped” because ingest does not log pre-classifier hits or classifier rejection reasons.

**Consumers:**
- Social / infographic copy ([`SOCIAL_ROLLOUT_PLAN.md`](../SOCIAL_ROLLOUT_PLAN.md) proof posts)
- Infographic creative brief ([`docs/infographic-niche-board-proposal.md`](infographic-niche-board-proposal.md))
- Optional board UI (“last updated”, “roles added this week”) — out of scope unless explicitly requested later

---

## Goals

| # | Capability | Enables |
| --- | --- | --- |
| 1 | **Raw ATS hit count** per employer before `toJob()` | “12,400 postings scanned → 70 listed” funnel |
| 2 | **Classifier reason counts** | “Top noise dropped: plant ops, SRE resilience, FEMA field EM…” chart |
| 3 | **Weekly snapshots** | “14 roles added this week” from real diffs, not guesses |

---

## Current state

### What we log today (`ingest/run.ts` → `reports[]` in `data/{vertical}/jobs.json`)

```ts
type SourceReport = {
  company: string;
  ats: string;
  fetched: number;  // jobs returned by connector AFTER classifier
  kept: number;       // after isUsOrRemote + dedup
  error?: string;
};
```

- `fetched` is **not** raw ATS search volume — connectors call `toJob()` and drop nulls before returning.
- Classifier rejections are silent (return `null` from `toJob()`).
- `ingestedAt` + `total` exist on the jobs payload but are overwritten each run; no history.

### Baseline (1 Sep 2026 ingest)

| Vertical | Employers wired | Classifier-pass | Listed | Employers with 0 classifier-pass |
| --- | ---: | ---: | ---: | ---: |
| Packaging | 57 | 73 | 49 | 29 (51%) |
| Resilience | 42 | 40 | 21 | 14 (33%) |

---

## Workstream 1 — Raw ATS hit counts

### Objective

Count every posting seen from an employer ATS **before** classification, per company and per daily ingest.

### Design

**New counters per employer ingest:**

| Field | Meaning |
| --- | --- |
| `scanned` | Unique postings seen from ATS search/API (title + sourceId) |
| `classifierPass` | Postings where `toJob()` returned non-null (rename today’s `fetched`) |
| `kept` | After `isUsOrRemote()` + board-level dedup (unchanged) |

**Optional per-search breakdown** (Workday/Phenom run multiple `searchText` queries):

```ts
searchHits?: { query: string; scanned: number }[];
```

### Implementation tasks

- [ ] **1.1** Add `IngestStats` helper in `ingest/stats.ts`:
  - `recordScan(sourceId)` — dedupe within employer run
  - `recordClassifierResult(verdict: { keep: boolean; reason: string })`
  - `summary()` → `{ scanned, classifierPass, classifierDrops: Record<reason, number> }`
- [ ] **1.2** Extend `classifyJob` / `classifyBusinessContinuityJob` callers to expose verdict without duplicating logic — prefer a shared `classifyJobWithReason()` used by `toJob()` (no behavior change).
- [ ] **1.3** Update **each connector** to increment `scanned` when a posting is first seen, **before** `toJob()`:
  - [ ] `ingest/sources/workday.ts` (highest volume; counts both preview + final pass as one scan per `sourceId`)
  - [ ] `ingest/sources/greenhouse.ts`
  - [ ] `ingest/sources/successfactors.ts`
  - [ ] `ingest/sources/phenom.ts`
  - [ ] Remaining connectors (lever, ashby, oracle, ultipro, teamtailor, smartrecruiters, cws, jibe, amazon)
- [ ] **1.4** Change connector return type to `{ jobs: NormalizedJob[]; stats: EmployerIngestStats }` or pass a mutable `stats` object into connectors (less churn).
- [ ] **1.5** Extend `SourceReport` in `ingest/run.ts`:

```ts
export type SourceReport = {
  company: string;
  ats: string;
  scanned: number;
  classifierPass: number;
  kept: number;
  classifierDrops?: Record<string, number>;
  error?: string;
};
```

- [ ] **1.6** Add rollup on jobs payload:

```ts
stats: {
  scanned: number;
  classifierPass: number;
  kept: number;
  classifierDrops: Record<string, number>;
}
```

- [ ] **1.7** Tests: unit test `IngestStats` dedupe; fixture test that a rejected title increments `scanned` but not `classifierPass`.

### Acceptance criteria

- After one packaging ingest, `reports[i].scanned >= reports[i].classifierPass` for every employer.
- Sum of `scanned` across reports matches total unique ATS postings touched.
- Existing `kept` / job list behavior unchanged.

### Infographic copy unlocked

> “Last ingest scanned **{scanned}** employer postings → **{kept}** specialist roles listed.”

---

## Workstream 2 — Classifier reason counts

### Objective

Aggregate **why** postings were dropped, rolled up per employer and per vertical.

### Design

**Reason strings** already exist on classifier verdicts, e.g.:

| Packaging (`classify.ts`) | Resilience (`classify-businesscontinuity.ts`) |
| --- | --- |
| `semiconductor/electronics packaging` | `field/FEMA disaster response` |
| `warehouse/ops title` | `product/SRE resilience noise` |
| `off-target function` | `generic IT title` |
| `not a packaging role` | `BCP acronym (business cards/payments)` |
| … | … |

**Rollup buckets for charts** (map raw reasons → display labels):

```ts
const PACKAGING_DROP_LABELS: Record<string, string> = {
  "warehouse/ops title": "Plant & warehouse ops",
  "semiconductor/electronics packaging": "Semiconductor packaging",
  "off-target function": "Procurement & sales",
  // ...
};
```

Keep raw `reason` in JSON; map to friendly labels only in export/social scripts.

### Implementation tasks

- [ ] **2.1** Refactor `toJob()` in `ingest/classify.ts` and `ingest/classify-businesscontinuity.ts` to call `classify*WithReason()` and record drops in passed-in `IngestStats`.
- [ ] **2.2** Count drops on **both** Workday passes when title-only preview fails vs full-JD failure (same `sourceId` → one scan, one drop reason — use final failure reason or first failure).
- [ ] **2.3** Add `classifierDrops` to per-employer `SourceReport` and vertical rollup `stats.classifierDrops`.
- [ ] **2.4** Script `scripts/export-ingest-stats.mjs`:
  - Reads `data/{vertical}/jobs.json`
  - Prints top 10 drop reasons with counts and %
  - Outputs JSON for infographic tooling
- [ ] **2.5** Tests: assert known fixtures increment expected reason keys (reuse cases from `ingest/classify.test.ts` / `classify-businesscontinuity.test.ts`).

### Acceptance criteria

- `stats.classifierDrops` sums to `scanned - classifierPass` (± dedupe edge cases documented).
- Top reasons are human-readable and match classifier code comments.
- No PII in reason keys (titles are not logged in drop counts).

### Infographic copy unlocked

> “Noise we drop: **{topReason}** ({pct}%), **{secondReason}** ({pct}%), …”

---

## Workstream 3 — Weekly snapshots

### Objective

Persist ingest history so we can say “roles added this week” and show trend lines without scraping git history.

### Design

**Snapshot file per vertical:** `data/{vertical}/snapshots.json`

```ts
type IngestSnapshot = {
  ingestedAt: string;       // ISO timestamp
  scanned: number;
  classifierPass: number;
  listed: number;           // jobs on board after ingest
  employersWired: number;
  employersWithRoles: number;
  classifierDrops: Record<string, number>;
  newJobIds?: string[];     // vs previous snapshot
  removedJobIds?: string[];
};

type SnapshotHistory = {
  latest: string;             // ingestedAt of newest entry
  snapshots: IngestSnapshot[]; // newest first, cap 52 (1 year weekly) or 90 daily
};
```

**When to write:** end of `runIngest()` after jobs.json is written.

**Diff logic:**

- `newJobIds` = job ids in current run not in previous snapshot’s job id set
- `removedJobIds` = ids that dropped off (optional for copy; useful internally)

**Retention:** Keep last **52** snapshots (weekly cadence) or **90** if daily ingest — prune oldest on append.

### Implementation tasks

- [ ] **3.1** Add `ingest/snapshots.ts` — `appendSnapshot(verticalId, payload, jobIds)` read/modify/write `data/{vertical}/snapshots.json`.
- [ ] **3.2** Call from `runIngest()` after successful write.
- [ ] **3.3** Add `getWeeklyDelta(verticalId)` → `{ added, removed, listed, ingestedAt }` for social scripts.
- [ ] **3.4** Extend `scripts/export-ingest-stats.mjs` (or `scripts/social-ingest-stats.mjs`) to print weekly delta for copy-paste into LinkedIn drafts.
- [ ] **3.5** Commit snapshot files to repo (ingest workflow already commits `jobs.json`) — document in `ingest/README.md`.
- [ ] **3.6** Tests: snapshot append, prune, diff with fixture job id sets.

### Acceptance criteria

- After two consecutive ingests, `newJobIds` reflects actual additions only.
- Snapshot write failure does not fail ingest (log + continue).
- Social script can output: “**{added}** new roles since last week” with zero manual counting.

### Infographic / post copy unlocked

> “**{added}** new specialist roles this week · **{listed}** live now · Updated daily”

---

## Suggested implementation order

| Phase | Workstreams | Outcome |
| --- | --- | --- |
| **A** | 1.1–1.5, 2.1–2.3 (Workday + Greenhouse first) | Accurate scanned/pass/drop for majority of employers |
| **B** | 1.3 remaining connectors, 1.6–1.7, 2.4–2.5 | Full vertical rollups + export script |
| **C** | 3.1–3.6 | Weekly deltas; first snapshot after one deploy |

**Do not** publish scanned/drop stats in LinkedIn until Phase A has run at least one full production ingest and numbers are sanity-checked.

---

## Files to touch (checklist)

| File | Change |
| --- | --- |
| `ingest/stats.ts` | **New** — counters + dedupe |
| `ingest/classify.ts` | Expose reason recording hook |
| `ingest/classify-businesscontinuity.ts` | Same |
| `ingest/run.ts` | Extended `SourceReport`, rollup `stats`, call snapshot |
| `ingest/snapshots.ts` | **New** — history + diff |
| `ingest/sources/*.ts` | Scan counting before `toJob()` |
| `ingest/types.ts` | Shared types if needed |
| `scripts/export-ingest-stats.mjs` | **New** — CLI for social/infographic |
| `data/{vertical}/snapshots.json` | **New** — committed by ingest |
| `ingest/README.md` | Document stats fields |
| `ingest/classify.test.ts` | Stats + reason assertions |

---

## Validation before marketing use

Run after first ingest with logging enabled:

```bash
npm run ingest -- --vertical=packaging
npm run ingest -- --vertical=businesscontinuity
node scripts/export-ingest-stats.mjs
```

**Sanity checks:**

1. `scanned >= classifierPass >= kept` at every level.
2. `classifierDrops` reasons ⊆ known classifier reason strings.
3. Employers with `classifierPass === 0` still have `scanned > 0` when ATS returned off-target titles (proves funnel is real).
4. Weekly `added` count matches manual spot-check of new job cards on board.

---

## Out of scope (for now)

- Dashboard UI for stats
- Redis / external analytics store (JSON files are enough until volume demands otherwise)
- Candidate-facing “noise filtered” counter on homepage (needs design review per layout stability rules)
- Logging individual job titles for drops (privacy + size; reason counts only)

---

## Changelog

| Date | Note |
| --- | --- |
| 2026-09-02 | Plan created from infographic stats brief |
