import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

let built;
try {
  built = JSON.parse(readFileSync("dist/server/wrangler.json", "utf8"));
} catch {
  console.error("Run npm run build before applying local database migrations.");
  process.exit(1);
}
const database = built.d1_databases?.find(
  (binding) => binding.binding === "DB",
);
if (!database) {
  console.error(
    "The build has no DB binding. Set d1 to DB in .openai/hosting.json and rebuild.",
  );
  process.exit(1);
}
mkdirSync(".sites-runtime", { recursive: true });
const config = resolve(".sites-runtime/migrations-wrangler.json");
writeFileSync(
  config,
  JSON.stringify(
    {
      name: "taskflow-local-migrations",
      compatibility_date: "2026-05-15",
      d1_databases: [{ ...database, migrations_dir: resolve("drizzle") }],
    },
    null,
    2,
  ),
);
const result = spawnSync(
  process.execPath,
  [
    "--import",
    "./scripts/sites-env.mjs",
    "./node_modules/wrangler/bin/wrangler.js",
    "d1",
    "migrations",
    "apply",
    "DB",
    "--local",
    "--config",
    config,
    "--persist-to",
    resolve(".wrangler/state"),
  ],
  { stdio: "inherit" },
);
process.exit(result.status ?? 1);
