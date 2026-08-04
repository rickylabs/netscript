# #1223 seven-point protocol — GREEN on Redis/Garnet and Deno KV

## 1. Fresh user scaffolds

Two projects were created with the local maintainer CLI, not fixtures:

> `.llm/tmp/1223-protocol/redis/saga-1223-redis`
>
> `.llm/tmp/1223-protocol/denokv/saga-1223-denokv`

Each installed the sagas plugin, generated the registry, migrated/generated/seeded Postgres, and
started its generated TypeScript AppHost. Redis used the default shared cache. Deno KV used its
supported shared `Container` mode, with both processes receiving `CACHE_PROVIDER=denokv` and the
same `DENO_KV_URL`.

## 2. Genuine health

Redis/Garnet runner and API:

> `{"state":"Running","healthStatus":"Healthy","healthReports":{"sagas_http_/health_200_check":{"status":"Healthy"}}}`
>
> `{"state":"Running","healthStatus":"Healthy","healthReports":{"sagas-api_http_/health_200_check":{"status":"Healthy"}}}`

Deno KV runner and API:

> `{"state":"Running","healthStatus":"Healthy","healthReports":{"sagas_http_/health_200_check":{"status":"Healthy"}},"cache":"denokv","kvUrl":"http://localhost:46507"}`
>
> `{"state":"Running","healthStatus":"Healthy","healthReports":{"sagas-api_http_/health_200_check":{"status":"Healthy"}},"cache":"denokv","kvUrl":"http://localhost:46507"}`

The reports are populated named HTTP checks; empty reports were not accepted.

## 3. Full lifecycle and compensation

On each backend, four inspected publish bodies returned HTTP 200 for `started`, `step`, `complete`,
and `rollback`. The inspected `/api/v1/sagas/sagas` response listed `issue1223-protocol`.

Redis `/instances`:

> `redis-terminal-1223`: `status=completed`, `version=3`, `steps=[started,step,completed]`
>
> `redis-compensate-1223`: `status=compensating`, `version=1`, `steps=[rollback-requested]`

Deno KV `/instances`:

> `denokv-terminal-container-1223`: `status=completed`, `version=3`,
> `steps=[started,step,completed]`
>
> `denokv-compensate-container-1223`: `status=compensating`, `version=1`,
> `steps=[rollback-requested]`

`compensating` is the persisted terminal compensation status; the execution outcome is proved by the
spans below.

## 4. OTEL traces, spans, logs, correlation

The required `aspire otel traces`, `aspire otel spans`, and `aspire otel logs` artifacts are stored
under `evidence/{redis,denokv}/otel-*.json`.

Redis spans:

> `started`, `step`, `complete` → instance `issue1223-protocol:redis-terminal-1223`, correlation
> `redis-terminal-1223`, outcome `success`
>
> `rollback` → instance `issue1223-protocol:redis-compensate-1223`, correlation
> `redis-compensate-1223`, outcome `compensated`

Deno KV spans:

> `started`, `step`, `complete` → instance `issue1223-protocol:denokv-terminal-container-1223`,
> correlation `denokv-terminal-container-1223`, outcome `success`
>
> `rollback` → instance `issue1223-protocol:denokv-compensate-container-1223`, correlation
> `denokv-compensate-container-1223`, outcome `compensated`

Each backend produced five traces and four filtered `saga.handle` spans. Terminal and compensation
correlations remain on distinct instances; no collapse occurred. Deno KV resource logs explicitly
say `CACHE_PROVIDER forced Deno KV` and `Initializing shared Deno KV adapter`.

## 5. RED before GREEN

The real Redis integration test persisted a Date-valued `SagaStateEnvelope`, loaded it through
`KvSagaStore`, asserted the runtime value was a string, then projected it.

Before the fix (`evidence/red-real-redis.txt`):

> `TypeError: metadata.createdAt.toISOString is not a function`
>
> `FAILED | 0 passed | 1 failed`

After the private boundary revival (`evidence/green-real-redis.txt`):

> `projection revives date strings from real Redis-persisted saga state ... ok`
>
> `ok | 1 passed | 0 failed`

## 6. Restart durability

Both runner and API resources were restarted separately on both backends. New PIDs were observed,
their populated health checks returned Healthy again, and `/instances` retained the exact versions,
steps, created/updated timestamps, and distinct correlations quoted in step 3.

## 7. Artifact-first verdict and hygiene

Every claim above was read from response JSON, Aspire describe JSON, resource logs, or OTEL JSON; no
piped exit status was used as a verdict. The two owned AppHosts were stopped and ownership-aware
teardown removed their containers. The foreign wave5 Postgres container was reported and untouched.
