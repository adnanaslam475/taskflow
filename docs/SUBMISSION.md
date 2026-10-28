# Assessment submission

## Deliverables

| Requirement                      | Deliverable                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------- |
| Responsive task list             | React UI with desktop/sidebar and mobile navigation                           |
| Add / edit / delete / complete   | Task form, title editing, delete confirmation, completion checkbox            |
| REST APIs                        | GET, POST, PATCH/PUT, DELETE routes documented in README                      |
| Database                         | SQLite via D1, Drizzle schema, generated migrations                           |
| Setup instructions               | README.md; no local database server or API key required                       |
| Database schema                  | docs/DATABASE.md and drizzle/*.sql                                            |
| Public API implementation        | GitHub repository and issue lookup with import-to-task                        |
| Screenshot                       | docs/screenshots/github-integration.png                                       |
| Architecture / review            | docs/ARCHITECTURE.md                                                          |
| GitHub repository and commit URL | Pending destination repository; source is committed locally                   |
| Hosted demo                      | https://taskflow-assessment-28oct26.sugarygecko7.chatgpt.site (owner-private) |

## Publish the repository to GitHub

Create an empty GitHub repository under your own account, then from this directory:

```sh
# Add a separate GitHub remote.
git remote add github https://github.com/OWNER/REPOSITORY.git
git push -u github main
```

Replace OWNER/REPOSITORY with the real destination. Do not add credentials to the URL or commit local `.env`, `.dev.vars`, `.wrangler`, or database files. The existing `.gitignore` excludes these files.

Record the submission links after pushing:

```sh
git log -1 --format='%H'
git log -1 --format='%H' -- app/api/github/route.ts lib/github.ts app/github-panel.tsx
```

- Repository: `https://github.com/OWNER/REPOSITORY`
- Integration commit: `https://github.com/OWNER/REPOSITORY/commit/INTEGRATION_SHA`

The demo is private to its owner. For an evaluator who cannot use that account, running locally is reproducible from the repository. A shareable/public audience change has not been made.
