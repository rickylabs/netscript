# Worklog — Wave 6 `@netscript/cli` A6-v2 promotion

## Design

The CLI is the **last** package in the S1 Package Quality program. Research establishes it is a
*fast-evolved A6-v1*, not a broken package: `deno check` clean, zero `console.*` leaks, no file >384
LOC, and `src/{kernel,public,maintainer,local}/` already maps to A6's kernel-horizontal /
surface-vertical shape. So the promotion to A6-v2 is a **bounded set of moves + seam introductions**,
not a rewrite. AP-1 ("Restructure") is valid but its scope is exactly the 7-slice plan.

### Sequencing rationale

The CLI deliberately ships **after** everything else (LD-7 / decision #7). Phase P publishes all 28
other members to JSR alpha.0 first, which lets slice 4 validate the *production* `netscript init`
(JSR-resolved deps) via a new `scaffold.published.runtime` e2e — closing the single biggest untested
gap (today only the maintainer/local scaffold variants are exercised).

### Load-bearing change — slice 2

The typed `CliCommandRegistry` (concrete to Cliffy `Command`, LD-2) replacing the hand-wired
`public-command-tree.ts` chain (V-1/F-CLI-27) is the keystone. If slice 2 doesn't close V-1, the
hand-wired tree becomes a permanent maintenance hotspot (R-15). Therefore slice 2 may only merge with
a green `scaffold.runtime` rerun (41/41) — enforced by the PR template. The `DeployTargetPort` +
`DeployTargetRegistryPort` seam lands in the same slice because it removes the `DeployTargetKey`
literal-union lock-in (V-9) and the two changes share the command-dispatch surface.

### Key design decisions

1. **Concrete registry, not generic (LD-2).** YAGNI — Cliffy `Command` is the only command runtime;
   a generic abstraction adds indirection with no second implementor.
2. **Writers under `maintainer/features/codegen/` (LD-3).** Keeps scaffold writers out of `public/`,
   satisfying F-CLI-3 (no surface↔surface import).
3. **Deploy is a port, not a switch.** `DeployTargetPort` + registry; `WindowsServiceDeployTarget` is
   the one concrete adapter (Windows deploy is *not* Aspire). Future k8s/container/cloud adapters wrap
   `Aspire.Hosting.{Kubernetes,ContainerApps,AWS,Azure}` — seam only, no concrete impl this wave.
4. **Single-file ownership with the upgrade run (LD-8).** This wave verifies the inherited
   `apphost.mts` + `.aspire/modules/*.mts` + `tsconfig.apphost.json` shape that #44/R6 already
   migrated, then adds the schema mirror and `WithProcessCommand()` flag-off seam. The upgrade run
   owns `scaffold-versions.ts` + CI pin, and no file is edited by both programs.
5. **Immutable research (LD-5).** Impl divergence goes in `research-realized.md`, never back-edited
   into `research.md`.

### What this wave does NOT do

- Publish `@netscript/cli` (withheld; ships after this wave).
- Set the Aspire/Deno version pins (upgrade run owns those; this wave consumes them).
- Build concrete new deploy targets (port + seam only).

## Implementation Log

### Slice 0 — Prep / Hygiene

- Verified `packages/cli/e2e` is already a root workspace member in `deno.json`; slice 0.1 is a
  verify-green check, not a workspace edit.
- Confirmed `packages/cli/deno.json` has no dependency currently represented in the root catalog,
  so the catalog-baseline consumption has no package-local import rewrite in this slice.
- Applied D-W6-2 catalog freshness bumps: `tailwindcss` and `@tailwindcss/vite` to `^4.3.1`, and
  `@preact/signals` to `2.9.2`; left `vite` unchanged as DEBT_ACCEPTED.
- Folded PLAN-EVAL gaps #1-#3 into `plan.md`, `worklog.md`, and `drift.md`.
- Validation:
  - `deno task check:packages --unstable-kv` is not defined on this branch; used the current
    repo-native equivalent `deno task check`, which passed with 1,582 selected files and 0 findings.
  - `deno check --unstable-kv packages/cli/bin/netscript.ts packages/cli/bin/netscript-dev.ts packages/cli/mod.ts packages/cli/maintainer.ts packages/cli/scaffolding.ts packages/cli/testing.ts`
    passed.
  - `deno task fmt:check` passed with 1,167 selected files and 0 findings.
  - `deno task lint` passed with 1,082 selected files and 0 findings.
  - `deno task publish:dry-run` passed; existing slow-type and dynamic-import warnings remain
    accepted upstream/package debt, not Slice 0 blockers.

### Slice 1 — Standards Doc

- Added `packages/cli/docs/standards.md` with the command contract, typed error model, IO/output
  discipline, naming rules, testing tiers, public-surface/doc-lint rules, layer discipline, gate map,
  and V-1..V-14 migration checklist with file:line evidence.
- Fixed the CLI public doc-lint leaks discovered by the slice gate by adding type-only public exports
  for `DbEngine`, `FileSystemPort`, `ScaffoldPlan`, and `ScaffoldServicePlan`, and by replacing the
  upstream `PluginManifest` alias with a CLI-owned structural `PluginHostManifest`.
- Validation:
  - `deno run --allow-read --allow-run .llm/tools/run-deno-doc-lint.ts --root packages/cli --entrypoints ./mod.ts --entrypoints ./scaffolding.ts --entrypoints ./testing.ts --pretty`
    passed with totalErrors=0, privateTypeRef=0, missingJSDoc=0.
  - `wc -l packages/cli/README.md` reports 227 lines, so the README >=150 LOC gate remains green.
  - `deno check --unstable-kv packages/cli/bin/netscript.ts packages/cli/bin/netscript-dev.ts packages/cli/mod.ts packages/cli/maintainer.ts packages/cli/scaffolding.ts packages/cli/testing.ts`
    passed.
  - `deno task lint` passed with 1,082 selected files and 0 findings.
  - `deno task fmt:check` passed with 1,167 selected files and 0 findings.

### Slice 2 — Command Registry + DeployTargetPort

- Replaced the hand-wired public root command `.command(...)` chain with a concrete
  `CliCommandRegistry` over Cliffy `Command`, located at the public composition boundary so
  F-CLI-14 Cliffy containment stays green.
- Added `DeployTargetPort` and `DeployTargetRegistryPort` under `kernel/domain/deploy/*`, removed
  the `DeployTargetKey` literal-union lock-in from `DeployTargetRegistry`, and added
  `WindowsServiceDeployTarget` as the single concrete deploy target adapter.
- Added four in-memory unit tests for command registry ordering, context passing, duplicate command
  rejection, and string-keyed deploy target registration.
- Validation:
  - `deno check --unstable-kv packages/cli/src/public/features/root/public-command-tree.ts packages/cli/src/public/composition/cli-command-registry.ts packages/cli/src/kernel/application/registries/deploy-target-registry.ts packages/cli/src/public/features/root/command-registry_test.ts`
    passed.
  - `deno test --unstable-kv --allow-read --allow-write --allow-env --allow-run packages/cli/src/public/features/root/command-registry_test.ts packages/cli/src/local/composition/local-contributor-command-tree_test.ts`
    passed with 5 tests, 0 failed.
  - `deno run --allow-read .llm/tools/fitness/check-cli-isolation.ts` passed
    (F-CLI-3/F-CLI-4).
  - `deno run --allow-read .llm/tools/fitness/check-cliffy-containment.ts` passed (F-CLI-14).
  - `deno run --allow-read .llm/tools/fitness/check-extension-points.ts` passed (F-CLI-31).
  - `deno task check` passed with 1,587 selected files and 0 findings.
  - `deno task lint` passed with 1,082 selected files and 0 findings.
  - `deno task fmt:check` passed with 1,167 selected files and 0 findings.
  - `deno task arch:check` remains red on the existing baseline (`FAIL=58 WARN=137 INFO=1`);
    this slice removed its transient new finding and used the focused F-CLI-3/F-CLI-4 layer gate
    above as the slice layer verdict.
  - `deno task e2e:cli run scaffold.runtime --cleanup --format pretty ; echo "E2E_EXIT=$?"`
    passed: `Summary: passed=41 failed=0`, `database.init` PASS, `E2E_EXIT=0`.

### Slice 3 — Surface Moves + File Splits

- Split `kernel/application/ui/registry.ts` by extracting `registry-deno-json.ts` and
  `registry-styles.ts`; the public `public/features/ui/registry.ts` export path remains unchanged.
- Split `kernel/application/scaffold/writers/write-app-files.ts` by extracting seeded route manifest
  generation to `writers/app-route-seeds.ts`; `writeNormalizedAppFiles` remains on its existing
  import path.
- Did not move app writers under `maintainer/features/codegen/*`: `orchestrate-init.ts` is a kernel
  pipeline and moving these writers to a maintainer surface would force a kernel-to-maintainer import,
  violating F-CLI-4. The safe split preserves the layer gate and is recorded in `drift.md`.
- Validation:
  - `wc -l` after split: `registry.ts` 278, `registry-deno-json.ts` 56, `registry-styles.ts` 62,
    `write-app-files.ts` 288, `app-route-seeds.ts` 98.
  - `deno check --unstable-kv packages/cli/src/kernel/application/ui/registry.ts packages/cli/src/kernel/application/scaffold/writers/write-app-files.ts`
    passed.
  - `deno test --unstable-kv --allow-read --allow-write --allow-env --allow-run packages/cli/src/public/features/ui/registry.test.ts packages/cli/src/kernel/application/scaffold/orchestrate-init_test.ts`
    passed with 9 tests, 0 failed.
  - `deno run --allow-read .llm/tools/fitness/check-cli-isolation.ts` passed
    (F-CLI-3/F-CLI-4).
  - `deno run --allow-read .llm/tools/fitness/check-cli-structure.ts` passed
    (F-CLI-12/F-CLI-13).
  - `deno run --allow-read .llm/tools/fitness/check-cliffy-containment.ts` passed (F-CLI-14).
  - `deno run --allow-read .llm/tools/fitness/check-cli-file-size.ts` now reports only the
    pre-existing large test-file baseline:
    `copy-official-plugin-copy_test.ts` 446 lines and `route-templates_test.ts` 448 lines. The two
    Slice 3 target files no longer appear in the findings.
  - `deno task check` passed with 1,590 selected files and 0 findings.
  - `deno task lint` passed with 1,082 selected files and 0 findings.
  - `deno task fmt:check` passed with 1,167 selected files and 0 findings.
  - `deno task test` was run and remains red outside this slice: 477 passed, 11 failed, 12 ignored;
    failures are in existing config/plugin-registry/deploy-config fixtures, one sync plugin sample
    test, runtime-schema Windows path expectations, `packages/config/workspace.test.ts`, plugin
    workers Deno runtime adapter tests, plus the existing `catalog:` unsupported scheme error from
    `packages/contracts/src/application/contract-primitives.ts`.

### Slice 5 — Aspire Verify + Schema Mirror

- Verified the inherited Aspire 13.4 apphost path rather than re-performing the #44/R6 migration:
  generated projects keep `apphost.mts`, `.aspire/modules/*.mts`, and `tsconfig.apphost.json`.
- Added a pinned local Deno config schema asset at
  `packages/cli/assets/schema/config-file.v1.json` and included it in the package publish include
  list.
- Updated editor config generation to emit `.netscript/schema/config-file.v1.json` into scaffolded
  workspaces and point Zed/VS Code JSON schemas at that local mirror instead of a live
  `raw.githubusercontent.com` URL.
- Added the Aspire 13.4 `WithProcessCommand()` seam to generated tool resources behind the
  flag-off `NETSCRIPT_ASPIRE_PROCESS_COMMANDS=1` opt-in. The seam is intentionally duck-typed and
  returns the original resource so the default generated AppHost remains stable.
- Validation:
  - `deno check --unstable-kv packages/cli/src/kernel/adapters/scaffold/editor-config.ts packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-tools.ts packages/cli/src/kernel/templates/aspire/helpers/tests/generators-tools-db-index_test.ts`
    passed.
  - `deno test --unstable-kv --allow-read --allow-write --allow-env --allow-run packages/cli/src/kernel/templates/aspire/helpers/tests/generators-tools-db-index_test.ts packages/cli/src/kernel/templates/aspire/helpers/tests/generators-pipeline_test.ts packages/cli/src/kernel/templates/aspire/generate-aspire-config_test.ts`
    passed with 6 tests, 40 steps, 0 failed.
  - `rg -n "raw\\.githubusercontent\\.com/denoland/deno|config-file\\.v1\\.json" packages/cli/src/kernel/adapters/scaffold packages/cli/src/kernel/assets/generated/aspire/helpers packages/cli/src/kernel/templates/aspire/helpers packages/cli/assets/schema`
    shows no live raw GitHub schema URL in CLI source; only the local asset and scaffold-local
    target remain.
  - First `deno task e2e:cli run scaffold.runtime --cleanup --format pretty ; echo "E2E_EXIT=$?"`
    run failed at `database.init` with generated `.helpers/register-tools.mts` TS2352 because the
    flag-off seam cast claimed an incompatible Aspire SDK return type.
  - After tightening the seam to `unknown` and returning the original resource, `deno task check`
    passed with 1,590 selected files and 0 findings.
  - `deno task lint` passed with 1,082 selected files and 0 findings.
  - `deno task fmt:check` passed with 1,167 selected files and 0 findings.
  - Final required `deno task e2e:cli run scaffold.runtime --cleanup --format pretty ; echo "E2E_EXIT=$?"`
    passed: `Summary: passed=41 failed=0`, `E2E_EXIT=0`.

### Slice 4a — Local Scaffold Improvements

- Verified Slice 3 already landed the prior scaffold/codegen moves relevant to E.2.1, E.2.5, and
  E.2.10, so Slice 4a did not redo the deferred writer/template relocation work.
- Split `kernel/application/scaffold/orchestrate-init.ts` into the compatibility re-export plus
  `init-orchestrator.ts` (119 LOC) and `init-pipeline.ts` (98 LOC). Behavior is preserved through
  the existing `executeInit` and `initNextSteps` import path.
- Added `kernel/application/testing/in-memory-scaffolder.ts` (46 LOC) and a fast unit assertion in
  `orchestrate-init_test.ts`; the focused test run reports the in-memory scaffolder test at `0ms`.
- Added `init --json` for both public and maintainer init commands. The JSON mode suppresses human
  progress and emits one serialized object with project, phase, plugin, Aspire, total, and next-step
  fields. Added a local e2e smoke at `packages/cli/e2e/tests/presentation/init-json_test.ts`.
- Added the empty Wave 6 preset seam: `init --from <preset>` plus
  `kernel/application/registries/preset-registry.ts`; any preset currently fails with
  `no presets registered`.
- Typed `PipelineContext<TStepOutput>` in `kernel/application/abstracts/pipeline.ts` and threaded the
  generic through `PipelineResult`.
- Added `packages/cli/docs/commands/init.md` with typed input, pipeline phases, JSON shape, and exit
  code categories.
- Validation:
  - `deno check --unstable-kv packages/cli/src/public/features/init/init-command.ts packages/cli/src/maintainer/features/init/init-command.ts packages/cli/src/maintainer/features/init/orchestrate-maintainer-init.ts packages/cli/src/kernel/application/scaffold/orchestrate-init.ts packages/cli/src/kernel/application/scaffold/init-orchestrator.ts packages/cli/src/kernel/application/scaffold/init-pipeline.ts packages/cli/src/kernel/application/output/renderers/init-json-renderer.ts packages/cli/src/kernel/application/testing/in-memory-scaffolder.ts packages/cli/src/kernel/application/abstracts/pipeline.ts packages/cli/src/public/features/init/init-command_test.ts packages/cli/e2e/tests/presentation/init-json_test.ts`
    passed.
  - `deno test --unstable-kv --allow-read --allow-write --allow-env --allow-run packages/cli/src/kernel/application/scaffold/orchestrate-init_test.ts packages/cli/src/public/features/init/init-command_test.ts packages/cli/e2e/tests/presentation/init-json_test.ts`
    passed with 5 tests, 0 failed.
  - `deno task e2e:cli run scaffold.runtime --cleanup --format pretty ; echo "E2E_EXIT=$?"`
    passed: `Summary: passed=41 failed=0`, `database.init` PASS, `E2E_EXIT=0`.
  - `deno task check:packages --unstable-kv` is not defined on this branch; `deno task check`
    passed with 1,597 selected files, 14 batches, 0 findings.
  - `deno task lint` passed with 1,082 selected files and 0 findings; this configured root task
    excludes `packages/cli`, so focused `deno check` and targeted tests above are the CLI-local
    verdicts.
  - `deno task fmt:check` passed with 1,167 selected files, 0 findings. The branch does not define a
    non-mutating `deno task fmt --check`; root `fmt` is mutating and was not run.
  - `deno task test` passed: 650 passed, 0 failed, 12 ignored.
  - `deno task publish:dry-run` exited 0. Existing slow-type / dynamic-import warnings remain on
    non-CLI packages and accepted debt; no CLI dry-run blocker appeared.
