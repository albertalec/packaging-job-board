export type DescriptionBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

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
  const withBreaks = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
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
  const withHeadings = insertHeadingBreaks(withEeo);
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
  for (const chunk of normalized.split(/\n\s*\n/)) {
    const trimmed = chunk.trim();
    if (!trimmed || ATS_NOISE.test(trimmed)) continue;
    blocks.push(...chunkToBlocks(trimmed));
  }
  return mergeLists(blocks);
}

function chunkToBlocks(chunk: string): DescriptionBlock[] {
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

function isPlausibleHeading(
  raw: string,
  atStart: boolean,
  before: string,
): boolean {
  const hasColon = /:$/.test(raw.trim());
  const label = raw.replace(/:$/, "").trim();
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
