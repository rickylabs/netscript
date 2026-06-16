# Drift log — Deno 2.8 + Aspire 13.4 toolchain upgrade

Discrepancies between the prior repo notes / RFC assumptions and verified reality (from research):

| ID | Assumption | Reality | Impact |
| -- | ---------- | ------- | ------ |
| D-1 | `packages/NetScript.Aspire.Hosting/` exists and is bumped. | **Does not exist.** | Aspire bump has no C# package target; it lands in CLI scaffold constants. |
| D-2 | `dotnet/AppHost/AppHost.csproj` + `global.json` are committed and edited directly. | **Generated** by `netscript init`; not committed. | Edit `scaffold-versions.ts` + `generate-global-json.ts`, never the generated output. |
| D-3 | Apphost is `apphost.ts` + `.modules/aspire.ts`. | Confirmed; the 13.4 GA `apphost.mts` + `.aspire/modules/` realignment is **deferred to Wave 6**. | Single-file ownership (LD-8). |
| D-4 | CI pins a specific Deno version. | CI floats `deno-version: v2.x` at `copilot-setup-steps.yml:40-42`. | Slice T1 pins `v2.8.x` (LD-2). |
| D-5 | `global.json` may forbid prerelease. | Emitted with `allowPrerelease: true` by `generate-global-json.ts`. | .NET 10 RC tolerated (R-6); keep the flag. |

## Plan-phase drift (this session)

- Decision #6 (Aspire 13.4 GA): not resolved at plan time. The plan carries **both** forks (decoupled
  default Slice 1 / coupled fallback Slice 1b) gated by E-12, so deferral forces no rework. To be
  resolved at impl time via `aspire --version` / Aspire MCP.

## Implementation-phase drift

| ID | Observation | Severity | Resolution |
| -- | ----------- | -------- | ---------- |
| IMPL-D-1 | Deno 2.8 (TS 6.0.3) enforces the repo's existing `isolatedDeclarations: true` strictly, surfacing a wave of TS90xx gaps + one `TS2322` across `triggers`/`workers`/`plugins`/`fresh`/`fresh-ui`. | minor (expected) | Publish-surface annotation debt, **not regressions**. Annotated in place, no suppressions (IMPL-1). Slightly wider file touch than the plan's "per-package `deno.json`" T3 wording — additive/harmless. |
| IMPL-D-2 | `packages/cli` could not be annotated without colliding with Wave 6's A6-v2 restructure (LD-8). | minor | New **LD-10**: temporary `isolatedDeclarations: false` carve-out on `cli` + `cli/e2e` with `DEBT_ACCEPTED`. 5th carve-out, additional to LD-5's four. |
| IMPL-D-3 | An earlier IMPL pass logged a major-drift "ESCALATED" blocker (188 errors / 5 vulns / arch FAIL). | resolved/superseded | Cleared by the IMPL-1 green-up: the "188 errors" were the isolatedDeclarations annotation gaps (now 0); the 5 `deno audit` advisories are scoped (T5 last slice, `@orpc/client` bump APPROVED, `vite`/`esbuild` deferred as debt). No standing escalation. |
| IMPL-D-4 | The first T2 attempt ran on Deno **2.8.0** and blocked with `Unsupported scheme "catalog"`; generator concluded `catalog:` was "unsupported in `deno.json` imports". | resolved (stale runtime) | True on 2.8.0 only — fixed by **PR #35168** (member-`imports` `catalog:` resolution, merged 2026-06-13). Both envs upgraded to **2.8.3**; `catalog:` verified resolving. Steered generator to retry. Also clarified **`catalog:` is npm-only** (jsr value → `Invalid version requirement`); verify migrations with `deno install`. Nothing to file upstream. |
| IMPL-D-5 | Second T2 attempt blocked again, treating the catalog-driven **`deno.lock` rewrite** (−1394/+43 lines, duplicate-specifier consolidation) as "MAJOR drift" per an over-strict carried-over rule. | resolved (policy correction) | Maintainer ruling: for a **toolchain upgrade**, `deno.lock` churn is the *expected output*, not drift — see new **LD-11**. Lock mutation is approved across the whole run (T2 + T5), committed alongside each slice. Block only on real gate failures. The "watch item" below is retired by LD-11. Generator re-steered to keep its T2 work, regenerate the lock via `deno install`, commit `deno.json`+`deno.lock`, and continue. |

## Watch items (impl phase must log here)

- Aspire 13.4 GA flip → switch from fallback posture to decoupled default.
- ~~`catalog:` rewrite altering any resolved version (could move `deno.lock`).~~ **Retired by LD-11**: `deno.lock` movement is expected this run, not drift. (Still flag a *breaking* resolved-version regression that fails a gate.)
- Any carve-out exceeding the 20-symbol cap → `significant` drift, revisit surface.

## R3 dependency holds (2026-06-16)

| Status | Package | Reason | Revisit |
| ------ | ------- | ------ | ------- |
| DEBT_ACCEPTED | `npm:vite` `7.2.2`→`8.0.16` | unvetted major; Vite 8 is outside R3's safe patch/minor bump rule | Fresh Vite integration and scaffold runtime validation |

R3 follow-up: maintainer approved bumping `@fedify/amqp`, `@fedify/denokv`, `@fedify/redis`,
`@durable-streams/state`, and `amqplib`; those rows were removed from debt and validated in the
follow-up commit. `@durable-streams/state` required moving `createStreamDB` imports to the package's
`/db` subpath.

## R5 merge-readiness blocker (2026-06-16)

| Status | Observation | Impact | Required follow-up |
| ------ | ----------- | ------ | ------------------ |
| BLOCKED | Full `scaffold.runtime` E2E fails at `database.init` after the Aspire 13.4 GA pin. First failure was local Aspire CLI `13.3.0` versus generated SDK `13.4.4`; after updating the local CLI to `13.4.4`, the failure persists because Aspire 13.4.4 generates `tsconfig.apphost.json` for `apphost.mts` and `.aspire/modules/*.mts`, while the NetScript scaffold still emits `apphost.ts` and `.modules/*.ts`. | PR #44 is not merge-ready on the full runtime gate. This invalidates the plan assumption that Aspire 13.4 would accept the legacy TS AppHost path as forward-compatible. | Rescope/coordinate with Wave 6 to land the GA path realignment (`apphost.mts` + `.aspire/modules/`) or defer the Aspire 13.4 scaffold pin until that migration lands. R5 did not patch this because the run explicitly assigned the path migration to Wave 6 and the fix is broader than a few-line evidence-slice repair. |

## R6 hotpatch resolution (2026-06-16)

| Status | Observation | Impact | Resolution |
| ------ | ----------- | ------ | ---------- |
| RESOLVED | Maintainer chose the in-branch hotpatch for the R5 blocker instead of deferring the Aspire 13.4 pin or waiting for Wave 6. Aspire 13.4 docs and local CLI agree that the GA shape is `apphost.mts` plus `.aspire/modules/*.mts` with `tsconfig.apphost.json` updated accordingly. | This intentionally expands PR #44 beyond the original thin Aspire version bump to include the minimal scaffold path migration needed for the full runtime gate. | Migrated generated NetScript TypeScript AppHost paths and tests to the Aspire 13.4 GA layout. Full `scaffold.runtime` passed with `database.init` PASS and `E2E_EXIT=0`. |
| RESOLVED | Full plugin/runtime scaffold also hit an Aspire 13.4 TypeScript SDK API change: `withReferenceEndpoint` is not generated in the GA SDK, while `withReference` accepts `EndpointReference`. | Background/plugin cache wiring failed AppHost type-check before any database operation could run. | Emit `withReference(infrastructure.primaryCacheEndpoint)` for cache endpoint references and keep `waitFor(infrastructure.primaryCache)` on the backing cache resource. |
| RESOLVED | Aspire 13.4 CLI no longer supports `aspire ps --resources`; resource state is exposed via `aspire describe --apphost`. The 13.4 TS SDK also warns/fails on pending fluent promises left to implicit flushing. | DB operation runner could not poll one-shot Prisma resources, and generated helpers risked incomplete AppHost configuration at shutdown. | Poll `aspire describe --apphost ... --format Json`; await generated fluent side-effect calls in app/service/plugin/background/tool helpers. |
