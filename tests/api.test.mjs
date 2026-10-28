import assert from "node:assert/strict";
import { test, after } from "node:test";

const base = process.env.TASKFLOW_TEST_URL || "http://127.0.0.1:5173";
const ids = new Set();
const request = (path, method = "GET", body, headers = {}) =>
  fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
after(async () => {
  for (const id of ids) await request(`/api/tasks/${id}`, "DELETE");
});

test("REST lifecycle persists edits, completion, reopening, and deletion", async () => {
  const create = await request("/api/tasks", "POST", {
    title: "  API lifecycle test  ",
    description: "Persist these details",
    priority: "high",
    category: "learning",
    dueDate: "2028-02-29",
  });
  assert.equal(create.status, 201);
  const { task } = await create.json();
  ids.add(task.id);
  assert.equal(task.title, "API lifecycle test");
  assert.equal(task.completed, false);
  assert.equal(task.completedAt, null);
  const update = await request(`/api/tasks/${task.id}`, "PATCH", {
    title: "Updated task",
  });
  assert.equal(update.status, 200);
  const edited = (await update.json()).task;
  assert.equal(edited.priority, "high");
  assert.equal(edited.description, "Persist these details");
  assert.equal(edited.dueDate, "2028-02-29");
  const complete = (
    await (
      await request(`/api/tasks/${task.id}`, "PUT", { completed: true })
    ).json()
  ).task;
  assert.equal(complete.completed, true);
  assert.ok(complete.completedAt);
  const list = await request("/api/tasks");
  assert.equal(list.status, 200);
  assert.equal(
    (await list.json()).tasks.find((item) => item.id === task.id).title,
    "Updated task",
  );
  const reopen = (
    await (
      await request(`/api/tasks/${task.id}`, "PATCH", { completed: false })
    ).json()
  ).task;
  assert.equal(reopen.completedAt, null);
  assert.equal(reopen.completed, false);
  assert.equal((await request(`/api/tasks/${task.id}`, "DELETE")).status, 204);
  ids.delete(task.id);
  assert.equal((await request(`/api/tasks/${task.id}`, "DELETE")).status, 404);
});

test("rejects invalid tasks, impossible dates, malformed JSON, oversized bodies, and unknown fields", async () => {
  for (const body of [
    { title: " " },
    { title: "x", priority: "urgent" },
    { title: "x", completed: "true" },
    { title: "x", dueDate: "2026-02-30" },
    { title: "x", surprise: true },
    { title: "x", sourceUrl: "https://evil.example/" },
  ]) {
    assert.equal((await request("/api/tasks", "POST", body)).status, 400);
  }
  assert.equal(
    (
      await fetch(`${base}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{bad",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request(
        "/api/tasks",
        "POST",
        { title: "x" },
        { "Content-Type": "text/plain" },
      )
    ).status,
    415,
  );
  assert.equal(
    (
      await request("/api/tasks", "POST", {
        title: "x",
        description: "a".repeat(21000),
      })
    ).status,
    413,
  );
  assert.equal(
    (
      await request(
        "/api/tasks",
        "POST",
        { title: "x" },
        { Origin: "https://example.com" },
      )
    ).status,
    403,
  );
  assert.equal((await request("/api/tasks/not-an-id", "DELETE")).status, 400);
  assert.equal(
    (
      await request(
        "/api/tasks/00000000-0000-4000-8000-000000000001",
        "PATCH",
        {},
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await request(
        "/api/tasks/00000000-0000-4000-8000-000000000001",
        "PATCH",
        { title: "Missing" },
      )
    ).status,
    404,
  );
});

test("GitHub issue imports are unique at the database level", async () => {
  const body = {
    title: "Import test",
    sourceUrl: `https://github.com/taskflow-assessment/test/issues/${Date.now()}`,
  };
  const first = await request("/api/tasks", "POST", body);
  assert.equal(first.status, 201);
  ids.add((await first.json()).task.id);
  const duplicate = await request("/api/tasks", "POST", body);
  assert.equal(duplicate.status, 409);
  assert.match((await duplicate.json()).error, /already/);
});

test("GitHub integration rejects arbitrary upstream hosts", async () => {
  const response = await request("/api/github?repo=https://example.com");
  assert.equal(response.status, 400);
});
