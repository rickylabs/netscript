# Context Pack — Fix prod CLI config-loader resolution

## Current State

Run artifacts are initialized under
`.llm/tmp/run/fix-cli-config-loader-resolution--prod-d1/`.

## Locked Plan

Implement the project-rooted config loader in `packages/cli`, not
`packages/config`, so child process IO stays in an Archetype 6 adapter and
`@netscript/config` remains a pure small-contract package. The child uses
`deno run --allow-all --minimum-dependency-age=0`, adding
`--config <projectRoot>/deno.json` when the project config file exists, to
preserve the current public CLI permission posture while changing only the graph
root.

## Validation Completed

- PLAN-EVAL attempt 2 PASS.
- New loader unit tests and plugin registry regression tests: 7 passed / 0
  failed.
- Scoped CLI check wrapper: 524 files, 5 batches, 0 failed.
- Focused lint/fmt on touched CLI files: PASS.
- Local prod-mode plugin list repro from inside and outside generated project:
  PASS.
- `deno task publish:dry-run`: PASS.
- Local `scaffold.runtime`: 47 passed / 0 failed.
- `deno task arch:check`: BLOCKED_UNRELATED by pre-existing JSR centralization
  failures for `@netscript/aspire` and `@netscript/plugin`.

## Validation Still Required

- IMPL-EVAL in a separate session.
- PR push/comment.
- Final closure requires release-triggered GREEN `e2e-cli-prod` after alpha.9 is
  published.
