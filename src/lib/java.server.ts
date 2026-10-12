// Server-only client for the Java business service.
// Never import from components; only from server function handlers.

export class JavaServiceError extends Error {
  constructor(
    message: string,
    public readonly kind: "not_configured" | "unreachable" | "unauthorized" | "rule" | "bad_response",
    public readonly messages: string[] = [],
  ) {
    super(message);
  }
}

function config() {
  const url = process.env["JAVA_SERVICE_URL"];
  const key = process.env["JAVA_SERVICE_API_KEY"];
  if (!url || !key) {
    throw new JavaServiceError(
      "Java business service is not configured. Add JAVA_SERVICE_URL and JAVA_SERVICE_API_KEY in project secrets.",
      "not_configured",
    );
  }
  return { url: url.replace(/\/+$/, ""), key };
}

export async function callJava<T>(path: string, body: unknown): Promise<T> {
  const { url, key } = config();
  let res: Response;
  try {
    res = await fetch(`${url}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", "X-Service-Key": key },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
  } catch (e) {
    console.error("Java service unreachable", e);
    throw new JavaServiceError(
      "Java business service is unreachable. It may be starting up (free hosting sleeps) — wait a minute and try again.",
      "unreachable",
    );
  }
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* handled below */
  }
  if (res.status === 401 || res.status === 503) {
    throw new JavaServiceError("Java service rejected the server key. Check that both sides use the same key.", "unauthorized");
  }
  if (res.status === 409 || res.status === 422 || res.status === 400) {
    const messages: string[] = Array.isArray(json?.messages) ? json.messages.map(String) : ["Request rejected"];
    throw new JavaServiceError(messages.join("; "), "rule", messages);
  }
  if (!res.ok || !json) {
    throw new JavaServiceError(`Java service returned an unexpected response (${res.status}).`, "bad_response");
  }
  return json as T;
}

export async function javaHealth(): Promise<{ ok: boolean; detail: string }> {
  const url = process.env["JAVA_SERVICE_URL"];
  if (!url || !process.env["JAVA_SERVICE_API_KEY"]) return { ok: false, detail: "Not configured" };
  try {
    const res = await fetch(`${url.replace(/\/+$/, "")}/health`, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return { ok: false, detail: `Health check returned ${res.status}` };
    const j = (await res.json()) as { version?: string; java?: string };
    return { ok: true, detail: `Running v${j.version ?? "?"} on Java ${j.java ?? "?"}` };
  } catch {
    return { ok: false, detail: "Unreachable" };
  }
}
