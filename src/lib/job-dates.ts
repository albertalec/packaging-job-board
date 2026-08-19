/** Parse ATS posted-at strings into a Date for structured data and display. */
export function parsePostedAt(postedAt: string | null): Date | null {
  if (!postedAt) return null;

  const parsed = Date.parse(postedAt);
  if (!Number.isNaN(parsed)) return new Date(parsed);

  const relative = postedAt.match(/posted\s+(\d+)\+?\s*days?\s+ago/i);
  if (relative) {
    const days = Number.parseInt(relative[1] ?? "", 10);
    if (Number.isNaN(days)) return null;
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - days);
    date.setUTCHours(12, 0, 0, 0);
    return date;
  }

  return null;
}

export function toIsoDate(date: Date | null): string | undefined {
  if (!date) return undefined;
  return date.toISOString().slice(0, 10);
}
