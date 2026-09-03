import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Some Workday tenants (e.g. Truist) reject Node fetch with HTTP 500 but accept curl. */
export async function workdayFetch(
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string },
): Promise<{ ok: boolean; status: number; text: string }> {
  const method = init.method ?? "GET";
  const res = await fetch(url, {
    method,
    headers: init.headers,
    body: init.body,
  });
  const text = await res.text();
  if (res.ok || res.status !== 500) {
    return { ok: res.ok, status: res.status, text };
  }

  const args = ["-sS", "-X", method, url];
  for (const [key, value] of Object.entries(init.headers ?? {})) {
    args.push("-H", `${key}: ${value}`);
  }
  if (init.body) args.push("-d", init.body);
  try {
    const { stdout } = await execFileAsync("curl", args);
    return { ok: true, status: 200, text: stdout };
  } catch {
    return { ok: false, status: res.status, text };
  }
}
