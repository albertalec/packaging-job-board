#!/usr/bin/env node
/**
 * Smoke-test Vercel domain routing for Niche Board hosts (no API token needed).
 *
 * Usage: node scripts/check-vercel-domains.mjs
 */
const HOSTS = [
  {
    host: "packaging-job-board.vercel.app",
    expect: "ok",
    note: "Default Vercel project URL",
  },
  {
    host: "packaging.nicheboardjobs.com",
    expect: "ok",
    note: "Packaging vertical (production)",
  },
  {
    host: "www.nicheboardjobs.com",
    expect: "ok",
    note: "Parent hub",
  },
  {
    host: "businesscontinuity.nicheboardjobs.com",
    expect: "ok",
    note: "Resilience / BCM vertical — must be on packaging-job-board project",
  },
];

async function probe(host) {
  const url = `https://${host}/`;
  try {
    const res = await fetch(url, { redirect: "follow" });
    const vercelError = res.headers.get("x-vercel-error");
    return {
      host,
      status: res.status,
      server: res.headers.get("server") ?? "",
      vercelError,
      ok: res.ok && !vercelError,
    };
  } catch (err) {
    return {
      host,
      status: 0,
      server: "",
      vercelError: err instanceof Error ? err.message : String(err),
      ok: false,
    };
  }
}

async function main() {
  console.log("Vercel domain connectivity check\n");
  let failed = 0;

  for (const item of HOSTS) {
    const result = await probe(item.host);
    const pass = item.expect === "ok" ? result.ok : !result.ok;
    const mark = pass ? "✓" : "✗";
    if (!pass) failed += 1;

    console.log(`${mark} ${item.host}`);
    console.log(`  ${item.note}`);
    console.log(
      `  HTTP ${result.status}${result.vercelError ? ` (${result.vercelError})` : ""}`,
    );
  }

  console.log("");
  if (failed > 0) {
    console.log(
      `${failed} host(s) need attention. For missing vertical subdomains, add the domain in Vercel:`,
    );
    console.log(
      "  Project packaging-job-board → Settings → Domains → Add businesscontinuity.nicheboardjobs.com",
    );
    console.log("  Or: npm run add:vertical-domain (requires VERCEL_TOKEN)");
    process.exit(1);
  }

  console.log("All hosts routed correctly.");
}

main();
