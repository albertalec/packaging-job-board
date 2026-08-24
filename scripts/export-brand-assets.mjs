#!/usr/bin/env node
/**
 * Export brand SVGs to PNG and render typography lockups via Playwright.
 * Run from repo root: node scripts/export-brand-assets.mjs
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const brandDir = path.join(root, "public/brand");
const svgDir = path.join(brandDir, "svg");
const pngDir = path.join(brandDir, "png");

const SYMBOL = `
  <path d="M0 0H235V62H62V235H0Z" fill="CURRENT_NAVY"/>
  <path d="M235 235H120V180H180V120H235Z" fill="CURRENT_TEAL"/>
`.trim();

const ROUNDEL_INNER = `
  <path d="M175 175H625V295H295V625H175Z" fill="CURRENT_NAVY"/>
  <path d="M625 625H400V505H505V400H625Z" fill="CURRENT_TEAL"/>
`.trim();

async function svgToPng(svgPath, outPath, size, bg = null) {
  let pipeline = sharp(svgPath, { density: 300 }).resize(size, size, {
    fit: "contain",
    background: bg ?? { r: 0, g: 0, b: 0, alpha: 0 },
  });
  await pipeline.png().toFile(outPath);
}

async function renderLockups(page) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@700&family=IBM+Plex+Mono:wght@500;700&family=Newsreader:ital@0;1&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Archivo, Helvetica, Arial, sans-serif; background: #fff; }
    .panel { padding: 48px; display: inline-block; }
    .panel.reverse { background: #0D1B2A; }
    .row { display: flex; align-items: center; gap: 22px; }
    .stack { display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center; }
    .wordmark { font-size: 42px; font-weight: 700; letter-spacing: -0.035em; line-height: 1; color: #0D1B2A; white-space: nowrap; }
    .wordmark.light { color: #FFFFFF; }
    .kicker { font-family: "IBM Plex Mono", monospace; font-size: 11px; font-weight: 500; letter-spacing: 0.16em; text-transform: uppercase; color: #4B5563; margin-top: 10px; white-space: nowrap; }
    .kicker.light { color: rgba(255,255,255,0.72); }
    .kicker .accent-teal { color: #0D7D77; font-weight: 700; }
    .kicker .accent-amber { color: #F5A623; font-weight: 700; }
    .wordmark-only { font-size: 48px; font-weight: 700; letter-spacing: -0.035em; color: #0D1B2A; padding: 40px 48px; }
    .og { width: 1200px; height: 630px; background: #0D1B2A; display: flex; align-items: center; justify-content: space-between; padding: 64px 80px; color: #fff; }
    .og-copy { display: flex; flex-direction: column; gap: 18px; max-width: 620px; }
    .og-tagline { font-family: Newsreader, Georgia, serif; font-style: italic; font-size: 28px; color: rgba(255,255,255,0.92); }
    .og-headline { font-size: 52px; font-weight: 600; letter-spacing: -0.03em; line-height: 1.08; }
    .og-kicker { font-family: "IBM Plex Mono", monospace; font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; color: #F5A623; }
  </style>
</head>
<body>
  <div id="primary" class="panel">
    <div class="row">
      <svg width="82" height="82" viewBox="0 0 235 235">${SYMBOL.replaceAll("CURRENT_NAVY", "#0D1B2A").replaceAll("CURRENT_TEAL", "#0D7D77")}</svg>
      <div>
        <div class="wordmark">Niche Board</div>
        <div class="kicker">Precision job boards for <span class="accent-teal">specialists.</span></div>
      </div>
    </div>
  </div>
  <div id="reverse" class="panel reverse">
    <div class="row">
      <svg width="82" height="82" viewBox="0 0 235 235">${SYMBOL.replaceAll("CURRENT_NAVY", "#FFFFFF").replaceAll("CURRENT_TEAL", "#0D7D77")}</svg>
      <div>
        <div class="wordmark light">Niche Board</div>
        <div class="kicker light">Precision job boards for <span class="accent-amber">specialists.</span></div>
      </div>
    </div>
  </div>
  <div id="stacked" class="panel">
    <div class="stack">
      <svg width="64" height="64" viewBox="0 0 235 235">${SYMBOL.replaceAll("CURRENT_NAVY", "#0D1B2A").replaceAll("CURRENT_TEAL", "#0D7D77")}</svg>
      <div class="wordmark">Niche Board</div>
    </div>
  </div>
  <div id="wordmark" class="wordmark-only">Niche Board</div>
  <div id="og" class="og">
    <div class="og-copy">
      <div class="og-kicker">Precision job boards for specialists</div>
      <div class="og-headline">The right jobs, not all the jobs.</div>
      <div class="og-tagline">Specialty boards refreshed daily from employer career sites.</div>
    </div>
    <svg width="220" height="220" viewBox="0 0 800 800">
      <circle cx="400" cy="400" r="400" fill="#0D7D77"/>
      ${ROUNDEL_INNER.replaceAll("CURRENT_NAVY", "#FFFFFF").replaceAll("CURRENT_TEAL", "rgba(255,255,255,0.5)")}
    </svg>
  </div>
</body>
</html>`;

  await page.setContent(html, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);

  async function shot(id, out) {
    await page.locator(`#${id}`).screenshot({ path: out });
  }

  await shot("primary", path.join(pngDir, "logo-horizontal-primary.png"));
  await shot("reverse", path.join(pngDir, "logo-horizontal-reverse.png"));
  await shot("stacked", path.join(pngDir, "logo-stacked.png"));
  await shot("wordmark", path.join(pngDir, "logo-wordmark.png"));
  await shot("og", path.join(pngDir, "og-image.png"));
}

async function main() {
  await mkdir(pngDir, { recursive: true });

  const exports = [
    [path.join(brandDir, "logo-mark.svg"), "logo-mark-512.png", 512],
    [path.join(svgDir, "logo-mark-on-navy.svg"), "app-icon-512.png", 512],
    [path.join(brandDir, "logo-avatar.svg"), "roundel-navy-512.png", 512],
    [path.join(svgDir, "roundel-white.svg"), "roundel-white-512.png", 512],
    [path.join(svgDir, "roundel-teal.svg"), "roundel-teal-512.png", 512],
    [path.join(svgDir, "roundel-outline.svg"), "roundel-outline-512.png", 512],
    [path.join(svgDir, "logo-mark-mono-navy.svg"), "logo-mark-mono-navy-512.png", 512],
    [path.join(svgDir, "logo-mark-mono-white.svg"), "logo-mark-mono-white-512.png", 512],
    [path.join(svgDir, "logo-mark-reverse.svg"), "logo-mark-reverse-512.png", 512],
  ];

  for (const [svgPath, pngName, size] of exports) {
    await svgToPng(svgPath, path.join(pngDir, pngName), size);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await renderLockups(page);
  await browser.close();

  const appIcon = path.join(pngDir, "app-icon-512.png");
  await sharp(appIcon).resize(192, 192).png().toFile(path.join(pngDir, "app-icon-192.png"));
  await sharp(appIcon).resize(32, 32).png().toFile(path.join(pngDir, "favicon-32.png"));
  await sharp(appIcon).resize(180, 180).png().toFile(path.join(root, "src/app/apple-icon.png"));
  await sharp(path.join(pngDir, "og-image.png"))
    .resize(1200, 630)
    .png()
    .toFile(path.join(root, "src/app/opengraph-image.png"));

  console.log("Brand assets exported.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
