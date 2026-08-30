use harness

# IMPL-EVAL cycle 2 — #1466 slice 1, PR #1731

You are a **fresh, separate** `formal_impl_evaluation` session. The generator is Codex
(`gpt-5.6-sol`); you are Claude Fable 5 · medium — native opposite-family per
`.llm/harness/workflow/lane-policy.md:46`. You did not author any of this code and you must not fix
it: you evaluate and rule.

## SKILL

`netscript-harness` (evaluator protocol, verdict vocabulary, `evaluate.md` template),
`netscript-doctrine` (Archetype 1/2 gates, public-surface rules, doctrine 04 on published values),
`netscript-deno-toolchain` (`deno doc` as the publish bar).

## Where to work

Use a **detached worktree of your own** — do not touch `/home/agent/projects/netscript/worktrees/007-leaf-1731`
(D-19). The previous IMPL-EVAL used `/home/agent/projects/netscript/worktrees/ns1466-impleval`; either
reuse it detached at the new head or create your own.

Evaluate at the PR head. Establish it yourself from live GitHub and git — do not take a SHA from this
brief as authority. Record `git rev-parse HEAD`, `origin/feat/sdk-procedure-meta`, and the PR's
`headRefOid`, and state that they agree.

## What happened since your predecessor's verdict

Cycle-1 IMPL-EVAL (session `00ec0e55-66cd-4cd2-814e-bc5975afeab3`) returned **`FAIL_FIX`**, failure 1
of 2. Its verdict is committed on the branch at `.llm/runs/feat-sdk-procedure-meta--1466/evaluate.md`
— **read it first; it is your baseline.** It issued three rulings (R-1, R-2, R-3) and five findings
(F-1…F-5).

Two repair cycles followed:

- **Cycle 4** (thread `01a051d1`, content head `42874803`) — F-1…F-5 plus archive-and-recut.
- **Cycle 5** (content head unchanged) — a supervisor Tier-A finding, AF-1: the `supervisor.md` written
  to close F-5 misstated the route of its own repair cycles. Evidence-only correction.

The supervisor's Tier-A review is `slices/tier-a-review-1466-repair-4.md` in the features
orchestration run; its verdict was `ACCEPTED_WITH_FINDINGS`.

## Your scope — set by your predecessor, not by me

Cycle-1's verdict fixed the re-evaluation scope: **F-1…F-5 as written, doc-lint count still 12 with
the R-1 set, `docs:exports-drift` exit 0, contracts tests green, receipts recut at the new content
head.** *"No ruling is reopened."* Honor that. R-1, R-2 and R-3 are settled inputs; do not relitigate
them, and do not expand into slices 2 and 3, which are still NOT RUN.

## Re-measure, do not accept

The supervisor re-measured every number below and they agreed. **That is not evidence for you** — two
sessions agreeing is worth less than one session measuring. Re-derive:

1. **`public-doc-lint` at head vs `main`.** Run the receipt's exact 16-entrypoint argv at both ends.
   The claim is 12 = 12 with the exact three-in/three-out set R-1 recorded. Verify the **set**, not
   just the count — R-1's condition is set identity, and a count match with a different set is a
   regression wearing a passing number.
2. **The F-2 pin must fail.** Apply perturbation B — change the real initializer at
   `contract-primitives.ts` to `oc.$meta<Record<never, never>>({})` — and confirm a **named** test
   goes red. Your predecessor defeated the *previous* guard with exactly this mutation while all
   three checks stayed green, so this is the assertion most worth attacking. Try to forge it too: the
   supervisor found a trailing-comment forgery is caught by `stripCommentsAndStrings`; find a form
   that is not, if one exists. Revert every perturbation and prove the worktree clean.
3. **F-1's consumer safety.** The `commonErrorMap` value export was withdrawn. Confirm nothing in
   `packages`, `plugins`, or `templates` consumed it through the public specifier, and that the alias
   now references the public `CommonErrorMap` rather than `typeof commonErrorMap`.
4. **Receipts.** All eight named receipts at the content head with `gitHead == actualGitHead`; the two
   frozen archives (`frozen-c9a391811`, `frozen-235482767`) intact and append-only.
5. **`deno task docs:exports-drift`** exit 0 and **`deno test --allow-all packages/contracts`** green.

## Three things you are being asked to rule

The implementation lane may not decide these for itself.

1. **Does a `SKIPPED` receipt satisfy the contracted `test` gate?** R-1 forbade further root-`test`
   retries on this host (the D-26 zombie baseline), so cycle 4 archived the terminal FAIL and cut
   `test-final.json` with `outcome: SKIPPED` and a reason citing R-1. The content head therefore has
   receipts for seven gates that ran and one that deliberately did not. Is that an acceptable
   contracted set, or must the gate carry the archived FAIL forward at the new head instead? Note the
   residual: root `test` has never run at `42874803`, and the head both withdraws a public export and
   adds a test. Say what covers that and whether it is enough.
2. **Is AF-1's class of defect adequately closed?** A run-identity artifact misreported its own route.
   Check `supervisor.md` at the final head against the observable facts, and say whether the run's
   recorded identity is now accurate — including whether marking the pre-migration PLAN-EVAL path as
   historical is the right treatment rather than rewriting it.
3. **Is slice 1 now terminal?** If you return `PASS`, say explicitly what remains before #1466 can
   close — slices 2 and 3 are unrun and PR #1731 carries `Closes #1466`, so the leaf cannot close the
   issue on slice 1 alone. The coordinator needs that stated, not implied.

This is **failure 2 of 2** for this leaf's IMPL-EVAL loop. If you return `FAIL_FIX` again, say plainly
whether the remaining defects are worth another cycle or whether the slice should be escalated to the
coordinator, and why.

## Deliverable

Write `evaluate.md` in the leaf run dir following the harness evaluator template — metadata,
immutable identity, process verification, substance verification, gate tables, anti-pattern check,
arch-debt delta, findings with required actions, lessons for promotion, and a verdict with rationale
and an explicit re-evaluation scope if not terminal. Commit it as an **evidence-only** commit and push
by explicit refspec. Report your head.

## Hard boundaries

- **Do not fix anything.** Findings with required actions, not patches. Perturbations must be reverted.
- No merge, ready-flip, relabel, milestone change, issue close, acceptance-box ticking, PR body
  rewrite, or gate-catalog edit.
- Do not retry root `test` (R-1), and do not run `e2e:cli`, Aspire, Docker, or browser gates — no
  runtime lease is held.
- Do not edit product code, tests, receipts, frozen archives, `plan.md`, `drift.md`, or the previous
  `evaluate.md`. Your verdict is a new section or a new file, never a rewrite of your predecessor's.
- Do not touch `deno.lock`; prove it byte-unchanged.
