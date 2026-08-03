# Worklog: sagas generated KV adapter registration

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-sagas-kv-glue-registration--w2-f` |
| Branch | `fix/sagas-kv-glue-registration` |
| Archetype | `5 — Plugin Package` |
| Scope overlays | `service` |

## Design

### Public Surface

- No exported function or subpath changes.
- Generated executable entrypoint: `sagas/runtime.ts` from `runtimeGlueStub.source`.

### Domain Vocabulary

- `runtimeGlueStub` — source authority for regenerated saga background glue.
- Redis adapter registration — the existing `@netscript/kv/redis` side-effect import.
- Saga lifecycle evidence — correlated start/step/terminal and compensating execution with durable state.

### Ports

- Existing `KvStore`/saga store ports only; no new port is introduced.

### Constants

- Existing `CACHE_PROVIDER` values (`garnet`/`redis`/`denokv`) remain the provider vocabulary.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 0 | Lock research/design and milestone PLAN-EVAL composition | plan checklist + owner waiver | run artifacts |
| 1 | Prove RED on emitted glue and unfixed real scaffold | focused failing test + captured `KvConnectionError` | `resources.test.ts`, worklog/evidence |
| 2 | Register Redis in regenerated glue and prove GREEN + Deno-KV compatibility | focused tests | `runtime.stub.ts`, test, worklog/evidence |
| 3 | Prove real AppHost health, full saga/compensation/correlation lifecycle, OTEL, and restart durability | owner protocol artifacts | worklog/evidence only |
| 4 | Prove quality, publishability, serialized full scaffold runtime, review, and hygiene | named gates | run artifacts only |

### Deferred Scope

- Published canary confirmation — milestone canary point 2.
- Builder/AST extraction (#1093) and provider architecture changes — separate ownership.

### Contributor Path

Generated runner behavior is changed in `plugins/sagas/src/adapter/resources/glue/runtime.stub.ts`;
semantic install-artifact assertions live in the adjacent `resources.test.ts`.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-04 | 0 | bootstrap | Read amended #1184, requested skills, milestone waiver, doctrine, code, and current environment. |
| 2026-08-04 | 0 | preflight | `aspire ps --format Json` returned `[]`; protected MCP processes and two foreign Postgres containers were left untouched. |
| 2026-08-04 | 0 | plan lock | Decisions D1–D5 locked; formal PLAN-EVAL composed per milestone waiver. |
| 2026-08-04 | 1 | emitted-glue RED | Added a semantic assertion over the collected `sagas/runtime.ts`; focused test failed exactly because Redis registration is absent. |
| 2026-08-04 | 1 | real scaffold created | Local CLI created `.llm/tmp/1184-red/saga-kv-red` with Postgres/default Redis cache and installed the sagas plugin; emitted runtime was inspected. |
| 2026-08-04 | 1 | real runtime RED | Executing that generated runtime with the scaffold's default `CACHE_PROVIDER=redis` failed in `openSagaRuntimeKv` with `KvConnectionError` before the runner could start. |
| 2026-08-04 | 1 | AppHost queued | A sibling #1191 AppHost acquired the shared slot after preflight; it is foreign and was left untouched. |
| 2026-08-04 | 2 | stub GREEN | Added the package-owned Redis registration import before the runner import; the focused emitted-glue test passed. |
| 2026-08-04 | 2 | green scaffold created | Local CLI created `.llm/tmp/1184-green/saga-kv-green`; regenerated `sagas/runtime.ts` contains the registration import before the runner. |
| 2026-08-04 | 2 | Deno-KV compatibility | The green generated project selected `CACHE_PROVIDER=denokv`, wrote and read a KV value successfully while the Redis registration module was loaded. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Register via unconditional side-effect import in the stub | Existing package-owned registration seam; Deno-KV selection remains independent. | plan D1–D2; KV source |
| Preserve raw evidence and quote decisive lines | Owner forbids exit-code-only or empty-health proof. | amended #1184 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Milestone run dir not present in this delegated checkout | minor | yes |
| Service overlay references two absent legacy `.claude` docs | minor | yes |

## Gate Results

### Plan Gate

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| PLAN-EVAL | composed per milestone-run.md (orchestrator waiver) | `plan-eval.md`; dispatch ruling D6 | No local formal evaluator spawned or awaited. |

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Public-surface baseline | `deno task doc:lint --root plugins/sagas --pretty` | BASELINE | 15 existing private-type refs, 0 missing JSDoc; no planned export change. |
| Generated-glue RED | `deno test --allow-all .../resources.test.ts --filter "registers Redis before"` | EXPECTED_FAIL | Exit 1; 0 passed, 1 failed. |
| Generated-glue GREEN | same focused command after the stub fix | PASS | `1 passed | 0 failed | 4 filtered out`. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-13 | NOT_RUN | pending RED/GREEN and owner runtime protocol | Runtime evidence is the closure bar. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Shared-host preflight | PASS | `aspire ps --format Json` → `[]` | No AppHost/scaffold run active. |
| Fresh scaffold artifact | PASS | `.llm/tmp/1184-red/saga-kv-red/sagas/runtime.ts` inspected | Real CLI scaffold; source lacks adapter registration and imports only the runner. |
| Unfixed generated runtime RED | PASS | actual generated `sagas/runtime.ts` stack | `KvConnectionError` thrown from `getKv` → `openSagaRuntimeKv` → runner startup. |
| Fixed generated artifact | PASS | `.llm/tmp/1184-green/saga-kv-green/sagas/runtime.ts` inspected | Registration precedes runner import. |
| Fixed AppHost lifecycle | QUEUED | detached host did not persist; no health claim made | Retry in an attached PTY after an empty shared-host preflight. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Fresh generated scaffold | IN_PROGRESS | RED and GREEN artifacts plus Deno-KV compatibility captured | AppHost lifecycle/OTEL/restart remain. |

## Owner Protocol Evidence

### Step 1 — Fresh local scaffold and emitted artefact

Commands executed from the repository root:

```text
deno run -A packages/cli/bin/netscript-dev.ts init saga-kv-red --path .llm/tmp/1184-red --db postgres --editor none --yes --no-git --force
deno run -A packages/cli/bin/netscript-dev.ts plugin install saga --name sagas --project-root .llm/tmp/1184-red/saga-kv-red --samples --force
```

Quoted artefact inspection (not inferred from either exit code):

```ts
import { runSagaRunner } from '@netscript/plugin-sagas/runtime';

if (import.meta.main) {
  await runSagaRunner({
```

The generated AppHost wiring independently shows the cache/resource boundary:

```text
register-infrastructure.mts: primaryCache = caches.get('redis')
register-infrastructure.mts: CACHE_PROVIDER: 'redis'
register-background.mts: ... 'sagas/runtime.ts'
register-background.mts: await withCacheReference(sagas, infrastructure.primaryCacheWiring)
```

### Step 5a — RED generated-glue test

The focused test exited 1 and printed the actual emitted artefact:

```text
sagas install runtime glue registers Redis before starting the runner ... FAILED
AssertionError: Expected actual: "... import { runSagaRunner } from
'@netscript/plugin-sagas/runtime'; ..." to contain:
"import '@netscript/kv/redis';".
FAILED | 0 passed | 1 failed | 4 filtered out
```

This is the intended RED: it exercises the collected install artefact, not the saga engine.

### Step 5b — RED fresh generated runtime

The real scaffold's generated runtime was executed with the same provider selection its AppHost
generates:

```text
CACHE_PROVIDER=redis REDIS_URI=redis://127.0.0.1:6379 deno run \
  --minimum-dependency-age=0 --node-modules-dir=none --unstable-worker-options \
  --unstable-kv --allow-all sagas/runtime.ts
```

The command exited 1, and the output—not the exit code—identified the shipped failure path:

```text
KvConnectionError: Redis/Garnet was selected but no Redis adapter is registered. Import
"@netscript/kv/redis" (or call registerRedisKvAdapter()) before opening KV.
    at initializeKv (.../packages/kv/src/shared.ts:130:13)
    at getKv (.../packages/kv/src/shared.ts:158:20)
    at openSagaRuntimeKv (.../packages/plugin-sagas-core/src/runtime/kv-runtime.ts:20:16)
    at SagaRuntimeSupervisor.start (.../runtime/supervisor.ts:110:27)
    at startSagaRunner (.../runtime/runner.ts:103:20)
    at runSagaRunner (.../runtime/runner.ts:121:25)
    at .../sagas/runtime.ts:9:3
```

### Step 1b — GREEN fresh generated artefact

The fixed local-source scaffold regenerated the user-facing file with package-owned registration
before runner startup:

```ts
import '@netscript/kv/redis';
import { runSagaRunner } from '@netscript/plugin-sagas/runtime';
```

### Compatibility — generated glue with `CACHE_PROVIDER=denokv`

From the fixed generated project, a real Deno-KV open/write/read was performed while the Redis
registration import was loaded. The inspected value was:

```text
{"value":"denokv"}
```

This proves the side-effect import registers a capability without overriding explicit provider
selection.

## Handoff Notes

- Inspect the emitted artifact test, then the seven owner-protocol evidence blocks before reviewing
  the one-line stub change.
