# Verification record

Verified on **28 October 2026** using Node.js 22.14.0 on macOS and the installed Google Chrome browser.

## Automated checks

- `npm run typecheck`: passed.
- `npm test`: 3 test groups passed (GitHub response shaping / PR filtering, upstream errors / repository validation, and task validation / partial updates).
- `npm run test:api`: 4 test groups passed against the built production Worker and real local D1/SQLite database.
- Production build through the Sites build helper: passed.
- Initial local SQL migration: applied successfully. Existing task data was retained when switching from development to the built production preview.

The API suite covers create/read/update/delete, trimming, preserved fields on partial updates, completion timestamps and reopening, invalid field types, impossible dates, invalid UUIDs, malformed JSON, content type, body size, cross-origin mutation rejection, missing records, and database-enforced unique GitHub imports. The oversized request is followed immediately by another mutation to verify the connection still handles the next request correctly.

## Browser checks

Using the running application and live GitHub responses:

- Added sample tasks, then created a separate task through the visible form.
- Edited its title and marked it complete.
- Reloaded and confirmed the edited title and completion survived.
- Filtered completed tasks and searched for the edited title.
- Cancelled deletion, verified the task remained, then confirmed deletion.
- Imported a real GitHub issue and verified its added/check state and task count.
- Looked up a nonexistent repository, observed the visible not-found state, and successfully recovered with a valid repository.
- Checked mobile navigation and layouts at 320, 390, 768, 1024, and 1440 pixels, with no horizontal overflow.
- Checked keyboard arrow/Home navigation in the task tabs.
- Observed no JavaScript page errors during the task-flow browser run.
- Ran axe-core's WCAG 2 A/AA and WCAG 2.1 AA checks on the desktop main page: **0 detected violations** after readability fixes. This result applies to the scanned page and state.

## Screenshots

- [Working GitHub integration](screenshots/github-integration.png)
- [Desktop workspace](screenshots/desktop.png)
- [Mobile workspace](screenshots/mobile.png)

Screenshots show a local production preview with six user-requested example tasks and one issue imported from the live GitHub API. Local example records are not copied into the hosted database; the hosted workspace starts empty and offers the same sample-data action.
