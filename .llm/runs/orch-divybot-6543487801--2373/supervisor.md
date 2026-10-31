# Supervisor

Issue #2373; branch `orch/divybot-6543487801`; baseline main `46b22e63608eb4ba067145445b523536d6e48aa9` (includes #2505 and #2525).
Implementation: Codex, owner-requested medium effort. Feature tier. Separate read-only evaluator: owner explicitly requests Claude Opus 5.5, high effort for both phases, overriding matrix evaluator routes. No privileged tier.
Allowed writes: this run directory; `packages/kv/src/testing/watchable-kv-contract.ts`; `packages/kv/tests/redis-internals_test.ts`; focused test registrations under `packages/kv/tests/kv-conformance_test.ts` if needed. No production implementation or lock changes.
Public artifacts omit private environment and session identifiers. Coordinator owns merge, labels, milestones, and issue closure.

Negative-control allowance: isolated source snapshot under the private project run, including an intentionally broken Redis abort delay; never committed or applied to the worktree.

CI-repair surface authorized by the follow-up: packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts, regenerated documentation metadata only. No production behavior changes.
