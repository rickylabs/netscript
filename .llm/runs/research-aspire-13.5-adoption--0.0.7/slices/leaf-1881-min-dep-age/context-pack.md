# Context Pack — README minimum dependency age

## State

- Branch: `fix/aspire-1881-readme-min-dep-age`
- Baseline: `3903feea63f0f4c421dd90f221132c08dbb3650e`
- Phase: converged onto coordinator-selected main; non-runtime gates replayed; final manifest commit pending
- Archetype: 6 — CLI / Tooling
- Overlay: docs
- PLAN-EVAL: N/A, small/mechanical owner-locked contract

## Next

1. Regenerate the Aspire surface manifest as the last mutation after every run artifact exists.
2. Prove parity green, commit the manifest and run artifacts together, then force-with-lease push
   the rebased branch.
3. Update existing non-draft PR #1980 and keep `status:impl`; do not apply ready-merge.

## Commits

- `1df4fb636` (rebased from `33083a6f0`) — Harness bootstrap and locked plan.
- `8d7af1ed2` (rebased from `a3f929c23`) — expectations-only RED.
- `a73da6b35` (rebased from `86c71bc97`) — printed-surface GREEN.
- `80bb337d3` (rebased from `e6dbee80d`) — mechanically regenerated docs carriers.
- `95f831a0c` (rebased from `957cff9ff`) — initial gate evidence.
- `4c4ce14f5` (rebased from `a074ba2a9`) — evidence-only manifest repair.
- `a144cfa80` (rebased from `d7ca826f7`) — evaluator PASS record.

The rebase onto exact main `3903feea6` completed without conflicts and did not broaden the approved
diff. Carrier checks remained fresh without regeneration. Converged-head check/fmt/lint, focused
contract tests, gate listing, docs accuracy/links, and quality gates pass. The full nested E2E test
wrapper passes 366/366 with an executable repository-local `TMPDIR`; its first attempt exposed only
the host's `/ephemeral` `noexec` mount in two new baseline browser fixture tests.

## Boundaries

No runtime suite, republish, workflow edit, harness-only flag injection, shim, environment override,
or `-f` addition.
