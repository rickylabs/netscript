# Drift: PR-B #1403

Append-only. No drift from the passed plan at bootstrap or RED-first fixture time.

## D-1 — significant: final 36-root selector conflicts with required green `arch:check`

After implementing the locked R-6 transition, `deno task arch:check` exits **1**. Discovery reaches
all 36 intended roots, but 54 pre-existing A14 findings become blocking: 52 under `packages/cli`,
one under `packages/database`, and one under `packages/mcp`. This is the same known population the
passed plan records inside the baseline `arch:check:repo` result (55 total = 54 A14 + root-level
A1).

The brief simultaneously requires the final 36-root selector, requires `arch:check` to remain exit
0, forbids changing A14 (PR-C #1380 owns it), and forbids fixing surfaced findings. Those conditions
cannot all hold. No suppression or source fix was applied. B1/B3 continue; B2's final gate is
escalated to the orchestrator.

## D-2 — minor: mandatory root formatter has unrelated pre-existing red

The exact scoped check and lint wrappers over `.llm/tools --ext ts` pass. After formatting every
PR-B-owned TypeScript file, the exact format wrapper still exits **1** solely for the pre-existing,
out-of-scope `.llm/tools/harness/extract-verdict.ts`. PR-B boundaries allow changes only under the
fitness and quality tool subtrees, so this slice does not edit that file. A focused format check of
all owned TypeScript is green; the root-wrapper residue is escalated rather than folded into this
PR.

## D-3 — significant: repaired PR scan truthfully reds on two pre-existing comment false positives

The exact workflow-equivalent changed-file scan at `ca52c3a8f` executes and exits **1** on
`.llm/tools/fitness/check-doctrine.ts:169` and `:237`. Both lines contain the English word “any” in
comments; neither is TypeScript `any`. They predate PR-B's semantic changes but become visible
because the repaired gate scans the changed tool file. C6 forbids fixing surfaced findings here,
and the boundaries forbid allowance comments, so both are recorded in `triage.md` without a fix.
This is evidence that C4 is no longer silently green, but it also prevents the workflow job from
being green at this head.

## D-4 — orchestrator resolution: R-5 moves from PR-C to PR-B

The orchestrator confirmed D-1 was a plan-ordering defect. The 36-root transition and A14
origin-awareness are a matched pair, so R-5 now lands in PR-B. `resolveIdentifierOrigin()` performs
lexical import and local-binding collection and returns `imported | locally-bound | unresolved`;
A14 fires only on `unresolved`. One test exercises all three origins through the actual CLI, with a
synthetic unresolved fixture that exits 1. `deno task arch:check` now exits 0 across all 36 roots.
#1380 remains open; its box 5 implementation is provided here for PR-C to cite and tick.

## D-5 — orchestrator resolution: temporary #1549 allowances

D-3's two comment false positives receive exactly two per-line `quality-allow:` comments. Each
reason says the scanner matched an English comment word rather than TypeScript `any` and routes the
durable comment-awareness fix to #1549. The PR-owned repo scan allowance count rises **8 → 10**;
both additions are designed to be deleted by #1549.

## D-6 — orchestrator correction: wrapper scope is the owned tool trees

The brief's `.llm/tools` wrapper root was too broad. Final wrapper evidence uses only
`.llm/tools/quality` and `.llm/tools/fitness`; the pre-existing unformatted
`.llm/tools/harness/extract-verdict.ts` remains untouched and outside PR-B.
