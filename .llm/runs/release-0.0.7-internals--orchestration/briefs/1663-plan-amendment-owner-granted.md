# Brief — #1663 owner-granted plan amendment (PLAN-EVAL cycle 3 F1)

You are the **preserved Codex author** of this leaf's plan, thread
`01a004ec-86a6-7c21-8886-81c09de099f5` (`gpt-5.6-sol`, medium). Resume your own thread; this is a
continuation, not a new run.

## What changed since your last turn

PLAN-EVAL cycle 3 ran — the owner authorized it as a third and final exception — and returned
`FAIL_PLAN` at evaluator commit `65c5e1ac4`. It confirmed **by execution** that your cycle-2 repair
was correct: F1's thirteenth path, A1, A2 and A4 are all genuinely absorbed, the acceptance
commands reach 114/2 `failedBatches: 0`, and no fourteenth path is forced. It then found one **new**
blocking defect.

The owner has now **granted the fix**: you amend the plan under this brief, and the topic
supervisor's Tier-A review stands in for the plan gate. **There is no cycle 4 and no further
evaluator.**

## Current state

| Field                 | Value                                                                          |
| --------------------- | ------------------------------------------------------------------------------ |
| Worktree              | `/home/codex/repos/netscript-007-package-gate` (recreated — see note below)    |
| Branch                | `fix/package-gate-honesty` @ `65c5e1ac4`, **no upstream by design**            |
| Push rule             | explicit refspec only: `git push origin HEAD:refs/heads/fix/package-gate-honesty` |
| PR                    | #1663, draft, `status:plan-eval`, milestone `0.0.7`                            |
| Immutable base        | `05fc3132b6800a85eb6152691a961b658962571b`                                     |
| Verdicts on the branch | `plan-eval-cycle-1.md`, `plan-eval-cycle-2.md`, `plan-eval.md` (cycle 3)      |

**Worktree note:** the leaf worktree was deleted from disk by an unrelated host cleanup after the
evaluator was released. Nothing was lost — the branch had been explicitly pushed, and the supervisor
recreated the worktree from `origin/fix/package-gate-honesty` at exactly `65c5e1ac4`, clean, with
all run artifacts restored. Your rollout is intact. Re-verify `git rev-parse HEAD` before editing.

## The defect (cycle-3 F1) — read `plan-eval.md` §5 before you edit

Your plan's surface-table `deno.json` row adds the doctor fixture family to root **top-level**
`exclude`. That key silently removes the five doctor fixture TS files from `deno check`:

- `deno check <excluded file>` → `Warning No matching files found`, **exit 0** — not checked, still green.
- In a mixed batch the file is silently dropped while the command reports success.
- Root `deno task check` (`deno.json:34`) type-checks all five doctor fixture files **today**, so
  this is a live coverage regression introduced by your own edit.

Nested-config precedence (a nested `deno.json` making the root `exclude` inapplicable to explicitly
named files) rescues `fmt` and `lint` — which is why your 114/2 wrapper acceptance is genuinely
green — but it does **not** extend to `deno check`. Both the evaluator and the supervisor
reproduced this independently on Deno 2.9.5. This is the same false-green class #1618 and R9
condemn, and the class cycle-2's A1 just removed from `fmt:check`.

## Required amendment

The fix stays **inside the already-granted `deno.json` path**. The thirteen-path surface is
unchanged and no fourteenth path is authorized.

1. **Move the exclusion key.** Plan the entry into the **existing** root `fmt.exclude` list
   (`deno.json:206-210`, beside `packages/cli/`, `**/.generated/`, `**/node_modules/`) instead of
   top-level `exclude`. **Append to the existing key** — a second `"exclude"` key added earlier in
   the `fmt` block is silently shadowed by JSON last-key-wins, which the evaluator hit in scratch.
2. **Write down the precedence rule.** In L3 and L10, state that a nested `deno.json` takes
   precedence for explicitly named files, that this holds for `fmt` and `lint` argv but **not** for
   `deno check`, and that this is why the key choice matters.
3. **Re-scope the exclusion's stated role** wherever you claim it: raw `deno fmt` walk protection
   only, with **no** effect on `check`/`lint`/`test` selection.
4. **Add the check-coverage proof obligation** to gate row 1 and S1: after the `deno.json` edit,
   `deno check` of the four healthy files still emits `Check` lines, or the scoped check wrapper
   reports `filesSelected:5, failedBatches:0` on the doctor directory.
5. **Propagate to every affected row**: surface-table `deno.json` row, L3, L10's last sentence, the
   open-decision row "Invalid-fixture boundary", risk row 2, gate row 1, and PR Definition-of-Done
   row 3.
6. **Advisory A-T2** — add one sentence (L3 or the `deno.json` row): root `lint.exclude` keeps its
   doctor entry, and the healthy files are still genuinely linted because their nested `deno.json`
   takes precedence for explicit argv. No `lint.exclude` edit is required. The `.llm/` entry in that
   same list is the separately-tracked deferred L-2 item and is **not** in scope.
7. **Advisory A-mem** — note that L11's memoization tests assert grouping equality with and without
   the cache, not timing.

Record the amendment in `drift.md` (append-only, superseding — do not rewrite history) and keep
`worklog.md` and `context-pack.md` current.

## Hard bounds for this turn

- **Run artifacts and the PR body/comment only. Mutate no product or config path** — you are
  amending the *plan*, not implementing it. The `deno.json` change is planned here, not made. Your
  commit's diff versus `65c5e1ac4` must contain only files under
  `.llm/runs/release-0.0.7-internals--orchestration/slices/package-gate-honesty/`.
- Do not touch `plan-eval.md`, `plan-eval-cycle-1.md`, or `plan-eval-cycle-2.md`. Those are the
  evaluators' and are preserved.
- No fourteenth path. If the amendment appears to force one, **stop and report** instead of taking
  it — that is a rescope decision, not yours or the supervisor's.
- No merge, ready flip, relabel, issue mutation, central-state edit, or lease.
- No `scaffold.runtime`, Aspire, Docker, or `e2e:cli`. Any reproduction runs on a `git archive HEAD`
  copy or a scratch project, never in the checkout.
- Do not start implementation. **Stop after the amendment** and report; the supervisor's Tier-A
  review is the gate, and S1 is dispatched separately.

## Output

Commit as `docs(harness): amend package gate plan for cycle-3 F1`, push by explicit refspec, and
post a `[PHASE: PLAN]` comment on #1663 stating what moved and why. Report your thread id, commit
SHA, and the amended head back to the internals topic supervisor.
