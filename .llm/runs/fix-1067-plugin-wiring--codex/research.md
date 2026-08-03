# Research — fix-1067-plugin-wiring--codex

## Re-baseline

- Carried-in source: owner brief for issues #1067, #1022, #1014, #1015, and #1017.
- Re-derived against `origin/main` @ `f663fe0e4` on 2026-08-03.
- Verified merged ancestors: `2e188bc91` (#1028/#1017), `8b69d78f0` (#1043/#1014), and `5a1a2d23b`
  (#1031/#1015) are commits reachable from `origin/main`.
- Existing fixes are treated as evidence targets, not implementation targets.

## Findings

| # | Finding                                                                                                                                                                                                                                 | How to verify                                                                                                                                 |
| - | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | Install writes declared references only onto the installing entry; later installs do not revisit earlier entries.                                                                                                                       | `install-plugin.ts` reference merge followed by `PluginWorkspaceMutator.updateAppsettings`; `appsettings-entry-builders.ts` builds one entry. |
| 2 | Workers, sagas, and triggers produce to durable streams and already declare `officialSource.dependencies: ["streams"]`; install/reference wiring never consumes this field.                                                             | Producer sources, all three manifests, and `rg '\.dependencies\b'` across the install path.                                                   |
| 3 | `streams` has no outgoing dependency and its real `serviceConfigKey` is `streams`, not `streams-api`; dependency edges must resolve the target manifest rather than synthesize a key.                                                   | `plugins/streams/scaffold.plugin.json`.                                                                                                       |
| 4 | `DurableStreamProducer` catches missing URL discovery inside its async initializer, warns, queues/skips void writes, and only exposes the error through `flush()`.                                                                      | `packages/plugin-streams-core/src/application/create-durable-stream.ts` and its current “drops writes” test.                                  |
| 5 | Plugin-owned doctor checks already run and a real workers check is tested failing when the generated registry is absent; named Zod issue rendering is also already unit-tested.                                                         | `doctor-plugin-command_test.ts`: “exits non-zero when generated registries are absent” and “reports visible validation issues by field”.      |
| 6 | Doctor has no running-AppHost resource inventory dependency, so it cannot distinguish absent AppHost from unhealthy resources or compare configured resource names with a live graph.                                                   | `PluginDoctorDependencies` and `doctorPlugin` contain only filesystem/config/manifest loaders.                                                |
| 7 | The public install path already has a JSR-shaped Prisma-fragment unit test, but the acceptance wording requires a clean public-install consumer assertion; the existing test is not that clean-install gate.                            | `install-plugin_test.ts` test at the published fragment case and CLI E2E/public-install fixtures.                                             |
| 8 | Saga registry path wiring exists through project-owned generated glue/Aspire env; a generated-registry import integration exists, but it imports the local workspace plugin rather than starting the published dependency-mode runtime. | `plugins/sagas/src/runtime/project-registry-module.ts`, Aspire contribution tests, and `installed-runtime-registry-integration_test.ts`.      |
| 9 | The CLI parses `--no-samples` into `includeSamples: false`; acceptance still needs four individually named official plugin dispatch assertions.                                                                                         | install/dispatch tests and the four official adapter scaffolders.                                                                             |

## Producer-path report

Creation is superficially non-blocking because the constructor stores `#connect(...)` as a promise.
URL discovery happens inside that async method and all errors are caught. Missing discovery
therefore does not fail the dependent service at startup: the promise resolves after setting
`#connectError`, normal void writes are queued or skipped, and only an explicit later `flush()`
rejects. Correctness requires synchronous configuration validation before accepting producer writes,
with a message that names the missing `streams` reference and the install/generate remedy.

## jsr-audit surface scan

- Surface scanned: `packages/plugin-streams-core/mod.ts`, CLI binary/library behavior, and official
  plugin package manifests/adapter entrypoints.
- Planned public API change: no new export; constructor failure semantics become strict when stream
  discovery is absent.
- Slow-type/surface risks: preserve explicit constructor/function return types; no new subpath,
  dependency, import attribute, package file, or self-referential package import. Consumer tests
  must exercise the published/dependency graph where acceptance explicitly says “published package.”
- Validation: full-export doc lint / JSR audit for materially changed publish units, plus scoped
  wrappers and publish/consumer smoke proportionate to the touched surface.

## Open questions resolved for Plan-Gate

- AppHost truth source: inject a narrow process/runtime inspection port into doctor; parse a stable
  Aspire JSON resource snapshot and represent `not-running` separately from live resource states.
- Reconcile authority: `officialSource.pluginReferences` plus dependency targets resolved through
  their manifests are declarations; installed appsettings entries are the installed set. Reconcile
  all entries after every install and before helper generation.
- Manual user-supplied `--plugin-refs`: preserve them as explicit edges only when their target is
  installed; official declarations are recomputed, not accumulated.
- Saga boundary: do not touch saga engine/store/runtime implementation owned by #1064–#1066; tests
  and the existing registry seam are allowed, plus `plugins/sagas/scaffold.plugin.json`.
