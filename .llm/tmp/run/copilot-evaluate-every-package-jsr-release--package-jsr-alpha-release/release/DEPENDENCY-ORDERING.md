# Dependency Ordering for Release Waves`

> How packages depend on each other and must release in order.

## Overview`

This document maps the dependency graph for `@netscript/*` packages to ensure
correct wave ordering in `PLAN.md`. No package in Wave N+1 publishes
until all packages in Wave ≤N are verified on JSR.

## Dependency Graph`

```
@netscript/shared (Wave 0)
    ↓
@netscript/contracts, @netscript/config, @netscript/runtime-config, @netscript/streams (Wave 1)
    ↓
@netscript/logger, @netscript/telemetry, @netscript/aspire (Wave 2)
    ↓
@netscript/kv, @netscript/queue, @netscript/cron, @netscript/database, @netscript/prisma-adapter-mysql (Wave 3)
    ↓
@netscript/watchers, @netscript/triggers + plugins/triggers, @netscript/workers + plugins/workers, @netscript/sagas + plugins/sagas (Wave 4)
    ↓
@netscript/service, @netscript/sdk, @netscript/fresh, @netscript/fresh-ui (Wave 5)
    ↓
@netscript/cli (Wave 6)
```

## Intra-Wave Ordering`

Within each wave, packages should publish in this order (respecting dependencies):

### Wave 0`
1. `@netscript/shared` (no dependencies)

### Wave 1`
1. `@netscript/contracts` (depends on shared)
2. `@netscript/config` (depends on shared, contracts)
3. `@netscript/runtime-config` (depends on shared, config)
4. `@netscript/streams` (depends on shared, contracts)

### Wave 2`
1. `@netscript/logger` (depends on shared)
2. `@netscript/telemetry` (depends on shared, logger)
3. `@netscript/aspire` (depends on shared, telemetry)

### Wave 3`
1. `@netscript/kv` (depends on shared)
2. `@netscript/queue` (depends on shared, kv)
3. `@netscript/cron` (depends on shared, queue)
4. `@netscript/database` (depends on shared)
5. `@netscript/prisma-adapter-mysql` (depends on database)

### Wave 4-prelude`
1. `plugins/hello-world` (no dependencies)
2. `@netscript/plugin` (depends on shared, contracts)

### Wave 4`
1. `@netscript/watchers` (depends on shared, contracts)
2. `@netscript/triggers` + `plugins/triggers` (depends on shared, contracts, plugin)
3. `@netscript/workers` + `plugins/workers` (depends on shared, contracts, plugin, triggers)
4. `@netscript/sagas` + `plugins/sagas` (depends on shared, contracts, plugin, workers)

### Wave 5`
1. `@netscript/service` (depends on shared, contracts, plugin)
2. `@netscript/sdk` (depends on shared, contracts)
3. `@netscript/fresh` (depends on shared, contracts, sdk)
4. `@netscript/fresh-ui` (depends on fresh)

### Wave 6`
1. `@netscript/cli` (depends on shared, contracts, plugin, service, fresh, workers, sagas, triggers)

## Plugin Platform Integration (PR #84)`

When PR #84 merges, the dependency graph extends:

```
@netscript/workers-core (new, Wave 4 extension)
    ↓
@netscript/workers (now depends on workers-core)

@netscript/sagas-core (new, Wave 4 extension)
    ↓
@netscript/sagas (now depends on sagas-core)

@netscript/triggers-core (new, Wave 4 extension)
    ↓
@netscript/triggers (now depends on triggers-core)

@netscript/streams-core (new, Wave 4 extension)
    ↓
@netscript/streams (now depends on streams-core)
```

**Rule:** New `-core` packages publish BEFORE the package they belong to in the same wave.

## Cross-Plan Dependency Ordering`

When implementing per-package plans, the developer must respect:

1. **Shared before consumers:** Any package consuming `@netscript/shared` utilities (e.g., `datetime.ts`) must wait for Wave 0 rewrite to complete.
2. **Telemetry before aspire:** `@netscript/aspire` depends on telemetry standards.
3. **Plugin before package+plugin pairs:** `@netscript/plugin` restructure (PR #84) must land before `plugins/workers`, `plugins/sagas`, `plugins/triggers`, `plugins/streams`.
4. **KV before queue before cron:** Cron depends on queue, which depends on kv.

## Consumer Inventory for Shared Rewrite`

Packages consuming `@netscript/shared` utilities that need migration after Wave 0:

| Consumer | Shared utility used | Migration action |
|----------|---------------------|------------------|
| `@netscript/workers` | `utils/datetime.ts` | Switch to `@std/datetime` or `@std/temporal` |
| `@netscript/sagas` | `utils/datetime.ts` | Switch to `@std/datetime` or `@std/temporal` |
| `@netscript/triggers` | `utils/datetime.ts` | Switch to `@std/datetime` or `@std/temporal` |
| `@netscript/cron` | `utils/datetime.ts` | Switch to `@std/datetime` or `@std/temporal` |
| `plugins/workers` | `@shared/utils` alias | Remove alias, import from new role-named modules |
| `plugins/sagas` | `@shared/utils` alias | Remove alias, import from new role-named modules |
| `plugins/triggers` | `@shared/utils` alias | Remove alias, import from new role-named modules |

**Note:** `plan_shared.md` Slice 2 addresses slow-types but doesn't enumerate consumers. This inventory fills that gap.

## Cross-Links`

- Wave order: [`PLAN.md`](./PLAN.md) §"Wave Order"
- Release process: [`release/RELEASE-PIPELINE.md`](./RELEASE-PIPELINE.md)
- Breaking-change policy: [`release/BREAKING-CHANGE-POLICY.md`](./BREAKING-CHANGE-POLICY.md)
- PR #84 compatibility: [`harmonisation/PR84-COMPATIBILITY.md`](./harmonisation/PR84-COMPATIBILITY.md)
- Per-package plans: [`plan_<pkg>.md`](./plan_<pkg>.md) §"Slice list"

---

*This mapping ensures no forward references in the release wave. Update when new packages added.*
