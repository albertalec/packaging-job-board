# BIMI setup — inbox sender avatar for `alerts@nicheboardjobs.com`

Shows the **Niche Board roundel** next to “Packaging Jobs Alerts” in Gmail, Apple Mail, and other BIMI-capable clients.

This is **not** the logo inside alert email HTML (that uses PNG `<img>` tags in `src/lib/alerts-mail.ts`). BIMI controls the **inbox avatar** only.

---

## Current state (check anytime)

Run from repo root:

```bash
node scripts/check-bimi-dns.mjs
```

| Requirement | Status (2026-08) | Action |
| --- | --- | --- |
| Alert From address | `alerts@nicheboardjobs.com` via Resend | Done |
| Resend DKIM on apex | `resend._domainkey.nicheboardjobs.com` | Done |
| DMARC `p=quarantine` or `reject`, `pct=100` | **`p=none` today** | **Step 1 — you** |
| BIMI logo hosted (HTTPS) | `public/brand/bimi/logo.svg` in repo | **Step 2 — deploy this PR** |
| BIMI DNS `default._bimi` | Missing | **Step 3 — you (Vercel DNS)** |
| Mark certificate (CMC or VMC) | Missing | **Step 4 — purchase** |
| BIMI `a=` certificate URL | Missing | **Step 5 — after cert issued** |

---

## Step 1 — Upgrade DMARC (Vercel DNS)

BIMI **requires** enforced DMARC. `p=none` will never show an avatar.

### Option A — Vercel API (Cloud Agent / script)

Add a [Vercel API token](https://vercel.com/account/tokens) with DNS access to your Cloud Agent environment as **`VERCEL_TOKEN`** (team slug defaults to `alba24`; override with `VERCEL_TEAM_ID` or `VERCEL_TEAM_SLUG` if needed).

```bash
# Preview changes
node scripts/apply-bimi-dns-vercel.mjs

# Apply DMARC + BIMI logo records (Steps 1 and 3)
npm run apply:bimi-dns
```

### Option B — Vercel dashboard (manual)

1. Open [Vercel](https://vercel.com) → **Domains** → **`nicheboardjobs.com`** → **DNS Records**
2. Find the existing **`_dmarc`** TXT record
3. Replace its value with:

```txt
v=DMARC1; p=quarantine; pct=100; rua=mailto:hello@nicheboardjobs.com
```

4. Save and wait ~15–60 minutes
5. Verify:

```bash
dig TXT _dmarc.nicheboardjobs.com +short
```

Expected: `v=DMARC1; p=quarantine; pct=100; ...`

**Monitor for 1–2 weeks** via reports at `hello@nicheboardjobs.com`. If everything looks clean, you can tighten to `p=reject` later (optional, stricter).

> **Note:** Apex SPF is Zoho (`include:zohomail.com`). Resend alert mail authenticates via **DKIM** on the apex (`resend._domainkey.nicheboardjobs.com`), which is sufficient for DMARC alignment on `alerts@nicheboardjobs.com`.

---

## Step 2 — Deploy the BIMI logo

This repo includes a BIMI-ready SVG:

`public/brand/bimi/logo.svg`

After merge/deploy, confirm it loads:

```bash
curl -I https://nicheboardjobs.com/brand/bimi/logo.svg
```

Must return `200` over HTTPS with `Content-Type` containing `svg`.

Optional: validate at [BIMI Group SVG converter](https://bimigroup.org/bimi-generator/) (paste URL or upload file).

---

## Step 3 — Add BIMI DNS record (logo only)

Use **`npm run apply:bimi-dns`** (see Step 1 Option A) or add manually in **Vercel DNS** for `nicheboardjobs.com`:

| Type | Name | Value |
| --- | --- | --- |
| TXT | `default._bimi` | `v=BIMI1; l=https://nicheboardjobs.com/brand/bimi/logo.svg;` |

Verify:

```bash
dig TXT default._bimi.nicheboardjobs.com +short
```

**Yahoo / AOL** may show the logo with only the `l=` tag after DMARC is enforced. **Gmail and Apple Mail require Step 4** (certificate).

---

## Step 4 — Get a mark certificate

Gmail displays a custom avatar only when a valid certificate is in the BIMI record.

| Certificate | Trademark required? | Gmail logo | Blue checkmark | Typical cost |
| --- | --- | --- | --- | --- |
| **CMC** (Common Mark Certificate) | No — logo used on domain 12+ months | Yes | No | ~$300–500/yr |
| **VMC** (Verified Mark Certificate) | Yes — registered trademark on the mark | Yes | Yes | ~$1,200–1,500/yr |

Authorized issuers include **DigiCert**, **GlobalSign**, and **SSL.com**.

When applying, provide:

- **Domain:** `nicheboardjobs.com`
- **Logo URL:** `https://nicheboardjobs.com/brand/bimi/logo.svg`
- **Sending address:** `alerts@nicheboardjobs.com` (Resend)
- **Logo file:** same roundel as `public/brand/bimi/logo.svg` (derived from `public/brand/logo-avatar.svg`)

The CA returns a **PEM file** (certificate chain). Do **not** commit it to git.

---

## Step 5 — Host certificate and update BIMI DNS

1. Upload the PEM to your site, e.g. host at:
   - `https://nicheboardjobs.com/brand/bimi/certificate.pem`
   - Options: add to `public/brand/bimi/` locally and redeploy, or upload via Vercel blob/static hosting
2. Confirm HTTPS works:

```bash
curl -I https://nicheboardjobs.com/brand/bimi/certificate.pem
```

3. Update the **`default._bimi`** TXT record in Vercel to:

```txt
v=BIMI1; l=https://nicheboardjobs.com/brand/bimi/logo.svg; a=https://nicheboardjobs.com/brand/bimi/certificate.pem;
```

4. Verify:

```bash
dig TXT default._bimi.nicheboardjobs.com +short
node scripts/check-bimi-dns.mjs
```

---

## Step 6 — Test in inbox

1. Trigger a **new** alert email (welcome or digest) to a Gmail account
2. Wait **24–72 hours** — avatars can lag after DNS/certificate changes
3. In Gmail, look for the roundel next to **Packaging Jobs Alerts**

If no avatar:

- Re-run `node scripts/check-bimi-dns.mjs`
- Confirm DMARC is `p=quarantine` or `p=reject` with `pct=100`
- Confirm Resend domain shows verified DKIM for `nicheboardjobs.com` in [Resend Domains](https://resend.com/domains)
- View raw message headers: look for `dmarc=pass` with aligned DKIM

---

## Quick reference — Vercel DNS summary

All on **`nicheboardjobs.com`** (team Domains → domain → DNS Records):

| Step | Name | Type | Value |
| --- | --- | --- | --- |
| 1 | `_dmarc` | TXT | `v=DMARC1; p=quarantine; pct=100; rua=mailto:hello@nicheboardjobs.com` |
| 3 | `default._bimi` | TXT | `v=BIMI1; l=https://nicheboardjobs.com/brand/bimi/logo.svg;` |
| 5 | `default._bimi` | TXT | add `a=https://nicheboardjobs.com/brand/bimi/certificate.pem;` |

Do **not** change Zoho MX/SPF on `@` for this workflow.

---

## Related docs

- Brand roundel: `public/brand/logo-avatar.svg`
- Alert email HTML logos: `public/brand/png/email-mark-reverse-48.png`
- Marketing / voice: `MARKETING.md` §7.3
- Resend From address: `config/email.ts` → `ALERTS_FROM_EMAIL`
