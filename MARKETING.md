# Niche Board — Marketing & Content Plan

**Tone (locked):** friendly but not eager · trustworthy and uplifting · a little fun  
If a draft feels breathless, salesy, or flatly corporate, rewrite it.

---

## Brand Guide v1.0 (platform — hub shipped 2026-08)

**Canonical reference:** [`Niche Board Brand Guide.dc.html`](Niche%20Board%20Brand%20Guide.dc.html) — logo, colour, type, voice, application mockups.  
**Site mock:** [`Niche Board Site.dc.html`](Niche%20Board%20Site.dc.html) — hub, employers, and packaging board layouts.

### Positioning
**Precision job boards for specialists.** The right jobs, not all the jobs.

### Core personality
- Trusted advocate
- Focused and precise
- Warm but professional
- Quietly confident
- Slightly clever

### Brand values (voice)
| Value | Line |
| --- | --- |
| Filtering | We filter out the noise so you find the fit. |
| Efficiency | Exact niche. Zero wasted time. |
| Advocacy | A trusted advocate in your corner — on your side, not just another job site. |
| Respect | Less searching. More finding. Your time is valuable. |
| Impact | The right role changes everything. Better matches. Better outcomes. |

These are **brand values**. Product proof pillars (Classification, Freshness, Apply-out, Precision buy, Simple commerce) stay in §4 — they complement, not replace.

### Color palette
| Token | Hex | Use |
| --- | --- | --- |
| Deep Navy | `#0D1B2A` | Trust, headlines, primary UI |
| Teal | `#0D7D77` | Focus, links, active states, niche labels |
| Amber | `#F5A623` | Energy, employer CTAs — use sparingly |
| Slate | `#4B5563` | Secondary text, metadata |
| Mist | `#F1F3F5` | Backgrounds, card borders |
| Paper | `#FFFFFF` | Main surfaces |
| Ink Violet | `#6A5FA9` | Board-family coding (labels/tints only) |
| Clay | `#A85C57` | Board-family coding (labels/tints only) |

Working ratio: navy + neutrals ~78%, teal ~14%, accents ~4%, amber ~4%. Violet and clay never appear in the logo, links, or button fills.

### Typography
- **Headings & body:** Archivo (600/700 headings, 400/500 body)
- **Tagline & pull quotes:** Newsreader Italic
- **Eyebrows, counts, metadata:** IBM Plex Mono (uppercase, tracked)

### Logo system
- **Symbol:** two crop marks — navy top-left corner opens the frame, teal bottom-right closes it. The gap between corners is structural; never close it, mirror, rotate, or recolour.
- **Roundel:** circle accent for avatars, favicons, section markers — one per view.
- **Primary lockup:** symbol + single-line **Niche Board** + uppercase kicker (*Precision job boards for specialists.* with final word in teal).
- **Name:** always **Niche Board** (two words). Boards listed by niche alone (**Packaging**, not “Packaging Jobs”).

### Brand assets (repo)
Source SVGs live under `public/brand/`; PNG lockups and social sizes are generated with `npm run brand:export`.

| Path | Use |
| --- | --- |
| `public/brand/logo-mark.svg` | Primary symbol (transparent) |
| `public/brand/logo-avatar.svg` | Navy roundel |
| `public/brand/logo-horizontal.svg` | Reference horizontal lockup |
| `public/brand/svg/logo-mark-on-navy.svg` | App icon base (navy tile) |
| `public/brand/svg/logo-mark-reverse.svg` | Symbol on dark backgrounds |
| `public/brand/svg/logo-mark-mono-*.svg` | Single-colour symbol variants |
| `public/brand/svg/roundel-*.svg` | Roundel avatars (navy, white, teal, outline) |
| `public/brand/png/logo-horizontal-*.png` | Marketing lockups (light / reverse) |
| `public/brand/png/logo-stacked.png` | Stacked symbol + wordmark |
| `public/brand/png/logo-wordmark.png` | Wordmark only |
| `public/brand/png/og-image.png` | Social share template |
| `src/app/icon.svg` | Favicon (roundel) |
| `src/app/apple-icon.png` | Apple touch icon (generated) |
| `src/app/opengraph-image.png` | Default Open Graph image (generated) |

React: `LogoMark` supports `default`, `reverse`, `mono-navy`, `mono-white`, `on-navy`, and roundel variants (`avatar`, `avatar-white`, `avatar-teal`, `avatar-outline`).

### UI guidelines (hub)
- Large whitespace, simple cards, 3px radius on buttons
- IBM Plex Mono for section labels, badges, and counts
- Amber used sparingly (employer CTAs, featured/soon badges)
- Teal for links, active states, live indicators, niche labels
- Navy for primary buttons and headings
- Board-family tints (teal/violet/clay washes) for category chips only

**Packaging board** matches [`Packaging Board.dc.html`](Packaging%20Board.dc.html) — standard brand UI with optional kraft skin toggle in the masthead.

---

## 1. Strategy in one page

### What we sell
**Audience precision.** Employers pay to put a live ATS listing in front of a narrow professional slice. Candidates get a clean board and email alerts at no charge — we don’t sell candidate subscriptions, resume databases, or “post a job from scratch” workflows.

### What we are
A **network of precision job boards** — one subdomain per niche — fed by daily employer ATS ingest. Candidates apply on the company’s career site.

### What we are not
- A LinkedIn / Indeed clone with niche as a filter
- A catch-all packaging (or industry) board for plant ops, warehouse, HR, sales
- A career network with profiles, messaging, or employer dashboards
- A scrape-and-spam aggregator

### North-star promise
| Audience | Promise |
| --- | --- |
| Candidates | Roles in *your* specialty, updated daily, apply on the real listing. |
| Employers | Reach the specialists LinkedIn buries — pin a listing you already have. |

### Launch wedge (Packaging)
**CPG / brand-side packaging engineers and package development** — not plant converting, not semiconductor “packaging,” not packer/warehouse titles.

Homepage contrast line (keep visible in every packaging surface):  
**Package development — not plant ops.**

---

## 2. Brand hierarchy (locked)

### The answer

| Layer | Official name | Never call it |
| --- | --- | --- |
| **Platform / company** | **Niche Board** (two words, always) | Nicheboard, Nicheboard Jobs, Niche Board Jobs, NB |
| **Specialty board (hub listing)** | Niche name only — e.g. **Packaging**, **Supply chain** | `{Specialty} Jobs` as hub card headline |
| **Vertical subdomain (phase 2)** | **Packaging Jobs** on `packaging.` mast/SEO | Packaging Nicheboard, Niche Board Packaging |
| **Domain (URL only)** | `nicheboardjobs.com` / `packaging.nicheboardjobs.com` | Spoken as the brand name |

**Niche Board is the network.** Specialty boards are listed by niche on the hub — not as separate product brands.

It is **not** “the Packaging Nicheboard.”  
It is **not** “Nicheboard Jobs.”  
It is **not** primarily “launch your next career move” branding — that is generic career fluff and fights our specialist wedge.

### How they relate

On the **hub**, link to boards by niche:

> **Packaging** — package development, not plant ops.

On **vertical subdomains** (unchanged until phase 2 rebrand):

> **Packaging Jobs** — packaging engineer roles, powered by **Niche Board**.

### Who leads where

| Surface | Lead brand | Supporting line |
| --- | --- | --- |
| `nicheboardjobs.com` hub | **Niche Board** | Specialty boards listed by niche (Packaging, Supply chain, …) |
| Hub niche cards | **Packaging** (hub label) | Contrast line + live role count — not “Packaging Jobs” |
| `packaging.nicheboardjobs.com` mast, hero, SEO | **Packaging Jobs** *(phase 2 visual rebrand pending)* | Niche Board as powered-by / footer credit |
| Alerts subject + body | **Packaging Jobs** / Packaging Job Alerts | “powered by Niche Board” once |
| Sponsor / employer on packaging | **Packaging Jobs** | Niche Board if explaining the network |
| Legal / from-email / DNS | nicheboardjobs.com | Display name “Niche Board” on hub; vertical names on subdomains |

### Why hub-first

- Multiple boards are coming — the hub sells the **network**, not one vertical product name.
- Employers buy **precision on a specialty board**; candidates discover via niche SEO on subdomains.
- Vertical `{Specialty} Jobs` naming stays on subdomains for search; hub downplays it.

### Banned / discouraged names

- Nicheboard (one word) in any customer-facing copy  
- Nicheboard Jobs / Niche Board Jobs as the product name  
- Packaging Nicheboard / The Packaging Niche Board  
- “Launch your next career move” as a brand or hero promise  
- Leading a packaging subdomain page with “Niche Board” in the H1  
- Leading hub niche cards with “Packaging Jobs” — use **Packaging** instead

### Mast mark

- **Hub:** geometric icon + single-line **Niche Board** wordmark
- **Packaging vertical (legacy until phase 2):** **Packaging** / **Jobs** two-line mark + stamp box

---

## 3. Audiences & jobs-to-be-done

### A. Packaging candidates (primary traffic)
- Packaging engineers, package development, packaging R&D / managers at CPG, pharma, adjacent brands.
- JTBD: “Show me real openings in my specialty without scrolling plant-ops noise.”
- Offer: free board + free email alerts. Never paywall candidates.

### B. Hiring managers / talent partners (revenue)
- People who already posted on Workday / Greenhouse / Lever / etc.
- JTBD: “Get this role in front of packaging engineers without another post-a-job form.”
- Offer: **$100 / 30 days** to pin an existing listing (packaging SKU).

### C. Future vertical candidates / employers
Same pattern per niche. Do not invent a new voice per vertical — swap specialty nouns and contrast line only.

---

## 4. Positioning pillars (every piece of content maps to ≥1)

1. **Classification** — Specialist titles only; we drop the noise incumbents keep.
2. **Freshness** — Daily ATS ingest; dates matter; stale 45-day posts are the enemy.
3. **Apply-out** — Candidate finishes on the employer ATS; we are not a fake apply wall.
4. **Precision buy** — Employers buy a niche audience, not “jobs traffic.”
5. **Simple commerce** — Pin what’s already live; no second posting workflow.

Content that only says “find your dream job” or “post jobs fast” fails these pillars.

---

## 5. Voice & tone

### Voice
- **Friendly, not eager.** Warm and human; never salesy, breathless, or “we’re so excited!!!”
- **Trustworthy and uplifting.** Clear, honest, and quietly confident — leave people feeling sharper about their next step, not hyped.
- **A little fun.** Light wit is welcome (especially the plant-ops contrast). Clever > cutesy. No jokes that undercut competence.
- Prefer concrete nouns: *packaging engineer*, *package development*, *Workday*, *pin*, *digest*.
- Short sentences. One idea per section.

### Tone dial
| More of this | Less of this |
| --- | --- |
| “You’re on the list — we’ll send a short digest when new roles appear.” | “We’re THRILLED to have you on this journey!!!” |
| “Package development — not plant ops.” | “The #1 revolutionary packaging careers platform.” |
| “Pin a listing you already have.” | “Unlock premium talent today.” |
| A dry smile in the contrast line | Emojis, exclamation piles, faux-urgency |

### Tone by channel
| Channel | Tone |
| --- | --- |
| Site hero / SEO | Clear specialty + contrast. Friendly precision; minimal ornament. |
| Alerts / digests | Warm, brief, scannable. Helpful without guilt or pep-talk. |
| Employer / sponsor | Practical and upbeat: who sees it, what you pin, what it costs. |
| Social / LinkedIn | Same claims as the site; lightly fun; no growth-hack energy. |

### Words we use
packaging engineer · package development · package-development · specialist board · pin · live listing · career site / ATS · updated daily · job alerts · Niche Board (network only)

### Words we avoid
dream job · passion · disrupt · AI-powered matching · #1 board · thousands of jobs · easy apply (unless meaning ATS) · resume database · talent pool unlock · limited-time hype · plant ops listed as a feature

### Claims we do not make unless measured
- Exact candidate counts, open rates, or “hire in X days”
- “Better than LinkedIn” as a blanket (prefer: *niches too narrow for LinkedIn* / *roles LinkedIn buries*)
- Volume leadership vs My Packaging Career or other incumbents

---

## 6. Message house

### Platform (Niche Board)
- **Headline pattern:** Precision job boards for specialists.
- **Tagline:** The right jobs, not all the jobs.
- **Support:** Daily ATS ingest. Apply on the employer career site. Employers pin a listing they already have.
- **CTA:** Browse specialty boards · Pin a listing · Talk bundles (later)

### Vertical — Packaging Jobs
- **Headline pattern:** Packaging engineer jobs at top employers.
- **Support:** Packaging engineers and package development — not plant ops. Named example employers when true (e.g. General Mills, J&J, Mars, Clorox). Apply on the company’s career site.
- **Contrast:** Package development — not plant ops.
- **Candidate CTA:** Browse roles · Get alerts / Email me new roles
- **Employer CTA:** Sponsor / pin a listing · $100 for 30 days

### Proof we can cite today
- Listings from employer career sites / ATS feeds (not LinkedIn scrapes)
- Updated daily
- Apply on source listing
- Candidate alerts with one-click unsubscribe (single opt-in)
- Sponsor pin without re-posting the job

### “Free” — use sparingly
Candidates are always free to browse, apply, and get alerts. That is strategy, not a slogan.

**Do not lead with “free”** on Packaging Jobs. It sounds defensive, a little salesy, and trains people to hear price instead of specialty. Most job alerts are expected to be free; repeating it cheapens the board.

| Surface | Prefer | Avoid |
| --- | --- | --- |
| Nav / signup kicker / button | Job alerts · Get alerts · Email me new roles | Free alerts · Get free alerts |
| Signup lede | What they’ll get (short digest, package-development focus) | “No paywall” as the opener |
| Welcome / digest email | Specialty + what happens next | “Free alerts from…” |
| Employer / hub copy | “Candidates stay free; employers fund precision” (ok once, competitively) | Calling the product “Free Alerts” |

Mention free only when contrasting a competitor that charges candidates — and then say it once, quietly, not as the brand.
---

## 7. Content system (what “all content” means)

Every asset is one of these types. Stay inside the template.

### 7.1 Site UI copy & visual system
- One job per block: hero, board empty states, alerts module, sponsor lede.
- **Hero budget:** Packaging Jobs mark (hero-level), one headline, contrast wedge, one short lede, one CTA pair. No stats strip, promo stickers, or secondary marketing in the first viewport.
- Contrast line is visual + verbal: stamp-accent, left rule — *Package development — not plant ops.*
- Board counts and “last updated” sit *below* the hero as quiet meta, not in the hero.
- Keep candidate path (Apply / Browse / Alerts) and employer path (Sponsor) visually separate.
- **Visual brand (Hub):** navy/teal palette (Brand Guide v1), Inter Tight + Inter, geometric logo mark, generous whitespace, simple cards. See Brand Guide v1 above.
- **Visual brand (Packaging vertical — legacy):** kraft-paper atmosphere (outer wash + paper sheet), Source Serif 4 + IBM Plex Sans, ink/kraft offset “stamp” geometry. Niche Board powered-by lives in the footer only. Phase 2: align with Brand Guide v1.
- Motion is presence, not noise: mark settle, hero rise-in, card hover offset. Respect `prefers-reduced-motion`.

### 7.2 SEO / metadata
- Title ≈ specialty + “jobs” + employer framing; do not keyword-stuff plant/ops terms.
- Meta description: specialty + freshness + apply-out.
- Do not target broad “packaging jobs” alone if it pulls warehouse/packer intent; prefer *packaging engineer* / *package development*.

### 7.3 Transactional email (alerts)
| Email | Purpose | Must include |
| --- | --- | --- |
| Welcome | Confirm value + set expectations | Vertical brand; Niche Board as powered-by; specialty focus; Browse CTA; unsubscribe |
| Digest | New roles only when inventory warrants | Short intro; job cards link to board listings (View role); Browse CTA; unsubscribe |
| (No) nurture drip yet | — | Do not invent weekly “engagement” mail without a product reason |

Rules:
- From domain: `@nicheboardjobs.com` (aligned SPF/DKIM/DMARC).
- Subject: outcome-oriented, specialty-named, no clickbait.
- Links: canonical vertical host (`https://packaging.nicheboardjobs.com/...`).
- Unsubscribe: always one-click; muted styling, not alarmist.

### 7.4 Employer outreach (manual or later sequences)
Structure: who you reach → proof of board focus → pin mechanic → price → link to `/sponsor`.
Do not lead with platform vision; lead with packaging-engineer attention.

### 7.5 Social / short posts
Formula: **Contrast + one proof + one CTA.**  
Example: “Package development roles only — not plant ops. Updated daily from employer ATS. Browse Packaging Jobs →”

### 7.6 Future vertical launches
Clone this plan; replace:
1. Specialty noun phrase  
2. Contrast line (what we are *not*)  
3. Example employers  
4. Price if different  
Keep Niche Board platform lines unchanged.

---

## 8. Channel priorities (near term)

Ordered by leverage for a thin vertical:

1. **SEO on the vertical subdomain** — title/meta, crawlable jobs, sitemap, Search Console on `packaging.nicheboardjobs.com`.
2. **Candidate alerts** — grow the free list; digests that only fire when there is news.
3. **Employer pin sales** — direct outreach to companies already on the board; `/sponsor` as the close.
4. **Hub (`nicheboardjobs.com`)** — employer education + future bundles; light until 2+ verticals.
5. **LinkedIn / communities** — packaging R&D / package-dev groups; same message house; no job spam dumps.

Out of scope until inventory and renewals prove out: paid candidate acquisition, podcast sponsorships, conference booths, content blogs written for volume SEO alone.

---

## 9. Offer & pricing messaging

| Offer | Audience | How we say it |
| --- | --- | --- |
| Free board | Candidates | Always free to browse and apply — say it rarely; show it by never charging. |
| Job alerts | Candidates | Short digest when new package-development jobs appear. Don’t lead with “free.” |
| Pin / sponsor | Employers | $100 to pin a live career-site listing for 30 days at the top of Packaging Jobs. |
| Bundles (later) | Employers | Multi-vertical pins — message only when a second vertical is live. |

Never discount by watering down the niche. If we discount, say “intro pin” clearly; do not imply the board is general-purpose.

---

## 10. Competitive framing

| Competitor type | Our line |
| --- | --- |
| Broad job boards | Niches too narrow for LinkedIn; specialists get buried in keyword search. |
| Wide packaging boards | They list the whole plant; we list package development. |
| Niche job boards that charge candidates | Candidates stay free; employers fund precision. |
| Pure job posters | You already posted on your ATS — pin that URL here. |

Do not name-call competitors in product UI. Fine in private outreach if factual and specific.

---

## 11. Quality bar (ship checklist)

Before publishing any copy (site, email, social, outreach):

- [ ] Tone: friendly + trustworthy + lightly fun — not eager or hype-y
- [ ] Correct brand for the surface: **Niche Board** on hub; specialty name (e.g. Packaging) on hub cards; **Packaging Jobs** on vertical subdomain only
- [ ] Hub: Niche Board leads; vertical product names downplayed
- [ ] Vertical subdomain: Packaging Jobs leads; Niche Board is powered-by only
- [ ] Maps to ≥1 positioning pillar
- [ ] Specialty is explicit; contrast (“not …”) present where packaging is the topic
- [ ] Apply-out or pin-existing-listing clear when relevant
- [ ] No candidate paywall language
- [ ] No unverified metrics
- [ ] Single primary CTA
- [ ] Links use the canonical vertical or hub host

---

## 12. Canonical phrases (reuse, don’t rewrite)

**Platform**
- Precision job boards for specialists.
- The right jobs, not all the jobs.
- Pin a listing you already have on Workday or Greenhouse.

**Packaging**
- Packaging engineer jobs at top employers.
- Packaging engineers and package development — not plant ops.
- Package development — not plant ops.
- Apply on the company’s career site.
- Get new packaging engineer roles by email.
- You’re subscribed to Packaging Jobs alerts, powered by Niche Board.
- Welcome subject: You’re subscribed to Packaging Jobs alerts.
- Welcome title: You’re on the list.
- Welcome CTA: Browse Packaging Jobs.
- Welcome preheader: Package development — not plant ops. Short digests when new roles appear.

Config source for live UI strings: `config/hub.ts`, `config/packaging.ts`.  
Product roadmap context: `PLAN.md`. Update this file when positioning changes.

---

## 13. Success signals (marketing, not vanity)

- Returning candidate visits and alert subscribe → retain rate
- Digest → click to board job page (apply-out stays on the site)
- Sponsor checkout starts and paid pins / renewals
- Search impressions/queries for *packaging engineer* / *package development* (not packer)
- Qualitative: employers say “these are the right people”

Ignore as primary goals: raw pageviews, social likes, email list size without engagement.
