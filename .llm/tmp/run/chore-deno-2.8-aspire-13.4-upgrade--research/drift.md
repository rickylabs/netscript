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
