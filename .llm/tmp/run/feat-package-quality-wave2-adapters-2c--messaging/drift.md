# Drift Log — feat-package-quality-wave2-adapters-2c--messaging

> Record every deviation from the locked combined `plan.md` (§ Sub-wave 2c),
> every subpath/folder rename, and every re-baseline finding here.

## Re-baseline drift (seed)

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|
| 2026-06-07 | note | Carried-in queue/cron doc-lint counts are stale | 2b drift measured queue 19+ / cron 5 doc-lint at base `ca4d9c4` on a partial sweep. 2a telemetry showed root-only (2) vs full-export sweep (168) divergence. | MEASURE-FIRST: generator Research step 1 re-runs `deno publish --dry-run` + `deno doc --lint` on the FULL export sweep for queue and cron at `55f6108`; record real numbers before locking slice effort. |
| 2026-06-07 | note | @db/redis migration is OUT OF SCOPE for 2c | 2b assessment recommended a dedicated future migration track (NOT Wave 2), gated behind a spike (kv → queue → sagas Streams). | queue keeps `npm:ioredis@^5` in `adapters/redis.adapter.ts`. No migration in 2c. Recorded as forward-looking opportunity only. |

## Carried-in decisions (from 2b drift "Decisions / renames")

| Item | Decision | Consumer impact |
|------|----------|-----------------|
| queue `interfaces/` → `ports/` | Rename now (alpha, no back-compat) | Zero external consumers of `@netscript/queue/types` |
| queue `utils/` → `validation/` | Rename folder (AP-16); `./validation` subpath name unchanged | None |
| queue `./types` subpath | Rename `./types` → `./ports` | Zero external consumers |
| cron `interfaces/` → `ports/` | Rename now (alpha, no back-compat) | Zero external consumers of `@netscript/cron/types` |
| cron `./types` subpath | Rename `./types` → `./ports` | plugins/triggers + plugins/workers import cron ROOT only — unaffected |
| `./testing` entrypoint | Required for queue + cron (multi-adapter units) | None — new entrypoints |

## Implementation drift — Sub-wave 2c

(append during plan + implement)

## Decisions / renames

(append during plan + implement)
