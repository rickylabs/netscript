# Research — cross-attempt PR-check supersession

## Re-baseline

- Carried-in source: issue #1187, its evidence comment, and `/home/codex/ns005prchecks-brief.md`.
- Re-derived against `main` at `f7558aa1c4e06f076114d924c7324feddf554e45` on 2026-08-04.
- The staged brief says recurrence count five; the owner's continuation says six. Six is the live
  operating count. GitHub currently reports one issue comment, despite the brief saying two
  evidence comments.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | `pr-checks.ts` fetches only `commits/{head}/check-runs`; it never queries workflow-run jobs or rerun attempts. | `.llm/tools/agentic/github/pr-checks.ts`, `fetchCheckRuns()` |
| 2 | The pure classifier keeps only the latest returned run by check name. It cannot supersede a stale attempt-1 failure when GitHub's default check-run listing omits attempt-2 success. | `classifyCheckRuns()` and the missing attempt metadata in `CheckRun` |
| 3 | Issue evidence identifies workflow run `30849924186`: attempt 1 `close-gate` failed and `check-test` was cancelled; attempt 2 jobs were all successful under `actions/runs/{id}/jobs?filter=latest`. | issue #1187 body |
| 4 | The current live PR #1181 is green on fresh head `003b82d07b8f04b49e493a91b85ecb42c0f8c05`; that is post-workaround evidence, not reproduction of the old head `c7248eb00`. | `deno task agentic:pr-checks -- --repo rickylabs/netscript --pr 1181 --pretty` on 2026-08-04 |
| 5 | Existing fixtures cover same-list duplicate names but not GitHub workflow attempts or the API read seam. | `.llm/tools/agentic/github/pr-checks_test.ts` |

## jsr-audit surface scan

- N/A: this is repository-owned tooling under `.llm/tools/agentic/`; no package/plugin or
  publishable JSR surface changes.

## Open questions

- Resolved now: correlate commit check-runs to the latest jobs returned per workflow run. This keeps
  check-run coverage for non-Actions providers while making the Actions result attempt-aware.
