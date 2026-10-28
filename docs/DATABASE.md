# Database schema

D1 is Cloudflare's managed SQLite database. Local previews run SQLite through Miniflare and Wrangler with durable files in `.wrangler/state`. The application uses Drizzle's D1 adapter and bound parameters for SQL queries.

The authoritative schema is [`db/schema.ts`](../db/schema.ts). Generated SQL and Drizzle migration snapshots are versioned in `drizzle/`.

| Column         | SQLite type | Constraints / meaning                                 |
| -------------- | ----------- | ----------------------------------------------------- |
| `id`           | TEXT        | Primary key; server-generated UUID                    |
| `title`        | TEXT        | NOT NULL; trimmed length 1–160                        |
| `description`  | TEXT        | NOT NULL, default empty string; API max 3000 chars    |
| `completed`    | INTEGER     | NOT NULL, default 0; CHECK 0 or 1                     |
| `priority`     | TEXT        | NOT NULL, default medium; CHECK low/medium/high       |
| `category`     | TEXT        | NOT NULL, default work; CHECK work/personal/learning  |
| `due_date`     | TEXT        | Nullable calendar date; API validates real YYYY-MM-DD |
| `source_url`   | TEXT        | Nullable unique GitHub issue URL                      |
| `created_at`   | TEXT        | NOT NULL; server-set UTC ISO 8601 timestamp           |
| `updated_at`   | TEXT        | NOT NULL; server-set UTC ISO 8601 timestamp           |
| `completed_at` | TEXT        | Nullable UTC timestamp; cleared when reopened         |

`tasks_created_at_idx` supports newest-first reads. `tasks_source_url_idx` prevents importing the same GitHub issue twice, including concurrent requests; SQLite allows multiple nulls in a unique index. No separate user table is needed for the owner-private demo's single workspace.

## Migrations

```sh
# After changing db/schema.ts:
npm run db:generate
# Inspect and commit generated SQL and metadata, then:
npm run build
npm run db:migrate
```

Local migration history is tracked by Wrangler. Sites applies the packaged Drizzle migrations to the hosted database during publication. Keep applied SQL and snapshots immutable; add a new migration for subsequent changes. Migrations contain schema changes only. Example tasks are created through ordinary REST requests after the user selects the sample action.
