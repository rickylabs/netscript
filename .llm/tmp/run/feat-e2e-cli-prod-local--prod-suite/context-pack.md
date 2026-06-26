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

Blocked before commit/push. The requested harness changes are implemented in the worktree, but the
required prod-local validation is red at `scaffold.plugin.worker`.

## Evidence Summary

- PASS: scoped check/lint/fmt on touched/e2e TypeScript.
- PASS: focused guard test.
- PASS: maintainer `scaffold.runtime` with `passed=47 failed=0`.
- FAIL: prod-local `scaffold.runtime`; public plugin add dispatches `deno dx ...`, and Deno 2.9
  reports `Module not found ".../dx"`.
- PASS: `deno.lock` unchanged.
- NOT RUN: actionlint unavailable.
