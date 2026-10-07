# Worklog

## Design

1. Public surface: existing streams services entrypoint, HTTP protocol and durable offsets unchanged. Internal createStreamsServer composes a native server/store with bounded segment I/O.
2. Domain vocabulary: frame (4-byte length, payload, trailer); physical frame end; logical end (fork base + physical end); complete frame; recent verified boundary checkpoint. Existing upstream StreamMessage type reused.
3. Ports: native FileBackedStreamStore/DurableStreamTestServer, a narrow positioned-read file port with immutable size snapshot and close, backed by native Deno files. Test port exercises short reads and byte-read bounds.
4. Constants: four-byte header, one-byte trailer, 64 KiB I/O chunk, maximum 32 cached segments / 128 recent checkpoints per segment; 1 GiB synthetic log; Linux subprocess RSS ceiling chosen before measurement.
5. Commit slices: bootstrap run artifacts; bounded segment reader and dependency seam plus main.ts wiring, tests and README (structured scoped gates + quality gate + actual runtime RSS); final independent evaluation and evidence/handoff.
6. Deferred scope: changing upstream protocols, segmentation, LMDB schema, producer durability, service orchestration, memory caps, and unrelated logs. Native returned payload arrays retain response-size memory cost.
7. Contributor path: plugins/streams/services/src/bounded-file-store.ts explains the dependency seam and points to bounded-segment-log.ts plus regressions.

PLAN-EVAL: N/A — the existing issue defines framing, native offset/recovery semantics, scope and acceptance; repair does not change public/storage contracts. Independent IMPL-EVAL required.

Bootstrap: matrix feature route resolved; fetched main is unchanged; no duplicate PR; rtk unavailable; no prior session memory exposed. Deno info caused only lock churn during source inspection; revert these task-owned changes before commit.

## Slice 1 — bounded I/O implementation (in review)

Native service adapter and reusable 64 KiB framing window implemented. Cache bounds: 32 segment identities × 128 recent frame boundaries. Full-log buffers removed from the production constructor and read path; requested complete message payloads read in at-most-64 KiB pieces. Native offset, fork chain/cap, JSON/sub-offset, producer/closed state and HTTP restart semantics covered.

Structured service test wrapper: 17 PASS, 0 FAIL/ignored, exit 0 (`tests.json`); scoped check/lint/fmt all exit 0 (`check.json`, `lint.json`, `fmt.json`). `quality:gate` receipt PASS exit 0, including dependency centralization and doctrine (`quality-gate.json`). JSR structural audit exit 0; export doc-lint/full scaffold.runtime pending investigation/completion.

RSS evidence `rss-measurements.json`: real 1,073,746,944-byte log; absolute ceiling 536,870,912 bytes. Native recovery 2,201,464,832 bytes RSS; native tail-only 2,203,815,936; bounded recovery 57,532,416, with tail 58,617,856. Native negative control exits 1/1, bounded exit 0. All recovered native offsets equal 0000000000000000_0000001073746944.

Upstream defect/injection-seam request: https://github.com/durable-streams/durable-streams/issues/420. Independent evaluator running via the matrix fallback Opus 5, session 507f3317-ba68-4e62-b085-89eb707037de. Primary Muse/OpenRouter could not prove expense allowance (missing usage snapshot); fallback native route launched and attested claude-opus-5.

Initial fixture failure (plain filename assumed rather than native encodeStreamPath base64url) fixed; full suite now green. Initial invalid wrapper --json invocation corrected to default JSON/--output. No production defect or bypass introduced to resolve either.

## Gate status after layout reconciliation

New regressions moved under `services/src/tests/` to keep source cardinality within cap; all 17 service tests, scoped check/lint/fmt rerun and remain exit 0. Final measurement (same fixture/ceiling): old recovery peak 2,202,705,920 bytes; old recovery+tail total peak 3,277,688,832; old tail after bounded recovery peak 2,204,364,800; bounded recovery peak 57,720,832 and after tail 58,802,176. Numeric source is rss-measurements.json; preceding exploratory measurement remains documented above.

| Gate | Exit | Evidence / outcome |
| --- | --- | --- |
| Structured service tests (17) | 0 | tests.json; includes real 1 GiB RSS negative controls |
| Structured scoped check | 0 | check.json; frozen dependency lock |
| Structured scoped lint | 0 | lint.json |
| Structured scoped fmt | 0 | fmt.json |
| quality:gate (quality scan + deps + doctrine) | 0 | quality-gate.json durable receipt |
| JSR structural/publish dry-run audit | 0 | jsr-audit.log; no cardinality finding after test relocation |
| Changed service export doc-lint | 0 | service-doc-lint.json |
| Whole plugin export doc-lint | 1 | doc-lint.log; unchanged streams-cli (two missing docs), packages/plugin plugin-contributions (private type) |
| scaffold.runtime --cleanup --format pretty | 1 | scaffold-runtime.log; UNPROVEN, .NET SDK missing / Docker daemon unavailable before scaffold |
| Aspire doctor (diagnosis only) | 1 | aspire-doctor.json: missing .NET SDK, Docker warning |
| Read-only leak-check | 0 | leak-check.log; Docker probes unavailable; no mutation |

Upstream compatibility debt recorded in `.llm/harness/debt/arch-debt.md` as STREAMS-BOUNDED-NATIVE-IO-HOOKS with owner, removal target/gates and upgrade cost. No broad framework refactor or source/test gate bypass.

Reconcile (slice 1): upstream #2080 remains open; draft #2081 now records exact RSS numbers, gate exits and environmental limitations, and ends with the required harness closing line. Namespace status moved impl → impl-eval, retaining type:fix/area:plugins/priority:p1 and Backlog / Triage milestone. Read-only resource report found an existing unrelated deploy-85d15ee AppHost and its DCP processes with unproven ownership; none was mutated. No run-owned AppHost/container started. Docker ownership probes unavailable.

Final recovery fixture additionally proves backward reconciliation after truncating a committed second frame to a two-byte header; targeted native reconciliation/HTTP tests pass 3/3, wrapper exit 0 (`reconciliation-tests.json`). Source formatting check remains exit 0. Resource report lists 17 unproven survivors from an unrelated AppHost/DCP and diagnostic process; no ownership was inferred and none was changed.

Implementation candidate is being committed/pushed while independent evaluation continues. This commit records passing local static/native runtime tests and the known unproven full scaffold gate; it is not a merge sign-off or self-certification. Final reviewer verdict will be recorded separately before closing the implementation slice.

## CI repair slice

Repeated owner alerts checked against current source head 6aa1676; job 112992100107 close-gate failed solely on the mandatory independent evaluation box (still genuinely pending). Job 112992308662 quality passed its first 17 gates and failed audit:critical on transitive proxy-addr 2.0.7. Owner-authorized drift recorded before touching deno.lock. Native Deno generated the patched 2.0.8 record with identical dependencies; exactly version + integrity changed. deno ci exit 0; durable audit-critical-repair.json PASS exit 0. No direct dependency/config/source changes or unrelated lock resolutions. Independent source evaluator remains session 507f3317-ba68-4e62-b085-89eb707037de. This commit fixes quality without falsely checking pending review.
