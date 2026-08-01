# Research — fix-1010-plugin-registry-generation--codex

## Re-baseline

- Carried-in source: issue #1010 brief and suspected-cause notes in `/home/codex/fix-1010-brief.md`.
- Re-derived against `origin/main` @ `3ab64720ffe06dedc80f12e8f7bb9fa281de37b9` on 2026-08-01.
- What changed vs the carried-in version:
  - The generic-walker diagnosis is confirmed.
  - The sync-context diagnosis is more specific: config loading already uses a project-rooted child
    process, but `ModuleManifestResolver` subsequently imports each project plugin module in the
    parent CLI process, which loses the project `deno.json` import map and produces the `zod` error.
  - Fresh public installs do not copy `scaffold.runtime.json` into the project. The installed package
    identity/version remains derivable from the generated `appsettings.json` service entrypoints,
    while the package's published `scaffold.runtime.json` is the generator contract.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | Published 0.0.2 reproduces all four installs successfully, `generate plugins` reports `0 written` with exit 0, creates no `.netscript`, and `plugin sync` exits 1 on `workers/jobs/health-check.ts` because `zod` is unresolved. | `.llm/tmp/issue-1010-clean-room-repro.log` |
| 2 | `GeneratePluginRegistriesCommand` only calls `resolveWalkerEmissions()` and treats an empty emission list as success. | `packages/cli/src/public/features/generate/plugins/generate-plugin-registries-command.ts` |
| 3 | The generic walker emits generic axis paths and never invokes plugin-owned generators. | `packages/cli/src/public/features/plugins/host/trigger-walker.ts`; `packages/plugin/src/sdk/discovery/registry-emitter.ts` |
| 4 | Workers, sagas, and triggers publish `runtimeRegistryGenerator.command` and canonical `runtimeRegistries[].registryPath` metadata in `scaffold.runtime.json`; their generator implementations already emit the runtime-consumed shapes. | `plugins/{workers,sagas,triggers}/scaffold.runtime.json` and each `src/cli/generate-runtime-registries.ts` |
| 5 | The maintainer copy path already executes this contract, but only for copied local plugin source and with `--no-config`; it is not reachable from public generation. | `packages/cli/src/maintainer/adapters/plugin-file-collector.ts` |
| 6 | Public install records exact JSR package identity/version in `appsettings.json` plugin service entrypoints, and fresh installs retain runtime source items even with `--no-samples`. | clean-room fixture `/tmp/netscript-1010-B63gfV/issue1010/appsettings.json` plus workers/sagas/triggers directories |
| 7 | `loadProjectConfig()` already runs under the project config/cwd. The later parent-process dynamic import in `ModuleManifestResolver` is the failing sync analysis step. | `packages/cli/src/kernel/adapters/config/project-config-loader.ts`; `packages/plugin/src/sdk/discovery/manifest-resolver.ts` |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/cli/deno.json`, public binary command tree, and planned internal command
  dependencies. No new `@netscript/cli` library export or `deno.json` export is planned.
- Slow-type / surface risks: new dependency interfaces and public command dependency fields require
  explicit types/JSDoc; subprocess/fetch adapters stay internal. The package publish include already
  covers `src/**/*.ts`; no generated/test artifacts should enter the package.
- Publish gate: scoped check/doc-quality gates plus package dry-run/JSR audit in final evaluation;
  the issue-mandated validation remains the primary slice evidence.

## Open questions

- None requiring deferred design. The authoritative command, installed-plugin discovery source,
  project-root execution context, zero-result policy, sync delegation, and canonical output ownership
  are locked in `plan.md`.
