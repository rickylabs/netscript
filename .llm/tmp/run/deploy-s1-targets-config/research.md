# Research: [Deploy-S1] `deploy.targets.*` config contract (#337)

## Run Metadata
| Field | Value |
| --- | --- |
| Run ID | `deploy-s1-targets-config` |
| Branch | `feat/deploy-s1-targets-config` (off origin/main `56ea68b2`) |
| Phase | `research` |
| Slice issue | #337 (epic #327) |
| Archetype | ARCHETYPE-1 (small-contract) |

## Problem
The deploy config schema in `packages/config` today models only `deploy.windows.*` (Windows/SERVY
lane). The deployment epic (#327) needs a general per-target contract so the bare-metal, Deno Deploy,
and Aspire container lanes (#339–#343) can all resolve typed, per-target config from one schema.

## Decision context (from epic spec, already ratified)
- **D5 (user override 2026-07-03): CLEAN BREAK.** `deploy.windows.*` is removed and replaced by
  `deploy.targets.*`. No back-compat alias, no deprecation window. Rationale (user): alpha, breaking
  changes allowed, ship the production-grade shape directly. The Windows lane is re-keyed to
  `deploy.targets.windows`; a one-line migration note covers existing config.
- Target shape: a discriminated map `deploy.targets` keyed by target name, each entry a
  target-specific schema extending a shared base.
- **Shared base fields** (from spec §3.3): `mode` (`compile|script`), `denoPath`, `compileTarget`,
  concurrency, timeouts, bundle opts (`bundleExternal`/`bundleImports`), `workspace`, `v8HeapMb`,
  `generateEnvFile`, `logging`, `health`.
- **Target-specific fields**: windows → servy (`installBase`, `servicePrefix`, `servyCliPath`);
  linux → systemd (`unitDir`, `user`); deno-deploy → project/org/token; docker/compose →
  registry/compute-env + `denoBaseImage` re-pinned from `denoland/deno:2.5` to `denoland/deno:2`.
- The currently-unused `docker` sub-block + `deno:2.5` pin migrate under the docker/compose target.

## Grounding
- Full architecture spec: `.llm/tmp/run/epic-deployment-aggregation/deployment-architecture-spec.md`
  §3.3 (config evolution), from the research worktree `research/deployment-aggregation`.
- Decision record: same run's `decision-gap-tracker.md` §4 (D5).
- Precedent for schema shape: existing `packages/config` domain schemas.

## Code map
See `plan.md` "Change Map" — populated from a read-only reconnaissance pass over
`deploy-schema.ts`, its composition into the root config schema, CLI deploy consumers
(`packages/cli/.../features/deploy/*`), tests, and fixtures.

## Non-goals for this slice
No adapter behavior, no CLI verb wiring, no `deno compile`/systemd/Deno Deploy/Aspire logic — those
are #339–#343. This slice is the **schema contract + type exports + consumer re-key + tests + one
migration note** only.
