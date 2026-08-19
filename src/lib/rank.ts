/** Higher means closer to the homepage promise: engineer / package-dev / R&D. */
export function promiseRank(title: string): number {
  const t = title.toLowerCase();
  if (
    /\b(procurement|category manager|account manager|sales)\b/.test(t) ||
    /\b(corrugator supervisor|corrugated supervisor|corrugator specialist|fleet budget)\b/.test(
      t,
    )
  ) {
    return 0;
  }

  const intern = /\b(intern|co-op|coop|campus recruit)\b/.test(t);
  const core =
    /\b(packaging engineer|package engineer|package development|packaging development|packaging scientist|packaging technologist|package designer|structural packaging|packaging r&d|r&d packaging)\b/.test(
      t,
    ) ||
    (/\b(engineer|scientist|technologist|designer)\b/.test(t) &&
      /\bpackag/.test(t));

  if (core && !intern) return 3;
  if (core && intern) return 2;
  return 1;
}
