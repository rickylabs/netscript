# Pre-merge gate — PR #1558 (Refs #1459, closes nothing)

Head **`2d515de75`**, 2026-08-12. Evaluated head == merge head, verified.

| # | Check | Result | Evidence |
| --- | --- | --- | --- |
| 1 | `close-gate` green | **PASS** | `close-gate` → `pass`. No `acceptance-evidence` block, correctly — #1459 states acceptance as **prose**, zero checkboxes. Not an empty block (that is #1561's trap). |
| 2 | Zero unticked boxes on issues the PR closes | **N/A — the PR closes nothing** | Body carries **`Refs #1459`**, deliberately not a closing keyword, because the browser-navigation and one-swap proof is split to **#1557**. |
| 3 | No new `deno-lint-ignore` / `as unknown as` / `@ts-ignore`, excluding `.llm/runs/**` | **PASS** | Diff scanned → no matches. |
| 4 | Named expensive gates `SUCCESS` | **PASS** | `scaffold-runtime (aspire + docker + postgres)` · `scaffold-runtime-sqlite` · `scaffold-static` · `build` · `code-quality` · `quality` · `check-test` · `surface-diff` · `deps-report` · `close-gate` — all `pass`, **pending 0, failing 0**. |
| 5 | The single decisive claim, re-verified | **PASS** | Claim: *the coordinator now reaches the client bundle*. Verified 227/227 tests, the client-bundle test passing, and the one-line lock delta proven **required** by removing its declaration, watching the bundle test fail, and restoring. |
| 6 | Changed-file audit | **N/A, audited** | 23 non-run-artifact files across `packages/fresh` and `packages/cli`. Both `.generated.ts` files attributed: `agent-docs.generated.ts` = `+ './defer/island',` from `deno task gen:assets-barrel`; `embedded.generated.ts` follows the edited template. |
| 7 | PR body checklist matches what shipped | **PASS** | 0 unticked DoD boxes; body states plainly which criteria are proven and which moved to #1557. |

**Current-main overlap guard:** `main` advanced **3 commits** past the merge-base (`59e435c5d` →
`3c9dc1f39`). Files touched by both `main`-since-base and this PR: **none**. `mergeable: MERGEABLE`,
`mergeStateStatus: CLEAN`.

`agentic:review-threads` → checked at merge time.

## IMPL-EVAL

`OPENHANDS_VERDICT: PASS` — automatic dispatcher, run **`31598821606`**, `completed/success` at head
`2d515de75`. Verified **live against the Actions API**, not from a reported state: an earlier steer
described this run as already PASS while the API and the PR comment both still read `in_progress` /
`"running"`, and advancement was correctly declined until the verdict actually existed.

Exactly three summary markers on the PR — PLAN-EVAL v1 (`FAIL_PLAN`), PLAN-EVAL v2 (`NONE`, the
heading-prefix extraction bug #1563 whose body verdict was PASS), and this one IMPL-EVAL. **No
duplicate evaluator spend.**

## Lock resolution

Total PR lock diff vs `main`: **1 insertion, 0 removals** —
`+ "jsr:@fresh/plugin-vite@^1.1.2",` under the `packages/fresh` workspace member. Owner-approved as
the exact derived record for the new direct manifest import. The prior 394-line churn was rejected
and removed; the fixture's `vite build` runs with `--no-lock`. Corrected forward across `0fc2c0158`
and `2d515de75` with **history preserved** — the offending commit `1a5c1d688` remains in the record.

## Verdict

**Cleared to merge.**
