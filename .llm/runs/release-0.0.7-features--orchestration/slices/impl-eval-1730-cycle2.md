use harness

# IMPL-EVAL cycle 2 (NARROW) — #1730, repair head `1c836918`

You are a **fresh, separate** `formal_impl_evaluation` session: Claude **Fable 5 · medium**, native
opposite-family for Codex work. Own detached worktree — not `007-leaf-1730` (D-19). Establish the head
yourself; do not trust a SHA here.

**This is a narrow re-evaluation, not a fresh audit.** Cycle 1 (`6977debd`) returned `FAIL_FIX` and
its scope is fixed: **F-1…F-7 as written**. Everything it ruled `PASS` stays ruled — the five
acceptance points, the S3 rename, retry/continuation coverage, mutation-A delegation, and the
gitignored-receipt design. Do not reopen them. Failure count is **1 of 2**.

## What was repaired

| Finding | Repair |
| --- | --- |
| **F-1** (medium) | `stream()`'s second argument is now captured (`async *stream(request, options)`); `signal` is destructured out and the remaining `ChatClientCallOptions` folded into the per-request projection, paired by index. |
| **F-2** (low) | Comment names the incidental owner of the `modelId` path rather than leaving it silently unguarded. |
| **F-3 / F-4** | `worklog.md` now states the `publish-dry-run` argv is the **workspace** `deno task publish:dry-run`, not the planned package-cwd `deno publish --dry-run --allow-dirty`, and that **attempt 2 at 30,719 ms** superseded a 150 ms value that "was a replay and is not" valid evidence. |
| **F-6** | The receipt audit table now lives in `worklog.md`, not only in a stale PR comment. |
| **F-5** | Closed by the supervisor: Tier-A review posted to PR #1763 (`issuecomment-5469233540`). |
| **F-7** | Informational; no action. |

## Verify — narrowly

1. **F-1 must actually be closed.** Apply **mutation B2** at `agent/loop.ts:165` —
   `{ signal, modelOptions: { ctx: JSON.stringify(input.context) } }` — and confirm a **named** test
   goes red. It left **all 147 green** before the repair. Then confirm **mutation B** (context
   appended to `system`) still fires. Revert each; prove the tree clean.
2. **Hunt one more escape.** The projection now covers request fields plus call options minus
   `signal`. Is there still a provider-bound path from the loop it does not project? Cycle 1 found one
   after Tier-A had broken the guard twice — assume a third exists until you have looked.
3. **`signal` exclusion.** Confirm excluding `signal` is correct and cannot itself carry context.
4. **F-10 ceiling**: `request_context_test.ts` is 498 LOC against a 500 cap. Confirm, and say whether
   the guard is now near a ceiling that will force a split.
5. **Receipts — command/hash/head exactness, not duration alone.** All seven at
   `gitHead == actualGitHead == 1c836918` with distinct `requestHash`. **Note a correction the
   supervisor made to its own rule:** `check` recorded 8,090 ms against a prior 119,238 ms, which
   looked like the 150 ms replay defect — but `deno task check` caches (89 ms fully warm, 117,649 ms
   cold in a fresh worktree) while `publish:dry-run` does not. Short duration alone is **not** evidence
   of a replay; the test is whether the gate can cache and whether the receipt's own output shows the
   full work. Rule on whether that refinement is right, since a rule that fires on cached gates trains
   people to ignore it.
6. `deno.lock` byte-unchanged; no generated carrier moved; **zero** product outside
   `packages/ai/tests` measured over the **merge base**, not `origin/main..HEAD`.

## Rule

1. **Is F-1 genuinely closed**, and is the guard now sufficient — or is there another un-projected
   provider-bound path?
2. **Is the durable trail now accurate** on the `publish-dry-run` facts (F-3/F-4/F-6)?
3. **Is the leaf terminal** at `1c836918`? If yes, say plainly that it is merge-ready on evidence, and
   name anything the coordinator still owes.

## Deliverable

**Append** to `evaluate.md` — never rewrite a predecessor section. Commit evidence-only, push by
explicit refspec, report your head.

## Hard boundaries

Do not fix, merge, ready-flip, relabel, close, tick acceptance boxes, or edit the PR body — including
on `PASS`. Revert every perturbation and prove the tree clean. No `e2e:cli`, Aspire, Docker or browser
gates. Do not touch `deno.lock`.
