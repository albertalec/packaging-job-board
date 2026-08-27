/** Higher means closer to the homepage promise: engineer / package-dev / R&D. */
export function promiseRank(title: string): number {
  const t = title.toLowerCase();
  if (
    /\b(procurement|category manager|account manager|sales|sourcing|commodity(?:\s+\w+){0,3}\s+manager|commodity risk)\b/.test(t) ||
    /\b(corrugator|corrugated supervisor|fleet budget|creative director|art director)\b/.test(
      t,
    ) ||
    /\b(system user|delivery leader|packaging equipment|packaging machinery)\b/.test(
      t,
    ) ||
    (/\bprocess engineer\b/.test(t) &&
      !/\bpackag(?:e|ing) engineer/.test(t))
  ) {
    return 0;
  }

  const intern = /\b(intern(?:ship)?|co-op|coop|campus recruit)\b/.test(t);
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

/** BCM / DR titles for the Resilience board. */
export function promiseRankBusinessContinuity(title: string): number {
  const t = title.toLowerCase();
  if (
    /\b(help\s?desk|service desk|desktop support|software engineer|network engineer|sysadmin|it support|site reliability|chaos engineering|product resilience)\b/.test(
      t,
    ) &&
    !/\b(business continuity|disaster recovery|bcm|continuity of (?:operations|business)|operational resilience|enterprise resilience)\b/.test(
      t,
    )
  ) {
    return 0;
  }

  const intern = /\b(intern(?:ship)?|co-op|coop|campus recruit)\b/.test(t);
  const core =
    /\b(business continuity manager|bcm manager|disaster recovery manager|dr manager|resilience manager|continuity manager|dr architect|resilience architect|business continuity director|bcm director|operational resilience manager|enterprise resilience)\b/.test(
      t,
    ) ||
    (/\b(business continuity|disaster recovery|operational resilience|enterprise resilience|bcm|continuity of (?:operations|business)|bc\/dr|bcdr)\b/.test(
      t,
    ) &&
      /\b(manager|director|architect|engineer|lead|specialist|analyst|advisor)\b/.test(
        t,
      ));

  if (core && !intern) return 3;
  if (core && intern) return 2;
  return 1;
}

export function promiseRankForVertical(title: string, verticalId: string): number {
  if (verticalId === "businesscontinuity") {
    return promiseRankBusinessContinuity(title);
  }
  return promiseRank(title);
}
