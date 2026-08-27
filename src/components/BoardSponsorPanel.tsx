import Link from "next/link";
import { formatUsd } from "@/lib/tenant";

export function BoardSponsorPanel({
  title,
  priceCents,
  durationDays,
}: {
  title: string;
  priceCents: number;
  durationDays: number;
}) {
  const price = formatUsd(priceCents);
  const duration = durationDays === 30 ? "thirty" : String(durationDays);

  return (
    <section className="board-sponsor-panel" aria-label="Pin a listing">
      <div className="board-sponsor-copy">
        <h2 className="board-sponsor-title">{title}</h2>
        <p className="board-sponsor-body">
          Pin the listing you already have — {price} for {duration} days, scoped
          to this board. Candidates finish on your ATS.
        </p>
      </div>
      <Link className="board-btn board-btn-amber" href="/sponsor">
        Pin a listing — {price}
      </Link>
    </section>
  );
}
