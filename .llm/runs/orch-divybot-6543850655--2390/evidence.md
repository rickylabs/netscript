# Investigation evidence

## Finding

The supported Prisma/Postgres composition on main completes the synthetic projected atomic saga through `admitted` → one worker intent → checked relay → native worker → durable-stream append/readback → HTTP receipt → `recorded`. Recreating the producer and processor between commit and receipt does not stall it. Replaying both messages through a third processor leaves two canonical transitions, one command and one worker invocation.

Native KV completes the supported receipt/restart path, with persistent state, projection and worker replay. Its atomic worker-outbox route is explicitly unsupported and refused before writes; this is not parity with Prisma's command relay. No KV outbox implementation or delivery guarantee was invented.

These are first-party synthetic tests, not acceptance of a consumer deployment. No new production defect was reproduced. The cause of the original process exits cannot be inferred from this bounded fixture.

## Acceptance evidence

| Requested proof | Evidence and boundary |
| --- | --- |
| Minimal first-party flow committed | `plugins/sagas/tests/runtime/fixtures/projected-receipt-flow.ts`, worker dispatcher helper and generated Prisma provider template. No consumer code. |
| Real Prisma/Postgres | `projected-receipt-postgres_test.ts`: real generated Prisma client, interactive callback, isolated schema, native transition store, Prisma query-source projection with archive disabled, native command relay/worker sink. One settled command with checked acceptance; two transitions/applied digests. |
| KV | `projected-receipt_test.ts`: persisted Deno KV state/read model; same producer, runner and worker flow without atomic command delivery. Separate refusal test preserves the unsupported atomic-worker contract. |
| Restart between commit and receipt | Prime sequence zero with an earlier document; commit admission before stopping producer and processor. Persist/allocate the next epoch atomically, reopen canonical/replay storage and reconstruct the native runner; then execute the receipt job. These are in-process lifecycle reconstructions with module singleton reset, not SIGKILL/OS-process proofs. |
| Projection reaches recorded | Both read-model storage and real HTTP GET assert `state.status=recorded`, `receipts=1`, `version=2`, lifecycle `status=running`. Prisma GET uses the actual generated indexed findFirst and rejects scan/count. |
| Repeated publication/replay | Queue deduplication disabled; wait for pending/processing/DLQ to reach zero after both HTTP replays. Canonical version stays 2, worker calls 1, stream events 2. KV worker dispatch is repeated and native worker idempotency suppresses duplicate execution. |
| Historical comparison | Exact canary.8 commit `e10fc0e19d0209cf8761068e0a1be863b171bd3c`. Full fixture fails typecheck because this tag lacks `initialEpoch`, `parseSagaInstanceReadModel` and the query client's indexed `findFirst`. The unchanged smaller producer-history probe runs with `--no-check` (old runtime ignores the newer option): both upserts acknowledge delivered but only `receipt-0` exists, so its two-event assertion fails. Identical probe on main passes with both receipts. No full canary.8 integrated-runtime verdict is claimed. |
| Negative control | In an isolated current-main worktree, change only `initialEpoch: epoch` to `initialEpoch: 0` in the integrated fixture. KV and real Prisma flow both fail the one-worker-invocation assertion: a missing first receipt append causes an internal job retry, so a later successful retry cannot hide the original failure. KV capability-refusal control stays green. |
| Broad runtime gate | Local scaffold.runtime deliberately not run. Coordinator must arm `e2e-cli-gate` and obtain the full CI verdict at the final head before merge. |

## Merged fixes and limits of attribution

All seven merge identities and changed surfaces were verified through GitHub PR metadata and the current source, rather than inferred from issue titles.

| PR / merge | What it establishes for the reported symptoms |
| --- | --- |
| [#2510](https://github.com/rickylabs/netscript/pull/2510), `24d63fd80e11309f32886d62fa8b22eaa74870fb` | Supported caller-persisted producer epochs prevent acknowledged-but-missing appends when a stable ID restarts. Direct canary.8/main probe and integrated epoch-zero controls demonstrate this symptom. Callers still must allocate the epoch; it is not automatic. |
| [#2499](https://github.com/rickylabs/netscript/pull/2499), `f6839463668c5dae4ca7234d26909e74e10b89c0` | Applied digest/state/history/correlation commit atomically; projection wrapper preserves atomic capability. Current replay assertions and neighboring atomic/projection tests cover this seam. Original failed-handler and OS-kill proof belongs to that PR; this run does not repeat it. |
| [#2517](https://github.com/rickylabs/netscript/pull/2517), `462f15c099c3d2d4600c4442111dce51edf0d4b2` | Preserves business phase separately from lifecycle metadata and uses canonical/indexed direct lookup. Canary.8 source overwrites business status; both integrated HTTP query paths now preserve recorded. |
| [#2522](https://github.com/rickylabs/netscript/pull/2522), `14816a409e31505bc528714332b0bf4670be2fcb` | Persists canonical Prisma status separately from business phase. This fixture asserts lifecycle running beside business recorded; it does not exercise every terminal/migration status. |
| [#2512](https://github.com/rickylabs/netscript/pull/2512), `20583c83c1e9af52ab8ac206c328aed67085cab7` | This is compensation-retry regression evidence and documentation, not a new production runtime fix. Its neighboring retry tests pass here; compensation is not part of this receipt flow. |
| [#2526](https://github.com/rickylabs/netscript/pull/2526), `7afe557fec73fcc3b0fb03987b4483030e3420db` | Discovers explicitly declared saga modules. Its declared-runtime tests pass here. The minimal flow deliberately injects the synthetic definition, so it does not independently establish generated-consumer module discovery. |
| [#2482](https://github.com/rickylabs/netscript/pull/2482), `02a66ba6dd62b34c69a245e16d3d640b751a28a1` | Replenishes worker-listener restart budgets after healthy intervals. Neighboring listener/health tests pass; no unplanned saga failure is observed during this fixture. It does not identify the original saga processor's unexplained exit cause. |

The issue itself records that the incompatible live path-singleton collision was application composition, subsequently corrected with a receipt-specific path/stable ID. This PR uses that supported shape without copying application code. It does not relabel that collision as a framework defect.

## Local gate results

- Structured reproduction: **3 passed, 0 failed, 0 ignored**, including real Prisma/Postgres.
- Neighboring targeted saga/projection/HTTP/compensation/discovery/streams/listener regressions: **81 passed, 0 failed, 6 backend-specific skips**. These skips are separate from the zero-skip reproduction.
- Producer history probe: main **1 passed**; exact canary.8 **1 expected failure** at missing physical receipt.
- Integrated forced epoch-zero controls: **1 passed, 2 expected failures**, both provider receipt flows red.
- Scoped source check/lint/fmt: zero findings on four new TypeScript files; the generated provider template is typechecked/executed by the Prisma test.
- `deno task quality:gate`: exit 0, broader quality/dependency/architecture checks pass with inherited advisories.
- Sagas JSR audit: exit 0, no FAIL, publish dry-run succeeds; inherited folder-cardinality and scanner banner advisories remain. New tests are outside the publish include list; no exports/dependencies change.
- No deno.lock change. No local scaffold.runtime. Final CI and independent exact-head review are recorded in the final handoff.
