# Pre-merge gate — PR #1536 (closes #1398)

Run per `.llm/harness/workflow/milestone-run.md` § The pre-merge gate, by the orchestrator holding
merge authority. Evaluated at head **`f7d503fee`**, 2026-08-12.

**Head discipline.** This PR's head changed mid-flight (`e4319c685` → `f7d503fee`) when the branch
was synced with `main` so the phase-eval dispatcher would exist in the merge ref. **No evidence from
before that sync is cited below.** Every gate result and job id here was re-read against
`f7d503fee`; the pre-sync job ids (`94062070840`, `94062070984`) describe a head that is no longer on
this PR and appear nowhere in the PR body or this record.

| # | Check | Result | Evidence |
| --- | --- | --- | --- |
| 1 | `close-gate` result is green | **PASS** | `close-gate` → `pass` on the re-run after `status:ready-merge`. The earlier red was a genuine red against the then-current body, not a flake — it listed all four unticked issue boxes and all three unticked DoD boxes by line. |
| 2 | Zero unticked `- [ ]` on every issue the PR closes | **PASS** | #1398 fetched live: all **4** acceptance boxes `- [x]`, ticked by the evidence mirror from the PR's `box-index` entries, not by hand. |
| 3 | No new `deno-lint-ignore` / `as unknown as` / `@ts-ignore` in the diff, excluding `.llm/runs/**` | **PASS** | `git diff origin/main...FETCH_HEAD -- . ':(exclude).llm/runs/**'` grepped for all four patterns on added lines → no matches. Diff was scanned; this is a verdict, not an absence. |
| 4 | Named expensive gates report `SUCCESS`, not `SKIPPED`/`CANCELLED` | **PASS** | Named individually, not counted: `scaffold-runtime (aspire + docker + postgres)` · `scaffold-runtime-sqlite (aspire + sqlite + garnet)` · `scaffold-static (deno-only)` · `code-quality` · `quality` · `check-test` · `surface-diff` · `deps-report` · `close-gate` — all `pass` at `f7d503fee`. |
| 5 | The single decisive claim per issue, re-verified independently | **PASS** | Claim: *job executions now reach the durable stream and join the `job.execute` trace*. Both formerly-deferred gates re-read **by name** from this head's logs: postgres job `94073971396` (`passed=88 failed=0 skipped=0`) and sqlite job `94073971501` (`passed=83 failed=0 skipped=0`). The Qwen IMPL-EVAL independently traced the join mechanism end-to-end (hook → `producer.upsert` → `#startPublish` → `instrumentation.startPublish` on ambient context). |
| 6 | Changed-file audit for `packages/**`/`plugins/**` on docs-lane PRs | **N/A, audited anyway** | Not a docs-lane PR. 7 non-run-artifact files, all in `packages/cli/e2e`, `packages/plugin-workers-core`, `plugins/workers`. No `streams/schema.ts` change (D4 honoured), no #1405 surface, no dependency or export-map change. |
| 7 | The PR body's own checklist matches what shipped | **PASS** | All 7 DoD boxes ticked and each true of this head. The two previously-false claims were **replaced, not ticked over**: the E2E box no longer says "blocked before those gates by `runtime.flow-b-fixture` fetch failure", and the acceptance evidence no longer says "Not yet live-verified". |

**Additional gate:** `agentic:review-threads` → `PASS threads=0 unanswered=0`, exit 0.

## IMPL-EVAL

`OPENHANDS_VERDICT: PASS` — automatic phase dispatcher, `openrouter/qwen/qwen3.8-max`, run
`31584188459`, evaluated at head `f7d503fee` against trusted base `281ab76887`. Triggered by the
label pair alone per D-5; **no manual OpenHands dispatch and no local evaluator** was used for this
PR.

Its three advisories are all pre-existing and tracked, none blocking:

- `close-gate` red pending `status:ready-merge` — now resolved, above.
- `quality:gate` roots omit `packages/plugin-workers-core` / `packages/cli/e2e` — filed as **#1542**.
- Undeclared `@netscript/plugin-streams-core` imports — filed as **#1543**.

## Did-not-run discipline

`agent` ×2 and `code-quality-repo` report `skipping`. None is in the named-gate set for this change
(`code-quality-repo` is the repo-wide audit), and `code-quality` itself ran and passed.

**Caveat carried into the merge record:** as with #1528, `quality:gate`'s configured roots do not
cover the packages this change touches, so the package-quality verdict rests on the **explicit target
scans** the slice worklog records (`findings=[]`, `allowCount=0`) rather than on the repo gate. CI
`code-quality` passing is not by itself proof for these packages. That gap is #1542.

## Verdict

**Cleared to merge.** Seven checks pass with named evidence at `f7d503fee`; IMPL-EVAL PASS from a
separate automatic session; no unanswered review threads.
