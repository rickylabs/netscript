use harness

# PLAN-EVAL cycle 2 (BOUNDED) — #1387 repaired plan sections only

You are a **fresh, separate** `formal_plan_evaluation` session: Claude **Fable 5 · medium**. Own
detached worktree — not `007-leaf-1387` (D-19). Establish the head yourself from live git and GitHub.

**This is a bounded re-evaluation of a diff, not a fresh PLAN-EVAL.** Cycle 1 (`plan-eval.md`) returned
`FAIL_PLAN` and fixed your scope in its own words:

> Re-evaluate **only**: `plan.md` § Named Validation Contract (row 4 + added carrier rows), § Product
> Ceiling for Slices 2, 3, 4, 7, 9, the LD-8/LD-11 text additions, and the appended census in
> `research.md`. LD-1…LD-7, LD-9, LD-10, LD-12, the archetype/overlay selection, the risk register,
> non-scope, and the jsr-audit scan are accepted as-is and need no re-review. Because the design is
> unchanged, the re-evaluation may run as a short same-family follow-up on the diff of those sections;
> a full fresh PLAN-EVAL is not required unless the design text changes.

**Honor that scope.** Do not reopen accepted decisions. Do not re-review Slice 1's implementation —
it has a supervisor Tier-A `ACCEPTED` and its own receipt set, and is outside your scope.

## What to check — the five required fixes

Read `plan-eval.md` § Required fixes, then verify each against the repaired `plan.md` / `research.md`:

1. **F-1 stale baselines.** Row 4 should read contracts **16** · service 90 · plugin 68 · SDK **77** ·
   MCP 136 (**387** total), with a note that it was re-measured after S0. The supervisor independently
   measured exactly those numbers at base `24f6642f` — **re-derive them yourself**, do not accept
   either figure.
2. **F-2 generated carriers.** `mcp-export-corpus` contracted at Slices 2/4/7; `docs-tagline` +
   `publish-assets` + `agent-docs-prose` + `assets-barrel` at Slice 9 and the final run;
   `agent-docs-prose` probed at base and recorded; and **either** the generated outputs added to the
   staling slices' ceilings **or** `gen:*` regeneration declared ceiling-exempt in one explicit
   sentence. This is the #1769 class — three of those outputs are product files outside every slice
   ceiling, so without this the plan's own rescope rule fires on the first public-surface slice.
   **Check that the fix is real, not merely mentioned.**
3. **F-3** `packages/service/src/builder/service-rpc.ts` (signature-only widening) and the
   `FetchHandler.handle` context widening added to **Slice 2**'s ceiling.
4. **F-4** `plan.md` records that the issue's compile-time-rename acceptance line is to be amended by
   the owner before close-gate, and that the implementation PR states the substitution.
5. **F-5** the `optional` rejection is stated as raised at `createContractAuthorizer()` construction,
   with the Slice 5 negative test named.

Also confirm **`research.md` was appended, not rewritten** — the supervisor measured **zero** deletions
in its diff; verify that independently, since "append" is easy to satisfy loosely.

## Rule

1. **Are all five fixes correctly applied?** Name any that is cosmetic rather than real.
2. **Is the repaired gate set now sufficient** for Slices 2–9 — in particular, will the carrier
   contracting actually prevent the rescope-rule trip on the first public-surface slice?
3. **Is the plan cleared for Slice 2?** `PASS` or `FAIL_PLAN` with required fixes.

## Deliverable

**Append** to `plan-eval.md` — never rewrite cycle 1. Commit evidence-only, push by explicit refspec,
report your head.

## Hard boundaries

Do not fix the plan, implement, merge, ready-flip, relabel, close, tick acceptance boxes, or edit the
PR body — including on `PASS`. No `e2e:cli`, Aspire, Docker or browser gates; **no runtime lease is
held and none may be acquired**. Do not touch `deno.lock`.
