import { HttpError } from "./http.ts";

type Repo = {
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  open_issues_count: number;
};
type Issue = {
  number: number;
  title: string;
  html_url: string;
  created_at: string;
  pull_request?: unknown;
  labels: { name: string; color: string }[];
};

export async function fetchGitHubRepository(
  repo: string,
  fetcher: typeof fetch = fetch,
) {
  if (
    !/^[a-zA-Z0-9-]{1,39}\/[a-zA-Z0-9_.-]{1,100}$/.test(repo) ||
    repo.endsWith("/.") ||
    repo.endsWith("/..")
  )
    throw new HttpError(400, "Enter a repository as owner/name.");
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "Taskflow-Assessment",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  async function get(path: string) {
    const response = await fetcher(
      `https://api.github.com/repos/${repo}${path}`,
      { headers, signal: AbortSignal.timeout(8000) },
    );
    if (response.status === 404)
      throw new HttpError(
        404,
        "Repository not found. Choose a public GitHub repository.",
      );
    if (response.status === 403 || response.status === 429)
      throw new HttpError(
        429,
        "GitHub’s request limit was reached. Please try again later.",
      );
    if (!response.ok)
      throw new HttpError(
        502,
        "GitHub is unavailable right now. Please try again.",
      );
    return response.json();
  }
  const [repository, issues] = (await Promise.all([
    get(""),
    get("/issues?state=open&sort=created&direction=desc&per_page=30"),
  ])) as [Repo, Issue[]];
  return {
    repository: {
      name: repository.full_name,
      description: repository.description,
      url: repository.html_url,
      stars: repository.stargazers_count,
      language: repository.language,
      openIssues: repository.open_issues_count,
    },
    issues: issues
      .filter((issue) => !issue.pull_request)
      .slice(0, 4)
      .map((issue) => ({
        number: issue.number,
        title: issue.title,
        url: issue.html_url,
        createdAt: issue.created_at,
        labels: issue.labels
          .slice(0, 2)
          .map(({ name, color }) => ({ name, color })),
      })),
    fetchedAt: new Date().toISOString(),
  };
}

export type GitHubData = Awaited<ReturnType<typeof fetchGitHubRepository>>;
