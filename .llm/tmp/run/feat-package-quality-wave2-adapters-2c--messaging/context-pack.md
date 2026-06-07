# Context Pack — Wave 2c Messaging (queue · cron)

Run ID: `feat-package-quality-wave2-adapters-2c--messaging`
Branch: `feat/package-quality-wave2-adapters-2c`
Base: `feat/package-quality-wave2-adapters` @ `55f6108` (umbrella = track + 2a + 2b)
PR target: `feat/package-quality-wave2-adapters` (umbrella) — **not** the track.
Role: SEED for the Research → Plan & Design phases. Authored by the SUPERVISOR
session. This is **not** a PLAN-EVAL or IMPL-EVAL artifact.

> This file front-loads context so the generator/plan session does not re-derive
> it. The locked slice authority is the combined Wave 2 `plan.md`
> (`…/feat-package-quality-wave2-adapters--adapters/plan.md`, § "Sub-wave 2c —
> messaging"). Do not re-open settled OQ-1..OQ-7 decisions; carry them in.

## Scope

In scope — align to JSR alpha package-quality (A2 archetype):

- `packages/queue`
- `packages/cron`

Out of scope and not to be changed:

- Wave 2a units (logger, telemetry, aspire) and Wave 2b units (kv, database,
  prisma-adapter-mysql) — already merged into the umbrella.
- `npm:ioredis@^5` → `jsr:@db/redis` migration (see "Deferred" below — explicitly
  a future track, NOT Wave 2).
- S2/S3 CI, versioning, publishing, OIDC, and the umbrella → track merge.

## Why 2c forks off the umbrella (dependency order)

`queue` consumes `@netscript/kv` (kv-polling adapter). kv was hardened in 2b.
So 2c **must** base on the umbrella tip (`55f6108`), which contains 2a+2b, not on
the track (`698d890`, 2a only). Confirmed: `698d890` and 2b tip `cf017d9` are both
ancestors of `55f6108`.

## Carried-in decisions (locked — do not re-litigate)

From the combined plan + 2b drift "Decisions / renames":

- **queue**: rename `interfaces/` → `ports/`; rename `utils/` → `validation/`
  (AP-16); subpath `./types` → `./ports` (`./validation` subpath name unchanged).
  Alpha = no back-compat shims. Zero external consumers found for
  `@netscript/queue/types` or `@netscript/queue/validation`.
- **cron**: rename `interfaces/` → `ports/`; subpath `./types` → `./ports`. Zero
  external consumers found for `@netscript/cron/types`. `plugins/triggers` and
  `plugins/workers` import `@netscript/cron` **root** only — unaffected by the
  subpath rename, but they are the consumer-gate targets.
- **`./testing` port-contract entrypoint** is REQUIRED for both queue and cron
  (multi-adapter units): in-memory queue adapter + in-memory scheduler adapter.

## Structural baseline (at `55f6108`)

`packages/queue` (pre-rename):
```
adapters/{_envelope,amqp.adapter,deno-kv.adapter,kv-polling.adapter,redis.adapter,mod}.ts
factory/{create-parallel-queue,create-queue,create-typed-queue,mod}.ts
interfaces/{errors,message-queue,options,mod}.ts        → rename to ports/
internal/{distributed-queue,parallel-queue,mod}.ts
utils/{validation,mod}.ts                               → rename to validation/
tests/{envelope,errors,options,typed-queue,validation}_test.ts
deno.json  README.md  mod.ts
```

`packages/cron` (pre-rename):
```
adapters/{_shared,deno.adapter,memory.adapter,mod}.ts
interfaces/{scheduler,types,mod}.ts                     → rename to ports/
tests/{memory-adapter,scheduler,types}_test.ts
deno.json  README.md  mod.ts
```

Folder-cardinality (F-16) after rename holds: queue `ports/` = 4 files, cron
`ports/` = 3 files (both ≥2). Note cron already has a `memory.adapter.ts`; the
`./testing` slice should expose it (or a dedicated in-memory scheduler) via a
`./testing` entrypoint rather than duplicating it — confirm during planning.

## MEASURE-FIRST (re-baseline before locking the plan)

The 2b drift recorded dynamic gates for queue/cron measured at `ca4d9c4`:

| Unit  | publish dry-run | `deno doc --lint`                                              |
|-------|-----------------|---------------------------------------------------------------|
| queue | 0 slow types    | **19+ errors** (missing-jsdoc on exported symbols)            |
| cron  | 0 slow types    | **5 errors** (private-type-ref `CronProviderRegistry` + jsdoc)|

These numbers are **carried-in / stale** (base was `ca4d9c4`, not `55f6108`, and
the telemetry 2a lesson showed full-export sweeps explode vs root-only). Treat
them as MEASURE-FIRST: the generator's Research step 1 must re-run, on a FULL
export sweep across every `exports` entrypoint, both:

- `deno publish --dry-run --allow-dirty` (expect 0 slow types — confirm)
- `deno doc --lint <every exports entrypoint>` (re-count; the 2a telemetry
  escalation went root-only 2 → full-sweep 168, so do NOT trust root-only)

…for queue and cron at `55f6108`, and record real numbers in `drift.md` before
locking slice effort. (Supervisor did NOT run these — boundary.)

## Deferred — @db/redis migration (NOT 2c)

2b assessed migrating `npm:ioredis@^5` → `jsr:@db/redis` (denodrivers/redis
v0.41.2). Recorded recommendation: a **dedicated future migration track, NOT
Wave 2**, gated behind a spike (port kv first, then queue, then sagas Streams).
Therefore **2c keeps `npm:ioredis@^5`** in `packages/queue/adapters/redis.adapter.ts`.
Do not migrate. queue's ioredis surface (informs the defensive-I/O slice):
`zadd/lpush/brpoplpush (blocking)/zrangebyscore/zrem/lrem`, with **dual
command + blocking clients**.

## Concept of Done (per the locked plan, ~14–16 slices)

queue:
1. `interfaces/` → `ports/`, `utils/` → `validation/` rename.
2. subpath exports updated (`./types` → `./ports`).
3. internal imports updated post-rename.
4. doc-lint → 0 (JSDoc on all exported symbols; full export sweep).
5. `./testing` entrypoint with in-memory queue adapter.
6. defensive I/O tests: abort/cleanup for kv-polling timers, amqp timers, **and
   the blocking redis client (`brpoplpush`)**.
7. `lint`, `fmt`, `publish:dry-run` tasks in `deno.json`.
8. `tests/_fixtures/docs-examples_test.ts` doctest.
9. verify: `publish:dry-run` 0 slow types + `deno doc --lint` clean.

cron:
10. `interfaces/` → `ports/` rename + subpath (`./types` → `./ports`).
11. doc-lint → 0 (JSDoc + `CronProviderRegistry` visibility fix).
12. `./testing` entrypoint with in-memory scheduler adapter.
13. defensive I/O tests: abort/cleanup for scheduler timers.
14. `lint`, `fmt`, `publish:dry-run` tasks; scaffold `/docs`.
15. verify: `publish:dry-run` 0 slow types + `deno doc --lint` clean.

cross-cutting:
16. consumer gate — `deno check` on `packages/cli`, `plugins/triggers`,
    `plugins/workers` after the renames.

Merge-readiness gate (Wave 2 is complete only after 2c): `deno task e2e:cli`
PASS, run **once** as the final slice of 2c (the last sub-wave). If it fails on
unrelated Wave-0/1 drift, log in `drift.md` and escalate — do not block the merge
on out-of-scope failures (per plan risk register).

## Gates (A2 archetype)

Static (every slice): `deno check --unstable-kv`, `deno lint`, `deno fmt --check`.
Fitness: F-1..F-12, F-14..F-18 (F-13 n/a). F-16 folder-cardinality verified at the
rename slices (queue slice 1, cron slice 10). Consumer gate: slice 16. Per the
archetype gate matrix in `.llm/harness/gates/archetype-gate-matrix.md`.

## Open items for Plan & Design

- Confirm cron `./testing` reuses the existing `memory.adapter.ts` vs a new
  in-memory scheduler (avoid duplication; F-16 cardinality).
- Re-measure queue/cron doc-lint on full export sweep at `55f6108` (MEASURE-FIRST)
  before locking per-slice effort.
- Confirm `_envelope.ts` / `_shared.ts` underscore-private files stay excluded
  from the public surface (no JSDoc/doc-lint obligation if not exported).

## Process boundaries (Harness v2)

- Generator, PLAN-EVAL, and IMPL-EVAL are each SEPARATE sessions.
- Evaluator must be a different session from the generator.
- Never delete lock files / caches; never `deno cache --reload` without approval.
- Record every deviation from the locked plan in `drift.md`.
