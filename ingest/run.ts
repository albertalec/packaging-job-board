import { writeFile } from "node:fs/promises";
import path from "node:path";
import { isUsOrRemote } from "./classify.ts";
import { companies } from "./companies.ts";
import type { NormalizedJob } from "./types.ts";
import { ingestAmazon } from "./sources/amazon.ts";
import { ingestAshby } from "./sources/ashby.ts";
import { ingestGreenhouse } from "./sources/greenhouse.ts";
import { ingestLever } from "./sources/lever.ts";
import { ingestOracle } from "./sources/oracle.ts";
import { ingestPhenom } from "./sources/phenom.ts";
import { ingestSmartRecruiters } from "./sources/smartrecruiters.ts";
import { ingestSuccessFactors } from "./sources/successfactors.ts";
import { ingestTeamtailor } from "./sources/teamtailor.ts";
import { ingestCws } from "./sources/cws.ts";
import { ingestWorkday } from "./sources/workday.ts";

export type SourceReport = {
  company: string;
  ats: string;
  fetched: number;
  kept: number;
  error?: string;
};

async function ingestCompany(company: (typeof companies)[number]) {
  switch (company.ats) {
    case "workday":
      return ingestWorkday(company);
    case "greenhouse":
      return ingestGreenhouse(company);
    case "lever":
      return ingestLever(company);
    case "ashby":
      return ingestAshby(company);
    case "amazon":
      return ingestAmazon(company);
    case "phenom":
      return ingestPhenom(company);
    case "oracle":
      return ingestOracle(company);
    case "successfactors":
      return ingestSuccessFactors(company);
    case "teamtailor":
      return ingestTeamtailor(company);
    case "smartrecruiters":
      return ingestSmartRecruiters(company);
    case "cws":
      return ingestCws(company);
    default:
      throw new Error(`No connector for ${(company as { ats: string }).ats}`);
  }
}

export async function runIngest() {
  const reports: SourceReport[] = [];
  const seen = new Set<string>();
  const jobs: NormalizedJob[] = [];

  for (const company of companies) {
    process.stdout.write(`Ingest ${company.name} (${company.ats})… `);
    try {
      const raw = await ingestCompany(company);
      let kept = 0;
      for (const job of raw) {
        if (!isUsOrRemote(job)) continue;
        if (seen.has(job.hash)) continue;
        seen.add(job.hash);
        jobs.push(job);
        kept += 1;
      }
      reports.push({
        company: company.name,
        ats: company.ats,
        fetched: raw.length,
        kept,
      });
      console.log(`kept ${kept}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      reports.push({
        company: company.name,
        ats: company.ats,
        fetched: 0,
        kept: 0,
        error: message,
      });
      console.log(`skip (${message})`);
    }
  }

  jobs.sort((a, b) => {
    const aDate = a.postedAt ? Date.parse(a.postedAt) : 0;
    const bDate = b.postedAt ? Date.parse(b.postedAt) : 0;
    return bDate - aDate;
  });

  const payload = {
    ingestedAt: new Date().toISOString(),
    total: jobs.length,
    jobs,
    reports,
  };

  const jobsPath = path.join(process.cwd(), "data", "jobs.json");
  await writeFile(jobsPath, JSON.stringify(payload, null, 2));
  console.log(`\nWrote ${jobs.length} jobs to data/jobs.json`);
  return payload;
}

if (import.meta.url === `file://${process.argv[1].replaceAll("\\", "/")}` ||
    process.argv[1]?.endsWith("run.ts")) {
  runIngest().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
