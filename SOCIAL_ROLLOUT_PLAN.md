# Niche Board — LinkedIn rollout schedule

**Anchor:** first post (Niche Board introduction) publishes **Wednesday, 2 September 2026**.  
**Canonical voice:** [`MARKETING.md`](MARKETING.md) · [`SOCIAL_MEDIA_PLAN.md`](SOCIAL_MEDIA_PLAN.md) · [`SOCIAL_LINKEDIN_GROK_PLAN.md`](SOCIAL_LINKEDIN_GROK_PLAN.md)

---

## Posting rules

### Frequency

| Phase | Dates | Posts / week | Notes |
| --- | --- | --- | --- |
| **Launch education** | 2 Sep – 25 Sep 2026 | **2** (Tue + Thu) | Explain both boards before job features |
| **Transition** | 30 Sep – 9 Oct 2026 | **2** | Last education posts + first job features |
| **Steady state** | 14 Oct 2026 onward | **2** | ~50% job features · ~50% education / proof |

**Why 2×/week:** New LinkedIn company pages perform best with consistent, low-volume posting. More than 3×/week risks feed fatigue and trains the audience to ignore posts. Stay at 2×/week unless a specific role or milestone warrants a one-off third post (max once per month).

**No weekend posts** during rollout — packaging and BCM audiences are B2B; Tue–Thu capture commute and mid-week scroll time.

### Time of day

**Publish at 10:00 AM US Eastern** (primary audience: US packaging engineers and BCM specialists).

| Season | Eastern | UTC |
| --- | --- | --- |
| Daylight saving (Mar–Nov) | 10:00 AM EDT | **15:00 UTC** |
| Standard time (Nov–Mar) | 10:00 AM EST | **14:00 UTC** |

**Why 10:00 AM ET:** Morning slot after inbox triage, before deep-work blocks. Stronger for career content than lunch or evening slots on LinkedIn. Aligns with existing Vercel draft cron (Tue/Thu 15:00 UTC) so Grok drafts arrive ~same day before manual publish.

**Optional secondary window:** 12:00 PM ET (17:00 UTC EDT) only if 10:00 AM slot is missed — do not double-post the same day.

### Days

| Day | Use |
| --- | --- |
| **Tuesday** | Education, audience, or Resilience-led posts |
| **Thursday** | Education, Packaging-led posts, or job features (from 2 Oct) |
| **Wednesday** | Kickoff only (2 Sep hub intro) — not part of steady rhythm |

Alternate **Packaging** and **Resilience** so neither board goes more than two weeks without a post.

### Every post

- **Formula:** Contrast + one proof + one CTA
- **One CTA only:** browse board · get alerts · job URL · sponsor
- **Hashtags:** 3–5 tags pasted *below* the post body (see [`SOCIAL_MEDIA_PLAN.md` §10](SOCIAL_MEDIA_PLAN.md))
- **Job features:** one role, one employer, OG link, “apply on their career site”
- **Pre-publish:** [`SOCIAL_MEDIA_PLAN.md` §12](SOCIAL_MEDIA_PLAN.md) checklist

| Board | Contrast line | URL |
| --- | --- | --- |
| **Packaging** | Package development — not plant ops. | packaging.nicheboardjobs.com |
| **Resilience** | BCM & disaster recovery — not generic IT. | businesscontinuity.nicheboardjobs.com |
| **Hub** | The right jobs, not all the jobs. | nicheboardjobs.com |

---

## Phase 1 — Explain the solution (2 Sep – 25 Sep)

Teach classification, freshness, and apply-out on **both** boards before job shares.

| Date | Day | Time (ET) | Board | `postType` | Topic | Draft source |
| --- | --- | --- | --- | --- | --- | --- |
| **2 Sep 2026** | Wed | 10:00 AM | **Hub** | `network` | **Niche Board introduction** — precision boards for specialists; Packaging + Resilience live | Hub About block, [`SOCIAL_MEDIA_PLAN.md` §7](SOCIAL_MEDIA_PLAN.md) |
| **4 Sep** | Thu | 10:00 AM | Packaging | `proof` | **How we curate roles** — daily ATS, classification, drop plant ops / procurement noise | Rollout draft (curation example) |
| **9 Sep** | Tue | 10:00 AM | Resilience | `contrast` | Why a specialty board exists — BCM/DR vs IT SRE / field EM | Rollout Resilience stub (Week 1 Sat) |
| **11 Sep** | Thu | 10:00 AM | Packaging | `proof` | Apply on the real listing — no middleman, employer career site | Rollout stub (Week 2 Tue) |
| **16 Sep** | Tue | 10:00 AM | Resilience | `proof` | **How we curate roles** — BCM classifier, finance/healthcare employers | Rollout Resilience curation stub |
| **18 Sep** | Thu | 10:00 AM | Hub | `proof` | Two boards, one model — classified daily, apply on ATS, alerts | Network proof post |
| **23 Sep** | Tue | 10:00 AM | Packaging | `audience` | **Recent grads** — roles near MSU, Clemson, RIT; campus recruiting & internships | Rollout draft (grad example) |
| **25 Sep** | Thu | 10:00 AM | Resilience | `audience` | Specialist search pain — narrow titles buried in “risk” keyword soup | Rollout Resilience audience stub |

---

## Phase 2 — Mix in job features (30 Sep onward)

**Ratio shift:** from 30 Sep, at least one post per week is a `fresh-role` share until steady state (~50% jobs).

| Date | Day | Time (ET) | Board | `postType` | Topic | Suggested role |
| --- | --- | --- | --- | --- | --- | --- |
| **30 Sep** | Tue | 10:00 AM | Packaging | `contrast` | Contrast line standalone — short education capstone | — |
| **2 Oct** | Thu | 10:00 AM | Packaging | `fresh-role` | Campus recruiting at a CPG brand | General Mills — *R&D Packaging Engineer - Campus Recruiting* |
| **7 Oct** | Tue | 10:00 AM | Resilience | `fresh-role` | BCM at a regulated finance employer | Capital One — *Principal Risk Associate - Business Continuity Management* |
| **9 Oct** | Thu | 10:00 AM | Packaging | `fresh-role` | Recent grad pipeline (callback to 23 Sep post) | Clorox — *R&D Packaging Scientist 1 (Recent Grad Starting in 2026)* |
| **14 Oct** | Tue | 10:00 AM | Resilience | `fresh-role` | Finance operational resilience | State Street — *Enterprise Resiliency Office, Vice President* |
| **16 Oct** | Thu | 10:00 AM | Packaging | `fresh-role` | Internship season | General Mills — *Internship - R&D Packaging Engineer* |
| **21 Oct** | Tue | 10:00 AM | Resilience | `fresh-role` | DR specialist, regulated employer | MSU Federal Credit Union — *Disaster Recovery Specialist* |
| **23 Oct** | Thu | 10:00 AM | Packaging | `fresh-role` | Materials / R&D at brand employer | Clorox — *Packaging Materials Senior Engineer* |
| **28 Oct** | Tue | 10:00 AM | Resilience | `proof` | Freshness — updated daily from ATS | — |
| **30 Oct** | Thu | 10:00 AM | Packaging | `employer` | Pin mechanic (max 1×/month per board) | → `/sponsor` · $100 / 30 days |

**Job feature rules:** one role per post · same `jobId` not within 30 days · prefer on-wedge titles · job URL for OG preview.

---

## Phase 3 — Steady state (4 Nov 2026 onward)

**2 posts / week · Tue + Thu · 10:00 AM ET**

| Week | Tuesday | Thursday |
| --- | --- | --- |
| **Odd weeks** | Packaging — `fresh-role` or `current-events` | Resilience — `fresh-role` or `proof` |
| **Even weeks** | Resilience — `fresh-role` or `current-events` | Packaging — `fresh-role` or `proof` |

**Monthly inserts (do not stack on same week):**

| Cadence | Board | `postType` | Topic |
| --- | --- | --- | --- |
| 1×/month | Packaging | `employer` | Pin a live listing — packaging engineers, not the whole plant |
| 1×/month | Resilience | `employer` | Pin a live listing — BCM/DR specialists ($175 / 30 days) |
| On milestone only | Hub | `network` | New vertical, hub update — not weekly filler |

**Education refresh** (rotate when job inventory is thin): curation post · apply-out · audience (grads / specialists) · contrast standalone.

---

## Post template quick reference

| Template | When | Structure |
| --- | --- | --- |
| **A — Curation** | Phase 1 | Search pain → daily ATS + classify → contrast → CTA |
| **B — Audience** | Phase 1 | Who it’s for → where roles cluster → what stays/drops → CTA |
| **C — Job feature** | Phase 2+ | “New on [Board]:” + title + employer → why on this board → job URL |
| **D — Proof** | Any phase | One pillar + one fact + CTA |
| **E — Hub / network** | Milestones | Niche Board model + specialty boards + hub CTA |

---

## Grok & draft delivery

Draft emails align with publish days (Tue/Thu cron at 15:00 UTC). Generate or edit drafts **the day before** publish when possible.

```bash
# Education
npm run social:linkedin-draft -- --vertical=packaging --postType=proof --dry-run
npm run social:linkedin-draft -- --vertical=businesscontinuity --postType=contrast --dry-run

# Job feature (pick freshest on-wedge role)
npm run social:linkedin-draft -- --vertical=packaging --postType=fresh-role --dry-run
npm run social:linkedin-draft -- --vertical=businesscontinuity --postType=fresh-role --dry-run
```

**Manual publish:** review email draft → edit → post at **10:00 AM ET** on scheduled date. Nothing auto-posts to LinkedIn.

---

## Success signals

| Phase | Signal |
| --- | --- |
| Sep (education) | DMs / comments: “didn’t know this existed” · “finally the right titles” |
| Oct (job mix) | Clicks to job pages · saves on role posts |
| Nov+ (steady) | Alert signups from LinkedIn · employer inbound citing pin post |

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-09-01 | Initial schedule anchored to hub intro **2 Sep 2026**; 2×/week Tue+Thu at 10:00 AM ET |
