# Scheduled trigger identity — #2165

Implementation: Codex Sol, xhigh, feature tier, branch `orch/divybot-6534990556`.
Baseline: `30c800958dbf512a4951d640f08748703a8b59e3` (main ancestry to be verified before implementation).
Coordinator: #2474, milestone 0.0.9, group A1.

## Declared write surface

- `.llm/runs/orch-divybot-6534990556--2165/**` (plans, memory, sanitized evidence, dated lesson).
- `packages/plugin-triggers-core/src/adapters/cron-trigger-scheduler-adapter.ts` and its tests.
- `packages/plugin-triggers-core/src/stores/` idempotency implementation and tests.
- `packages/plugin-triggers-core/src/runtime/trigger-processor.ts` and scheduled persistence regression tests.
- `plugins/triggers/src/runtime/scheduled-idempotency_test.ts` (integration proof only).
- `packages/plugin-triggers-core/src/testing/memory-trigger-idempotency-store.ts` (fallback parity).
- `packages/plugin-triggers-core/README.md` for contributor-facing identity semantics.
- Excluded assignment and final-report handoff files, never committed.

File-watch adapter is owned by #2187 and must remain untouched. No dependency or lock changes.

## Routing

`deno task agentic:matrix --tier feature --json` resolved implementation Sol xhigh → Muse Spark 1.3 xhigh; plan evaluation GLM 5.3 → Fable 5.1; implementation evaluation Muse Spark 1.3 → Opus 5.
Owner explicitly selects separate-session Anthropic evaluator `claude -p --model claude-opus-5-5 --effort high`, read-only, stdin closed, blockers only, for both phases. Exact override is recorded in worklog. Maximum 2 plan rounds / 5 implementation rounds; two consecutive terminal failures stop. Re-steer evaluator across repair rounds.

Public artifacts omit machine identity, connection details, operator paths and session identifiers. Private evaluator transport state is kept only in ephemeral storage.

## Delivery

One draft PR to main, body starts `Refs https://github.com/rickylabs/netscript/issues/2165`; no closing keyword, label or milestone mutations. Commit and push every slice. Final exact pushed head evaluation; stop at READY, coordinator owns readiness and merge.
