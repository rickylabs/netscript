# Worklog: Zod npm alignment

## Run Metadata

| Field          | Value                                       |
| -------------- | ------------------------------------------- |
| Run ID         | `fix-zod-v4-npm-alignment-1295--1295`       |
| Branch         | `fix/zod-v4-npm-alignment-1295`             |
| Archetype      | cross-cutting manifests + Archetype 6 guard |
| Scope overlays | none                                        |

## Design

### Public Surface

- Member `zod` import aliases retain the same local name and the dependency guard remains the graph
  invariant.
- The evaluator repair replaces npm-Zod implementation types in public annotations with
  package-owned structural validators while retaining private concrete Zod values for internal
  composition and `isolatedDeclarations` inference.
- The detached Fresh streams fixture owns its active catalog and is invoked by the root CI chain.

### Domain Vocabulary

- `ZodAlignmentFinding` — a precise manifest, lock, or source violation.
- `ZodAlignmentReport` — inspected paths, resolved instances, and findings.

### Ports

- Filesystem inputs only; the audit core accepts text/paths so negative controls do not mutate the
  repository.

### Constants

- `ZOD_CATALOG_RANGE` — `^4.4.3`.
- allowed workspace specifier — `catalog:`.
- allowed oRPC source subpath — `@orpc/zod/zod4`.

### Commit Slices

| # | Slice                                                   | Gate                                                             | Files                                                       |
| - | ------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------- |
| 0 | locked harness plan and draft PR                        | composed Plan-Gate                                               | run artifacts                                               |
| 1 | RED Zod graph guard with negative controls              | live guard fails; unit tests prove predicates                    | `.llm/tools/deps/*`, root task, run artifacts               |
| 2 | npm catalog alignment and reviewed lock                 | guard/deno info/check green                                      | root/member manifests, SDK oRPC import, lock, run artifacts |
| 3 | publish and train readiness evidence                    | publish/doc/CI/review gates                                      | run artifacts and PR metadata                               |
| 4 | canary.14 child-workspace catalog repair                | emitted samples and focused child compile                        | generic generation seams and run artifacts                  |
| 5 | Qwen `FAIL_FIX` public-type and detached-fixture repair | 19-root baseline diff, Fresh member check, 73-gate runtime smoke | 26 product/config files plus corrected run/PR evidence      |

### Deferred Scope

- Actual JSR publication is deferred by #1312; dry-run and train soak are the available bar.

### Contributor Path

Change Zod only in the root catalog, run `deno task deps:check`, and inspect the single-instance
report before accepting lock changes.

## Progress Log

| Time       | Slice | Step                  | Notes                                                                                                                                                                                                            |
| ---------- | ----- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-05 | 0     | research              | Reproduced three instances, violated peers, 18 member specifiers, and one non-v4 oRPC import.                                                                                                                    |
| 2026-08-05 | 1     | negative controls     | Six tests prove the documented boundary and reject unknown v3 parents, JSR member/source specifiers, AI/MCP v3 resolution, and the oRPC compatibility root.                                                      |
| 2026-08-05 | 1     | RED                   | Live guard failed with 21 findings: catalog 1, member specifier 18, lock instance 1, oRPC surface 1.                                                                                                             |
| 2026-08-05 | 1     | reconcile             | Draft PR #1315 targets `canary/0.0.5-canary.13`; issue scope and labels remain current.                                                                                                                          |
| 2026-08-05 | 2     | GREEN attempt         | Catalog/member/oRPC alignment removed measured MCP peer-to-3 warnings, but guard still found Zod 3.                                                                                                              |
| 2026-08-05 | 2     | drift                 | Native provenance found hard v3 paths through kvdex and AG-UI; exact-one-instance acceptance remains unearned.                                                                                                   |
| 2026-08-05 | 2     | rescope               | Owner rewrote #1295 to align workspace/AI/MCP v4 while documenting the exact residual boundary; full collapse moved to #1320.                                                                                    |
| 2026-08-05 | 2     | GREEN                 | Guard passes with npm Zod 4 for AI/MCP and only the exact `@ag-ui/core@0.0.52` / `@olli/kvdex@3.6.7` v3 parents.                                                                                                 |
| 2026-08-05 | 2     | focused proof         | 977-file targeted check and 27 CLI/service/streams tests pass, including the generated workspace compile fixture.                                                                                                |
| 2026-08-05 | 3     | publish proof         | Repository publish dry-run exits 0; `deno doc --lint` passes all exports for the 19 affected package/plugin roots.                                                                                               |
| 2026-08-05 | 3     | architecture proof    | `quality:gate`, dependency checks, docs accuracy, and focused lint/format all pass; doctrine reports baseline warnings only.                                                                                     |
| 2026-08-05 | 3     | cloud repair          | Canary code-quality exposed a Zod 4 `private-type-ref` in the plugin manifest schema; a local public validator contract preserves the runtime Zod object and makes the exact cloud doc-lint command green.       |
| 2026-08-06 | 4     | canary.14 integration | Merged train base `2508eb8c99c9cfc55e0c9f1d7ab72fea745db492` without rebase/force; merge commit `c1fb3bb6e5a421fb0db6393ac1b350e38441bd91`.                                                                      |
| 2026-08-06 | 4     | RED                   | `deno task check:emitted-samples` exits 1 with `Package 'zod' not found in catalog`; cloud check-test independently reports nine child-process failures with the same cause.                                     |
| 2026-08-06 | 4     | GREEN                 | Generated standalone roots and generic child-project seams own the scaffold Zod catalog; `check:emitted-samples` checks all 40 emitted samples from 30 artifact paths.                                           |
| 2026-08-06 | 4     | focused proof         | 37 child-workspace/scaffold tests pass; scoped check/lint/fmt cover 824 files with zero findings.                                                                                                                |
| 2026-08-06 | 4     | dependency proof      | Guard tests pass 6/6; live guard retains only the documented AG-UI/kvdex v3 parents; `deno info` binds Anthropic, MCP, OpenAI, and zod-to-json-schema to Zod 4.4.3 without peer-to-3 warnings.                   |
| 2026-08-06 | 4     | publish proof         | Full workspace publish dry-run succeeds; export-map doc-lint completes for all 19 affected roots; docs accuracy and `quality:gate` pass with baseline warnings only.                                             |
| 2026-08-06 | 5     | evaluator RED         | Qwen high session `f516aada-2a74-4dad-821e-b20963fe2983` found +70 root-summed private-type diagnostics (55 distinct sites / 14 files / eight roots) and a canary-green/head-red detached Fresh streams fixture. |
| 2026-08-06 | 5     | public-type repair    | `b29879e9468d4c154bc67beb1cbe430984f8290c` keeps concrete Zod schemas private and publishes structural validators; no suppressions or per-package doc exceptions.                                                |
| 2026-08-06 | 5     | Fresh consumer repair | Fixture-owned npm catalog makes `check:streams-types` green; root `ci:quality` now depends on that member task.                                                                                                  |
| 2026-08-06 | 5     | full proof            | Root check covers 2,630 files; 46 focused tests pass; 19-root doc counts are all at/below canary.14; publish dry-run succeeds; one-pass `scaffold.runtime` passes 73/73 and cleans up.                           |

## Decisions

| Decision         | Reason                                                | Source                         |
| ---------------- | ----------------------------------------------------- | ------------------------------ |
| npm root catalog | gives workspace and npm peers one resolvable identity | issue #1295 / Deno catalog law |
| graph-wide guard | string-only catalog checks cannot prove deduplication | issue acceptance               |

## Gate Results

| Gate                           | Result                         | Evidence                                                                                                                                                                                    |
| ------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Guard predicate tests          | PASS                           | 6 passed, 0 failed, including second-instance/v3/peer negative controls                                                                                                                     |
| Live graph guard               | PASS                           | `zod@4.4.3` plus only documented v3 parents `@ag-ui/core@0.0.52` / `@olli/kvdex@3.6.7`                                                                                                      |
| AI/MCP peer binding            | PASS                           | Anthropic 0.97.1, MCP 1.29.0, OpenAI 6.45.0, and zod-to-json-schema 3.25.2 all resolve `zod@4.4.3`; no peer-to-3 warning                                                                    |
| Root check                     | PASS                           | 2,630 files, 22 batches, 0 diagnostics                                                                                                                                                      |
| Focused check                  | PASS                           | eight touched roots, 635 files, 6 batches, 0 diagnostics                                                                                                                                    |
| Focused tests                  | PASS                           | 46 passed, 0 failed across contracts, Fresh route/StreamDB, AI/auth/workers contracts/streams, and plugin capabilities                                                                      |
| Fresh detached consumer        | PASS                           | `deno task check:streams-types` and full `packages/fresh` check exit 0; task is a root `ci:quality` dependency                                                                              |
| Emitted samples                | PASS                           | 40 samples / 30 artifact paths; preserved pre-repair missing-catalog RED is the negative evidence                                                                                           |
| Dependency / architecture      | PASS                           | `deps:check` and `quality:gate`; FAIL=0 with only named baseline warnings                                                                                                                   |
| Documentation links / accuracy | PASS                           | 102 docs, 0 broken links/anchors/orphans; accuracy PASS                                                                                                                                     |
| Focused lint / format          | PASS                           | 635 files, 0 findings                                                                                                                                                                       |
| Publish dry-run                | PASS                           | serial workspace simulation: `Success Dry run complete`; only baseline dynamic-import warnings                                                                                              |
| Lock / manifest hygiene        | PASS                           | publish restored manifests; inspection-only lock entries were restored to branch hash `d32ef0c1f2b9256e05cf7339c452bd8cf6addeb9a4b433d38abcee992651b529`; no lock diff                      |
| Runtime smoke                  | PASS                           | exact one-pass `scaffold.runtime --cleanup --format pretty`: raw exit 0, passed=73 failed=0; endpoint/background and OTEL webhook/Flow-B/trace/task-trace gates pass; Aspire cleanup passes |
| Post-run leak report           | PASS with shared-worktree note | no survivor from this smoke; reporter lists only older foreign/unproven resources and three unrelated prior-slice containers owned by this worktree; none mutated                           |

### Full-export doc-lint baseline comparison

Counts are parsed diagnostics from the wrapper output; its zero exit status is not used as the
verdict because the evaluator proved that exit status can be green while diagnostics exist.

| Root                          | canary.14 |  repair |      Δ |
| ----------------------------- | --------: | ------: | -----: |
| packages/aspire               |         0 |       0 |      0 |
| packages/bench                |       118 |     118 |      0 |
| packages/cli                  |         0 |       0 |      0 |
| packages/config               |         0 |       0 |      0 |
| packages/contracts            |         9 |       9 |      0 |
| packages/fresh                |        44 |      44 |      0 |
| packages/plugin-ai-core       |         2 |       2 |      0 |
| packages/plugin-auth-core     |         4 |       4 |      0 |
| packages/plugin-sagas-core    |         9 |       9 |      0 |
| packages/plugin-triggers-core |         2 |       2 |      0 |
| packages/plugin-workers-core  |        13 |       9 |     -4 |
| packages/plugin               |        15 |      15 |      0 |
| packages/queue                |         0 |       0 |      0 |
| packages/service              |         0 |       0 |      0 |
| plugins/auth                  |         5 |       5 |      0 |
| plugins/sagas                 |        15 |      15 |      0 |
| plugins/streams               |         2 |       2 |      0 |
| plugins/triggers              |        25 |      25 |      0 |
| plugins/workers               |        24 |      20 |     -4 |
| **root sum**                  |   **287** | **279** | **-8** |

## Implementation Handoff — 2026-08-06

- Product repair commit: `b29879e9468d4c154bc67beb1cbe430984f8290c`
  (`fix(types): publish portable zod schema contracts`), following inherited child-workspace repair
  `ecd224243ea373e803c5165ba607f235d438f9c8` and train merge
  `c1fb3bb6e5a421fb0db6393ac1b350e38441bd91`.
- Exact product/config files: `deno.json`; five `packages/contracts` schema/helper files; three
  Fresh route/fixture files; AI contract + barrel; auth config/contract/domain/public/streams
  surfaces; workers constants/job-definition/job-spec/domain/public-schema/runtime/streams surfaces;
  plugin capabilities + barrel; auth plugin stream schema (26 files total).
- Artefacts corrected: `context-pack.md`, `supervisor.md`, `drift.md`, `research.md`, `worklog.md`,
  and generated `leak-report.md`; formal `evaluate.md` remains immutable.
- PR #1315 remains draft at `status:impl` and targets `canary/0.0.5-canary.14`. The closing keyword
  remains because the issue's six boxes were already accepted. At pushed evidence head
  `91bc68099285b2c322fd895c25bca34ec3c0c99b`, GitHub reported 13 terminal `skipped` checks,
  including core and scaffold lane visibility; no green current-SHA train verdict is claimed.
- Remaining risk: a fresh orchestrator-owned Qwen IMPL-EVAL and a later green required-context run
  remain outside this implementation session. Tool limitations (doc wrapper exit semantics and the
  emitted-sample full-catalog fixture) are recorded, not silently treated as fixed. No known
  product, graph, publish, lock, or current-run resource leak remains.

READY_FOR_FRESH_QWEN_IMPL_EVAL

## Fresh DeepSeek repair IMPL-EVAL — 2026-08-06

- Fresh independent local session `d1fddd8c-12c9-4a44-9bbd-b07207d3db65` evaluated exact clean
  local/remote/PR head `18c7a7e791552c6f346ef07a77a741dd70b058d6` with requested/observed
  `deepseek/deepseek-v4-flash-0731`, effort `max`, and bypass permissions. It did not resume or
  relabel the prior Qwen session. Cost: `$3.565048`.
- Verdict: **PASS**. The evaluator independently confirmed the 19-root doc-lint regression is
  eliminated (287 baseline → 279 repair), detached Fresh consumer is green and root-CI wired,
  exact one-pass scaffold runtime evidence is 73/73 with raw exit 0 and cleanup, all six #1295
  acceptance rows hold, no new suppressions/debt exist, and lock SHA-256 stayed
  `d32ef0c1f2b9256e05cf7339c452bd8cf6addeb9a4b433d38abcee992651b529`.
- Complete evaluator-authored artifact: `evaluate-repair-deepseek.md`. The earlier Qwen
  `FAIL_FIX` artifact remains immutable history. Current-head Actions and milestone pre-merge gates
  remain separate and mandatory before merge.
