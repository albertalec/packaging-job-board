import Link from "next/link";

export default function NotFound() {
  return (
    <article className="sponsor-page">
      <p className="kicker">404</p>
      <h1>Page not found</h1>
      <p className="lede">That URL is not on this board.</p>
      <Link className="apply big" href="/">
        Back to home
      </Link>
    </article>
  );
}
