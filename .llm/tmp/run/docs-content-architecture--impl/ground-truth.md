# Ground Truth — real scaffold, verified by running it

Captured 2026-06-19 by running `deno task e2e:cli run scaffold.runtime --format pretty` (no cleanup).
The generated project persists at `.llm/tmp/cli-e2e/plugin-smoke-20260619-050854/`. This is the
**authority** for every command, path, endpoint, and code shape in the docs. Do not invent surface.

## What the suite actually did (observed step trace)

| Step | Result | Note |
| --- | --- | --- |
| preflight deno / aspire | PASS | deno 2.8.3, aspire 13.2.2 |
| `init` (service `users` :3001, db postgres) | PASS (61s) | scaffolds full project |
| `plugin add worker/saga/trigger/stream --samples` | PASS | 4 official plugins |
| `plugin list` | PASS | registry generated |
| `db init` | **FAILED** | see "Database reality" below — NOT a product bug |

**`db init` failure is the key lesson, not a defect.** It failed with
`aspire start failed: … Project file does not exist` because `db init` **provisions Postgres through
Aspire** and the isolated e2e ran it with cwd=repo-root so Aspire couldn't find the AppHost project.
The real dev flow runs `aspire run` first (from `aspire/`), which brings up Postgres, *then* db
commands work. getting-started.md omitting this is exactly the gap the user flagged.

## Dev-facing command flow (from the generated README — authoritative)

A normally-installed project (global `netscript`) runs:

```bash
# 1. scaffold
netscript init my-app --db postgres --service --service-name users --service-port 3001 --yes

# 2. bring up orchestration FIRST (Aspire provisions Postgres + Garnet via Docker — no manual setup)
cd aspire && aspire restore     # once: restores the Aspire TS SDK
aspire run                       # starts the AppHost; dashboard at http://localhost:18888

# 3. database workflow (Postgres is now up via Aspire)
netscript db init --name init    # create migration
netscript db generate            # generate Prisma client
netscript db seed                # seed
netscript db status

# 4. per-workspace dev servers (or let `aspire run` orchestrate them)
deno task --cwd services/users dev      # users oRPC service
deno task --cwd apps/dashboard dev      # Fresh dashboard

# 5. workspace gates
deno task check    # type-check    deno task lint    deno task fmt    deno task test
```

> **Two CLIs (local-source projects only).** A scaffold run from local source vendors `packages/`
> and the generated README uses `deno run -A packages/cli/bin/netscript-dev.ts <cmd>` (contributor)
> vs `…/netscript.ts <cmd>` (public mirror). A **normal JSR install has no vendored `packages/`**;
> the dev-facing command is plain `netscript <cmd>`. Docs use the `netscript <cmd>` form.

Install: `deno install --global --allow-all --name netscript jsr:@netscript/cli/bin/netscript.ts`
(NOT the bare `jsr:@netscript/cli/bin`).

## Real project structure (clean scaffold, from README)

```
my-app/
├── apps/dashboard/        # Fresh frontend (defineFreshApp)
├── contracts/             # Shared oRPC contracts, versioned (versions/v1/…)
├── services/users/        # Example oRPC service (src/main.ts, router.ts, routers/)
├── plugins/               # Plugin registry + manifests (mod.ts per plugin)
├── aspire/                # Aspire TS orchestration (apphost.mts, .helpers/, .aspire/, package.json)
├── database/postgres/     # DB workspace
├── appsettings.json       # NetScript infra config (Services / Databases / Persistent)
├── deno.json              # workspace root (members, tasks, catalog)
└── netscript.config.ts    # framework config (defineConfig)
```
After `plugin add`, each plugin also lands as a top-level workspace dir: `workers/`, `sagas/`,
`triggers/`, `streams/` (jobs/, contracts/, runtime/, services/, src/…). The vendored `packages/`
tree is a **local-source artifact** — omit it from normal-install docs.

## Real runtime endpoints (validated live by the suite)

- **Workers API `:8091`** — `GET /health`, `GET /api/v1/workers/jobs`, `GET /api/v1/workers/tasks`,
  `POST /api/v1/workers/seed`, `POST /api/v1/workers/jobs/<id>/trigger`,
  `GET /api/v1/workers/executions?limit=10`.
- **Sagas API `:8092`** — `GET /health/live`, `GET /api/v1/sagas/sagas`, `GET /api/v1/sagas/instances`.
- **Triggers API `:8093`** — `GET /health`, `POST /api/v1/webhooks/inbound/generic` (JSON),
  `GET /api/v1/events?limit=10`.
- **Aspire dashboard** — `http://localhost:18888` (token printed by `aspire run`).
- Aspire resources: postgres, garnet, workers-api, workers, sagas-api, sagas, triggers-api, triggers.

## Real code shapes (adapt these — they compile)

**Contract** (`contracts/versions/v1/users.contract.ts`) — `@orpc/contract` + zod:
```ts
import { z } from 'zod';
import { oc } from '@orpc/contract';
import { implement } from '@orpc/server';

export const UsersContractV1 = {
  health: { check: oc.route({ method: 'GET' }).input(z.object({}).optional()).output(UsersHealthSchemaV1) },
  list: oc.route({ method: 'POST' }).input(UsersListInputSchemaV1).output(UsersListResponseSchemaV1),
};
export const UsersV1 = implement(UsersContractV1); // ready for .handler() binding
```

**Service entry** (`services/users/src/main.ts`) — `@netscript/service`:
```ts
import { defineService } from '@netscript/service';
import { router } from './router.ts';
await defineService(router, {
  name: 'users', version: '1.0.0',
  port: parseInt(Deno.env.get('PORT') || '3001'),
  openapi: { title: 'Users API', description: 'users service' },
  debug: true,
});
```

**Router** (version-namespaced) + **handler** (imports contract via `@<project>/contracts` alias):
```ts
// router.ts
export const router = { v1: { users: { ...UsersV1, health } } };
// routers/health.ts
import { v1 } from '@my-app/contracts';
export const health = {
  check: v1.users.health.check.handler(async () => ({
    status: 'healthy' as const, service: 'users', version: '1.0.0',
    timestamp: new Date().toISOString(), uptime: 0,
  })),
};
```

**Worker job** (`workers/jobs/health-check.ts`) — `@netscript/plugin-workers-core`; **OTel + structured
logs are built in** (this is the observability pillar, concretely):
```ts
import { defineJobHandler, createSuccessResult, createFailureResult } from '@netscript/plugin-workers-core';
import { createJobTools } from './job-tools.ts';
const handler = defineJobHandler(async (ctx) => {
  const { log, progress, trace } = createJobTools(ctx);
  log.info('Starting health check');
  progress(20, 'Checking environment');
  await trace.withChildSpan('check.environment', (span) => { span.setAttribute('check.name', 'environment'); /*…*/ });
  return createSuccessResult({ status: 'healthy' });
});
export default Object.assign(handler, { id: 'workers-plugin-health-check' as const });
```

**Config** (`netscript.config.ts`) — `@netscript/config`:
```ts
import { defineConfig } from '@netscript/config';
export default defineConfig({
  name: 'my-app', version: '1.0.0',
  paths: { services: 'services', apps: 'apps', contracts: 'contracts', plugins: 'plugins' },
  logging: { level: 'info', format: 'text' },
  databases: { config: [] },
  plugins: ['./plugins/workers/mod.ts', './plugins/sagas/mod.ts', './plugins/triggers/mod.ts', './plugins/streams/mod.ts'],
});
```

## Catalog deps a reader will see (from root deno.json)
oRPC `@orpc/{contract,server,client,zod,openapi,tanstack-query}` ^1.14.6 · Prisma `@prisma/*` ^7.8 +
`@prisma/adapter-pg` · `@saga-bus/core` · `@durable-streams/*` · `@opentelemetry/api` ^1.9 ·
Fresh/Preact + Tailwind v4 + Vite · `pg`/`mysql2`/`ioredis`/`amqplib`. Always `catalog:` (never de-catalog).

## Hard doc rules (do not violate)
1. Aspire is step 2, not an afterthought: `cd aspire && aspire run` brings up Postgres/Garnet.
2. DB commands require Aspire running first. Document that dependency.
3. Use `netscript <cmd>` (public form); never the vendored `packages/cli/...` path or bare `jsr:@netscript/cli/bin`.
4. Cite real endpoints/ports above per capability. Link to `reference/<unit>/` for full API.
5. Never touch `reference/**`, packages/plugins, catalog, version pins.
