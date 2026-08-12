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

CI then exposed one missing generated-asset step. E5 refreshes the scanner's consumer-tool copy in
`packages/cli/src/kernel/assets/agent-tools.generated.ts`; inspection found no unrelated generated
drift. Quality tests, repo scan, and quality gate remain green. A post-commit generator run must
leave `git status --porcelain` empty before the E5 PR comment is posted.

## Handoff

Post E5's literal hash and post-commit idempotence/gate evidence on PR #1560. Do not change PR state,
labels, milestone, acceptance mappings, or issue box 7. The orchestrator retains merge authority.
