# Worklog — Deno 2.8 + Aspire 13.4 toolchain upgrade

## Design

The upgrade is decomposed into four sequenced phases so `main` is green at every merge and a broken
`netscript init` is never emitted:

- **Phase T (Deno 2.8)** is the foundation — workspace config + CI only, plus the one publish-blocking
  `packages/aspire` barrel fix folded in (LD-1). It is independent of Aspire entirely.
- **Phase P (JSR alpha.0)** is cut after Phase T Slice 0 because 2.8's publish-clean surface
  (`isolatedDeclarations`, `deno doc --lint`) is what makes a clean publish possible. It withholds
  `@netscript/cli` (decision #7) so the production scaffold path can be tested before the CLI ships.
- **Phase A (Aspire 13.4)** is a *thin* scaffold-constant bump. The key design insight from research
  discrepancies D-1/D-2 is that **the Aspire upgrade is a CLI edit, not a `dotnet/` edit**:
  `AppHost.csproj` and `global.json` are *generated* by `netscript init`, so the version pins live in
  `packages/cli/src/kernel/constants/scaffold-versions.ts`. We edit the leaf constant, not the CLI
  structure (AP-1 stays owned by Wave 6).
- **Slice 2/3** are joint-with-Wave-6 / post-13.5 and explicitly not launch gates.

### Key design decisions

1. **Decoupled default (LD-6).** Deno and Aspire ship as separate PRs. The only coupling is
   type-system (the 13.4 SDK's TS shape needs the compiler that 2.8 bundles). The coupled Slice 1b is
   a *fallback only* if 13.4 is still preview when 2.8 lands — gated by E-12.
2. **Preview guard (LD-7 / E-12).** A new `check-scaffold-versions.ts` asserts the pinned Aspire
   versions carry no `-preview`/`-beta` suffix, so we never default a preview SDK into scaffolds.
3. **Single-file ownership (LD-8).** This run owns `scaffold-versions.ts` + `copilot-setup-steps.yml`;
   Wave 6 owns `scaffold-files.ts` + the apphost-path realignment. This prevents the two parallel
   programs from colliding.
4. **lib.node as capability, not escape hatch (LD-9).** 2.8 turns `lib.node` on by default; we exploit
   it but never add `"node"` to `compilerOptions.lib`, preserving the `no-node-globals` lint guard for
   the multi-runtime library packages.
5. **Carve-outs are debt, not defaults (LD-5).** The four heavy-generic packages
   (`contracts`,`triggers`,`service`,`plugin`) get per-package `--allow-slow-types` each paired with a
   `DEBT_ACCEPTED` arch-debt row so the JSR-score cost is recorded, never a workspace default.

### What this run deliberately does NOT do

- No CLI restructure (AP-1 is Wave 6's).
- No `apphost.mts`/`.aspire/modules/` GA path realignment (Wave 6).
- No 13.5 native-Deno-apphost flip (post-GA, stubbed only).
- No real `deno publish` (that is Phase P, a separate plan).

## Implementation log

### IMPL-1 — type foundation green-up (2026-06-15)

Deno 2.8 ships TS 6.0.3, which enforces the repo's pre-existing `isolatedDeclarations: true`
strictly. On first `deno task check` under 2.8 this surfaced a wave of TS90xx
explicit-return-type gaps plus one genuine `TS2322`. These are **publish-surface annotation
debt, not regressions** — the code was already correct; 2.8 simply requires the types be
written explicitly. Resolved without suppressions:

- `db11fb7` triggers, `212189a` workers, `ac4ee94` plugins (stream + saga checks),
  `b64dea1` fresh builder fixtures, `f44c2da` fresh-ui — explicit-type annotations only.
- `939bbe9` fresh: the one real bug — SSE keepalive timer typed `number` but assigned a
  `setInterval` handle (`TS2322`). Fixed with an exported `SSEIntervalId =
  ReturnType<typeof setInterval>` alias threaded through `SSEClock`. No `@ts-ignore`.
- `2d5e7ac` cli + cli/e2e: `isolatedDeclarations: false` carve-out (LD-10) — see drift
  IMPL-D-2. CLI publish surface is Wave 6's; annotating here would collide with A6-v2.
- `03838d1` `deno fmt` of the 8 annotated files.
- `f16b31f` (T0): aspire public-barrel value/type export split (LD-1 publish prerequisite).

End state: `deno task check` = 0, `deno task lint` clean (340 files), `deno task fmt --check`
clean. `deno.lock` untouched. No `.md` edited by the generator.

### IMPL-2 — generator resumes here (handoff)

Remaining Phase-T slices, resequenced: **T1** (CI pin `v2.8.x`) → **T2** (`catalog:` +
28-member rewrite) → **T4** (four `--allow-slow-types` carve-outs + debt rows + 28-member
`publish:dry-run`) → **T5 last** (`deno ci` + per-fn coverage + `--parallel`, and the
APPROVED `deno audit` `@orpc/client` bump — the only slice permitted to move `deno.lock`).
Phase A (A1–A4) stays gated on Aspire 13.4 GA (LD-7), out of this resume's scope. The
generator runs as a supervised Codex session in WSL (`/home/codex/repos/netscript-deno28-upgrade`).

### R1 — subpath pins + dax normalization (2026-06-16)

- `104bfc5`: aligned `packages/fresh` and `packages/fresh-ui` inline Preact
  subpath specifiers with the root catalog (`preact ^10.29.2`,
  `preact-render-to-string ^6.7.0`) and normalized inline `@david/dax` pins to `^0.48`.
  Evidence: `deno task deps:latest --filter "preact*"` = 0 behind / 2 total;
  `deno task deps:latest --filter "@david/*"` = 0 behind / 1 total; targeted
  `deno check --no-lock --unstable-kv` passed for Fresh/Fresh UI entrypoints.

### R2 — plugin dead import-map prune (2026-06-16)

- `3e7368f`: removed only the import-map entries that `deps:why` reported as
  `likelyDeadImport=true` / `fullyRemovable=true` from `plugins/workers/deno.json` and
  `plugins/sagas/deno.json`.
- Removed evidence:
  - `@hono/hono` (workers + sagas): `sourceUsed=false`, `sourceHitCount=0`,
    `transitivelyPresent=false`, `likelyDeadImport=true`, `fullyRemovable=true`.
  - `@netscript/plugin-workers-core/presets` (workers): `sourceUsed=false`, `sourceHitCount=0`,
    `transitivelyPresent=false`, `likelyDeadImport=true`, `fullyRemovable=true`.
  - `@netscript/plugin-workers-core/schemas` (workers): `sourceUsed=false`, `sourceHitCount=0`,
    `transitivelyPresent=false`, `likelyDeadImport=true`, `fullyRemovable=true`.
  - `@netscript/plugin-sagas-core/integration/publisher` (sagas): `sourceUsed=false`,
    `sourceHitCount=0`, `transitivelyPresent=false`, `likelyDeadImport=true`,
    `fullyRemovable=true`.
  - `@netscript/plugin-sagas-core/streams` (sagas): `sourceUsed=false`, `sourceHitCount=0`,
    `transitivelyPresent=false`, `likelyDeadImport=true`, `fullyRemovable=true`.
- Kept candidate evidence: `hono` (`sourceUsed=true`, `sourceHitCount=13`), `zod`
  (`sourceUsed=true`, `sourceHitCount=104`), `@tanstack/db` (`sourceUsed=true`,
  `sourceHitCount=1`), and `@durable-streams/client` (`sourceUsed=true`, `sourceHitCount=2`).
- Re-sweep evidence: all other `imports` members were checked with `deps:why`; only the four
  additional entries above returned `fullyRemovable=true`.
- Gates: scoped check passed with
  `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/workers --root plugins/sagas --ext ts,tsx`
  (wrapper command: `deno check --quiet --unstable-kv <files>`, 127 files, 2 batches,
  0 occurrences); scoped lint passed with
  `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root plugins/workers --root plugins/sagas --ext ts,tsx`
  (127 files, 0 occurrences).

### R3 — dependency inventory to stable latest (2026-06-16)

R3 started from `8bb33b8` on `chore/deno-2.8-aspire-13.4-upgrade`; `deno --version` reported
`deno 2.8.3`. Pre-edit authority was `deno task deps:latest --behind-only --pretty`:
26 behind / 52 total.

| Decision | Package | Before | After / target | Evidence |
| -------- | ------- | ------ | -------------- | -------- |
| BUMPED | `jsr:@fedify/fedify` | `^1.5.0` | `^2.2.5` | pre-approved major; check + publish dry-run green |
| BUMPED | `jsr:@fresh/core` | `^2.3.0` | `^2.3.3` | patch; check + publish dry-run green |
| BUMPED | `jsr:@olli/kvdex` | `^3.5.0` | `^3.6.7` | minor; check + publish dry-run green |
| BUMPED | `npm:@durable-streams/client` | `^0.2.3` | `^0.2.6` | patch; check + publish dry-run green |
| BUMPED | `npm:@durable-streams/server` | `^0.2.3` | `^0.3.7` | minor; check + publish dry-run green |
| BUMPED | `npm:@preact/signals` | `^2.5.0` | `^2.9.1` | minor; `preact` held at `^10.29.2`; check + publish dry-run green |
| BUMPED | `npm:@prisma/adapter-mssql` | `^7.4.2` | `^7.8.0` | minor; check + publish dry-run green |
| BUMPED | `npm:@prisma/adapter-pg` | `^7.4.2` | `^7.8.0` | minor; check + publish dry-run green |
| BUMPED | `npm:@prisma/client` | `^7.4.2` | `^7.8.0` | minor; check + publish dry-run green |
| BUMPED | `npm:@prisma/driver-adapter-utils` | `^7.4.2` | `^7.8.0` | minor; check + publish dry-run green |
| BUMPED | `npm:@prisma/instrumentation-contract` | `^7.4.2` | `^7.8.0` | minor; check + publish dry-run green |
| BUMPED | `npm:@tanstack/db` | `^0.6.1` | `^0.6.8` | patch; check + publish dry-run green |
| BUMPED | `npm:@tanstack/preact-query` | `^5.75.5` | `^5.101.0` | minor; check + publish dry-run green |
| BUMPED | `npm:@tanstack/query-core` | `^5.75.5` | `^5.101.0` | minor; check + publish dry-run green |
| BUMPED | `npm:@tanstack/query-db-collection` | `^1.0.32` | `^1.0.40` | patch; check + publish dry-run green |
| BUMPED | `npm:@tanstack/react-db` | `^0.1.79` | `^0.1.86` | patch; check + publish dry-run green |
| BUMPED | `npm:ioredis` | `^5.4.1` | `^5.11.1` | minor; check + publish dry-run green |
| BUMPED | `npm:mysql2` | `^3.22.3` | `^3.22.5` | patch; check + publish dry-run green |
| BUMPED | `npm:pg` | `^8.13.1` | `^8.21.0` | minor; check + publish dry-run green |
| BUMPED | `npm:tailwind-merge` | `^3.5.0` | `^3.6.0` | minor; check + publish dry-run green |
| BUMPED | `jsr:@fedify/amqp` | `^1.0.0` | `^2.2.5` | maintainer-approved follow-up; check + publish dry-run green |
| BUMPED | `jsr:@fedify/denokv` | `^1.0.0` | `^2.2.5` | maintainer-approved follow-up; check + publish dry-run green |
| BUMPED | `jsr:@fedify/redis` | `^1.0.0` | `^2.2.5` | maintainer-approved follow-up; check + publish dry-run green |
| BUMPED | `npm:@durable-streams/state` | `^0.2.3` | `^0.3.1` | maintainer-approved follow-up; `createStreamDB` imports moved to `/db`; check + publish dry-run green |
| BUMPED | `npm:amqplib` | `^0.10.4` | `^2.0.1` | maintainer-approved follow-up; check + publish dry-run green |
| HELD | `npm:vite` | `7.2.2` | `8.0.16` | DEBT_ACCEPTED; unvetted major |

R3 validation:

| Gate | Result |
| ---- | ------ |
| `deno task deps:latest --behind-only --pretty` | 1 behind / 52 total; only documented HELD row is `vite` |
| `deno task check` | PASS: 1581 files, 14 batches, 0 occurrences |
| `deno task publish:dry-run` | PASS: exit 0; warnings are the pre-existing slow-type / dynamic-import classes, not R3 dependency failures |

R3 follow-up commit: maintainer approved bumping the five previously held non-Vite entries. The
follow-up leaves `vite` as the only documented hold.

### R4 — scaffold catalog parity + Aspire GA pins (2026-06-16)

R4 commit: this commit; final hash reported after commit creation/push.

| Aspire pin | Current | New | NuGet GA evidence |
| ---------- | ------- | --- | ----------------- |
| `ASPIRE_SDK` (`Aspire.AppHost.Sdk`) | `13.2.2` | `13.4.4` | NuGet flat-container lists stable `13.4.4` with no prerelease suffix |
| `ASPIRE_HOSTING_DENO` (`CommunityToolkit.Aspire.Hosting.Deno`) | `13.1.0` | `13.4.0` | NuGet flat-container lists stable `13.4.0`; nuspec depends on `Aspire.Hosting` `13.4.0` |
| `ASPIRE_HOSTING_SQLITE` (`CommunityToolkit.Aspire.Hosting.SQLite`) | `13.1.0` | `13.4.0` | NuGet flat-container lists stable `13.4.0`; nuspec depends on `Aspire.Hosting` `13.4.0` |
| `SCALAR_ASPIRE` (`Scalar.Aspire`) | `0.7.3` | `0.10.3` | NuGet flat-container lists stable `0.10.3`; package line is not Aspire-versioned |

Catalog sourcing summary:

- Added `SCAFFOLD_APP_CATALOG` / `SCAFFOLD_APP_IMPORTS` under the scaffold constants layer.
- `generate-app-deno-json.ts` now spreads `SCAFFOLD_APP_IMPORTS` instead of carrying inline Fresh,
  Preact, Signals, Tailwind, and Vite literals.
- Root `deno.json` catalog now includes scaffold-only npm pins for `@tailwindcss/vite` and
  `tailwindcss`, so generated app npm imports match the catalog for `preact`, `preact/hooks`,
  `@preact/signals`, `@tailwindcss/vite`, `tailwindcss`, `vite`, and `vite/client`.
- JSR Fresh pins remain explicit in the scaffold catalog because Deno 2.8 catalogs are npm-only.

Init smoke:

| Check | Result |
| ----- | ------ |
| `deno run -A packages/cli/bin/netscript-dev.ts init r4-smoke --path .llm/tmp/r4-init-smoke --db sqlite --service --service-name users --service-port 3001 --editor zed --ci --yes --no-git --force` | PASS; scaffold completed, then `.llm/tmp/r4-init-smoke` was removed |
| Generated `apps/dashboard/deno.json` npm pins | PASS; `preact`, `preact/hooks`, `@preact/signals`, `@tailwindcss/vite`, `tailwindcss`, `vite`, and `vite/client` matched the root catalog-derived expected values |
| Generated Aspire pins | PASS; TypeScript AppHost mode generated `aspire/aspire.config.json` with SDK `13.4.4`; no generated `aspire/` semver prerelease pins found |

R4 validation:

| Gate | Result |
| ---- | ------ |
| `deno task check:scaffold-versions` | PASS: `E-12 OK — 10 scaffold pin(s) are stable (no prerelease suffix).` |
| `deno check --unstable-kv packages/cli` | PASS |
| `deno test --allow-read packages/cli/src/kernel/templates/app/generators-config_test.ts` | PASS: 2 suites / 15 steps |
| `deno fmt --check --no-config --line-width=100 --indent-width=2 --single-quote=true --use-tabs=false <touched TS files>` | PASS: checked 4 files |

### R5 — merge-readiness verification (2026-06-16)

Pre-flight:

- Native WSL worktree: `/home/codex/repos/netscript-chore-deno-2.8-aspire-13.4-upgrade`.
- Reset target: `origin/chore/deno-2.8-aspire-13.4-upgrade`.
- Pre-flight HEAD: `bf5c570` (`docs(harness): R4 done (b834f54) + R5 merge-readiness brief`).
- Deno: `deno 2.8.3 (stable, release, x86_64-unknown-linux-gnu)`.

Gate 1:

| Gate | Raw exit | Result |
| ---- | -------- | ------ |
| `deno task ci ; echo "CI_EXIT=$?"` | `CI_EXIT=0` | PASS. `check`, `lint`, `fmt:check`, function coverage, `publish:dry-run`, and `audit:critical` completed. `audit:critical` reported one high advisory but no critical advisory, so the task exited 0. Publish dry-run warnings were the documented pre-existing slow-type / dynamic-import classes. |

Gate 2:

| Attempt | Raw exit | Pretty step summary | Result |
| ------- | -------- | ------------------- | ------ |
| Initial required pretty run | `E2E_EXIT=1` | `preflight.deno` PASS; `preflight.aspire` PASS; `scaffold.init` PASS; `scaffold.plugin.worker` PASS; `scaffold.plugin.saga` PASS; `scaffold.plugin.trigger` PASS; `scaffold.plugin.stream` PASS; `scaffold.plugin-list` PASS; `database.init` FAIL; `cleanup.aspire-stop` PASS. Summary: `passed=9 failed=1`. | Failed because local Aspire CLI was still `13.3.0` while generated AppHost config pinned SDK `13.4.4`; Aspire log showed `No code generator found for language: TypeScript`. |
| Toolchain-aligned pretty rerun after `dotnet tool update -g Aspire.Cli --version 13.4.4` | `E2E_EXIT=1` | `preflight.deno` PASS; `preflight.aspire` PASS; `scaffold.init` PASS; `scaffold.plugin.worker` PASS; `scaffold.plugin.saga` PASS; `scaffold.plugin.trigger` PASS; `scaffold.plugin.stream` PASS; `scaffold.plugin-list` PASS; `database.init` FAIL; `cleanup.aspire-stop` PASS. Summary: `passed=9 failed=1`. | Still failed. JSON diagnostic showed Aspire CLI `13.4.4` generated `tsconfig.apphost.json` for `apphost.mts` and `.aspire/modules/*.mts`, but NetScript still generates `aspire/apphost.ts` and `.modules/*.ts`. This is the path realignment that plan/research assigned to Wave 6, now proven merge-blocking for the 13.4 full runtime gate. |

Merge-readiness verdict: **BLOCKED**. CI is green, but the full `scaffold.runtime` E2E gate is not
green under Aspire 13.4.4. Root cause is the deferred TypeScript AppHost GA path migration
(`apphost.mts` + `.aspire/modules/`) versus the current generated scaffold shape (`apphost.ts` +
`.modules/`). This is larger than an R5 evidence-only fix and crosses the documented Wave 6
ownership boundary, so no product code was changed in R5.

### R6 — Aspire 13.4 AppHost path migration (2026-06-16)

Pre-flight:

- Native WSL worktree: `/home/codex/repos/netscript-chore-deno-2.8-aspire-13.4-upgrade`.
- Reset target: `origin/chore/deno-2.8-aspire-13.4-upgrade`.
- Pre-edit HEAD: `dfebaee` (`docs(harness): R6 brief — Aspire 13.4 AppHost path migration (hotpatch R5 blocker) [C6]`).
- Deno: `deno 2.8.3 (stable, release, x86_64-unknown-linux-gnu)`.
- Aspire CLI: `13.4.4+ccc566c5ab3285c9beb8f38ede34734bb477c029`.

Research checkpoint:

- Aspire 13.4 docs confirm TypeScript AppHosts are GA and new TypeScript projects use
  `apphost.mts`, import `createBuilder` from `./.aspire/modules/aspire.mjs`, and use generated SDK
  modules under `.aspire/modules/`.
- The legacy compatibility section documents the old pre-13.4 shape as `apphost.ts` plus
  `./.modules/aspire.js`; migrating requires `appHost.path: "apphost.mts"`, `tsconfig.apphost.json`
  entries for `apphost.mts` and `.aspire/modules/**/*.mts`, deleting `.modules`, regenerating with
  `aspire restore`, and replacing `.gitignore` references to `.modules/`.
- Repo search before edits found old-shape literals in scaffold constants, TS AppHost rendering,
  helper templates/tests, workspace README generation, and E2E smoke expectations.

Empirical Aspire 13.4.4 shape:

- `aspire init --language typescript --non-interactive --nologo` in
  `.llm/tmp/r6-empirical-aspire/upstream-ts` created `apphost.mts`, `aspire.config.json`,
  `tsconfig.apphost.json`, `package.json`, `.gitignore`, and generated SDK modules under
  `.aspire/modules/{aspire.mts,base.mts,transport.mts}`.
- Upstream `apphost.mts` imports `createBuilder` from `./.aspire/modules/aspire.mjs`.
- Upstream `aspire.config.json` sets `appHost.path` to `apphost.mts`.
- Upstream `tsconfig.apphost.json` includes `apphost.mts` plus the explicit
  `.aspire/modules/*.mts` files and excludes `node_modules`.
- Upstream `.gitignore` ignores `.aspire/`, not `.modules/`.

Implementation checkpoint:

- NetScript scaffold now emits `aspire/apphost.mts`, `aspire/tsconfig.apphost.json`, and helper
  sources under `aspire/.helpers/*.mts`.
- Runtime imports use `.mjs` specifiers (`./.aspire/modules/aspire.mjs`,
  `./.helpers/index.mjs`, and helper-to-helper `.mjs` imports) so NodeNext/tsx resolves the
  generated `.mts` sources correctly.
- Aspire integration NuGet package constants for Postgres/MySQL/MSSQL/Redis are aligned to
  `13.4.4` with the `13.4.4` SDK.
- Smoke scaffold `r6-smoke4` generated the new shape, `aspire restore --non-interactive --nologo`
  restored `.aspire/modules/*.mts`, and `npm exec -- tsc -p tsconfig.apphost.json` passed.
- Focused generator tests passed: 25 tests / 115 steps.
- `deno check --unstable-kv packages/cli` passed.

Runtime E2E diagnosis:

- First full `scaffold.runtime` rerun after the path migration reached `database.init` but failed
  with `E2E_EXIT=1`; pretty summary was `passed=9 failed=1`.
- The generated project was `.llm/tmp/cli-e2e/plugin-smoke-20260616-162116`; Aspire child log
  `/home/codex/.aspire/logs/cli_20260616T142122821_detach-child_b0823125a3424ab0b889b62d62e4d1f3.log`
  showed TypeScript AppHost compile errors, not a database engine failure.
- Root cause: full plugin/runtime scaffold emits background/plugin cache wiring through
  `withReferenceEndpoint(...)`, but the Aspire 13.4 GA generated TypeScript SDK has no
  `withReferenceEndpoint`; `withReference(...)` accepts `EndpointReference` directly.
- Fixed `generate-register-background` and `generate-register-plugins` to emit
  `withReference(infrastructure.primaryCacheEndpoint)` for endpoint references.
- Focused rerun passed:
  `deno test --allow-read packages/cli/src/kernel/templates/aspire/helpers/tests/generators-background-app_test.ts packages/cli/src/kernel/templates/aspire/helpers/tests/generators-service-plugin_test.ts`
  (4 tests / 49 steps).

Second runtime E2E diagnosis:

- Full `scaffold.runtime` rerun after the endpoint-reference fix passed AppHost type-check and then
  failed `database.init` with `Error: aspire ps failed: Unrecognized command or argument
  '--resources'.`
- Aspire 13.4 `aspire ps --help` confirms `ps` now lists AppHosts only; resource inspection is
  under `aspire describe --apphost <apphost> --format Json`.
- Updated `DbOperationRunner` polling to call `aspire describe --apphost ... --format Json` and
  kept the parser backward-compatible with the old `ps --resources` array shape.
- Diagnostic normal AppHost start exposed another 13.4 runtime issue:
  `Flushing 20 pending promise(s). Consider awaiting fluent calls to avoid implicit flushing.`
  Fixed generated app/service/plugin/background/tool helpers so Aspire fluent side-effect calls are
  awaited before build/run.
- Removed temporary diagnostic Docker container `e13aeefe278c` (`postgres:18.3`) before rerunning
  the acceptance gate.
- Focused rerun passed:
  `deno test --allow-read packages/cli/src/kernel/templates/aspire/helpers/tests/generators-tools-db-index_test.ts packages/cli/src/kernel/templates/aspire/helpers/tests/generators-service-plugin_test.ts packages/cli/src/kernel/templates/aspire/helpers/tests/generators-background-app_test.ts packages/cli/src/kernel/adapters/database/operation-runner_test.ts`
  (8 tests / 74 steps).
- `deno check --unstable-kv packages/cli` passed.

Third runtime E2E diagnosis:

- Full `scaffold.runtime` rerun after the describe/fluent-await fixes still failed `database.init`
  with `TS2741` in generated `.helpers/register-tools.mts`: `ExecutableResource` was assigned into a
  local type still modeled as `ExecutableResourcePromise`.
- Fixed the tool helper generator/template so tool resources are awaited immediately and the local
  `ToolResource` type is `Awaited<ReturnType<DistributedApplicationBuilder['addExecutable']>>`.
- Focused rerun passed:
  `deno test --allow-read packages/cli/src/kernel/templates/aspire/helpers/tests/generators-tools-db-index_test.ts packages/cli/src/kernel/adapters/database/operation-runner_test.ts`
  (4 tests / 25 steps).
- Broader scaffold generator/database suite passed:
  `deno test --allow-read packages/cli/src/kernel/templates/aspire/generate-aspire-config_test.ts packages/cli/src/kernel/templates/aspire/helpers/tests/generators-pipeline_test.ts packages/cli/src/kernel/templates/aspire/helpers/tests/generators-config-infra_test.ts packages/cli/src/kernel/templates/aspire/helpers/tests/generators-tools-db-index_test.ts packages/cli/src/kernel/templates/aspire/helpers/tests/generators-service-plugin_test.ts packages/cli/src/kernel/templates/aspire/helpers/tests/generators-background-app_test.ts packages/cli/src/kernel/templates/workspace/generators_test.ts packages/cli/src/kernel/adapters/database/operation-runner_test.ts`
  (25 tests / 115 steps).
- Final `deno check --unstable-kv packages/cli` passed.
- Final acceptance gate passed:
  `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` ended with
  `database.init` PASS, `Summary: passed=41 failed=0`, and `E2E_EXIT=0`.
- `deno task check:scaffold-versions` passed after the migration (`E-12 OK — 10 scaffold pin(s)
  are stable`).
- Post-run Docker hygiene: stopped and removed leftover smoke container `49df3761fac1`
  (`postgres:18.3`).
