#!/usr/bin/env node
/**
 * Check BIMI / DMARC / DKIM readiness for alerts@nicheboardjobs.com
 * Usage: node scripts/check-bimi-dns.mjs [domain]
 */
import { execSync } from "node:child_process";

const domain = process.argv[2] ?? "nicheboardjobs.com";
const logoUrl = `https://${domain}/brand/bimi/logo.svg`;

function dig(name, type = "TXT") {
  try {
    const out = execSync(`dig ${type} ${name} +short`, { encoding: "utf8" }).trim();
    return out || null;
  } catch {
    return null;
  }
}

function ok(label, pass, detail = "") {
  const icon = pass ? "✓" : "✗";
  console.log(`${icon} ${label}${detail ? `: ${detail}` : ""}`);
  return pass;
}

function parseDmarcPolicy(txt) {
  if (!txt) return null;
  const match = txt.match(/\bp=(\w+)/);
  return match?.[1] ?? null;
}

function parseDmarcPct(txt) {
  if (!txt) return 100;
  const match = txt.match(/\bpct=(\d+)/);
  return match ? Number.parseInt(match[1], 10) : 100;
}

console.log(`BIMI readiness — ${domain}\n`);

const dmarcRaw = dig(`_dmarc.${domain}`);
const dmarc = dmarcRaw?.replace(/^"|"$/g, "") ?? null;
const policy = parseDmarcPolicy(dmarc);
const pct = parseDmarcPct(dmarc);
const dmarcEnforced =
  (policy === "quarantine" || policy === "reject") && pct === 100;
ok(
  "DMARC enforced (p=quarantine|reject, pct=100)",
  dmarcEnforced,
  dmarc ?? "missing",
);

const dkim = dig(`resend._domainkey.${domain}`);
ok("Resend DKIM (resend._domainkey)", Boolean(dkim), dkim ? "present" : "missing");

const bimiRaw = dig(`default._bimi.${domain}`);
const bimi = bimiRaw?.replace(/^"|"$/g, "") ?? null;
ok("BIMI DNS record (default._bimi)", Boolean(bimi), bimi ?? "missing");

const hasLogoUrl = bimi?.includes("l=") ?? false;
ok("BIMI l= logo URL", hasLogoUrl, hasLogoUrl ? "present" : "missing");

const hasCertUrl = bimi?.includes("a=") ?? false;
ok(
  "BIMI a= certificate URL (required for Gmail)",
  hasCertUrl,
  hasCertUrl ? "present" : "missing — need CMC or VMC",
);

try {
  const res = await fetch(logoUrl, { method: "HEAD", redirect: "follow" });
  ok(
    `Logo HTTPS (${logoUrl})`,
    res.ok,
    res.ok ? `${res.status}` : `${res.status} — deploy public/brand/bimi/logo.svg`,
  );
} catch (error) {
  ok(`Logo HTTPS (${logoUrl})`, false, error instanceof Error ? error.message : "fetch failed");
}

console.log("\nNext steps: docs/bimi-setup.md");
if (!dmarcEnforced) {
  console.log("→ Upgrade _dmarc to p=quarantine; pct=100 in Vercel DNS (Step 1)");
}
if (!bimi) {
  console.log("→ Add default._bimi TXT in Vercel DNS (Step 3)");
}
if (!hasCertUrl) {
  console.log("→ Purchase CMC or VMC, host certificate.pem, update BIMI a= (Steps 4–5)");
}

process.exit(dmarcEnforced && dkim && bimi && hasLogoUrl && hasCertUrl ? 0 : 1);
