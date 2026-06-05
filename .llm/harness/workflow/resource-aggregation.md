# Resource Aggregation

Resource aggregation is required when a run depends on external APIs, upstream
library behavior, public examples, or ecosystem conventions not already present
in the repo.

## Order

1. Check `.resources/deps-docs/`.
2. Check existing `.llm/tmp/docs/` extracts for the current run.
3. Fetch official upstream docs or primary sources with the available docs/web
   tools.
4. Save the useful extract to `.llm/tmp/docs/<source>-<topic>.md`.
5. Cite the extract from `worklog.md` or `plan.md`.

## Promotion

Promote an extract only when it becomes useful across runs. Promotion targets:

- `.resources/deps-docs/` for dependency docs,
- `lessons/` for repeated harness behavior,
- a skill when the knowledge is domain-specific and repeatedly loaded.

## Non-Goals

Do not aggregate external docs for stable repo facts. Read the repo. Do not use
web material to override the doctrine without logging drift.
