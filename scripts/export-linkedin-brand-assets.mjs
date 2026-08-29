#!/usr/bin/env node
/**
 * Export LinkedIn intro post + company cover images for Niche Board.
 * Run: node scripts/export-linkedin-brand-assets.mjs
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public/brand/png/linkedin");

const SYMBOL = `
  <path d="M0 0H235V62H62V235H0Z" fill="CURRENT_NAVY"/>
  <path d="M235 235H120V180H180V120H235Z" fill="CURRENT_TEAL"/>
`.trim();

function linkedinHtml() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;700&family=Newsreader:ital@0;1&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #ccc; }

    .intro-post {
      width: 1200px;
      height: 627px;
      background: #F1F3F5;
      padding: 72px 80px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      font-family: Archivo, Helvetica, Arial, sans-serif;
      position: relative;
      overflow: hidden;
    }
    .intro-post::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        linear-gradient(135deg, rgba(13,27,42,0.03) 0%, transparent 45%),
        linear-gradient(225deg, rgba(13,125,119,0.05) 0%, transparent 40%);
      pointer-events: none;
    }
    .intro-top { position: relative; z-index: 1; }
    .intro-lockup {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-bottom: 28px;
    }
    .intro-wordmark {
      font-size: 54px;
      font-weight: 700;
      letter-spacing: -0.035em;
      color: #0D1B2A;
      line-height: 1;
    }
    .intro-kicker {
      font-family: "IBM Plex Mono", monospace;
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #4B5563;
      margin-top: 12px;
    }
    .intro-kicker .teal { color: #0D7D77; font-weight: 700; }
    .intro-headline {
      font-family: Newsreader, Georgia, serif;
      font-style: italic;
      font-size: 34px;
      line-height: 1.25;
      color: #0D1B2A;
      max-width: 720px;
      margin-bottom: 28px;
    }
    .intro-chips {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .chip {
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.02em;
      padding: 10px 18px;
      border-radius: 3px;
      border: 1px solid rgba(13,27,42,0.12);
      background: #FFFFFF;
    }
    .chip.packaging { color: #6A5FA9; border-color: rgba(106,95,169,0.25); }
    .chip.resilience { color: #0D7D77; border-color: rgba(13,125,119,0.25); }
    .intro-footer {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 24px;
    }
    .intro-proof {
      font-size: 15px;
      font-weight: 400;
      color: #4B5563;
      max-width: 620px;
      line-height: 1.5;
    }
    .intro-url {
      font-family: "IBM Plex Mono", monospace;
      font-size: 15px;
      font-weight: 500;
      letter-spacing: 0.04em;
      color: #0D7D77;
      white-space: nowrap;
    }

    .company-cover {
      width: 1584px;
      height: 396px;
      background: #0D1B2A;
      padding: 0 96px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-family: Archivo, Helvetica, Arial, sans-serif;
      position: relative;
      overflow: hidden;
    }
    .company-cover::before {
      content: "";
      position: absolute;
      right: -40px;
      top: 50%;
      transform: translateY(-50%);
      width: 420px;
      height: 420px;
      opacity: 0.08;
      background:
        linear-gradient(135deg, transparent 48%, #0D7D77 48%, #0D7D77 52%, transparent 52%),
        linear-gradient(45deg, transparent 48%, #0D7D77 48%, #0D7D77 52%, transparent 52%);
      pointer-events: none;
    }
    .cover-copy {
      position: relative;
      z-index: 1;
      max-width: 920px;
    }
    .cover-lockup {
      display: flex;
      align-items: center;
      gap: 22px;
      margin-bottom: 18px;
    }
    .cover-wordmark {
      font-size: 46px;
      font-weight: 700;
      letter-spacing: -0.035em;
      color: #FFFFFF;
      line-height: 1;
    }
    .cover-kicker {
      font-family: "IBM Plex Mono", monospace;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.72);
      margin-top: 10px;
    }
    .cover-kicker .teal { color: #0D7D77; font-weight: 700; }
    .cover-tagline {
      font-size: 24px;
      font-weight: 500;
      letter-spacing: -0.02em;
      color: rgba(255,255,255,0.94);
      margin-bottom: 14px;
      max-width: 780px;
      line-height: 1.3;
    }
    .cover-boards {
      font-family: "IBM Plex Mono", monospace;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.58);
    }
    .cover-mark {
      position: relative;
      z-index: 1;
      opacity: 0.92;
    }
  </style>
</head>
<body>
  <div id="intro-post" class="intro-post">
    <div class="intro-top">
      <div class="intro-lockup">
        <svg width="88" height="88" viewBox="0 0 235 235">${SYMBOL.replaceAll("CURRENT_NAVY", "#0D1B2A").replaceAll("CURRENT_TEAL", "#0D7D77")}</svg>
        <div>
          <div class="intro-wordmark">Niche Board</div>
          <div class="intro-kicker">Precision job boards for <span class="teal">specialists.</span></div>
        </div>
      </div>
      <div class="intro-headline">The right jobs, not all the jobs.</div>
      <div class="intro-chips">
        <span class="chip packaging">Packaging</span>
        <span class="chip resilience">Resilience</span>
      </div>
    </div>
    <div class="intro-footer">
      <div class="intro-proof">Updated daily · Apply on the employer career site</div>
      <div class="intro-url">nicheboardjobs.com</div>
    </div>
  </div>

  <div id="company-cover" class="company-cover">
    <div class="cover-copy">
      <div class="cover-lockup">
        <svg width="72" height="72" viewBox="0 0 235 235">${SYMBOL.replaceAll("CURRENT_NAVY", "#FFFFFF").replaceAll("CURRENT_TEAL", "#0D7D77")}</svg>
        <div>
          <div class="cover-wordmark">Niche Board</div>
          <div class="cover-kicker">Precision job boards for <span class="teal">specialists.</span></div>
        </div>
      </div>
      <div class="cover-tagline">Jobs in niches too narrow for LinkedIn.</div>
      <div class="cover-boards">Packaging · Resilience · More coming</div>
    </div>
    <div class="cover-mark">
      <svg width="180" height="180" viewBox="0 0 235 235">${SYMBOL.replaceAll("CURRENT_NAVY", "rgba(255,255,255,0.15)").replaceAll("CURRENT_TEAL", "rgba(13,125,119,0.45)")}</svg>
    </div>
  </div>
</body>
</html>`;
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1700, height: 1200 } });
  await page.setContent(linkedinHtml(), { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  const introPath = path.join(outDir, "niche-board-linkedin-intro-post.png");
  const coverPath = path.join(outDir, "niche-board-linkedin-company-cover.png");

  await page.locator("#intro-post").screenshot({ path: introPath });
  await page.locator("#company-cover").screenshot({ path: coverPath });

  await browser.close();
  console.log(introPath);
  console.log(coverPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
