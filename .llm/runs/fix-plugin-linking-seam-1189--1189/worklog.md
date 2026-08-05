# Worklog: declared plugin linking seam

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-plugin-linking-seam-1189--1189` |
| Branch | `fix/plugin-linking-seam-1189` |
| Archetype | `5 - Plugin` + `6 - CLI/tooling` |

## Design

### Public Surface

- `PluginManifestLinking` — optional published linking declaration.
- `PluginManifestLinkingConsumers` — explicit named service/app consumers.
- `PluginInstallerManifest.linking` — third-party-equal protocol entry.
- Existing `netscript plugin install/remove` commands — unchanged command shape, stronger behavior.

### Domain Vocabulary

- Producer identity: canonical plugin identity, resource config key, optional background config key.
- Consumer surface: `services` or `apps`, each containing explicit config identifiers.
- Desired reference: the producer resource key injected into a consumer `PluginReferences` list.

### Ports

- Existing `FileSystemPort` owns discovery and appsettings IO.
- Existing process/scaffold/template ports own third-party execution and helper generation.

### Constants

- `SCAFFOLD_PLUGIN_MANIFEST` — declaration filename.
- Consumer surface keys are derived from the typed declaration, not repeated plugin names.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Contract + RED fixture | focused parser/reconciler RED | protocol/tests/fixture/run artifacts |
| 2 | Generic reconciler | order/uninstall/four-surface focused GREEN | reconciler/lifecycle tests |
| 3 | Runtime seam proof | response + OTEL artefacts | fixture/E2E evidence |
| 4 | Quality/handoff | wrappers, quality, JSR, runtime | run artifacts/PR |

### Deferred Scope

- Wildcard linking and marketplace policy — not required for explicit consumer linking.
- General discovery work from #1093 — separate open issue.

### Contributor Path

Add a `linking` object to a plugin manifest with explicit producer keys and named consumers; no core
file changes are needed for a new plugin.

## Progress Log

| Date | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-08-05 | 1 | research | Confirmed three gaps and existing shared lifecycle call sites. |
| 2026-08-05 | 1 | RED | Protocol fixture failed with missing `linking`; ACME manifest left service/app references absent. |
| 2026-08-05 | 1 | contract | Added documented optional linking types/schema independent of `officialSource`. |
| 2026-08-05 | 2 | reconciliation | Generic manifest scan and four-surface reconciliation pass; `-api` discovery heuristic removed. |
| 2026-08-05 | 2 | symmetry | Consumer-later and uninstall cleanup fixture converges; ACME local-path install wires both consumers. |
| 2026-08-05 | 2 | runtime seam | Plugin-owned created entrypoints now select generated workdirs without plugin identity branches. |
| 2026-08-05 | 3 | fresh install | Real CLI installed the ACME fixture into a fresh scaffold; persisted manifest stayed third-party-only and catalog/dashboard received `fixture-api`. |
| 2026-08-05 | 3 | uninstall | Real CLI removal deleted both producer entries and pruned both consumer references. |
| 2026-08-05 | 3 | safety | Fixture post-script now writes inside its declared third-party writable subtree; dispatch regression updated and green. |
| 2026-08-05 | 3 | runtime block | Live start/OTEL deferred: leak reporter found three foreign AppHosts, so the one-AppHost rule forbids another start. |
| 2026-08-05 | 4 | D6 augmentation | PR moved draft→ready with seven earned box-index entries; box 5 and its live/OTEL proof remain explicitly open for the orchestrator gate. |

## Gate Results

| Gate | Result | Evidence |
| ---- | ------ | -------- |
| Protocol RED→GREEN | PASS | 6 parser tests; RED was TS2339 before contract. |
| Reconciler RED→GREEN | PASS | 4 tests, including third-party, both order, and cleanup. |
| Third-party install | PASS | `install-plugin_test.ts`, 27 steps; ACME manifest has no `officialSource`. |
| Fixture dispatch | PASS | 11 steps; generated runtime entrypoint artifacts included. |
| Fresh CLI install | PASS | `Installed fixture plugin`; appsettings contains `fixture-api` in catalog/dashboard and no persisted `officialSource`. |
| Fresh CLI remove | PASS | Empty Plugins/BackgroundProcessors; catalog/dashboard `PluginReferences` absent. |
| Fresh scaffold check | BLOCKED | Scaffold requires `netscript db generate`; that command requires an AppHost and three foreign AppHosts are active. |
| Live service/OTEL | BLOCKED | Safety rule prohibits starting a fourth AppHost; foreign owners left untouched. |

D6 PLAN-EVAL is composed per milestone ruling. Full quality gates remain pending; runtime acceptance
is explicitly unearned until the shared-host AppHost slot clears.

## Handoff Notes

- Inspect third-party eligibility and runtime artefacts before official-plugin compatibility.
