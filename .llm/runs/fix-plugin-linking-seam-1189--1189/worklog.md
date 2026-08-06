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

## Terminal implementation handoff — 2026-08-06

### Commits

- `ca8f1c76bb8859d8ab5d39db31300a15652ebb3d` — merge exact train base
  `2508eb8c99c9cfc55e0c9f1d7ab72fea745db492` without rebase/force.
- `e6c429f4527e02f1dfa8886f0ff66311bbc5a299` — generic empty-surface repair,
  fixture-declared runtime permissions, and RED/GREEN/live-trace evidence.
- The terminal handoff update is evidence-only and is the next explicit-refspec push after the
  product/evidence commit above.

### Exact changed paths in the repair commit

- `packages/cli/src/kernel/adapters/plugin/plugin-reference-reconciler.ts`
- `packages/cli/tests/fixtures/plugin-scaffolder/scaffold.plugin.json`
- `.llm/runs/fix-plugin-linking-seam-1189--1189/acceptance-evidence.md`
- `.llm/runs/fix-plugin-linking-seam-1189--1189/drift.md`
- `.llm/runs/fix-plugin-linking-seam-1189--1189/leak-report.md`
- `.llm/runs/fix-plugin-linking-seam-1189--1189/run-resources.json`
- `.llm/runs/fix-plugin-linking-seam-1189--1189/worklog.md`
- `.llm/runs/fix-plugin-linking-seam-1189--1189/live-proof/red-before-install.md`
- `.llm/runs/fix-plugin-linking-seam-1189--1189/live-proof/green-consumer.md`
- `.llm/runs/fix-plugin-linking-seam-1189--1189/live-proof/trace-00766def76331c34a3df9fd525bfe3e0.json`

### Commands and verdicts

- Focused remove RED: existing lifecycle test failed because actual appsettings retained
  `Apps: {}`.
- Focused GREEN: protocol/install/dispatch/reconciler/remove command — 17 tests, 42 steps,
  0 failures.
- Scoped check/lint/fmt — zero findings; fixture/run JSON format check passed.
- `deno task docs:links` — 102 docs, 0 broken links/anchors.
- `deno task arch:check` — exit 0; warnings are recorded pre-existing doctrine debt.
- CLI JSR audit — exit 0 and publish dry-run OK.
- Plugin JSR audit — publish dry-run OK; exit 1 only on four pre-existing missing `@module` tags
  in unchanged public entrypoints.
- Fresh consumer `deno task check` — zero diagnostics across generated app/service/contracts.
- Mandatory one-pass `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` —
  73 passed, 0 failed, raw exit 0 (the earlier interrupted attempt is not counted).
- Review-thread gate — PASS, 0 threads / 0 unanswered.

### Owned runtime proof and cleanup

- Owned root:
  `/home/codex/repos/ns005-cachetiers/.llm/tmp/fix-plugin-linking-seam-1189-live`.
- RED request: catalog endpoint HTTP 500, endpoint not linked before install.
- GREEN request: catalog endpoint HTTP 200 after the handler called and validated
  `fixture-api /ping`.
- Correlation: trace `00766def76331c34a3df9fd525bfe3e0`; catalog client span
  `9c22af7526ff564a`; fixture server span `c7935b1b03518da5`, whose parent is that catalog
  client span.
- Post-run: `aspire ps` empty; leak reporter found no run-owned AppHost/container. Every listed
  foreign or unknown-owner survivor was left untouched.
- Root `deno.lock` matches the branch baseline. Stash
  `7eb4ed16d6944c1d1c904895bcb76b4361ad8a57` remains `stash@{0}` and was not popped,
  dropped, rewritten, or committed.

### PR snapshot and remaining authority

- PR #1316 product/evidence head: `e6c429f4527e02f1dfa8886f0ff66311bbc5a299`.
- PR state: draft; base `canary/0.0.5-canary.14`; label `status:impl`.
- Draft push checks: all 18 contexts skipped by draft policy; no failing executed context.
- Local close-gate replay evaluated the exact head and found only authoritative issue #1189 box 5
  unticked. The PR now carries valid structured box-index 5 evidence, but the supervisor did not
  apply `status:ready-merge` or mutate the issue because those actions belong to the milestone
  orchestrator after formal evaluation.
- Remaining risk: four pre-existing plugin `@module` audit findings are unrelated to this diff;
  formal Qwen IMPL-EVAL, issue acceptance mutation, draft→ready, merge, and canary remain
  orchestrator-owned.

READY_FOR_QWEN_IMPL_EVAL

## Current-head CI retrigger — 2026-08-06

- Formal Qwen IMPL-EVAL already passed in independent session
  `abe31571-0fa1-4ea4-9085-1c36ea14a5c7` against unchanged product head `53d6c278d...`; the
  existing artifact-only head before this note was `31b8982123fda57294f4f7bf438c1157a622a41c`.
- GitHub Actions run `31121552268` attempt 2 remained indefinitely queued while the cancel API
  classified it as completed and the rerun API classified it as running. Neither attempt produced
  the required executed current-head green rollup.
- This evidence-only commit deliberately triggers a new `synchronize` event. It changes no product,
  package, plugin, manifest, dependency, evaluator artifact, or `deno.lock`; merge remains held
  until the new exact head has executed green required contexts and the milestone pre-merge gate.
