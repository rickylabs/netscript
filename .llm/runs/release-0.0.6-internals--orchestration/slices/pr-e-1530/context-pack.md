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

E1 added the intentionally failing regression test as a standalone commit. E2 added `isTypeFixture`
and restored the quality test gate. E3 added all three leakage controls. E4 removed the two actual
SDK allowance clauses. All required gates are green; the base/head repo scan moved from exit 1,
five findings, `allowCount: 10` to exit 0, no findings, `allowCount: 8`.

## Handoff

Update PR #1560's body with literal E1–E4 hashes, gate results, checked Definition of Done boxes,
and exact-text evidence mappings for issue boxes 1–6. Do not map or tick issue box 7. Leave the PR
draft and at `status:impl`; the orchestrator owns the draft-to-ready IMPL-EVAL trigger and merge.

The PR must remain draft; the orchestrator owns draft → ready, formal IMPL-EVAL, labels after
implementation, and merge authority.
