import { fetchGitHubRepository } from "@/lib/github";
import { errorResponse, HttpError, json } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const repo =
      new URL(request.url).searchParams.get("repo") ?? "facebook/react";
    return json(await fetchGitHubRepository(repo));
  } catch (error) {
    if (
      error instanceof Error &&
      ["TimeoutError", "AbortError"].includes(error.name)
    )
      return errorResponse(
        new HttpError(
          504,
          "GitHub took too long to respond. Please try again.",
        ),
      );
    return errorResponse(error);
  }
}
