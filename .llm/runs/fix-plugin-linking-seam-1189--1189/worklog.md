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
| 2026-08-06 | 5 | train integration | Merged `origin/canary/0.0.5-canary.14@2508eb8c99c9cfc55e0c9f1d7ab72fea745db492` without rebase or conflicts; merge commit `ca8f1c76b`. |
| 2026-08-06 | 5 | removal RED→GREEN | Focused remove test reproduced the empty `Apps: {}` regression; generic four-surface assignment now preserves absent empty surfaces and 7 focused reconciler/remove tests pass. |
| 2026-08-06 | 6 | live RED | Fresh run-owned catalog returned HTTP 500 before install because the fixture endpoint was not linked. |
| 2026-08-06 | 6 | fixture runtime | First start exposed under-declared fixture permissions; added net/env/sys in the third-party manifest and reinstalled through the public CLI path. |
| 2026-08-06 | 6 | live GREEN | All five owned resources became Running/Healthy; catalog returned HTTP 200 after a real `fixture-api /ping` call. |
| 2026-08-06 | 6 | correlated OTEL | Trace `00766def76331c34a3df9fd525bfe3e0` joins catalog server/client spans to fixture-api server span through parent `9c22af7526ff564a`. |
| 2026-08-06 | 7 | full runtime gate | Exact one-pass `scaffold.runtime --cleanup --format pretty` rerun passed 73/73, failed 0, raw exit 0. |

## Gate Results

| Gate | Result | Evidence |
| ---- | ------ | -------- |
| Protocol RED→GREEN | PASS | 6 parser tests; RED was TS2339 before contract. |
| Reconciler RED→GREEN | PASS | 4 tests, including third-party, both order, and cleanup. |
| Third-party install | PASS | `install-plugin_test.ts`, 27 steps; ACME manifest has no `officialSource`. |
| Fixture dispatch | PASS | 11 steps; generated runtime entrypoint artifacts included. |
| Fresh CLI install | PASS | `Installed fixture plugin`; appsettings contains `fixture-api` in catalog/dashboard and no persisted `officialSource`. |
| Fresh CLI remove | PASS | Empty Plugins/BackgroundProcessors; catalog/dashboard `PluginReferences` absent. |
| Fresh scaffold check | PASS | Run-owned db-none consumer `deno task check` checked generated app/service/contracts with zero diagnostics. |
| Live service/OTEL | PASS | HTTP 200 catalog→fixture call; correlated trace and span IDs are tracked under `live-proof/`. |
| Focused lifecycle suite | PASS | 17 tests / 42 steps, including protocol, install, dispatch, reconciler, and remove. |
| Scoped source gates | PASS | check/lint/fmt zero findings; fixture/run JSON formatting clean; docs links 0 broken. |
| Doctrine | PASS | `arch:check` exit 0 (warnings are pre-existing repository debt). |
| JSR audit | PARTIAL | CLI audit exit 0; plugin dry-run is OK but the audit exits 1 on four pre-existing missing `@module` tags in unchanged entrypoints. |
| Scaffold runtime | PASS | One pass, 73 passed / 0 failed, raw exit 0, cleanup included. |
| Review threads | PASS | 0 threads, 0 unanswered. |
| Resource cleanup | PASS | No AppHosts and no run-owned containers after both live proof and full gate; foreign/unproven survivors untouched. |
| Lock hygiene | PASS | Root `deno.lock` restored to branch baseline; stash `7eb4ed16...` preserved unchanged. |

D6 PLAN-EVAL is composed per milestone ruling. Formal IMPL-EVAL remains exclusively owned by the
milestone orchestrator.

## Handoff Notes

- Inspect third-party eligibility and runtime artefacts before official-plugin compatibility.
- Product changes are the generic empty-surface cleanup and fixture-declared runtime permissions;
  no plugin-specific core branch was introduced.
- Exact live request/response, resource relationship, and correlated span IDs are under
  `live-proof/`.
