export function parseVerticalArg(
  argv: string[],
  env: { INGEST_VERTICAL?: string } = process.env,
): string {
  const flag = argv.find((arg) => arg.startsWith("--vertical="));
  if (flag) {
    const value = flag.slice("--vertical=".length).trim();
    if (value) return value;
  }
  const index = argv.indexOf("--vertical");
  if (index >= 0) {
    const value = argv[index + 1]?.trim();
    if (value && !value.startsWith("--")) return value;
  }
  return env.INGEST_VERTICAL?.trim() || "packaging";
}
