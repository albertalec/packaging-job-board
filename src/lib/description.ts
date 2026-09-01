export type RubricRow = {
  competency: string;
  level: string;
  description: string;
};

export type DescriptionBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "rubric"; rows: RubricRow[] };

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  hellip: "…",
  bull: "•",
  middot: "·",
  trade: "™",
  copy: "©",
  reg: "®",
  deg: "°",
  times: "×",
  plusmn: "±",
};

/** ATS section labels, longest first so "minimum qualifications" wins over "qualifications". */
const SECTION_HEADINGS = [
  "about us (and our exciting future)",
  "reasonable accommodation request",
  "reasonable accomodation request",
  "equal opportunity employer (eoe)",
  "a taste of your responsibilities",
  "compensation and benefits",
  "additional considerations",
  "preferred qualifications",
  "what we look for",
  "what's in it for you",
  "what’s in it for you",
  "what is required",
  "preferred experience",
  "minimum qualifications",
  "equal opportunity employer",
  "key accountabilities",
  "all job posting locations",
  "additional locations",
  "company overview",
  "position overview",
  "job sub function",
  "primary location",
  "worker sub-type",
  "your role at clorox",
  "what you will do",
  "what you'll do",
  "what we offer",
  "to be considered",
  "job description",
  "about the role",
  "salary range",
  "job overview",
  "equal opportunity",
  "qualifications",
  "responsibilities",
  "requirements",
  "how to apply",
  "job function",
  "job category",
  "worker type",
  "time type",
  "eligibility",
  "who we are",
  "what we do",
  "about you",
  "about us",
  "your role",
  "the role",
  "overview",
  "purpose",
  "benefits",
  "education and experience you'll bring",
  "education and experience you’ll bring",
  "education and experience",
  "education",
  "experience",
].sort((left, right) => right.length - left.length);

const HEADING_PATTERN = new RegExp(
  `(?<![\\w])(${SECTION_HEADINGS.map(escapeRegExp).join("|")})\\s*:?`,
  "gi",
);

const WEAK_HEADINGS = new Set([
  "about us",
  "about you",
  "benefits",
  "education",
  "eligibility",
  "experience",
  "overview",
  "purpose",
  "qualifications",
  "requirements",
  "responsibilities",
  "the role",
  "what we do",
  "who we are",
  "your role",
]);

const ATS_NOISE =
  /^(menasha corporation employees, please log-in|job descriptions may display in multiple languages)\b/i;

/** Standalone labels that are usually subheads, not section breaks. */
const STRUCTURAL_HEADING_STOPWORDS = new Set([
  "apply now",
  "preferred",
  "required",
  ...WEAK_HEADINGS,
]);

/** Small words allowed in title-case section labels. */
const TITLE_CASE_MINOR_WORDS = new Set([
  "a",
  "an",
  "and",
  "at",
  "for",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "vs",
  "versus",
  "with",
  "&",
  "what",
  "how",
  "why",
  "when",
  "where",
  "who",
]);

/** First words that commonly start employer-written section labels. */
const SECTION_START_WORDS = new Set([
  "a",
  "about",
  "accommodation",
  "additional",
  "all",
  "an",
  "better",
  "candidate",
  "compensation",
  "core",
  "cross",
  "discover",
  "drive",
  "environmental",
  "equal",
  "essential",
  "execution",
  "focus",
  "group",
  "how",
  "inclusion",
  "ingredients",
  "job",
  "key",
  "lead",
  "leadership",
  "magna",
  "manufacturing",
  "minimum",
  "operational",
  "optional",
  "our",
  "packaging",
  "partner",
  "physical",
  "position",
  "preferred",
  "primary",
  "process",
  "quality",
  "reasonable",
  "recruitment",
  "required",
  "role",
  "strategy",
  "support",
  "talent",
  "technical",
  "the",
  "travel",
  "validation",
  "what",
  "why",
  "work",
  "working",
  "your",
]);

const JOB_TITLE_SUFFIX =
  /\b(?:analyst|architect|consultant|coordinator|director|engineer|engineering|manager|specialist|technician)\s*$/i;

const COMPETENCY_RUBRIC_START = "[[COMPETENCY-RUBRIC]]";
const COMPETENCY_RUBRIC_END = "[[/COMPETENCY-RUBRIC]]";
const COMPETENCY_RUBRIC_PATTERN =
  /\[\[COMPETENCY-RUBRIC\]\]([\s\S]*?)\[\[\/COMPETENCY-RUBRIC\]\]/g;

const COMPETENCY_LEVEL_RE =
  /^(?:performing|developing|exceeding|not demonstrated|needs improvement|advanced|proficient|foundational|n\/a|na)$/i;

const RUBRIC_HEADER_LABELS = new Set([
  "behavioral description",
  "functional competency",
]);

export function decodeHtmlEntities(input: string): string {
  return input.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body: string) => {
    const key = body.toLowerCase();
    if (key.startsWith("#x")) {
      const codePoint = Number.parseInt(key.slice(2), 16);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    if (key.startsWith("#")) {
      const codePoint = Number.parseInt(key.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    return NAMED_ENTITIES[key] ?? match;
  });
}

export function htmlToPlainText(html: string): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
  const withRubrics = withoutScripts.replace(
    /<table[\s\S]*?<\/table>/gi,
    (tableHtml) => serializeCompetencyTable(tableHtml) ?? flattenTableHtml(tableHtml),
  );
  const withBreaks = withRubrics
    .replace(/<\/(p|div|h[1-6]|tr|table|section|article|header|footer|blockquote)>/gi, "\n\n")
    .replace(/<(br|hr)\s*\/?>/gi, "\n")
    .replace(/<\/(li|dt|dd)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ");
  const withoutTags = withBreaks.replace(/<[^>]+>/g, " ");
  return normalizeDescription(withoutTags);
}

export function normalizeDescription(input: string): string {
  const decoded = decodeHtmlEntities(input)
    .replace(/\u00a0/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/\u200b/g, "")
    .replace(/[•·●▪‣]\s*/g, "• ");
  const withEeo = splitEqualOpportunity(decoded);
  const withMergedHeadings = mergeFragmentedSectionHeadings(withEeo);
  const withHeadings = insertHeadingBreaks(withMergedHeadings);
  return withHeadings
    .split("\n")
    .map((line) => line.replace(/[ \t\f\v]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function parseJobDescription(input: string): DescriptionBlock[] {
  const normalized = normalizeDescription(input);
  if (!normalized) return [];

  const blocks: DescriptionBlock[] = [];
  let cursor = 0;
  COMPETENCY_RUBRIC_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = COMPETENCY_RUBRIC_PATTERN.exec(normalized))) {
    blocks.push(...parseDescriptionSegment(normalized.slice(cursor, match.index)));
    blocks.push(parseSerializedRubric(match[1] ?? ""));
    cursor = match.index + match[0].length;
  }
  blocks.push(...parseDescriptionSegment(normalized.slice(cursor)));
  return mergeLists(blocks);
}

function parseDescriptionSegment(text: string): DescriptionBlock[] {
  const chunks = text
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk && !ATS_NOISE.test(chunk));

  const blocks: DescriptionBlock[] = [];
  for (let index = 0; index < chunks.length; ) {
    const rubric = tryParseRubricFromChunks(chunks, index);
    if (rubric) {
      blocks.push(rubric.block);
      index = rubric.nextIndex;
      continue;
    }
    blocks.push(...chunkToBlocks(chunks[index] ?? "", chunks[index + 1]));
    index += 1;
  }
  return blocks;
}

const EMPLOYER_HEADINGS = new Set([
  "about us",
  "about us (and our exciting future)",
  "company overview",
  "who we are",
]);

/** Pull company-overview copy out of the posting body for the employer panel. */
export function splitEmployerAbout(blocks: DescriptionBlock[]): {
  about: DescriptionBlock[];
  rest: DescriptionBlock[];
} {
  const about: DescriptionBlock[] = [];
  const rest: DescriptionBlock[] = [];
  let inAbout = false;
  for (const block of blocks) {
    if (block.type === "heading") {
      inAbout = EMPLOYER_HEADINGS.has(block.text.toLowerCase());
      if (inAbout) continue;
    }
    if (inAbout) about.push(block);
    else rest.push(block);
  }
  return { about, rest };
}

function chunkToBlocks(chunk: string, nextChunk?: string): DescriptionBlock[] {
  const lines = chunk.split("\n").map((line) => line.trim()).filter(Boolean);
  const heading = matchHeadingPrefix(lines[0] ?? "");
  if (heading && heading.rest === "" && lines.length === 1) {
    return [{ type: "heading", text: heading.label }];
  }

  if (heading) {
    const restLines = heading.rest
      ? [heading.rest, ...lines.slice(1)]
      : lines.slice(1);
    return [
      { type: "heading", text: heading.label },
      ...linesToContent(restLines),
    ];
  }

  if (lines.length === 1) {
    const line = lines[0] ?? "";
    if (looksLikeStructuralHeading(line)) {
      return [
        {
          type: "heading",
          text: displayHeading(line.replace(/:$/, "").trim()),
        },
      ];
    }
    if (
      nextChunk &&
      isBulletListChunk(nextChunk) &&
      looksLikeListIntroHeading(line)
    ) {
      return [
        {
          type: "heading",
          text: displayHeading(line.replace(/:$/, "").trim()),
        },
      ];
    }
  }

  return linesToContent(lines);
}

function linesToContent(lines: string[]): DescriptionBlock[] {
  if (lines.length === 0) return [];
  const joined = lines.join(" ");
  const parts = joined
    .split(/(?:^|\s+)[•·●▪‣]\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const startsWithBullet = /^\s*[•·●▪‣]/.test(joined);
  if (parts.length > 1 || startsWithBullet) {
    const lead = startsWithBullet ? "" : (parts[0] ?? "");
    const items = startsWithBullet ? parts : parts.slice(1);
    const blocks: DescriptionBlock[] = [];
    if (lead) blocks.push({ type: "paragraph", text: lead });
    if (items.length) blocks.push({ type: "list", items });
    return blocks;
  }
  return [{ type: "paragraph", text: joined }];
}

function mergeLists(blocks: DescriptionBlock[]): DescriptionBlock[] {
  const merged: DescriptionBlock[] = [];
  for (const block of blocks) {
    const previous = merged[merged.length - 1];
    if (block.type === "list" && previous?.type === "list") {
      previous.items.push(...block.items);
    } else {
      merged.push(block);
    }
  }
  return merged;
}

function matchHeadingPrefix(
  line: string,
): { label: string; rest: string } | null {
  HEADING_PATTERN.lastIndex = 0;
  const match = HEADING_PATTERN.exec(line);
  if (!match || match.index !== 0) return null;
  if (!isPlausibleHeading(match[0], true, "")) return null;
  const rest = line.slice(match[0].length).trim();
  return { label: displayHeading(match[1]), rest };
}

function insertHeadingBreaks(text: string): string {
  const matches: Array<{ start: number; end: number; label: string }> = [];
  HEADING_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = HEADING_PATTERN.exec(text))) {
    const before = text.slice(0, match.index);
    const atStart = match.index === 0 || /\n\s*$/.test(before);
    if (!isPlausibleHeading(match[0], atStart, before)) continue;
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      label: displayHeading(match[1]),
    });
  }

  if (matches.length === 0) return text;

  let output = "";
  let cursor = 0;
  for (const heading of matches) {
    output += text.slice(cursor, heading.start).trimEnd();
    output += `${output && !output.endsWith("\n") ? "\n\n" : ""}${heading.label}\n\n`;
    cursor = heading.end;
  }
  output += text.slice(cursor);
  return output;
}

function mergeFragmentedSectionHeadings(text: string): string {
  return text.replace(
    /\b(education)\b\s*\n+\s*and\s*\n+\s*\b(experience)\b(?:\n+\s*,?\s*(you(?:\u2019|')ll bring))?/gi,
    (_match, education: string, experience: string, bring?: string) => {
      const heading = `${education.toUpperCase()} AND ${experience.toUpperCase()}`;
      return bring ? `${heading} ${bring.toUpperCase()}` : heading;
    },
  );
}

function looksLikeStructuralHeading(line: string): boolean {
  const { trimmed, label } = normalizeHeadingCandidate(line);
  if (!passesHeadingCandidateGuards(trimmed, label)) return false;

  const words = label.split(/\s+/);
  if (words.length < 2 || words.length > 8) return false;
  if (!looksLikeHeadingPhrase(label)) return false;

  const firstWord = words[0]?.replace(/[^A-Za-z]/g, "").toLowerCase() ?? "";
  return (
    isMostlyUppercase(label) ||
    trimmed.endsWith(":") ||
    SECTION_START_WORDS.has(firstWord)
  );
}

function looksLikeListIntroHeading(line: string): boolean {
  const { trimmed, label } = normalizeHeadingCandidate(line);
  if (!passesHeadingCandidateGuards(trimmed, label)) return false;

  const words = label.split(/\s+/);
  if (words.length < 2 || words.length > 8) return false;
  return looksLikeHeadingPhrase(label);
}

function normalizeHeadingCandidate(line: string): {
  trimmed: string;
  label: string;
} {
  const trimmed = line.trim();
  return { trimmed, label: trimmed.replace(/:$/, "").trim() };
}

function passesHeadingCandidateGuards(trimmed: string, label: string): boolean {
  if (!label || label.length > 72) return false;
  if (/^[•·●▪‣\-–—]/.test(trimmed)) return false;
  if (/[.!?…]["'”’)]*$/.test(trimmed)) return false;
  if (/^\[/.test(trimmed)) return false;
  if (/^&#/.test(trimmed)) return false;
  if (/^[^:\n]{1,60}:\s*\S/.test(trimmed)) return false;
  if (/\//.test(trimmed)) return false;
  if (/\d/.test(trimmed)) return false;
  if (/[$%]/.test(trimmed)) return false;
  if (/&\s*$/.test(trimmed)) return false;
  if (STRUCTURAL_HEADING_STOPWORDS.has(label.toLowerCase())) return false;
  if (/^(?:and|or|&)\s/i.test(label)) return false;
  if (/^[A-Z]{1,2}\s+(?:AND|OR)\s/i.test(label)) return false;
  if (/^&\s/.test(label)) return false;
  if (/^(?:what|and|&)\s/i.test(label) && label.split(/\s+/).length <= 3) {
    return false;
  }
  if (/^you(?:\u2019|')ll bring$/i.test(label)) return false;
  if ((trimmed.match(/,/g) ?? []).length >= 2) return false;
  if (/^[A-Za-z .'\u2019-]+,\s*[A-Z]{2}$/.test(trimmed)) return false;
  if (/United States of America|United Kingdom/i.test(trimmed)) return false;
  if (JOB_TITLE_SUFFIX.test(label)) return false;
  return true;
}

function isBulletListChunk(chunk: string): boolean {
  const lines = chunk
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return false;
  return lines.every((line) => /^[•·●▪‣]/.test(line));
}

function flattenTableHtml(tableHtml: string): string {
  return tableHtml
    .replace(/<\/tr>/gi, "\n\n")
    .replace(/<\/t[dh]>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
}

function stripCellHtml(cellHtml: string): string {
  return decodeHtmlEntities(
    cellHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
  );
}

function parseTableRows(tableHtml: string): string[][] {
  const rows: string[][] = [];
  for (const rowMatch of tableHtml.matchAll(/<tr[\s\S]*?<\/tr>/gi)) {
    const cells: string[] = [];
    for (const cellMatch of rowMatch[0].matchAll(/<t[dh][\s\S]*?<\/t[dh]>/gi)) {
      const text = stripCellHtml(cellMatch[0]);
      if (text) cells.push(text);
    }
    if (cells.length) rows.push(cells);
  }
  return rows;
}

function serializeCompetencyTable(tableHtml: string): string | null {
  const rows = parseTableRows(tableHtml)
    .map((row) => row.map((cell) => cell.trim()).filter(Boolean))
    .filter((row) => row.length >= 3)
    .map(([competency, level, ...rest]) => ({
      competency,
      level,
      description: rest.join(" ").trim(),
    }))
    .filter(
      (row) =>
        looksLikeCompetencyLabel(row.competency) &&
        isCompetencyLevel(row.level) &&
        row.description.length > 0,
    );

  if (rows.length < 2) return null;

  const body = rows
    .map((row) => `${row.competency} | ${row.level} | ${row.description}`)
    .join("\n");
  return `${COMPETENCY_RUBRIC_START}\n${body}\n${COMPETENCY_RUBRIC_END}`;
}

function parseSerializedRubric(body: string): DescriptionBlock {
  const rows = body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf(" | ");
      if (separator === -1) return null;
      const competency = line.slice(0, separator).trim();
      const remainder = line.slice(separator + 3);
      const levelSeparator = remainder.indexOf(" | ");
      if (levelSeparator === -1) return null;
      const level = remainder.slice(0, levelSeparator).trim();
      const description = remainder.slice(levelSeparator + 3).trim();
      if (!competency || !level || !description) return null;
      return { competency, level, description };
    })
    .filter((row): row is RubricRow => row !== null);

  return { type: "rubric", rows };
}

function tryParseRubricFromChunks(
  chunks: string[],
  start: number,
): { block: DescriptionBlock; nextIndex: number } | null {
  let index = start;
  while (index < chunks.length && isRubricHeaderChunk(chunks[index] ?? "")) {
    index += 1;
  }

  const rows: RubricRow[] = [];
  while (index + 2 < chunks.length) {
    const competency = singleLineChunk(chunks[index] ?? "");
    const level = singleLineChunk(chunks[index + 1] ?? "");
    if (!looksLikeCompetencyLabel(competency) || !isCompetencyLevel(level)) {
      break;
    }

    const descriptionParts: string[] = [];
    let descIndex = index + 2;
    while (descIndex < chunks.length) {
      if (
        descIndex + 1 < chunks.length &&
        looksLikeCompetencyLabel(singleLineChunk(chunks[descIndex] ?? "")) &&
        isCompetencyLevel(singleLineChunk(chunks[descIndex + 1] ?? ""))
      ) {
        break;
      }
      if (isRubricHeaderChunk(chunks[descIndex] ?? "")) break;
      if (isRubricBoundaryChunk(chunks[descIndex] ?? "")) break;
      descriptionParts.push(chunks[descIndex] ?? "");
      descIndex += 1;
    }

    const description = descriptionParts.join(" ").replace(/\s+/g, " ").trim();
    if (!description) break;

    rows.push({ competency, level, description });
    index = descIndex;
  }

  if (rows.length < 2) return null;
  return { block: { type: "rubric", rows }, nextIndex: index };
}

function singleLineChunk(chunk: string): string {
  return chunk.split("\n").map((line) => line.trim()).filter(Boolean)[0] ?? "";
}

function isRubricHeaderChunk(chunk: string): boolean {
  const line = singleLineChunk(chunk);
  return RUBRIC_HEADER_LABELS.has(line.toLowerCase());
}

function isRubricBoundaryChunk(chunk: string): boolean {
  if (isBulletListChunk(chunk)) return true;
  const line = singleLineChunk(chunk);
  if (/^[•·●▪‣]/.test(line)) return true;
  const trimmed = line.trim();
  if (!trimmed.endsWith(":")) return false;
  const label = trimmed.replace(/:$/, "").trim();
  if (/^disclaimer$/i.test(label)) return true;
  if (label.split(/\s+/).length < 2) return false;
  return (
    looksLikeStructuralHeading(trimmed) || looksLikeListIntroHeading(trimmed)
  );
}

function isCompetencyLevel(text: string): boolean {
  return COMPETENCY_LEVEL_RE.test(text.trim());
}

function looksLikeCompetencyLabel(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 80) return false;
  if (isCompetencyLevel(trimmed) || isRubricHeaderChunk(trimmed)) return false;
  if (/^[•·●▪‣]/.test(trimmed)) return false;
  if (/[.!?…]["'”’)]*$/.test(trimmed)) return false;
  const words = trimmed.split(/\s+/);
  if (words.length < 1 || words.length > 6) return false;
  return looksLikeHeadingPhrase(trimmed);
}

function looksLikeHeadingPhrase(text: string): boolean {
  const words = text.split(/\s+/);
  let contentWords = 0;

  for (const word of words) {
    const clean = word.replace(/[^A-Za-z\u2019']/g, "");
    if (!clean) continue;
    const lower = clean.toLowerCase();
    if (TITLE_CASE_MINOR_WORDS.has(lower)) continue;
    contentWords += 1;
    if (!/^[A-Z]/.test(clean) && clean !== clean.toUpperCase()) {
      return false;
    }
  }

  return contentWords >= 1;
}

function isPlausibleHeading(
  raw: string,
  atStart: boolean,
  before: string,
): boolean {
  const hasColon = /:$/.test(raw.trim());
  const label = raw.replace(/:$/, "").trim();
  if (WEAK_HEADINGS.has(label.toLowerCase()) && !hasColon) {
    return false;
  }
  if (isMostlyUppercase(label)) return true;
  if (atStart && /^[A-Z]/.test(label)) return true;
  if (
    hasColon &&
    /^[A-Z]/.test(label) &&
    !WEAK_HEADINGS.has(label.toLowerCase())
  ) {
    return true;
  }
  const afterSentence = /(?:^|[.!?])["'”’)]*\s*$/.test(before);
  if (
    afterSentence &&
    /^[A-Z]/.test(label) &&
    !WEAK_HEADINGS.has(label.toLowerCase())
  ) {
    return true;
  }
  return false;
}

function splitEqualOpportunity(text: string): string {
  return text.replace(
    /(?<!Equal opportunity employer\n{0,2})(?<=\S)\s+(?=[A-Z][\w&.'’-]+ is proud to be an equal opportunity employer\b)/g,
    "\n\nEqual opportunity employer\n\n",
  );
}

function isMostlyUppercase(label: string): boolean {
  const letters = label.replace(/[^A-Za-z]/g, "");
  if (letters.length < 4) return false;
  const upper = letters.replace(/[^A-Z]/g, "").length;
  return upper / letters.length >= 0.85;
}

function displayHeading(label: string): string {
  const trimmed = label.replace(/:$/, "").trim();
  if (isMostlyUppercase(trimmed)) return trimmed.toUpperCase();
  return trimmed.replace(/\s+/g, " ");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
