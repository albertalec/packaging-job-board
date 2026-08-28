# Agent instructions

## Job scope (United States only)

All Niche Board verticals list **United States roles only**. Candidates browse US employers on US career sites; we do not run an international job board.

**Ingest gate:** every normalized job must pass `isUsOrRemote()` in `ingest/classify.ts` before it is written to `data/{vertical}/jobs.json`.

- **Keep:** US city + state, explicit US/USA in location or Workday path, or Workday `"N Locations"` collapse for employers marked `country: "USA"`.
- **Drop:** foreign locations (Latin America, Canada, EMEA, APAC, etc.), foreign Workday path segments (`/job/Latin-America-…`), and **foreign hybrid/remote** roles.
- **Do not** treat `remote: true` alone as US-qualified. Hybrid/remote must still anchor to a US state or US mention in location/path.

When adding employers on global ATS sites (e.g. Kenvue Workday), set `country: "USA"` on the company record and rely on the location filter — do not widen ingest to non-US postings.

## CSS layout stability

Board and hub layout must stay **stable** across verticals, theme skins (Standard / Kraft), and feature work. Visual themes may change colors and surfaces; they must not change structure.

**Canonical mocks:** [`Packaging Board.dc.html`](Packaging%20Board.dc.html), [`Packaging Job Page.dc.html`](Packaging%20Job%20Page.dc.html), [`Niche Board Site.dc.html`](Niche%20Board%20Site.dc.html). Layout changes should match these unless the user explicitly requests a redesign.

**Shared structure, separate tint**

- Put flex, grid, spacing, padding, and visibility in selectors that apply to **all** skins for a vertical (e.g. `html[data-vertical="packaging"]`, not `:not([data-board-skin="kraft"])`).
- Theme skins (Kraft) may only override **surfaces and tokens**: page wash, card background, field colors, listing rails (`--job-rail`), dashed borders. Do **not** override mast/header, hero grid, shell width, or nav layout when adding a skin.
- Mast/header stays on standard brand chrome (navy mast, standard CTAs) regardless of Kraft toggle.

**Multi-vertical selectors**

When sharing rules between Packaging and Resilience in `src/app/packaging-board.css`, attach each descendant to **both** vertical clauses:

```css
/* Correct */
html[data-vertical="packaging"] .job-card,
html[data-vertical="businesscontinuity"] .job-card { … }

/* Wrong — Packaging never gets .job-card rules */
html[data-vertical="packaging"], html[data-vertical="businesscontinuity"] .job-card { … }
```

**Before merging CSS changes**

- Toggle Kraft on the Packaging homepage and confirm header, hero, filters, and job list keep the same structure (only colors/surfaces change).
- Spot-check Resilience (`businesscontinuity`) so shared selectors still apply there.

## Testing / walkthrough artifacts

- Never generate video (screen recordings) unless the user explicitly asks for video.
- Prefer screenshots, HTML/curl checks, and automated tests for evidence unless video is requested.
