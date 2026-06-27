# PR #162 Documentation Realignment Evaluation Summary

## Summary
Evaluating three commits on branch `docs/alpha11-cli-surface` against framework ground truth:
1. `b847c6a8` - Multi-backend cache (redis default, garnet/deno-kv alternatives)
2. `28539811` - Polyglot database (4 engines at scaffold-time, Postgres recommended)
3. `474a47ca` - Prisma-backed subsystems follow scaffolded engine (not Postgres-only)

## Verification Results

### Domain 1: Multi-backend cache (commit b847c6a8) - PASS

**Claim**: redis is default cache backend; garnet/deno-kv are alternatives via `--cache-backend`; cache enabled by default, disabled with `--cache=false` (NOT `--no-cache`)

**Code anchors verified**:
- `packages/cli/src/kernel/adapters/cache/cache-backend.ts:15-17`: `CacheBackendChoice = 'redis' | 'garnet' | 'deno-kv'`
- `packages/cli/src/kernel/domain/scaffold/scaffold-defaults.ts:8`: `CACHE_BACKEND: 'redis'` (default)
- `packages/cli/src/cli.ts` (grep confirms `--cache` bool flag + `--cache-backend` string flag)
- No `--no-cache` found in entire docs/site tree (grep returned 0 results)

**Docs verified** (`docs/site/cli-reference.md:100`):
```
"netscript init my-app --cache-backend garnet" - The shared cache is on by default 
with the redis backend. Pick another with --cache-backend: redis (default) or garnet 
are provisioned as Aspire container resources; deno-kv is app-level and needs no 
container. Pass --cache=false to scaffold without a cache.
```

**Verdict**: PASS - All claims align with code surface. Correctly frames redis as default, uses `--cache=false` for disable, never invents `--no-cache`.

---

### Domain 2: Polyglot database (commit 28539811) - PASS

**Claim**: scaffold-time `--db` accepts 4 engines (postgres|mysql|mssql|sqlite); Postgres is recommended (not literal CLI default); postgres/mysql/mssql provision Aspire container; sqlite is file-backed with no container; runtime adapter barrel = 3 engines (no sqlite runtime adapter)

**Code anchors verified**:
- `packages/cli/src/kernel/domain/db-engine.ts:8`: `DbEngine = 'postgres' | 'mysql' | 'mssql' | 'sqlite'`
- `packages/cli/src/kernel/adapters/database/providers/postgres.provider.ts`: `prismaProvider: 'postgresql', supportsContainerMode: true`
- `packages/cli/src/kernel/adapters/database/providers/mysql.provider.ts`: `prismaProvider: 'mysql', supportsContainerMode: true`
- `packages/cli/src/kernel/adapters/database/providers/mssql.provider.ts`: `prismaProvider: 'sqlserver', supportsContainerMode: true`
- `packages/cli/src/kernel/adapters/database/providers/sqlite.provider.ts`: `prismaProvider: 'sqlite', supportsContainerMode: false`
- `packages/cli/src/kernel/domain/scaffold/scaffold-defaults.ts:7`: `DB_ENGINE: 'none'` (literal CLI default is none, not postgres)

**Docs verified** (`docs/site/capabilities/database.md:54-55`):
```
The scaffold engine is chosen with the --db flag — 
netscript init my-app --db postgres|mysql|mssql|sqlite. Postgres is the recommended
default (and what every tutorial uses); mysql, mssql, and sqlite are first-class
alternatives. postgres / mysql / mssql provision an Aspire container; sqlite is
file-backed with no Aspire container resource.
```

**Runtime adapter separation verified** (`docs/site/capabilities/database.md:119-138`):
- Runtime adapter barrel exports only 3 engines: postgres, mssql, mysql
- No sqlite runtime adapter exists (correct - scaffold-only)
- Docs correctly distinguish scaffold-time choice vs runtime adapter availability

**Verdict**: PASS - All claims align. Correctly frames Postgres as "recommended" (not literal default), correctly identifies sqlite container-less, correctly separates scaffold from runtime adapter surface.

---

### Domain 3: Prisma-backed subsystems follow scaffolded engine (commit 474a47ca) - PASS

**Claim**: sagas `prisma` store and better-auth backend are engine-agnostic (persist through Prisma client, follow whatever engine was scaffolded); queue PostgreSQL provider is genuinely Postgres-specific (not relabeled as polyglot)

**Code anchors verified**:
- `plugins/sagas/src/runtime/prisma-saga-store.ts`: Uses Prisma client queries (no raw SQL), delegates all persistence to Prisma ORM - engine-agnostic
- `packages/auth-better-auth/src/better-auth.ts:166-171`: Uses `prismaAdapter(prisma, { provider, ... })` - delegates to Prisma, provider is parameter
- `packages/queue/adapters/postgres.adapter.ts:180-190`: Raw SQL with `FOR UPDATE SKIP LOCKED`, `JSONB`, `TIMESTAMPTZ`, `$N` parameter binding - genuinely Postgres-specific

**Docs verified** (commit `474a47ca` diff):
- `docs/site/capabilities/durable-sagas.md:289-294`: Correctly frames `prisma` store as following scaffolded engine via Prisma client
- `docs/site/explanation/durability-model.md:143-147`: Same framing - "follows your Prisma client, it is not Postgres-specific"
- `docs/site/capabilities/auth.md:313-316`: Correctly notes better-auth persists through Prisma
- `docs/site/how-to/add-authentication.md:119-122`: Correctly notes auth.prisma aggregation follows engine
- `docs/site/capabilities/kv-queues-cron.md:177-193`: Correctly keeps queue PostgreSQL provider marked as PostgreSQL-specific (not polyglot)

**Verdict**: PASS - All claims align. Correctly distinguishes engine-agnostic (sagas prisma store, better-auth) from engine-specific (queue postgres adapter). No relabeling of queue as polyglot.

---

### Gate: Documentation build - PASS

**Lume build result**: 306 files generated in 6.46 seconds, 0 errors

**Command**: `deno task build` (executed from `docs/site/`)

**Xrefs verified**: All `comp.xref()` calls in changed docs resolve to valid keys (cap:database, ref:sagas, explain:observability, etc.)

---

## Overall Verdict

**PR #162: PASS** (3/3 domains PASS, Lume build green)

All documentation claims verified against:
1. Type definitions in `packages/cli/src/kernel/domain/`
2. Provider metadata in `packages/cli/src/kernel/adapters/database/providers/`
3. Runtime adapter implementations in `plugins/sagas/`, `packages/auth-better-auth/`, `packages/queue/`
4. CLI flag surface in `packages/cli/src/cli.ts`

No broken xrefs. No invented flags (`--no-cache`). No runtime adapter fabrication (sqlite runtime adapter does not exist, docs correctly reflect this). No relabeling of engine-specific code as polyglot (queue adapter remains correctly marked as PostgreSQL-specific).

## Changes
Documentation-only changes across three commits:
- Multi-backend cache framing
- Polyglot database framing  
- Prisma-backed subsystem engine-agnostic framing

No source code changes. No test changes.

## Validation
- Code anchor inspection: 7 provider files, 3 runtime adapter implementations
- Docs grep: 15+ files checked for claim alignment
- Lume build: 306 files, 0 errors
- Xref resolution: all internal links valid

## Remaining risks
None identified. All factual claims in documentation align with implementation ground truth.
