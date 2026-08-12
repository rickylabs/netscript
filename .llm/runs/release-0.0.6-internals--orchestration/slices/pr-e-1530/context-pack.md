# PR-E #1530 Context Pack

## Identity

- Worktree: `/home/codex/repos/ns006-typefixtures`
- Branch: `fix/1530-type-fixture-scan-scope`
- Dispatch base: `84dd44ae7`
- Draft PR: #1560; issue: #1530
- Implementer route: Codex gpt-5.6-sol low

## Contract

Exclude a file only when its normalized path contains `tests/type-fixtures/` and it ends in
`_type.ts`. Prove the exemption and all leakage controls. Do not change any fixture assertion.
Remove only the two redundant allowance comments and prove repo `allowCount` 10 → 8.

## Current state

E1 adds the intentionally failing regression test as a standalone commit. E2 must immediately add
the scanner rule and restore the quality test gate. E3 adds the three leakage controls. E4 removes
the two actual SDK allowance comments and runs all acceptance gates.

The PR must remain draft; the orchestrator owns draft → ready, formal IMPL-EVAL, labels after
implementation, and merge authority.
