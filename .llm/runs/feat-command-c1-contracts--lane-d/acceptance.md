# Acceptance evidence plan

C1 boxes1–5 have substantively reviewed evidence. Same-session independent reevaluation PASS attests repaired qualification head `17e9ad075e595aa591b12e3b009c6aed6c482fbf`; historical round1 report is preserved. Later leaves remain pending. Every newly added named test has a meaningful production mutation failure and restored pass.

## #1482

| Box | Acceptance | Concrete evidence | State |
| --- | --- | --- | --- |
| 1 | Publish NetScript-owned command definition, identity, envelope, and literal error contracts. | [S1 contracts](./c1-implementation.md), [S2 public definition/value handoff](./s2-implementation.md), [S3 source/export hashes](./s3-source-manifest.json), [publication inventories](./s3-jsr-audit.json) | [x] Implementation evidence recorded; S3 supervisor signed off |
| 2 | Canonical JCS/codec behavior is deterministic and versioned. | [S2 normative vectors, strict negatives and replay-stability law](./s2-implementation.md), [all ten production controls](./s2-mutation-evidence.json), [complete package regression gates](./s3-gate-evidence.json) | [x] Implementation evidence recorded; S3 supervisor signed off |
| 3 | Positive and negative type fixtures use real exports. | [S1 real SDK/client controls](./s1-mutation-evidence.json), [S2 opacity/invariance fixture controls](./s2-mutation-evidence.json), [clean source and emitted declaration fixture receipts](./s3-consumer-evidence.json), [production-to-declaration mutation](./s3-mutation-evidence.json) | [x] Implementation evidence recorded; S3 supervisor signed off |
| 4 | Runtime codec negatives and isolated-declaration/publish gates pass. | [S2 codec negatives](./s2-gate-evidence.json), [180 passing affected package tests, frozen prod install and native publish/pack gates](./s3-gate-evidence.json), [JSR/declaration inventories](./s3-jsr-audit.json), [frozen consumer checks](./s3-consumer-evidence.json) | [x] Implementation evidence recorded; S3 supervisor signed off |
| 5 | IMPL-EVAL passes. | [Independent C1 repaired-head PASS](./evaluate.md) at `17e9ad075e595aa591b12e3b009c6aed6c482fbf` | [x] PASS |

Current downstream CI repair evidence: [narrow repair handoff](./ci-repair.md), [actual gates](./ci-repair-gate-evidence.json), [versions/integrities preserved](./ci-repair-lock-diff.json), [source/evaluator identities](./ci-repair-source-manifest.json). Original product acceptance/mutation evidence is unchanged. Same-session independent repaired-head PASS is recorded in evaluate.md.

## #1483

| Box | Acceptance | Planned evidence | State |
| --- | --- | --- | --- |
| 1 | Executor follows the RFC transaction algorithm over an in-memory conformant fake. | S4-S6 atomic fake and RFC algorithm conformance | Pending |
| 2 | Identity, replay, mismatch, busy, retry, cancellation, and callback-count laws are executable. | S5/S6 semantic identity/replay/mismatch/busy/retry/cancellation/callback laws | Pending |
| 3 | No remote/global transaction or hidden database singleton enters the public surface. | S4/S5 public-surface/dependency inspection and no-root/remote boundary control | Pending |
| 4 | Fault seams prove rollback and retry behavior. | S6 all seven command fault seams and retry evidence | Pending |
| 5 | IMPL-EVAL passes. | C2 separate-family IMPL-EVAL exact head | Pending |

## #1484

| Box | Acceptance | Planned evidence | State |
| --- | --- | --- | --- |
| 1 | Store operations share the caller transaction type without erasure. | S7/S8 true-TTx positive/negative bridge fixtures | Pending |
| 2 | Generated schema/bridge owns receipt and logical-row shapes; no runtime DDL. | S7 schema/migration and consumer bridge artifact inspection, no-runtime-DDL control | Pending |
| 3 | PostgreSQL claim algorithm proves concurrent leader commit, rollback, follower behavior, lock timeout, and no connection poisoning. | S8/S9 real PostgreSQL leader/follower/timeout/no-poisoning suite | Pending |
| 4 | Real-provider and publish gates pass. | S9 real-provider and publish gate receipts | Pending |
| 5 | IMPL-EVAL passes. | C3 separate-family IMPL-EVAL exact head | Pending |

## #1485

| Box | Acceptance | Planned evidence | State |
| --- | --- | --- | --- |
| 1 | Command spans and attributes follow the RFC vocabulary and existing-attribute ownership decision. | S10 exact vocabulary and documented legacy-attribute asymmetry | Pending |
| 2 | Cardinality is bounded and payload, secret, and unbounded identity fields are forbidden. | S10 forbidden-field/cardinality/secret privacy suite | Pending |
| 3 | Replay, busy, failure, and relay relationships have exact assertions. | S10 exact applied/replayed/busy/failure and relay context assertions | Pending |
| 4 | Privacy/redaction and telemetry conformance gates pass. | S10 telemetry conformance and redaction receipts | Pending |
| 5 | IMPL-EVAL passes. | C4 separate-family IMPL-EVAL exact head | Pending |

## #1486

| Box | Acceptance | Planned evidence | State |
| --- | --- | --- | --- |
| 1 | Raw relay-store port and PostgreSQL lease/settlement adapter use no queue dependency or runtime DDL. | S11 raw relay/lease/settlement real provider plus no-queue/no-DDL inspection | Pending |
| 2 | Decoded delivery/sink ports and supervisor honor drain/stop lifecycle. | S12 decoded sinks and drain/stop/cancellation runtime suite | Pending |
| 3 | Crash, lease, redelivery, token, and publish-then-crash tests prove at-least-once semantics without deliver-once claims. | S11/S12 lease expiry/stale token/crash/redelivery suite and mutations | Pending |
| 4 | Worker/saga/stream integrations remain thin and correct exactly-once wording. | S13/S14 checked core adapters, thin-plugin/import audit and delivery documentation | Pending |
| 5 | IMPL-EVAL passes. | C5 separate-family IMPL-EVAL exact head | Pending |

## #1932

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

