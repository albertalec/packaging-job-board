/** Prefer ISO dates; approximate relative Workday strings for sorting / JSON-LD. */
export function toIsoDate(
  postedAt: string | null | undefined,
  now = Date.now(),
): string | null {
  if (!postedAt) return null;
  const trimmed = postedAt.trim();
  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();

  if (/posted\s+today/i.test(trimmed)) return new Date(now).toISOString();
  if (/posted\s+yesterday/i.test(trimmed)) {
    return new Date(now - 86_400_000).toISOString();
  }

  const days = trimmed.match(/posted\s+(\d+)\+?\s*days?\s+ago/i);
  if (days) {
    const n = Number.parseInt(days[1], 10);
    if (!Number.isNaN(n)) {
      return new Date(now - n * 86_400_000).toISOString();
    }
  }

  return null;
}

/** Milliseconds since epoch for sorting; unknown/unparseable dates sort last. */
export function postedTimestamp(
  postedAt: string | null | undefined,
  now = Date.now(),
): number {
  const iso = toIsoDate(postedAt, now);
  if (!iso) return 0;
  const time = Date.parse(iso);
  return Number.isNaN(time) ? 0 : time;
}
