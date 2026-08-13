# Research — fix-1634-verify-canary-pair-deno-permission--w9

## Re-baseline

- Re-derived against `origin/main` at `c63dcc669a6eb7424012283630bc6a312e5c8435`.
- The carried-in RCA matches current code: `deno.json` grants only `git`; `publish.yml` calls that task; the freshness seam spawns `deno`; and the agent-docs catch rewrites every error as content drift.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | The task is the workflow's single permission source. | `deno.json:125`; `publish.yml:75` |
| 2 | Freshness invokes four `deno` subprocess checks. | `github-release.ts` `assertPreparedReleaseGeneratedOutputsFresh` |
| 3 | Permission failures are caught in the agent-docs branch and relabeled as content drift. | `github-release.ts` `verifyGreenCanaryPair` catch |

## jsr-audit surface scan

N/A: this is release tooling/workflow code, not a package/plugin public surface.

## Open questions

- None. The issue fixes scope, acceptance, permission boundary, and gates.
