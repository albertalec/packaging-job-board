import type { NormalizedJob } from "../../ingest/types";
import { decodeHtmlEntities } from "./description";
import { formatNiche } from "./niches";

export type JobSearchHit = {
  job: NormalizedJob;
  score: number;
  snippet: string | null;
};

type SearchFields = {
  title: string;
  company: string;
  location: string;
  visible: string;
  extras: string;
  description: string;
};

const TITLE = 8;
const COMPANY = 5;
const LOCATION = 3;
const BODY = 1;

/** Quoted phrases stay intact; other terms split on whitespace. Skip 1-char tokens. */
export function parseSearchQuery(query: string): string[] {
  const tokens: string[] = [];
  let rest = query.trim();
  while (rest) {
    if (rest.startsWith('"')) {
      const end = rest.indexOf('"', 1);
      if (end === -1) {
        pushWords(tokens, rest.slice(1));
        break;
      }
      pushPhrase(tokens, rest.slice(1, end));
      rest = rest.slice(end + 1).trim();
      continue;
    }
    const match = /^(\S+)(.*)$/.exec(rest);
    if (!match) break;
    pushPhrase(tokens, match[1].replace(/^"+|"+$/g, ""));
    rest = match[2].trim();
  }
  return tokens;
}

export function searchJobs(
  jobs: NormalizedJob[],
  query: string,
): JobSearchHit[] {
  const tokens = parseSearchQuery(query);
  if (tokens.length === 0) {
    return jobs.map((job) => ({ job, score: 0, snippet: null }));
  }

  const hits: JobSearchHit[] = [];
  for (const job of jobs) {
    const fields = jobSearchFields(job);
    if (!tokens.every((token) => tokenInJob(fields, token))) continue;
    hits.push({
      job,
      score: scoreJob(fields, tokens),
      snippet: matchSnippet(fields, tokens),
    });
  }

  return hits.sort((left, right) => right.score - left.score);
}

export function highlightSnippet(
  snippet: string,
  tokens: string[],
): Array<{ text: string; match: boolean }> {
  if (!snippet || tokens.length === 0) return [{ text: snippet, match: false }];

  const ranges: Array<{ start: number; end: number }> = [];
  for (const token of tokens) {
    let from = 0;
    while (from < snippet.length) {
      const index = findTokenIndex(snippet, token, from);
      if (index === -1) break;
      ranges.push({ start: index, end: index + token.length });
      from = index + 1;
    }
  }
  ranges.sort((left, right) => left.start - right.start || right.end - left.end);

  const merged: Array<{ start: number; end: number }> = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range.start <= last.end) {
      last.end = Math.max(last.end, range.end);
    } else {
      merged.push({ ...range });
    }
  }

  const parts: Array<{ text: string; match: boolean }> = [];
  let cursor = 0;
  for (const range of merged) {
    if (range.start > cursor) {
      parts.push({ text: snippet.slice(cursor, range.start), match: false });
    }
    parts.push({ text: snippet.slice(range.start, range.end), match: true });
    cursor = range.end;
  }
  if (cursor < snippet.length) {
    parts.push({ text: snippet.slice(cursor), match: false });
  }
  return parts.length ? parts : [{ text: snippet, match: false }];
}

export function jobSearchFields(job: NormalizedJob): SearchFields {
  const title = foldSearchText(job.title);
  const company = foldSearchText(job.company);
  const location = foldSearchText(job.location);
  const extras = foldSearchText(
    [job.department, job.salary, formatNiche(job.niche)].filter(Boolean).join(" "),
  );
  const description = foldSearchText(job.description);
  return {
    title,
    company,
    location,
    visible: `${title} ${company} ${location}`,
    extras,
    description,
  };
}

function scoreJob(fields: SearchFields, tokens: string[]): number {
  let score = 0;
  for (const token of tokens) {
    if (tokenIn(fields.title, token)) score += TITLE;
    else if (tokenIn(fields.company, token)) score += COMPANY;
    else if (tokenIn(fields.location, token)) score += LOCATION;
    else score += BODY;
  }
  return score;
}

function matchSnippet(fields: SearchFields, tokens: string[]): string | null {
  const hidden = tokens.filter(
    (token) => !tokenIn(fields.visible, token) && tokenInJob(fields, token),
  );
  if (hidden.length === 0) return null;

  let bestIndex = Number.POSITIVE_INFINITY;
  let bestToken = hidden[0] ?? "";
  for (const token of hidden) {
    const index = findTokenIndex(fields.description, token);
    if (index !== -1 && index < bestIndex) {
      bestIndex = index;
      bestToken = token;
    }
  }
  if (Number.isFinite(bestIndex)) {
    return excerptAround(fields.description, bestIndex, bestToken.length);
  }

  for (const token of hidden) {
    const index = findTokenIndex(fields.extras, token);
    if (index !== -1) return excerptAround(fields.extras, index, token.length);
  }
  return null;
}

function excerptAround(text: string, index: number, matchLength: number, radius = 72): string {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + matchLength + radius);
  let slice = text.slice(start, end).trim();
  if (start > 0) slice = slice.replace(/^\S*\s+/, "");
  if (end < text.length) slice = slice.replace(/\s+\S*$/, "");
  return `${start > 0 ? "…" : ""}${slice}${end < text.length ? "…" : ""}`;
}

function tokenInJob(fields: SearchFields, token: string): boolean {
  return (
    tokenIn(fields.visible, token) ||
    tokenIn(fields.extras, token) ||
    tokenIn(fields.description, token)
  );
}

function tokenIn(text: string, token: string): boolean {
  return findTokenIndex(text, token) !== -1;
}

/**
 * Whole-word match, plus camelCase suffixes so "CAD" hits ArtiosCAD / AutoCAD
 * without matching "pet" inside "compete" or "carpet".
 */
export function findTokenIndex(text: string, token: string, from = 0): number {
  if (!text || !token) return -1;
  if (isExactAbbreviation(token)) {
    let index = text.indexOf(token, from);
    while (index !== -1) {
      if (isTokenBoundary(text, index, token.length)) return index;
      index = text.indexOf(token, index + 1);
    }
    return -1;
  }

  const lower = text.toLowerCase();
  const needle = token.toLowerCase();
  let index = lower.indexOf(needle, from);
  while (index !== -1) {
    if (isTokenBoundary(text, index, needle.length)) return index;
    index = lower.indexOf(needle, index + 1);
  }
  return -1;
}

function isExactAbbreviation(token: string): boolean {
  return /^[A-Z0-9][A-Z0-9/+-]*$/.test(token) && /[A-Z]/.test(token);
}

function isTokenBoundary(text: string, index: number, length: number): boolean {
  const before = index > 0 ? text[index - 1] ?? "" : "";
  const after = text[index + length] ?? "";
  const afterOk = after === "" || !isAlphaNum(after);
  if (!afterOk) return false;
  if (before === "" || !isAlphaNum(before)) return true;
  // camelCase: "...sCAD" — previous letter is lowercase, match starts uppercase.
  return /[a-z]/.test(before) && /[A-Z]/.test(text[index] ?? "");
}

function isAlphaNum(char: string): boolean {
  return /[A-Za-z0-9]/.test(char);
}

function foldSearchText(value: string): string {
  return decodeHtmlEntities(value)
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pushPhrase(tokens: string[], raw: string) {
  const phrase = raw.trim().replace(/\s+/g, " ");
  if (phrase.length < 2) return;
  const key = phrase.toLowerCase();
  if (tokens.some((token) => token.toLowerCase() === key)) return;
  tokens.push(phrase);
}

function pushWords(tokens: string[], raw: string) {
  for (const word of raw.split(/\s+/)) {
    pushPhrase(tokens, word);
  }
}
