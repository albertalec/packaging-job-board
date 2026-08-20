export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON-LD is a trusted string we build ourselves from job fields.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
