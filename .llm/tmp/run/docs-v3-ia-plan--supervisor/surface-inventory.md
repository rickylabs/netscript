# Public-Surface Inventory & Doc-Coverage Matrix

**Baseline:** `origin/main` @ `5f273355` (branch `docs/v3-ia-plan`).
**Source:** every `deno.json` under `packages/**` and `plugins/**` with a `@netscript/*` name + `exports`
map (read directly; full sweep). Closes Codex panel **blocker #2** ("public-surface inventory incomplete").
**Totals:** 27 packages + 5 plugins = **32 published units**, **242 export subpaths** (`.` counted once per unit).

This is the authoritative completeness contract: **every public subpath below is classified** into exactly
one primary doc disposition. WS3 acceptance (`plan.md`) binds to this matrix — "no shipped public subpath
remains unclassified."

## Classification legend

| Code | Disposition | Meaning |
|------|-------------|---------|
| **N** | Capability narrative | Gets prose treatment in a `/capabilities/*` hub and/or `/explanation/*` essay. |
| **H** | How-to / tutorial | Demonstrated in a `/how-to/*` recipe or a tutorial-track chapter. |
| **R** | Generated reference only | Linked via xref to `/reference/<unit>` (deno doc); no hand-authored narrative. Default for ports/domain/adapters/config/contracts/telemetry extension subpaths. |
| **T** | Testing-only | A `./testing` helper export; surfaced only as a "Testing" reference link. |
| **D** | Deferred / stub (debt) | Underlying surface is a known stub/alpha; documented with a **status badge + honest caveat**, NOT full narrative. Never hidden. |

A subpath may be exercised in multiple zones; the table lists its **primary** disposition plus secondary
zones in parentheses. "Narrative home" is the single page a reader lands on first.

---

## Packages (27)

| Unit | Narrative home | N (narrative) | H (how-to/tutorial) | R (reference-only) | T | D (deferred/stub) |
|------|----------------|---------------|---------------------|--------------------|---|-------------------|
| `@netscript/fresh` (11) | `capabilities/fresh-framework` ★NEW | `.`, `server`, `builders`, `route`, `defer`, `form`, `error`, `query`, `interactive`, `streams` | Track D (01–06); how-to/`forms-three-ways`, `tanstack-query` | `vite` (R; named in quickstart) | `testing` | — |
| `@netscript/sdk` (10) | `capabilities/sdk` ★NEW | `.`, `client`, `discovery`, `cache`, `collections`, `query`, `query-client` | how-to/`discover-services`; Track D 03/05 | `streams`, `telemetry`, `ports` | — | — |
| `@netscript/service` (2) | `capabilities/services` | `.` (incl. shutdown hooks, OpenAPI/Scalar, health primitives), `auth` | how-to/`graceful-shutdown`, `expose-openapi-scalar`; Track A 02 | — | — | — |
| `@netscript/database` (10) | `capabilities/database` | `.`, `ports`, `adapters`, `adapters/postgres`, `adapters/mssql`, `adapters/mysql`, `tracing` | how-to/`use-a-second-database`; Track B 03 | `extensions`, `scripts` | `testing` | — |
| `@netscript/plugin-workers-core` (15) | `capabilities/background-jobs` + `polyglot-tasks` ★NEW | `.`, `builders`, `workflow`, `executor`, `runtime`, `state`, `registry`, `presets`, `shutdown` | how-to/`tune-worker-runtime`, `run-a-polyglot-task`; Track C 02/03 | `contracts/v1`, `schemas`, `telemetry`, `abstracts`, `config` | `testing` | job-tools `createJobTools` no-op → badge+caveat (see WS7) |
| `@netscript/plugin-sagas-core` (15) | `capabilities/durable-sagas` | `.`, `builders`, `runtime`, `stores`, `presets`, `middleware`, `transports`, `agent`, `integration/workers`, `integration/publisher` | Track A 04 | `domain`, `ports`, `adapters`, `telemetry`, `config`, `contracts/v1`, `streams`, `abstracts` | `testing` | — |
| `@netscript/plugin-triggers-core` (10) | `capabilities/triggers` | `.`, `builders`, `runtime`, `adapters`, `public` | Track A 05; Track C 04 | `domain`, `ports`, `config`, `contracts/v1`, `telemetry` | `testing` | — |
| `@netscript/plugin-auth-core` (8) | `capabilities/auth` (seam) | `.`, `domain`, `ports`, `presets` | how-to/`add-authentication`; Track B 02/05 | `contracts/v1`, `telemetry`, `streams`, `config` | `testing` | — |
| `@netscript/plugin-streams-core` (3) | `capabilities/streams` | `.` | Track D 05 | `telemetry` | `testing` | streams **consumer** manifest helpers throw (stub) → badge+caveat |
| `@netscript/queue` (12) | `capabilities/kv-queues-cron` | `.`, `adapters/deno-kv`, `adapters/redis`, `adapters/amqp`, `adapters/postgres` | how-to/`choose-a-queue-provider`; Track C 04 | `adapters/kv-dead-letter-store`, `adapters/postgres-dead-letter-store`, `adapters/redis-dead-letter-store`, `adapters/kv-polling`, `ports`, `errors`, `validation` | `testing` | — |
| `@netscript/kv` (4) | `capabilities/kv-queues-cron` | `.`, `redis` | Track A 01 (KV adapter registration) | `kvdex` | `testing` | — |
| `@netscript/cron` (4) | `capabilities/kv-queues-cron` | `.` | Track C 04 | `adapters`, `ports` | `testing` | — |
| `@netscript/telemetry` (8) | `capabilities/telemetry` + `explanation/observability` ★NEW | `.`, `tracer`, `context`, `instrumentation` | — | `config`, `attributes`, `registry`, `orpc` | — | — |
| `@netscript/logger` (3) | `explanation/observability` | `.` | — | `middleware`, `orpc` | — | — |
| `@netscript/aspire` (8) | `explanation/architecture` + `explanation/aspire` ★NEW | `.`, `application` | how-to/`deploy-to-production`; quickstart | `config`, `schema`, `types`, `constants`, `adapters` | `testing` | — |
| `@netscript/runtime-config` (1) | `capabilities/runtime-config` ★NEW | `.` | how-to (runtime overrides) | — | — | — |
| `@netscript/config` (4) | `capabilities/runtime-config` + `explanation/architecture` | `.` | — | `merge`, `paths`, `schema/plugins` | — | — |
| `@netscript/contracts` (4) | `explanation/contracts-first` + `capabilities/services` | `.`, `crud`, `query`, `transform` | Track A 03 | — | — | — |
| `@netscript/fresh-ui` (3) | `capabilities/fresh-ui` | `.`, `interactive` | Track D | `primitives` | — | — |
| `@netscript/plugin` (8) | `explanation/plugin-system` ★NEW + how-to/`add-a-plugin` | `.`, `abstracts`, `loader` | how-to/`add-a-plugin` | `config`, `cli`, `sdk`, `templates` | `testing` | — |
| `@netscript/cli` (3) | `cli-reference` | `.` | how-to (all CLI recipes) | `scaffolding` | `testing` | `marketplace publish\|search` = **stub** → badge+caveat (M8) |
| `@netscript/auth-kv-oauth` (8) | `capabilities/auth` (backend) | `.`, `backend`, `providers`, `flow` | how-to/`add-authentication`; Track B 02 | `store`, `crypto`, `cookies`, `errors` | — | — |
| `@netscript/auth-workos` (1) | `capabilities/auth` (backend) | `.` | how-to/`add-authentication` | — | — | — |
| `@netscript/auth-better-auth` (1) | `capabilities/auth` (backend) | `.` | how-to/`add-authentication`; Track B 02 | — | — | — |
| `@netscript/prisma-adapter-mysql` (1) | `capabilities/database` (mysql path) | — | how-to/`use-a-second-database` | `.` | — | — |
| `@netscript/watchers` (1) | `capabilities/triggers` (file-watch) | `.` | Track C 04 (file watch) | — | — | — |

## Plugins (5) — the deployable wiring/runtime units

| Unit | Narrative home | N | H | R (reference-only) | T |
|------|----------------|---|---|--------------------|---|
| `@netscript/plugin-workers` (9) | `capabilities/background-jobs` | `.` | `cli`, `scaffolding` (CLI ref); Track C | `aspire`, `contracts`, `services`, `streams`, `streams/server`, `worker` | — |
| `@netscript/plugin-sagas` (12) | `capabilities/durable-sagas` | `.`, `public`, `runtime` | `cli`, `scaffolding`; Track A 04 | `plugin`, `e2e`, `aspire`, `contracts`, `services`, `streams`, `streams/server` | — |
| `@netscript/plugin-triggers` (9) | `capabilities/triggers` | `.`, `public`, `runtime` | `cli`, `scaffolding`; Track A 05 | `plugin`, `aspire`, `services`, `streams`, `streams/server` | — |
| `@netscript/plugin-streams` (5) | `capabilities/streams` | `.` | `cli`, `scaffolding`; Track D 05 | `e2e`, `aspire` | — |
| `@netscript/plugin-auth` (7) | `capabilities/auth` | `.`, `public` | how-to/`add-authentication`; Track B | `plugin`, `contracts`, `services`, `streams`, `streams/server` | — |

---

## Coverage roll-up

- **Net-new narrative homes required** (★NEW): `capabilities/{fresh-framework, sdk, polyglot-tasks,
  runtime-config}`, `explanation/{architecture, plugin-system, observability, aspire, durability-model}`.
- **Enrichment of existing hubs** with newly-classified narrative subpaths: `services` (shutdown/OpenAPI/health),
  `database` (mssql/mysql/tracing), `durable-sagas` (presets/middleware/transports/agent/integration), `triggers`
  (adapters/runtime), `background-jobs` (worker runtime modes/shutdown), `kv-queues-cron` (4 queue providers + cron).
- **Reference-only (R) subpaths** are linked, never authored — they are the bulk of `domain/ports/adapters/
  config/contracts/telemetry/abstracts` subpaths. Every R subpath must resolve to a `ref:<unit>/<subpath>` xref key
  (WS6) so a hub can link it without a hardcoded path.
- **Testing-only (T)** subpaths get a single "Testing utilities → reference" link per hub.
- **Deferred/stub (D)** — exactly three, each gets a status badge + one honest caveat (no hiding, no repetition):
  `plugin-workers-core` job-tools `createJobTools` no-op; `plugin-streams-core` consumer manifest stub; CLI
  `marketplace publish|search` "coming soon" stub.

**Acceptance (binds WS3):** a build-run check enumerates all 242 subpaths from the export maps and asserts each
appears in this matrix with a disposition; any unclassified subpath fails the gate.
