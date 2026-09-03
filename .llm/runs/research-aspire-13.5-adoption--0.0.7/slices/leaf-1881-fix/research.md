# Research — readme.quickstart install-root isolation

## Re-baseline

- Carried-in source: owner-supplied Canary 9 failure from `e2e-cli-prod` run `33704697088`.
- Re-derived against `main` at `45e57377f8e4ccf4b823c73136f1512ba379c392` on 2026-09-03.
- The branch is clean and exactly at the requested base.
- The hosted red is immutable and will not be rerun.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | `executeReadmeQuickstartCommand` delegates every non-`cd` README command to a private `runCommand`, which calls `runAspireCommand` without an environment override. | `packages/cli/e2e/src/application/gates/quickstart/readme-command.ts` |
| 2 | `runAspireCommand` constructs `Deno.Command` without `env`, so README commands inherit the ambient global install root and PATH. | `packages/cli/e2e/src/application/gates/quickstart/aspire-walk.ts` |
| 3 | `ReadmeWalkState` persists cwd/index and service-port evidence but not the run-owned Deno install root. | `readme-command.ts` state interface and read/write functions |
| 4 | Existing `AspireCommandRunner` is already the command seam for the bounded Aspire walk, but the README walker does not expose an injectable spawn seam. | `aspire-walk.ts`; `readme-command.ts` |
| 5 | Canary 9 command 1 failed before scaffolding: `deno install --global --allow-all --name netscript jsr:@netscript/cli@0.0.7-canary.9` exited 1 with `error: Existing installation found. Aborting (Use -f to overwrite).`. | Owner-supplied run `33704697088`, receipt `01.json` |

## jsr-audit surface scan

N/A. This slice changes only the nested CLI E2E gate workspace, not the published package surface,
exports, JSDoc, dependency graph, or lockfile.

## Open questions

None. The owner locked the install-root path, environment shape, receipt contract, test seam,
validation commands, and prohibited alternatives.
