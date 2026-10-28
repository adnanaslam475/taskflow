import { ZodError } from "zod";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    throw new HttpError(403, "Cross-origin requests are not allowed.");
}

export async function readJson(request: Request) {
  checkOrigin(request);
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new HttpError(415, "Send application/json.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "A JSON body is required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      // Retain at most 20 KB; discard oversized input through EOF so the
      // runtime can safely reuse the connection for the next request.
      if (size > 20_000) chunks.length = 0;
      else chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (size > 20_000) throw new HttpError(413, "Request body is too large.");
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new HttpError(400, "Send a valid JSON body.");
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof ZodError)
    return json(
      {
        error: error.issues[0]?.message ?? "Invalid request.",
        details: error.flatten(),
      },
      400,
    );
  if (error instanceof HttpError)
    return json({ error: error.message }, error.status);
  if (
    error instanceof Error &&
    /UNIQUE constraint failed: tasks.source_url/.test(
      error.message + String(error.cause),
    )
  )
    return json({ error: "This GitHub issue is already in your tasks." }, 409);
  console.error("API request failed", error);
  return json({ error: "Something went wrong. Please try again." }, 500);
}
