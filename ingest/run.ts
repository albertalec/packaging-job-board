import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getVertical } from "../config/tenants.ts";
import { parseVerticalArg } from "./args.ts";
import { isUsOrRemote, setIngestClassifier } from "./classify.ts";
import { appendSnapshot } from "./snapshots.ts";
import {
  rollupEmployerStats,
  type EmployerIngestStats,
  type VerticalIngestStats,
} from "./stats.ts";
import type { Company, NormalizedJob } from "./types.ts";
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
import { ingestJibe } from "./sources/jibe.ts";
import { ingestUltipro } from "./sources/ultipro.ts";
import { ingestRippling } from "./sources/rippling.ts";
import { ingestWpJobs } from "./sources/wpjobs.ts";
import { ingestEightfold } from "./sources/eightfold.ts";
import { ingestWorkday } from "./sources/workday.ts";

export type SourceReport = {
  company: string;
  ats: string;
  scanned: number;
  classifierPass: number;
  kept: number;
  /** @deprecated use classifierPass */
  fetched: number;
  classifierDrops?: Record<string, number>;
  error?: string;
};

const COMPANY_LOADERS: Record<string, () => Promise<Company[]>> = {
  packaging: async () =>
    (await import("./verticals/packaging/companies.ts")).companies,
  businesscontinuity: async () =>
    (await import("./verticals/businesscontinuity/companies.ts")).companies,
};

async function loadCompanies(verticalId: string): Promise<Company[]> {
  const loader = COMPANY_LOADERS[verticalId];
  if (!loader) {
    throw new Error(`No company list for vertical: ${verticalId}`);
  }
  return loader();
}

async function ingestCompany(company: Company) {
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
    case "jibe":
      return ingestJibe(company);
    case "ultipro":
      return ingestUltipro(company);
    case "wpjobs":
      return ingestWpJobs(company);
    case "rippling":
      return ingestRippling(company);
    case "eightfold":
      return ingestEightfold(company);
    default:
      throw new Error(`No connector for ${(company as { ats: string }).ats}`);
  }
}

function emptyEmployerStats(): EmployerIngestStats {
  return { scanned: 0, classifierPass: 0, classifierDrops: {} };
}

function toSourceReport(
  company: Company,
  employerStats: EmployerIngestStats,
  kept: number,
  error?: string,
): SourceReport {
  return {
    company: company.name,
    ats: company.ats,
    scanned: employerStats.scanned,
    classifierPass: employerStats.classifierPass,
    kept,
    fetched: employerStats.classifierPass,
    classifierDrops: employerStats.classifierDrops,
    error,
  };
}

export async function runIngest(verticalId = parseVerticalArg(process.argv)) {
  const vertical = getVertical(verticalId);
  setIngestClassifier(vertical.ingest.classifier);

  const companies = await loadCompanies(vertical.id);
  const reports: SourceReport[] = [];
  const employerSummaries: EmployerIngestStats[] = [];
  const seen = new Set<string>();
  const jobs: NormalizedJob[] = [];

  for (const company of companies) {
    process.stdout.write(`Ingest ${company.name} (${company.ats})… `);
    try {
      const { jobs: raw, stats: employerStats } = await ingestCompany(company);
      let kept = 0;
      for (const job of raw) {
        if (!isUsOrRemote(job, { homeCountry: company.country })) continue;
        if (seen.has(job.hash)) continue;
        seen.add(job.hash);
        jobs.push(job);
        kept += 1;
      }
      employerSummaries.push(employerStats);
      reports.push(toSourceReport(company, employerStats, kept));
      console.log(`kept ${kept}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      employerSummaries.push(emptyEmployerStats());
      reports.push(toSourceReport(company, emptyEmployerStats(), 0, message));
      console.log(`skip (${message})`);
    }
  }

  jobs.sort((a, b) => {
    const aDate = a.postedAt ? Date.parse(a.postedAt) : 0;
    const bDate = b.postedAt ? Date.parse(b.postedAt) : 0;
    return bDate - aDate;
  });

  const stats: VerticalIngestStats = rollupEmployerStats(
    employerSummaries,
    jobs.length,
  );
  const ingestedAt = new Date().toISOString();
  const payload = {
    ingestedAt,
    total: jobs.length,
    stats,
    jobs,
    reports,
  };

  const jobsPath = path.join(process.cwd(), vertical.dataFile);
  await mkdir(path.dirname(jobsPath), { recursive: true });
  await writeFile(jobsPath, JSON.stringify(payload, null, 2));

  const employersWithRoles = reports.filter((report) => report.kept > 0).length;
  await appendSnapshot(
    vertical.id,
    ingestedAt,
    stats,
    jobs.map((job) => job.id),
    companies.length,
    employersWithRoles,
  );

  console.log(`\nWrote ${jobs.length} jobs to ${vertical.dataFile}`);
  return payload;
}

if (import.meta.url === `file://${process.argv[1].replaceAll("\\", "/")}` ||
    process.argv[1]?.endsWith("run.ts")) {
  runIngest().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
