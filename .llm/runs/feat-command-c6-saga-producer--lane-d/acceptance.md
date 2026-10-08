# #1932 planned acceptance

| Box | Acceptance | Planned evidence | State |
| --- | --- | --- | --- |
| 1 | A public typed saga effect represents worker jobs and tasks without changing `send()` semantics. | S15 typed job/task distinct effects plus send regression | Pending |
| 2 | Selecting one job/task definition requires its registered payload type and runtime schema; a payload for another definition fails both type and runtime fixtures. | S15 definition-bound schema/type negatives and runtime mismatch suite | Pending |
| 3 | The handler remains side-effect free: emitting a worker effect performs no network or queue call before commit. | S17 recording worker/network port proves no precommit dispatch | Pending |
| 4 | A single store call commits state, correlation, transition history, and command intents under the same optimistic version condition. | S17/S18 one commitTransition call with optimistic version and all rows | Pending |
| 5 | First-party KV and Prisma saga stores either implement that atomic capability and pass the same conformance suite or refuse composition with a diagnostic naming the missing capability. | S16/S18 shared atomic conformance; explicit KV refusal diagnostic | Pending |
| 6 | No engine path calls the current granular writes and then claims an atomic command effect. | S17 recording store forbids granular writes for worker effect path | Pending |
| 7 | The producer adapter targets #1486's relay/sink contract; no saga-owned copy of lease, retry, drain, or settlement infrastructure is added. | S19 producer imports C5 relay; dependency/no duplicate lifecycle audit | Pending |
| 8 | Relay dispatch uses a stable command id/idempotency key, correlation id, and trace context. | S17/S19 stable tuple identity, correlation and W3C assertions | Pending |
| 9 | A row is settled only from a checked worker receipt; discardable/unchecked acceptance is rejected by tests or the repository quality rule. | S11/S13/S19 checked/mismatched/absent receipt settlement controls | Pending |
| 10 | Worker progress is observed through #1592's native durable execution stream, not mirrored into the saga command outbox. | S20 native execution progress-stream consumer proof | Pending |
| 11 | Worker-to-saga completion examples use `publishSagaOrThrow()` from #1365. | S20 completion imports existing publishSagaOrThrow | Pending |
| 12 | Restart and duplicate tests prove at-least-once delivery without an exactly-once transport claim. | S19 restart/redelivery and explicit downstream idempotent effect proof | Pending |
| 13 | `deno doc --lint`, isolated declaration/publish checks, repository quality gates, and separate-session IMPL-EVAL pass. | S20 full-map doc/declaration/publish/quality gates and separate-family IMPL-EVAL | Pending |
| 14 | Fault before transition commit leaves no new state, transition, correlation entry, or command intent. | S18 injected before-commit rollback asserts state/history/correlation/intents absent | Pending |
| 15 | Fault after commit and before relay dispatch is recovered after restart. | S19 after-commit restart proof | Pending |
| 16 | Fault after worker acceptance and before outbox settlement redelivers the same stable idempotency identity and produces no second effective job application. | S19 acceptance-before-settlement crash redelivers stable key and one guarded application | Pending |
| 17 | Concurrent stale-version writers commit at most one transition and one command set. | S18 barrier-based concurrent stale writers one version/command set | Pending |
| 18 | Relay lease expiry/redelivery and shutdown drain reuse #1486 behavior and are exercised through the saga producer adapter. | S19 C5 lease expiry and shutdown drain through producer | Pending |
| 19 | Invalid or mismatched payloads fail before commit. | S15/S17 invalid/mismatched payload refused before store call | Pending |

