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

## Gate Results

All gates pending implementation. D6 PLAN-EVAL is composed per milestone ruling.

## Handoff Notes

- Inspect third-party eligibility and runtime artefacts before official-plugin compatibility.
