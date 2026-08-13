use harness

## SKILL

Follow the complete launch brief staged by `topic-fixes-0.0.7`. Required skills are
`netscript-harness`, `netscript-doctrine`, `netscript-tools`, `netscript-pr`, `netscript-cli`,
`aspire`, `jsr-audit`, `netscript-deno-toolchain`, and `rtk`.

Implement only `legacy-port-pin-sweep` (#1243) under its approved milestone leaf contract. Inspect
the live issue, reproduce first, make and record the PLAN-EVAL decision before source edits, use
structured reporters and durable receipts, request the singleton expensive-gate lease, commit in
reviewable slices, push by explicit refspec, open a draft direct-to-main PR, and stop for Tier-A
review plus separate opposite-family IMPL-EVAL. Never merge or publish.

## Coordinator amendment — 2026-08-13

- Add only
  `packages/cli/src/public/features/plugins/auth/auth-plugin-command_test.ts` beyond the original
  contract.
- Preserve the streams manifest and official-copy `4437` compatibility metadata; do not redesign
  schema/copy behavior.
- Finish the explicit `--stream-url` fail-loud guidance and focused tests, produce structured
  non-expensive receipts, and stop for Tier-A review plus separate IMPL-EVAL.
- Do not request or run `scaffold.runtime`, mark ready, merge, or publish.

## Implementation result

- Semantic implementation: `3d32e9ee2ee37dc9cebfe645f93e3a4ea479c215`.
- Mechanical formatting slice: `a212245867b77ab8d40e7330b2b7cb7409781a90`.
- Durable gate receipt head: `6242edabc3679173c841e2e167f7f5786819e720`.
- All authorized non-expensive gates passed; receipts and structured reports are in `receipts/`.
- Stop state: draft PR at `status:impl`, awaiting topic-orchestrator Tier-A review and a fresh
  opposite-family IMPL-EVAL. No ready transition, merge, publication, or runtime lease.
