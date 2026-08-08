# T2-A preflight — #1117 / PR #1317

Observed on 2026-08-06 before the T1 dependency opened:

- PR head and local worktree are exact at `abdae400e099c9b47c2381ad08c5921ca164ab22`.
- Against current `canary/0.0.5-canary.14@2508eb8c9`, the branch is 4 commits behind and 11 ahead.
- PR is open, non-draft, mergeable, `status:ready-merge`, and all current hosted substantive lanes
  are green; review-thread gate is 0/0.
- Issue #1117 remains open in milestone 0.0.5 with all six acceptance rows checked, but its issue
  lifecycle remains stale at `status:triage`.
- PR body still says the base train is canary.13.
- Existing implementation evidence reports MCP 110/0 and `scaffold.runtime` 73/0, but it predates T1
  train integration and its evaluator was composed rather than separate.

## Required post-T1 supervisor mission

1. Re-query the live PR, issue, train head, hosted contexts, and review threads before mutation.
2. Protect the unowned lock state, then integrate the exact post-T1 canary.14 train without force
   push and resolve only T2-A-owned conflicts.
3. Re-run the ordered three-tool MCP funnel from generated agent instructions through the live
   Aspire-assigned service: `list_api_services → list_service_operations → get_operation_schema`.
4. Re-run focused MCP/CLI tests, scoped source check/lint/fmt, quality/doctrine/docs/package gates,
   acceptance mirror/close gate, and the exact one-pass `scaffold.runtime` command with cleanup.
5. Correct stale canary.13 wording and record current-head evidence without weakening the closing
   keyword or acceptance contract.
6. Leave the PR draft or at `status:impl-eval` for a fresh separate Qwen evaluator; do not merge,
   publish, or self-certify.

At launch, the final implementation prompt must start with `use harness`, include a `## SKILL`
chapter naming `netscript-harness`, `netscript-pr`, `netscript-tools`, `netscript-cli`,
`netscript-doctrine`, `netscript-deno-toolchain`, `jsr-audit`, and `rtk`, and carry the exact
worktree/branch/base/head plus the complete Codex launch-evidence contract.
