import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchGitHubRepository } from "../lib/github.ts";
import { taskInput, taskPatch } from "../lib/task-validation.ts";

const repo = {
  full_name: "facebook/react",
  html_url: "https://github.com/facebook/react",
  description: "React",
  stargazers_count: 1,
  language: "JavaScript",
  open_issues_count: 10,
};
const issues = Array.from({ length: 8 }, (_, i) => ({
  number: i + 1,
  title: `Issue ${i}`,
  html_url: `https://github.com/facebook/react/issues/${i + 1}`,
  created_at: "2026-01-01",
  labels: [],
  ...(i === 0 ? { pull_request: {} } : {}),
}));

test("GitHub adapter filters pull requests and limits the response", async () => {
  const calls: string[] = [];
  const fetcher = (async (url, options) => {
    calls.push(String(url));
    assert.equal(
      options?.headers &&
        (options.headers as Record<string, string>)["User-Agent"],
      "Taskflow-Assessment",
    );
    return Response.json(String(url).includes("/issues?") ? issues : repo);
  }) as typeof fetch;
  const result = await fetchGitHubRepository("facebook/react", fetcher);
  assert.equal(result.issues.length, 4);
  assert.equal(result.issues[0].number, 2);
  assert.equal(result.repository.name, "facebook/react");
  assert.equal(calls.length, 2);
  assert.ok(
    calls.every((url) =>
      url.startsWith("https://api.github.com/repos/facebook/react"),
    ),
  );
});

test("GitHub adapter maps upstream failures and validates repository names before fetching", async () => {
  for (const [status, expected] of [
    [404, 404],
    [403, 429],
    [429, 429],
    [500, 502],
  ]) {
    await assert.rejects(
      fetchGitHubRepository(
        "facebook/react",
        (async () => new Response("", { status })) as typeof fetch,
      ),
      (error: unknown) => (error as { status: number }).status === expected,
    );
  }
  for (const name of [
    "https://evil.example",
    "owner/../repo",
    "owner/..",
    "owner/.",
    "",
    "owner/repo?x=y",
  ]) {
    await assert.rejects(
      fetchGitHubRepository(name, (async () => {
        throw new Error("must not fetch");
      }) as typeof fetch),
      (error: unknown) => (error as { status: number }).status === 400,
    );
  }
});

test("task validation preserves partial updates and rejects impossible dates", () => {
  assert.deepEqual(taskPatch.parse({ title: "  Changed  " }), {
    title: "Changed",
  });
  assert.equal(taskInput.parse({ title: " New " }).title, "New");
  assert.equal(
    taskInput.safeParse({ title: "Date", dueDate: "2027-02-29" }).success,
    false,
  );
  assert.equal(
    taskInput.safeParse({ title: "Date", dueDate: "2028-02-29" }).success,
    true,
  );
  assert.equal(taskPatch.safeParse({}).success, false);
  assert.equal(taskPatch.safeParse({ id: "new-id" }).success, false);
});
