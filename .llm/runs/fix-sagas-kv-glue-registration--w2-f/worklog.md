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

- Existing `KvStore`/saga store ports remain unchanged. Generated saga runners now receive one
  Aspire-assigned, dynamically proxied HTTP endpoint used only for `/health`.

### Constants

- Existing `CACHE_PROVIDER` values (`garnet`/`redis`/`denokv`) remain the provider vocabulary.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 0 | Lock research/design and milestone PLAN-EVAL composition | plan checklist + owner waiver | run artifacts |
| 1 | Prove RED on emitted glue and unfixed real scaffold | focused failing test + captured `KvConnectionError` | `resources.test.ts`, worklog/evidence |
| 2 | Register Redis in regenerated glue and prove GREEN + Deno-KV compatibility | focused tests | `runtime.stub.ts`, test, worklog/evidence |
| 3 | Prove real AppHost health, full saga/compensation/correlation lifecycle, OTEL, and restart durability | owner protocol artifacts | saga glue, saga-only AppHost probe wiring, KV service bootstrap, worklog/evidence |
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
| 2026-08-04 | 3 | health bar RED | Fixed `sagas` reached `Running`, but `healthReports: {}` proved no check ran; the owner protocol rejected that fallback state. Scope was explicitly expanded to saga-only supervisor health wiring. |
| 2026-08-04 | 3 | real health GREEN | Final fresh scaffold reported populated `sagas_http_/health_200_check: Healthy`; the probed body reported `status=running`, `adapter=native`, `definitionCount=2`. |
| 2026-08-04 | 3 | KV service bootstrap | The fresh KV scaffold lacked optional saga Prisma projections; the API now starts its KV durable runtime while Prisma backend still fails closed. Internal resolver tests passed 3/3. |
| 2026-08-04 | 3 | lifecycle GREEN | Four API publishes returned 200: start, step, complete, and rollback. Durable Redis envelopes show distinct completed and compensating instances. |
| 2026-08-04 | 3 | OTEL GREEN | `aspire otel traces|spans|logs` showed four `saga.handle` spans and Redis connection logs; correlation keys stayed stable and separate. |
| 2026-08-04 | 3 | restart GREEN | `sagas-api` PID changed 275673→278465 and `sagas` PID changed 275672→280444; durable envelopes and populated saga health survived. |
| 2026-08-04 | 3 | teardown | Exact AppHost stop was followed by process-tree verification; the briefly surviving runner exited, and scoped teardown removed four owned Postgres containers while leaving two foreign containers untouched. |
| 2026-08-04 | 4 | scoped quality | Check/lint/fmt wrappers passed for 79 saga files and 22 touched CLI-helper files with zero findings; focused suites passed 48 total test/BDD steps. |
| 2026-08-04 | 4 | framework law | `deno task quality:gate` passed; quality scan had zero findings and doctrine had zero failures. |
| 2026-08-04 | 4 | package surface | Doc-lint stayed at its 15-private-ref/0-missing-JSDoc baseline; targeted `deno publish --dry-run --allow-dirty` completed successfully. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Register via unconditional side-effect import in the stub | Existing package-owned registration seam; Deno-KV selection remains independent. | plan D1–D2; KV source |
| Preserve raw evidence and quote decisive lines | Owner forbids exit-code-only or empty-health proof. | amended #1184 |
| Add saga-only health endpoint/probe | Empty reports were explicitly disallowed; the check is backed by the started supervisor snapshot. | owner protocol step 2; drift ruling |
| Treat Prisma projections as optional only for KV backend | KV is the durable state authority; Prisma backend still requires its full delegates. | fresh-scaffold runtime evidence |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Milestone run dir not present in this delegated checkout | minor | yes |
| Service overlay references two absent legacy `.claude` docs | minor | yes |
| Empty saga health reports required product probe wiring | significant/rescoped | yes |
| KV API bootstrap unconditionally required optional Prisma projections | significant/rescoped | yes |

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
| Supervisor health glue | `resources.test.ts` | PASS | 6/6 resource tests; emitted glue owns `/health`. |
| Saga AppHost probe generation | `generators-background-app_test.ts --filter generateRegisterBackground` | PASS | 17/17 steps. |
| KV/Prisma delegate policy | `database-client_test.ts` | PASS | 3/3 tests. |
| Scoped saga check/lint/fmt | repo wrappers, 79 files | PASS | 0 findings across all three wrappers. |
| Scoped CLI-helper check/lint/fmt | repo wrappers, 22 files | PASS | 0 findings across all three wrappers. |
| Framework quality | `deno task quality:gate` | PASS | 0 quality findings; 0 doctrine failures; warnings are baseline. |
| Doc-lint | `deno task doc:lint --root plugins/sagas --pretty` | BASELINE | 15 private refs, 0 missing JSDoc, unchanged. |
| Publish dry-run | `plugins/sagas: deno publish --dry-run --allow-dirty` | PASS | Pack manifest inspected; dry run complete. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-13 | PASS | actual generated AppHost + HTTP lifecycle + Redis state + OTEL + restart | No engine-only substitution. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Shared-host preflight | PASS | `aspire ps --format Json` → `[]` | No AppHost/scaffold run active. |
| Fresh scaffold artifact | PASS | `.llm/tmp/1184-red/saga-kv-red/sagas/runtime.ts` inspected | Real CLI scaffold; source lacks adapter registration and imports only the runner. |
| Unfixed generated runtime RED | PASS | actual generated `sagas/runtime.ts` stack | `KvConnectionError` thrown from `getKv` → `openSagaRuntimeKv` → runner startup. |
| Fixed generated artifact | PASS | `.llm/tmp/1184-green/saga-kv-green/sagas/runtime.ts` inspected | Registration precedes runner import. |
| Fixed AppHost lifecycle | PASS | `.llm/tmp/1184-final/saga-kv-final` | Attached launcher PTY; fresh user scaffold. |
| Fixed process health | PASS | populated `sagas_http_/health_200_check` plus HTTP body | Supervisor snapshot, not process-liveness fallback. |
| Lifecycle + compensation | PASS | four 200 publishes; Redis envelopes; OTEL spans | Completed and compensated outcomes use separate correlation keys/instances. |
| Restart durability | PASS | changed process PIDs; unchanged durable envelopes | Both API and background runner restarted. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Fresh generated scaffold | PASS | final scaffold artifact, AppHost, lifecycle, OTEL, restart | Published-package confirmation remains canary point 2. |

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
import { startSagaRunner } from '@netscript/plugin-sagas/runtime';
```

### Compatibility — generated glue with `CACHE_PROVIDER=denokv`

From the fixed generated project, a real Deno-KV open/write/read was performed while the Redis
registration import was loaded. The inspected value was:

```text
{"value":"denokv"}
```

This proves the side-effect import registers a capability without overriding explicit provider
selection.

### Step 1c — Final fresh user scaffold

The closure scenario was recreated from scratch under
`.llm/tmp/1184-final/saga-kv-final` with the normal local CLI path:

```text
netscript-dev init saga-kv-final --path .llm/tmp/1184-final --db postgres ...
netscript-dev plugin install saga --name sagas --db postgres --project-root ... --samples --force
netscript-dev generate plugins --project-root ... --verbose
aspire restore
netscript-dev db init --db all ...
netscript-dev db generate --db all ...
netscript-dev db seed --db all ...
```

Artefacts were inspected after generation: `sagas/runtime.ts` contains the Redis registration and
supervisor-backed `/health`; `register-background.mts` contains both
`sagas.withHttpEndpoint({ env: 'PORT' })` and `sagas.withHttpHealthCheck(...)`; the generated
registry imports two definitions. `deno check --unstable-kv` passed on all three generated/user
runtime files.

### Step 2 — Genuine saga background health

`aspire describe sagas --format Json` returned a populated report:

```json
{
  "state": "Running",
  "healthStatus": "Healthy",
  "healthReports": {
    "sagas_http_/health_200_check": { "status": "Healthy" }
  }
}
```

The proxied health artefact was then read directly:

```text
200 {"status":"running","adapter":"native","definitionCount":2}
```

### Step 3 — Full terminal and compensating lifecycles

The actual saga API returned these response artefacts:

```text
200 {"published":true,"messageType":"issue1184.started","correlationId":"issue1184-terminal-d"}
200 {"published":true,"messageType":"issue1184.step","correlationId":"issue1184-terminal-d"}
200 {"published":true,"messageType":"issue1184.complete","correlationId":"issue1184-terminal-d"}
200 {"published":true,"messageType":"issue1184.rollback","correlationId":"issue1184-compensate-e"}
```

Reading Redis through the same adapter showed the durable outcome rather than trusting HTTP exits:

```json
{"instanceId":"issue1184-protocol:issue1184-terminal-d","version":3,"status":"completed","state":{"status":"completed","steps":["started","step","completed"],"workflowId":"issue1184-terminal-d"}}
{"instanceId":"issue1184-protocol:issue1184-compensate-e","version":1,"status":"compensating","state":{"status":"rollback-requested","steps":["rollback-requested"],"workflowId":"issue1184-compensate-e"}}
```

`compensating` is the engine's terminal compensated status; the corresponding telemetry outcome is
quoted below.

### Step 4 — Traces, spans, logs, and correlation

The required commands were run against the live dashboard:

```text
aspire otel traces sagas-api --dashboard-url https://localhost:44795 ...
aspire otel spans sagas-api --dashboard-url https://localhost:44795 --search issue1184-protocol ...
aspire otel logs sagas-api --dashboard-url https://localhost:44795 ...
aspire otel logs sagas --dashboard-url https://localhost:44795 ...
```

Filtered `saga.handle` span artefacts:

```text
7f53... event=issue1184.started  instance=issue1184-protocol:issue1184-terminal-d correlation=issue1184-terminal-d outcome=success
0eb6... event=issue1184.step     instance=issue1184-protocol:issue1184-terminal-d correlation=issue1184-terminal-d outcome=success
7a90... event=issue1184.complete instance=issue1184-protocol:issue1184-terminal-d correlation=issue1184-terminal-d outcome=success
5366... event=issue1184.rollback instance=issue1184-protocol:issue1184-compensate-e correlation=issue1184-compensate-e outcome=compensated
```

This proves all three terminal-path steps remained on one instance while the separate compensation
workflow remained on a second instance; correlation did not collapse them. Logs independently show:

```text
CACHE_PROVIDER forced Redis KV backend
Initializing shared Redis KV adapter
Connected Redis KV adapter
[Sagas API] Running on http://localhost:45381
```

The saga background logs show the health listener both before and after restart, with no
`KvConnectionError`.

### Step 6 — Restart durability

The API process was restarted from PID `275673` to `278465`; its post-restart log says
`[Sagas API] Running on http://localhost:46229`. The saga background was restarted from PID
`275672` to `280444`; its populated health report and supervisor body remained healthy.

After both restarts, Redis still returned the exact version-3 completed envelope and the distinct
version-1 compensating envelope quoted in step 3, including their original traceparents.

### Step 7 — Artefact-first verification and teardown

Every claim above comes from emitted source, response bodies, `healthReports`, Redis envelopes, or
OTEL payloads. No piped exit status is used as evidence. After `aspire stop`, the exact owned process
tree was checked (the briefly surviving watch process exited), scoped teardown removed four owned
Postgres containers, and the two foreign containers reported by leak-check were left untouched.

## Handoff Notes

- Inspect the emitted artefact tests, saga-only health wiring, backend-aware KV bootstrap, and the
  seven owner-protocol evidence blocks. Published-package confirmation remains canary point 2.
