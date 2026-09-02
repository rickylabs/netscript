# Worklog

## Design

- Public surface: `@netscript/fresh/vite` publishes
  `resolveNetScriptRouteManifestOptions`, `discoverNetScriptRoutes`, and
  `writeNetScriptRouteManifestSync`, plus their option, resolved-option, discovered-route, and
  writer-result types. The reachable type closure also publishes `PageModuleRouteForm` because
  `DiscoveredNetScriptRoute.pageModuleForm` otherwise creates a new private-type doc-lint
  diagnostic. The page-module rewrite function and binding pass remain unexported. The CLI adapter
  itself remains kernel-internal.
- Domain vocabulary: resolved manifest options, discovered routes, generated manifest content,
  and writer result. No new generic port or speculative abstraction.
- Ports: the existing Fresh public writer is the external package boundary; the adapter uses
  Deno filesystem reads only inside `kernel/adapters/scaffold`.
- Constants: none; there is no new finite identifier family.
- Commit slice: one Slice B implementation commit, proven by focused tests, structured package
  gates, dependency/publish gates, doc-lint A/B, JSR audits, doctrine/quality gates, docs ceilings,
  and any required generated-carrier cascade.
- Deferred scope: no command calls the seam; no page rewriting; no router transform; no resource
  planner or templates.
- Contributor path: public manifest behavior is owned by `packages/fresh/.../route/manifest.ts`;
  CLI staging consumers use the scaffold adapter without cloning Fresh route semantics.

## Evidence

| Gate | Exit | Evidence |
| --- | ---: | --- |
| Focused Fresh Vite + CLI adapter tests | 0 | 13 passed, 0 failed, 0 ignored |
| Fresh structured check | 0 | 207 files, 2 batches, 0 diagnostics |
| Fresh structured lint | 0 | 207 files, 2 batches, 0 findings |
| Fresh structured fmt | 0 | 207 files, 2 batches, 0 findings |
| CLI structured check | 0 | 918 files, 16 batches, 0 diagnostics |
| CLI full-root structured lint diagnostic | 1 | 726 files, 59 baseline findings in 34 paths; root config normally excludes CLI |
| CLI full-root structured fmt diagnostic | 1 | 726 files, 237 baseline findings; root config normally excludes CLI |
| CLI owned-file structured lint | 0 | 2 files, 0 findings |
| CLI owned-file structured fmt | 0 | 2 files, 0 findings |
| Fresh doc-lint before / after | 1 / 1 | 45 / 45; reports byte-identical, delta 0 |
| CLI doc-lint before / after | 0 / 0 | 0 / 0; reports byte-identical, delta 0 |
| Fresh JSR audit | 0 | dry-run OK; 2 pre-existing warnings |
| CLI JSR audit | 0 | dry-run OK; 20 pre-existing warnings |
| `deps:why @netscript/fresh` | 0 | sourceUsed=true, sourceHitCount=106, likelyDeadImport=false |
| `deps:prod-install` | 0 | OK |
| `publish:dry-run` | 0 | Success; workspace dry run complete |
| `arch:check` | 0 | PASS with existing warnings |
| `quality:gate` | 0 | quality scan ok, 0 findings; arch check passed |
| `docs:readme-fences` | 0 | 7 type errors; baseline ceiling unchanged |
| `docs:jsdoc-examples` | 0 | 359 checked, 0 failures; unboundName=116 |
| Carrier generators | 0 | all three generators ran in required order |
| Post-commit `check:mcp-export-corpus` | 0 | generated corpus matches; symbolCount=7823 |
| Post-commit `check:assets-barrel` | 0 | generated asset barrels match |
| Post-commit `check:publish-assets` | 0 | publish assets match |

## Lock decision

`deno install --frozen` reported the lock was out of date. The accepted `deno.lock` delta is exactly
one dependency-only line under the CLI workspace member:

```text
+          "jsr:@netscript/fresh@0.0.6",
```

No package-resolution entry changed.

## Ceiling ruling

The public export changes the hard carrier
`packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`:
`symbolCount` 7816 → 7823, `uncompressedBytes` 2192016 → 2194722, and the compressed payload/hash.
Work paused before commit because that path was outside Slice B's six-file ceiling. On 2026-09-02,
the owner ruled generated carrier outputs ceiling-exempt because they are regenerated at every
converged public-surface head and stale output is a hard quality failure. The six scoped product
paths therefore remain unchanged; the generated corpus is an authorized required side effect.
