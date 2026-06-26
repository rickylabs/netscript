# Context Pack

Run id: `feat-e2e-cli-prod-local--prod-suite`

## Current Objective

Add prod-local mode to the CLI scaffold e2e harness: local public CLI binary with generated
workspace dependencies resolved from JSR.

## Required Outputs

- Guard accepts public bin and rejects contributor bin under `--source jsr`.
- Root task `e2e:cli:prod`.
- New CI workflow for post-merge prod-local gate.
- Focused guard test.
- README caveats for version pinning and #124 blind spot.
- Gate evidence in `worklog.md`.

## Process Notes

- PLAN-EVAL waived by user.
- IMPL-EVAL will be run by the user, not self-certified here.
- Push with explicit refspec:
  `git push origin HEAD:refs/heads/feat/e2e-cli-prod-local`.

## Status

Import-map hygiene slice complete in the worktree. The requested root-only import-map changes,
scaffold generator hygiene, and required validation are green. Commit and push are pending in the
current Codex slice.

## Evidence Summary

- PASS: scoped check/lint/fmt on touched/e2e TypeScript.
- PASS: focused guard test.
- PASS: maintainer `scaffold.runtime` with `passed=47 failed=0`.
- FAIL: prod-local `scaffold.runtime`; public plugin add dispatches `deno dx ...`, and Deno 2.9
  reports `Module not found ".../dx"`.
- PASS: `deno.lock` unchanged.
- NOT RUN: actionlint unavailable.

## Import-Map Hygiene Slice Summary

- Checked-in `deno.json` audit is clean: no same-package registry sub-path import-map entries remain.
- Updated scaffold generators so JSR-mode/generated registry import maps use root package mappings
  only; local-mode file-path subpaths are preserved.
- PASS: scoped checks for `plugins/auth`, `plugins/sagas`, `plugins/workers`, `plugins/triggers`,
  `packages/sdk`, `packages/service`, `packages/logger`, `packages/fresh`, `packages/fresh-ui`, and
  `packages/cli`.
- PASS: `rtk proxy deno task publish:dry-run` (raw exit code 0).
- PASS: `rtk proxy deno task e2e:cli:prod --cleanup --format pretty` with `passed=47 failed=0`.
- PASS: `rtk proxy deno task e2e:cli run scaffold.runtime --cleanup --format pretty` with
  `passed=47 failed=0`.
- `deno.lock` changed naturally during validation: 655 insertions, 3 deletions; one new top-level
  specifier `npm:style-dictionary@5.4.4` and 96 npm transitive entries.
