# Infographic proposal — How Niche Board works

**Status:** Proposal — wireframes at [`Niche Board Infographic.dc.html`](../Niche%20Board%20Infographic.dc.html)  
**Audience:** Candidates first; employers second  
**Primary use:** LinkedIn proof post (carousel or single tall image), hub landing embed, optional PDF for university outreach  
**Voice:** [`MARKETING.md`](../MARKETING.md) · [`Niche Board Brand Guide.dc.html`](../Niche%20Board%20Brand%20Guide.dc.html)  
**Data dependency:** [`docs/ingest-analytics-plan.md`](ingest-analytics-plan.md) — Phase A required before publishing scan/drop numbers

---

## 1. Objective

Explain **how** Niche Board works in one glance — not what it is in one tagline.

The infographic should answer:

1. Where do roles come from?
2. What happens before a job appears on a board?
3. Why is the list short on purpose?
4. What does the candidate do next?

**North-star feeling:** *Edited, not aggregated.* The brand subtracts noise; the visual should show subtraction, not volume.

**Avoid:** “Thousands of jobs”, rocket ships, funnel hype, AI matching, exclamation piles, emoji.

---

## 2. Recommended format

| Format | Dimensions | Best for |
| --- | --- | --- |
| **LinkedIn carousel** (preferred) | 1080×1080 px per slide, 5–7 slides | Scroll story; one idea per frame |
| **Single tall infographic** | 1080×1920 px (4:5) or 1200×3000 px | Download / pin / university email |
| **Hub embed** | Responsive SVG or PNG sections | `nicheboardjobs.com` “How it works” |

**Recommendation:** Lead with a **6-slide LinkedIn carousel**, then export a stacked **single PNG** from the same artboards for the hub.

---

## 3. Story arc (6 frames)

```
Problem → Source → Filter funnel → Two boards → Candidate path → Proof + CTA
```

| Slide | Title | Job |
| --- | --- | --- |
| **1** | The problem | Keyword search buries narrow titles |
| **2** | The source | Employer career sites, daily |
| **3** | The filter | What we scan vs what we list |
| **4** | The boards | Packaging + Resilience, each classified |
| **5** | Your path | Browse → apply on ATS → optional alerts |
| **6** | The proof | Live numbers + CTA |

---

## 4. Slide-by-slide content

### Slide 1 — The problem

**Headline:** Your specialty has a title. General search treats it like a keyword.

**Body (short):**
- Packaging engineers see plant ops, procurement, and semiconductor “packaging.”
- BCM specialists see IT SRE, product DR, and field emergency management.

**Visual:** Split panel — left “keyword soup” (muted gray chips), right “your title” (one teal chip). No employer logos.

**Do not:** Name-call LinkedIn or Indeed.

---

### Slide 2 — The source

**Headline:** Pulled daily from employer career sites.

**Body:**
- Workday, Greenhouse, SuccessFactors, and more
- Same listings employers publish on their ATS
- Updated every ingest — not stale reposts

**Visual:** Row of abstract ATS badges (generic icons, not trademark logos) feeding into a single Niche Board mark. Navy background optional for contrast with slide 1.

**Stats (current, safe today):**

| Label | Value |
| --- | --- |
| Employer ATS feeds wired | **98** |
| ATS connector types | **13** |
| Boards live | **2** (Packaging · Resilience) |

---

### Slide 3 — The filter (hero slide)

**Headline:** We classify before we list.

**Subhead:** The value is what we leave out.

**Funnel visual (left → right, narrowing):**

```
[ Employer ATS postings scanned ]  →  [ Specialty classifier ]  →  [ US-only + dedup ]  →  [ Live roles ]
```

**Placeholder numbers (replace after ingest analytics Phase A):**

| Stage | Packaging | Resilience | Combined |
| --- | ---: | ---: | ---: |
| Scanned | `{scanned}` | `{scanned}` | `{scanned}` |
| Pass classifier | 73 | 40 | 113 |
| Listed (US) | 49 | 21 | **70** |

*Until analytics ship, use **70 live roles** and qualitative funnel only — do not invent scan totals.*

**“Noise we drop” chips (two columns):**

| Packaging | Resilience |
| --- | --- |
| Plant & warehouse ops | Generic IT / SRE |
| Semiconductor packaging | FEMA / field EM |
| Procurement & sales | Product engineering DR |
| Converting-line supervision | Manufacturing “resiliency” |

**Contrast lines (small, bottom):**
- Package development — not plant ops.
- BCM & disaster recovery — not generic IT.

**Visual style:** Mist `#F1F3F5` funnel blocks; teal `#0D7D77` for “kept”; slate `#4B5563` for dropped chips with subtle strikethrough or ×.

---

### Slide 4 — The boards

**Headline:** One board per narrow profession.

**Two cards side by side:**

| | **Packaging** | **Resilience** |
| --- | --- | --- |
| **For** | Package development & packaging engineering | Corporate BCM & IT disaster recovery |
| **Employers** | CPG, pharma, automotive brands | Finance, healthcare, regulated employers |
| **Live roles** | 49 | 21 |
| **URL** | packaging.nicheboardjobs.com | businesscontinuity.nicheboardjobs.com |

**Visual:** Board-family tint only on card labels — violet/clay as accent strips per Brand Guide; logo stays navy + teal.

**Optional employer name strip (text only, no logos):** General Mills · Clorox · Capital One · State Street — “examples on the board today.”

---

### Slide 5 — Your path (candidate)

**Headline:** Browse a list that’s already filtered.

**Three steps (horizontal):**

1. **Browse** — Filter by sector, state, remote  
2. **Apply** — On the employer’s career site (Workday, Greenhouse, …)  
3. **Alerts** — Short email digest when new roles post (optional)

**Callouts:**
- No profiles. No messaging. No fake apply wall.
- Descriptions formatted for scanning (headings, lists — not a wall of ATS HTML).

**Visual:** Simple path diagram with crop-mark nodes at step corners (brand symbol motif).

---

### Slide 6 — Proof + CTA

**Headline:** The right jobs, not all the jobs.

**Proof grid (2×2):**

| Stat | Value (Sep 2026 baseline) |
| --- | ---: |
| Live specialist roles | **70** |
| Employers with open roles | **38** |
| US states | **24** |
| Remote / hybrid flagged | **20** |

**Future slot (after weekly snapshots):** “**{added}** new roles this week”

**CTA:** nicheboardjobs.com  
**Secondary:** Browse Packaging · Browse Resilience

**Footer:** Precision job boards for specialists.

---

## 5. Alternate single-page layout (tall infographic)

If one image instead of carousel, stack vertically:

1. Header — logo + tagline (navy band)
2. Problem strip (one line + two contrast examples)
3. **Centerpiece funnel** (60% of visual weight)
4. Two board cards
5. Candidate 3-step path
6. Proof stats bar
7. CTA + URL

**Aspect ratio:** 2:3 (1080×1620) for mobile LinkedIn; export @2× for crispness.

---

## 6. Visual system

### Colors (Brand Guide v1)

| Token | Hex | Use |
| --- | --- | --- |
| Navy | `#0D1B2A` | Headlines, header band |
| Teal | `#0D7D77` | Links, “kept” funnel, accents |
| Mist | `#F1F3F5` | Card backgrounds |
| Slate | `#4B5563` | Body, dropped-noise chips |
| Amber | `#F5A623` | Employer CTA only — **omit** on candidate infographic |
| Violet / Clay | `#6A5FA9` / `#A85C57` | Board-family label tints only |

### Typography

| Role | Font |
| --- | --- |
| Headlines | Archivo 600 |
| Body | Archivo 400–500 |
| Stats / kicker | IBM Plex Mono 11px, letter-spacing 0.14em, uppercase |
| Tagline (optional) | Newsreader italic |

### Iconography

- Use **crop-mark symbol** (navy L + teal corner) as funnel nodes — not generic filter icons.
- ATS sources: simple rectangles with monospace labels (`WORKDAY`, `GH`) — no official logos without legal review.
- Dropped noise: gray chips with × — never ridicule employers.

### Layout rules

- Generous whitespace; max 3 text blocks per slide.
- Numbers large (48–64px); labels small (mono kicker).
- No stats strip in hero style (per Packaging board layout rules) — stats live in proof slide only.

---

## 7. Copy bank (approved phrases)

Use verbatim where possible:

- *The right jobs, not all the jobs.*
- *Precision job boards for specialists.*
- *One board per narrow professional slice.*
- *Updated daily from employer career sites.*
- *You apply on the company's ATS — never through us.*
- *Package development — not plant ops.*
- *BCM & disaster recovery — not generic IT.*
- *We classify before we list.*
- *The value is what we leave out.*

**Banned:** dream job, passion, disrupt, AI-powered, #1, thousands of jobs, free alerts (as headline).

---

## 8. Data & publishing gates

### Safe to publish today (1 Sep 2026 ingest)

- 98 employer feeds · 13 ATS types · 2 boards
- 70 live roles · 38 employers · 24 states · 20 remote/hybrid
- 49 Packaging / 21 Resilience roles
- Qualitative noise categories (no percentages until analytics)

### Publish only after [`ingest-analytics-plan.md`](ingest-analytics-plan.md) Phase A

- `{scanned}` totals per vertical
- Funnel shrink % (scanned → listed)
- Top 5 drop reasons with counts

### Publish only after Phase C

- “{n} roles added this week”

**Footnote on infographic (small):** “Stats from daily ingest, {date}.”

---

## 9. Distribution plan

| Channel | Asset | Notes |
| --- | --- | --- |
| **LinkedIn** | 6-slide carousel | Slide 3 = link to hub; pin as featured post after education phase |
| **Hub** | `/how-it-works` section or expandable below hero | Same art, HTML sections for accessibility |
| **Packaging / Resilience boards** | Cropped slide 4 card + slide 5 path | Vertical-specific CTA |
| **University outreach** | PDF export | Pair with campus-recruiting post (Sep 23 in rollout) |
| **Employer** | Separate cut (future) | Slide on pin mechanic — not this candidate infographic |

**Post copy (carousel intro):**

> Ever wonder what happens before a role shows up on a specialty board?
>
> We pull from employer career sites daily, classify titles most job boards keep, and list only US roles in your discipline. The right jobs, not all the jobs.
>
> Swipe through how Niche Board works →

**Hashtags (below post):** `#NicheBoard` `#PackagingEngineering` `#BusinessContinuity`

---

## 10. Production checklist

### Design

- [x] Wireframe 6 slides in `.dc.html` mock — [`Niche Board Infographic.dc.html`](../Niche%20Board%20Infographic.dc.html) (1080×1080 per slide)
- [ ] High-fidelity pass in Figma (or refine `.dc.html` to production)
- [ ] Brand review — navy/teal only in logo; amber absent
- [ ] Accessibility — 4.5:1 contrast on body text; don’t rely on color alone for drop vs keep
- [ ] Export PNG @2× + PDF

### Content

- [ ] Run [`SOCIAL_MEDIA_PLAN.md`](../SOCIAL_MEDIA_PLAN.md) §12 pre-publish checklist
- [ ] Replace funnel placeholders with `node scripts/export-ingest-stats.mjs` output
- [ ] Date-stamp proof slide
- [ ] Legal pass on employer names (text-only fair use)

### Engineering (optional embed)

- [ ] Hub static section — no layout shift vs [`Niche Board Site.dc.html`](../Niche%20Board%20Site.dc.html)
- [ ] Lazy-load infographic PNG on hub

---

## 11. Out of scope for v1

- Animated video / motion graphic
- Employer pin pricing on candidate infographic
- Comparison table vs LinkedIn/Indeed by name
- Candidate counts, apply rates, or invented efficiency multipliers (“save 10 hours”)
- Kraft skin / packaging vertical aesthetic on hub infographic (hub uses Brand Guide v1)

---

## 12. Success metrics

| Signal | Target |
| --- | --- |
| Carousel completion rate | Benchmark after 2 weeks |
| Hub clicks from slide 6 | Track UTM `?utm_source=linkedin&utm_medium=infographic` |
| Comments | “didn’t know you filtered this much” / “how do I get alerts” |
| Saves | High save rate = reference asset |

---

## 13. Next steps

1. **Approve** story arc and slide outline (this doc).
2. **Implement** ingest analytics Phase A — unlock real funnel numbers.
3. **Wireframe** slides 1–6 in Figma.
4. **Populate** stats from export script; legal review employer names.
5. **Publish** as LinkedIn carousel during rollout Week 3–4 (after education posts establish context).
6. **Embed** on hub `/how-it-works` or homepage below fold.

---

## Changelog

| Date | Note |
| --- | --- |
| 2026-09-02 | Initial proposal |
