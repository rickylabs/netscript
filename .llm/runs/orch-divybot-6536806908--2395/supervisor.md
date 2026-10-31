# Redis queue lease recovery — #2395

Implementation: Codex, feature tier, Sol xhigh; baseline a410a81 (main).
Branch: `orch/divybot-6536806908`; PR targets main. Coordinator: #2474.
The supplied dispatcher leaf profile is authoritative; repository profiles are not loaded.

Write surface: this run directory; `packages/queue/adapters/redis.adapter.ts`;
`packages/queue/adapters/_redis-lease*.ts`; `packages/queue/ports/message-queue.ts`; `packages/queue/adapters/_envelope.ts`;
`packages/queue/tests/redis-*`; `packages/queue/tests/_fixtures/redis-lease*`;
`packages/queue/README.md`; queue public export barrels if required for lease types.
The listener's concurrency structure is owned by #2351 and remains outside this change.
Assignment and final-report handoff files are never committed.

Routing inspected with `deno task agentic:matrix --tier feature --json`.
Owner evaluator override, quoted verbatim in worklog: separate Claude Opus 5.5 high
PLAN-EVAL and IMPL-EVAL, read-only, stdin closed. Vendor/session independence is mandatory.
Raw evaluator identity and transport data remain outside Git; only sanitized evidence is retained.

Coordinator authorized fresh two-round PLAN-EVAL cycle at the linked PR decision in worklog.
Atomic server-side scripts replace the rejected shared-WATCH design. Additional write surface
if needed: packages/queue/tests/abort-cleanup_test.ts (lease lifecycle stub) only.

Expanded necessary compatibility scope: CLI helper register/generate-register-infrastructure.ts
and helper tests/generate-register-infrastructure_test.ts, to enable atomic Lua in all generated
Garnet launch arms. Record rescope and require coordinator-owned scaffold-runtime CI gate.

Additional evidence-only write surface: .llm/harness/debt/arch-debt.md, recording the
pre-existing adapters cardinality advisory growing from 15 to 19 due to four cohesive modules.

CI-followup write surface: packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts,
the repository-generated public API corpus, plus run evidence. CI quality identified its
required freshness delta after the new queue public API; no hand editing of generated rows.

Review follow-up surface: worker idempotency port/store and their tests in
packages/plugin-workers-core/src/{ports,stores}, its README; plugins/workers/worker/job-dispatcher.ts,
queue-consumer.ts, a delivery-lease helper, and focused worker recovery tests. Review exposed
that broker recovery must be honored by first-party consumers: a higher delivery of the same
message may atomically replace its stranded active marker, with fenced completion/release;
healthy job/task execution renews its queue lease and aborts on ownership loss. Completed
markers still suppress effects. This integration is necessary for the issue's worker recovery
acceptance, and does not change listen concurrency. The coordinator still owns runtime CI.

Final review W1 follow-up: job-dead-letters_test.ts settlement expectations and
worker-lease-survival_test.ts are in scope. Expected queue requeue decisions settle via nack
and return normally, preserving the listener supervisor budget. Missing/disabled task behavior
remains acknowledgement; actual claim-store failures remain recoverable. No supervisor or listen
loop rewrite. Round5 exhausted the authorized evaluation cycle; corrected-head review needs a
coordinator-authorized fresh cycle, not a silently launched sixth round.

CI test-4 follow-up: helpers/tests/generated-helpers-compile_test.ts needs the existing
container withArgs capability in its minimal restored SDK contract, now exercised by Garnet
Lua flags. Preserve strict explicit methods; add Container-mode coverage rather than loosen
the SDK type. This is a test-contract update, not a new production generator API.


Corrective review W2: worker-kv-recovery_test.ts is in scope. Preserve native Deno KV
rejection-based retry semantics; nack-and-return is restricted to lease-capable deliveries.
Manual e2e-cli also exposed a pre-existing desktop test-driver failure, reproduced by the
latest main manual run: launcher lookup truncates runtime filename text. Necessary CI harness
scope: cli/e2e/src/adapters/native-desktop/linux-native-driver.ts and a focused launcher
lookup test. Resolve the unique installed executable beside the runtime, failing on absent
or ambiguous candidates. No desktop product/package behavior or skip policy change.
