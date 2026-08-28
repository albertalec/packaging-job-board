# LinkedIn content plan — Grok + X drafts

**Goal:** Relatable posts that help specialists and hiring managers *understand what Niche Board is* — not generic job spam.

**Tone:** friendly but not eager · trustworthy · lightly fun  
**Canonical voice:** [`MARKETING.md`](MARKETING.md) · [`SOCIAL_MEDIA_PLAN.md`](SOCIAL_MEDIA_PLAN.md)  
**Tooling:** X recent search → Grok draft → **manual** LinkedIn publish

---

## 1. What we’re trying to teach

Every post should help someone grasp at least one of these ideas:

| Idea | Plain-language hook |
| --- | --- |
| **Specialty, not keyword soup** | Your title exists on LinkedIn — buried under plant ops, procurement, and “packaging” that isn’t yours. |
| **We classify, not aggregate** | One board per narrow slice; noise is dropped before it hits the feed. |
| **Fresh from the ATS** | Listings come from employer career sites daily — not stale reposts. |
| **Apply on the real job** | No fake apply wall; you finish on Workday / Greenhouse / etc. |
| **Employers pin what they already have** | No second posting workflow — pin a live listing to reach the niche. |
| **Network story** | Niche Board builds one precision board per specialty; Packaging is live, more niches coming. |

**Relatable framing:** Start from a moment people recognize (search fatigue, wrong-title noise, “is this even package dev?”) then land one proof + one CTA.

---

## 2. Two content lanes

### Lane A — **New job highlights** (board-led)

**Purpose:** Show the board is alive; prove classification and apply-out.

| When | After daily ingest or when a strong role appears |
| **Source** | `data/{vertical}/jobs.json` — freshest on-wedge roles |
| **Grok `postType`** | `fresh-role` |
| **Lead with** | Title + employer + why it’s on *this* board |
| **Avoid** | “50 new jobs!” dumps; roles already posted this week |

**Structure:**

1. Hook — “New on Packaging: …” or “If you’re a packaging engineer at a CPG brand…”
2. Role — title, employer, location/remote if relevant
3. Contrast or proof — “Package development — not plant ops.” / “Apply on their career site.”
4. CTA — job URL (OG preview) or board browse

**Cadence:** 1–2 per week when inventory warrants (Packaging launch wedge).

```bash
npm run social:linkedin-draft -- --vertical=packaging --postType=fresh-role --dry-run
```

---

### Lane B — **Industry pulse** (X-led)

**Purpose:** Join timely conversation; explain *why a specialty board exists* in context of what people are already talking about.

| When | 1–2× per week, independent of ingest |
| **Source** | X recent search (vertical queries in `src/lib/social/x.ts`) |
| **Grok `postType`** | `current-events` (default), or `contrast` / `proof` for education-only |
| **Lead with** | Trend or observation (hiring chatter, sustainability, regs, layoffs/hiring waves) |
| **Avoid** | Quoting tweets verbatim, @mentions, hot takes, politics |

**Structure:**

1. Relatable opener — what specialists are seeing / discussing (from X themes, not a quote)
2. Bridge — “That’s why keyword search is brutal for narrow titles…”
3. Contrast + proof — specialty board, daily ATS, classified titles
4. CTA — browse board or get alerts (not both)

**Themes to watch on X (Packaging):**

- CPG / brand hiring for R&D packaging
- Sustainable packaging, PFAS, recyclability regs
- “Packaging engineer” vs plant / converting confusion
- Campus / co-op packaging roles
- Supply chain news that affects package dev hiring

**Themes to watch (Business Continuity):**

- BCM program builds, DR testing, regulatory pressure
- “Resilience” vs IT/SRE/product noise
- Finance / healthcare continuity hiring

```bash
npm run social:linkedin-draft -- --vertical=packaging --postType=current-events --dry-run
npm run social:linkedin-draft -- --vertical=businesscontinuity --postType=current-events --dry-run
```

---

## 3. Weekly mix (Packaging — launch)

Target **2–3 LinkedIn posts per week** total. Rotate lanes so followers see both *roles* and *why the board exists*.

| Week rhythm | Lane | `postType` | Example angle |
| --- | --- | --- | --- |
| **Mon or Tue** | B — Industry pulse | `current-events` | X trend → “specialists get lost in keyword search” |
| **Thu** | A — Job highlight | `fresh-role` | One strong new role + apply-out |
| **Optional Sat** | B or education | `contrast` or `proof` | Contrast line only, or “updated daily from ATS” |

**Ratio:** ~40% job highlights · ~60% trend/education (until audience knows the product; then adjust).

**Employer posts** (`employer`) — max **1 per month** unless inbound sponsor push; don’t crowd candidate feed.

**Hub / network** (`contrast` on hub copy) — when a second vertical ships or hub milestone; not weekly filler.

---

## 4. Post archetypes → Grok types

| Archetype | Audience | `postType` | Primary CTA |
| --- | --- | --- | --- |
| **Fresh role share** | Candidates | `fresh-role` | `/jobs/{id}` |
| **Trend bridge** | Candidates | `current-events` | Board home |
| **Contrast / specialty** | Candidates | `contrast` | Board home |
| **How it works** | Candidates | `proof` | Board or alerts |
| **Pin your listing** | Employers | `employer` | `/sponsor` |
| **Network / hub** | Both | `contrast` | `nicheboardjobs.com` |

Map every draft to ≥1 pillar from [`SOCIAL_MEDIA_PLAN.md` §8](SOCIAL_MEDIA_PLAN.md#8-content-pillars-map-every-post-to-1).

---

## 5. Relatable hooks (Grok should lean on these)

Use **one** per post — don’t stack.

**Candidate — search pain**

- “You search ‘packaging engineer’ and half the results are plant ops.”
- “Your title is right there on LinkedIn — mixed in with procurement and converting.”
- “You don’t need another profile. You need a list that’s already filtered.”

**Candidate — apply trust**

- “The listing is real — you apply on the company’s career site, not through us.”
- “No ‘easy apply’ middleman. Same Workday link the employer posted.”

**Candidate — freshness**

- “Stale reposts are the worst part of job search. We pull from employer ATS feeds daily.”

**Employer — precision**

- “You already posted on Greenhouse. Pin that same listing where packaging engineers browse.”
- “You’re not buying ‘traffic.’ You’re buying a niche audience keyword search buries.”

**Trend bridge (Lane B)**

- “Lots of chatter about [theme] this week. Narrow titles still get buried in general search.”
- “When [industry] hiring picks up, specialists still have to filter the noise by hand — unless the board already did.”

---

## 6. Production workflow

### Deliver (no local CLI required)

LinkedIn drafts are **emailed** via Resend when `SOCIAL_DRAFT_TO_EMAIL` is set (your personal inbox).

| Schedule | Lane | Trigger |
| --- | --- | --- |
| **Tue 15:00 UTC** | B — Industry pulse | Vercel cron → `/api/social/linkedin-digest?cronDayOnly=true` |
| **Thu 15:00 UTC** | A — Job highlight | Same cron path (day picks `fresh-role`) |
| **After ingest** | A — Job highlight | GitHub Action → `SOCIAL_LINKEDIN_DIGEST_URL` + `postType=fresh-role` |

**Manual test email:**

```bash
curl -X POST -H "Authorization: Bearer $ALERTS_CRON_SECRET" \
  "https://packaging.nicheboardjobs.com/api/social/linkedin-digest?vertical=packaging&postType=current-events"
```

Email includes copy-paste draft text, optional job link, and X theme notes (not for quoting).

### Generate (optional local CLI)

1. **Job lane** — run after ingest when listings changed, or pick manually from board.
2. **Trend lane** — run 1–2× weekly; X supplies recent posts; Grok synthesizes theme.
3. Use `--dry-run` until draft is approved; omit to save to `data/social/{vertical}.json` (or Redis in prod).

```bash
# Trend-led draft
npm run social:linkedin-draft -- --vertical=packaging --postType=current-events --dry-run

# Job-led draft
npm run social:linkedin-draft -- --vertical=packaging --postType=fresh-role --dry-run

# Education-only (no job anchor required)
npm run social:linkedin-draft -- --vertical=packaging --postType=contrast --dry-run
```

**Production API** (same auth as alert digest):

```bash
curl -X POST -H "Authorization: Bearer $ALERTS_CRON_SECRET" \
  "https://packaging.nicheboardjobs.com/api/social/linkedin-draft?vertical=packaging&postType=fresh-role&dryRun=true"
```

### Review (required)

Run [`SOCIAL_MEDIA_PLAN.md` §12](SOCIAL_MEDIA_PLAN.md#12-quality-bar-pre-publish-checklist) checklist:

- Relatable, not salesy
- One pillar + one CTA
- Packaging: contrast line present
- Facts only (title, employer, price) — no invented metrics
- No tweet quotes or @mentions
- Canonical URLs

**Edit Grok output** freely — drafts are starting points.

### Publish

1. Post manually on LinkedIn (company page or vertical voice).
2. Job shares: use **job URL** for OG preview.
3. Log qualitatively: which lane, which pillar, any inbound.

### Automate (email delivery)

| Trigger | Action |
| --- | --- |
| **Tue 15:00 UTC** | Vercel cron → industry pulse email (`current-events`) |
| **Thu 15:00 UTC** | Vercel cron → job highlight email (`fresh-role`) |
| **Ingest commit** (listings changed) | GitHub Action → job highlight email |
| Human | Review email → post on LinkedIn |

Nothing auto-posts to LinkedIn without human approval.

---

## 7. Lane-specific rules

### Job highlights (Lane A)

- **One role per post** — never a list.
- Prefer **on-wedge** titles (package dev, not procurement/converting).
- Prefer **recognizable employers** when possible.
- Say **apply on their career site** — not “apply on Niche Board.”
- Don’t repost the same `jobId` within 30 days (store tracks `usedJobIds`).

### Industry pulse (Lane B)

- **Theme, not quote** — summarize what X is discussing; never paste tweet text.
- **No @mentions** — avoids awkward engagement and ToS noise.
- Tie trend to **classification** or **search pain** — not generic career advice.
- If X search is empty or off-topic, switch to `contrast` or `proof` instead of forcing a trend.
- Don’t repost the same X tweet id within 30 days (store tracks `usedXTweetIds`).

---

## 8. Sample calendar (Packaging — week 1)

| Day | Lane | Draft focus |
| --- | --- | --- |
| Tue | B | X: CPG hiring chatter → “package dev vs plant ops” + browse CTA |
| Thu | A | Fresh role: Senior Packaging Engineer at [brand] → job link |
| Optional | B | `proof`: daily ATS ingest, short digest alerts |

---

## 9. Success signals

Same as [`SOCIAL_MEDIA_PLAN.md` §13](SOCIAL_MEDIA_PLAN.md#13-success-signals-social):

- Clicks to job pages and alert signups from LinkedIn
- Comments/DMs: “finally the right titles” / “didn’t know this existed”
- Employer inbound citing a post

**Per lane:**

| Lane | Good signal |
| --- | --- |
| A — Jobs | Applies on employer ATS; saves/shares on role posts |
| B — Trends | Comments on the *problem* (search noise), not just likes |

---

## 10. Brand tone + hashtags (draft email)

Drafts follow [`MARKETING.md`](MARKETING.md) §4–5 via `src/lib/social/voice.ts` and Grok system prompts.

**Post body:** contrast + proof + CTA. No hashtags inside the copy — LinkedIn reach tags are separate.

**Suggested hashtags** (3–5, in digest email below the post):

| Vertical | Specialty tags (examples) | Avoid |
| --- | --- | --- |
| Packaging | `#PackagingEngineering` `#PackageDevelopment` `#CPGJobs` `#PackagingJobs` | `#Hiring` `#JobSearch` `#DreamJob` |
| Resilience | `#BusinessContinuity` `#BCM` `#DisasterRecovery` `#OperationalResilience` | Generic recruitment spam |

Use `#NicheBoard` at most once when the post mentions the network. Paste hashtags **below** the post on LinkedIn — not in the opening line.

Tone warnings (banned words, missing contrast, inline hashtags) appear in the email **Notes** section when Grok drifts off voice.

---

## 11. Prompt evolution (backlog)

Improve Grok prompts in `src/lib/social/grok.ts` when drafts repeatedly miss the mark:

- [ ] Lane-specific user prompts (`fresh-role` vs `current-events` instructions)
- [ ] Explicit “relatable opener” requirement for Lane B
- [ ] `employer` / `proof` templates with fixed CTA lines from `config/*.ts`
- [ ] Optional second job in digest-style post (still max 2, never 10)

---

## Quick reference

| Intent | Command |
| --- | --- |
| Trend / X-led post | `--postType=current-events` |
| New job post | `--postType=fresh-role` |
| Contrast education | `--postType=contrast` |
| Freshness / ATS proof | `--postType=proof` |
| Employer pin | `--postType=employer` |
| Preview without saving | `--dry-run` |

**Env:** `XAI_API_KEY`, `X_BEARER_TOKEN`, `GROK_MODEL`, `SOCIAL_DRAFT_TO_EMAIL` — see `.env.example` and [`SOCIAL_MEDIA_PLAN.md` §15](SOCIAL_MEDIA_PLAN.md#15-linkedin-drafts--x--grok-current-events).

---

*Update when verticals launch, pricing changes, or lane mix shifts. Clone Lane B themes per vertical; keep Niche Board network lines on hub posts.*
