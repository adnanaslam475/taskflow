# Taskflow

A small, full-stack task workspace built for the coding assessment. Create, edit, delete, complete, search, and organize tasks. A GitHub integration turns real public issues into persistent tasks.

**Stack:** React 19 + TypeScript, Vinext (Next.js App Router API), Cloudflare Workers, Drizzle ORM, and Cloudflare D1 (SQLite). The frontend and REST API share one origin. All task records live in SQL, not browser storage.

## Submission

- **Source repository:** a local Git repository is included. A GitHub URL is pending; no GitHub repository was supplied. See [publishing instructions](docs/SUBMISSION.md).
- **Hosted demo:** https://taskflow-assessment-28oct26.sugarygecko7.chatgpt.site (owner-private; requires the creating account).
- **Setup:** below.
- **Database:** [schema and data dictionary](docs/DATABASE.md), [Drizzle schema](db/schema.ts), and generated SQL in `drizzle/`.
- **API integration:** [implementation and evidence](docs/API-INTEGRATION.md).
- **Code review and architecture:** [review, decisions, and tradeoffs](docs/ARCHITECTURE.md). The supplied Step 4 had a heading only; this document provides an architecture review of this application.

## Run locally

Prerequisites: Node.js **22.13 or newer**, npm, and Git. No database server, API key, or Cloudflare account is needed for local development.

```sh
cd taskflow
npm ci
npm run build
npm run db:migrate
npm run dev
```

Open the local URL printed by the dev server (normally **http://localhost:5173**). The initial task list is empty. Use **Try a few sample tasks** for editable examples, or create your own. Sample data is added only when requested.

`npm run db:migrate` uses Wrangler's local migration tracking, so repeating it applies only pending migrations. Local database files are ignored under `.wrangler/state`. Restarting the app preserves tasks. Deleting this directory resets local data. Hosted D1 and local SQLite are separate databases.

For a production build preview:

```sh
npm run build
npm run start
```

Use the URL printed by Wrangler. Stop any dev server first; both previews use the same local database.

## Checks

```sh
npm run typecheck
npm test
# With the app running in a second terminal:
npm run test:api
# Use another preview URL if necessary:
TASKFLOW_TEST_URL=http://127.0.0.1:8787 npm run test:api
```

The API suite creates its own tasks and removes them afterward. It exercises CRUD, actual database round trips, validation, completion/reopening, cross-origin rejection, body limits, and duplicate issue imports. Unit tests check GitHub pull-request filtering, upstream failures, input validation, and partial updates. The GitHub panel itself uses live network requests; its availability depends on GitHub.

## REST API

| Method      | Path                              | Result                                                |
| ----------- | --------------------------------- | ----------------------------------------------------- |
| GET         | `/api/tasks`                      | `200 { tasks: Task[] }`, newest first                 |
| POST        | `/api/tasks`                      | `201 { task: Task }`                                  |
| PATCH / PUT | `/api/tasks/:id`                  | `200 { task: Task }`; both accept partial fields      |
| DELETE      | `/api/tasks/:id`                  | `204`, empty body                                     |
| GET         | `/api/github?repo=facebook/react` | Repository metadata and up to four recent open issues |

```sh
curl -X POST http://localhost:5173/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Review the assessment","priority":"high","category":"work","dueDate":"2026-11-01"}'

curl -X PATCH http://localhost:5173/api/tasks/TASK_UUID \
  -H 'Content-Type: application/json' -d '{"completed":true}'

curl -X DELETE http://localhost:5173/api/tasks/TASK_UUID
```

Task fields: `title` (required, 1–160 trimmed characters), `description` (up to 3000), `completed` (boolean), `priority` (`low`, `medium`, `high`), `category` (`work`, `personal`, `learning`), `dueDate` (`YYYY-MM-DD` or null), and `sourceUrl` (GitHub issue URL or null). IDs and UTC timestamps are server-owned. Unknown fields and impossible dates are rejected. Errors use `{ "error": "Human-readable message" }` and appropriate HTTP status codes.

This is a **single-workspace assessment app**. The hosted demo is protected by Sites owner access. Local development intentionally has no sign-in. Multi-user ownership and authentication would be added before exposing a shared public deployment; see the architecture notes.

## Project map

```text
app/
  page.tsx                  entry page
  task-workspace.tsx        task UI, filters, search, and CRUD state
  task-dialog.tsx           accessible native add/edit dialog
  github-panel.tsx          live repository lookup and import controls
  api/tasks/                REST collection routes
  api/tasks/[id]/            REST update/delete routes
  api/github/               public API adapter endpoint
lib/                        validation, HTTP helpers, GitHub adapter, API client
db/                         Drizzle schema and D1 connection
drizzle/                    versioned SQL migrations and metadata
tests/                      unit and HTTP/database integration tests
docs/                       submission, schema, screenshots, architecture
worker/                     Worker runtime entry point
scripts/                    local migration and build/runtime tooling
.openai/hosting.json         hosted storage declaration and Site identity
```

Built on the Sites Vinext starter; its build/runtime integration remains in place. Framework tooling is retained so the same application runs locally and on the hosted Worker.
