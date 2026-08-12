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
