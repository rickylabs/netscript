# Worklog

## Design

1. **Public surface:** JSON registry schema and `/registry-v2`; `ui:build`, `ui:init --preset`, `ui:add --diff`, `ui:update`, `ui:apply --preset --only`, `ui:view/search/list/docs/info`, `ui:registry add|validate`, `ui:preset decode|url`; four MCP registry tools. Existing page/island commands remain supported.
2. **Domain vocabulary:** Registry/RegistryItem/RegistryFile, item type, namespace, registry source, app config, preset, style component map, install plan, lock entry, file baseline, local edit and diff.
3. **Ports:** existing FileSystemPort and TokenEnginePort; new registry transport (network/env seam), MCP registry query port. Native Web APIs provide URL, Headers, crypto.subtle and AbortSignal; Ajv validates published JSON Schema. No DI container or new abstract class.
4. **Constants:** twelve item types; schema URIs/version; `components.json`, `fresh-ui.lock.json`; default aliases; Utility style; preset version and public create URL; namespaced tool/command names.
5. **Commit slices:** schema → ui:build → config/lockfile → commands → style/docs → MCP. Exact surfaces and per-slice gates are in plan.md. The current Cliffy factory pattern is preserved; no changes to the five existing CLI spine abstracts, registries or their type parameters.
6. **Deferred scope:** actual alternate component styles and ui:migrate belong to S3; no component source edits, merge/tag/release or three-way merge.
7. **Contributor path:** the registry-v2 README will describe registry.json authoring, style source maps, config/lock behavior and every public command; implementation entry is `/registry-v2` and the UI command composition feature list.

## Bootstrap

- Assignment read in full; issue body and comments read live. No orchid-triage report or duplicate S2 PR found.
- Memory consulted and local MCP find_guidance/search_docs queried before implementation.
- Feature routing resolved through the pinned matrix; exact owner evaluator override recorded in supervisor.md.
- RTK unavailable; direct noninteractive tools used. No locks/caches deleted or reloaded.
- Public notes omit private runtime identity and paths. Assignment-specific Refs-only/no-label constraints supersede generic GitHub templates.
- PLAN-EVAL pending; no implementation started.

## PLAN-EVAL round 1

FAIL_PLAN: preset persistence/only filtering, managed asset hashes, removal lock reconciliation, and canonical docs carrier needed explicit decisions. Repaired all four in plan.md before implementation; same evaluator resumed for the single repair pass.

## Slice 1 — schema and authoring

- Canonical JSON contains 86 protocol items, including Utility style. Legacy projection preserves all 85 prior item names/kinds/files/dependencies/CSS and all 8 collections, verified against a pre-change snapshot.
- Schema test wrapper: exit 0, 21 passed / 0 failed / 0 skipped. Scoped check (4 selected), lint and format (6 selected, 0 dropped) exit 0. `quality:scan` and `arch:check` exit 0.
- Full Fresh UI doc-lint exits 1 on 123 existing errors in runtime component sources; changed registry entrypoints have zero errors. Runtime source fixes belong to S3.
- Independent slice review pending. Reconcile: draft #2468 remains Refs-only, no labels changed; component source ownership preserved.

## Slice 1 repair and mandatory stop

- First independent slice review: FAIL_FIX; added generated-theme/preview/version drift checks and complete pre-change legacy compatibility fixture. See slice-1-review-round-1.md.
- Second independent review: FAIL_FIX; its only finding was an incorrect expected preview prefix in the added test. Corrected `~/static/` to the original `static/`; no shipped target changed. See slice-1-review-round-2.md.
- The supplied leaf's two consecutive terminal failure limit requires ending the review loop. No third review, independent sign-off, final IMPL-EVAL, or READY claim. The draft is a partial delivery.
- Final focused wrapper tests: exit 0, 25 passed / 0 failed / 0 skipped. Structured check: 8 selected, 0 failed. Lint/format: 8 selected/processed, 0 dropped/refused, exit 0. Registry and registry-v2 doc-lint: exit 0, zero errors. JSR metadata audit without publication dry-run: exit 0. Repository quality and architecture tasks: exit 0 with existing warnings.
- Full Fresh UI doc-lint has existing component-runtime findings; its initial run also found the new registry type-export reference, which was repaired. The full package doc-lint will be rerun to report its exact remaining baseline separately.
- Scaffold runtime, static build publication and final publish dry-run remain unproven. They were not skipped to claim readiness; the run stops before readiness under the explicit review limit.
- Reconcile: #2415 remains open, draft #2468 carries only a reference. No labels or milestones changed on the issue, no merge/tag/release, and no unrelated resources started or mutated.

Final full Fresh UI doc-lint: 123 errors (96 private type references, 27 missing docs), in unchanged runtime component sources. Both changed registry entrypoints individually exit 0. Final quality/architecture reruns exit 0.

## Authorized continuation

The next user instruction resumes the full goal: "Continue working toward the active thread goal" and "Keep the full objective intact." Previous turn classification: progress (schema implementation and pushed evidence), but the objective remains incomplete. The continuation authorizes a new implementation/review cycle from `cdbbe24`; historical review verdicts remain intact and no earlier PASS is invented. The subsequent user instruction requires addressing failed CI while completing S2. The draft remains open; no merge or release is authorized.

CI failure inspected at run 40756074834 / build job: docs:exports-drift reports twelve new registry symbols absent from the Fresh UI reference. Added the new subpath and all exported symbols to the existing reference page, preserving complete coverage.

## Slice 2 — static registry build and CI documentation repair

- `buildRegistry` returns deterministic static index and per-item JSON after validating all source/includes, detecting cycles and duplicate ids, and reading exact source bytes. CLI ui:build preflights sources and output paths, including physical symlink containment, before any write.
- Docs build now publishes `_site/r/registry.json` and all 86 item payloads through its normal build task. Real CLI and docs build:registry both exit 0 and produce 87 JSON artifacts.
- Focused structured tests: exit 0, 11 passed / 0 failed / 0 skipped. Structured check traversing the CLI root/new build test/registry export: 3 selected, 0 failures. Lint/format: 11 selected and processed, 0 dropped/refused, exit 0. Registry entrypoint doc-lint, quality:scan, arch:check and docs:exports-drift all exit 0.
- Independent same-session reviewer: PASS; see slice-2-review.md. The reviewer inspected source/tests but did not independently execute commands, as required by the read-only tool restriction.
- CI repair: the failed Pages build reported missing registry exports in the Fresh UI reference. All twelve symbols plus build APIs and the eighth subpath are now documented. The exact failing docs:exports-drift command exits 0 locally.
- Reconcile: draft #2468 remains open from main, no label changes; full S2 scope is active under user continuation. No component source modifications. The pending work is config/lock/remote commands, style+docs/preset, and MCP.

## Coordinator continuation


The owner accepted slice 1 and authorized one fresh independent review, one blocker repair if needed, then every remaining slice. The branch and PR were verified at the requested head, and main is unchanged. Fresh review uses the exact requested Claude Opus model/effort with closed stdin and read-only instructions. Owner evaluator override and writable surface are recorded in supervisor.md.

Focused baseline command through `run-deno-test.ts`: the exact `registry-v2.test.ts`, `registry-authoring.test.ts`, `registry-doc-drift.test.ts` set passes 12/0/0, exit 0. An initial invocation used nonexistent `registry-schema.test.ts` and exited 1 before tests; the corrected run is the verdict.

Fresh review: FAIL_FIX for design-sync selecting the portable JSON catalog as a legacy manifest. Single authorized repair separates exports; dashboard config now loads all 85 legacy units. Structured test wrapper 13/0/0, exit 0. Scoped source formatting covers all four repair files with zero drops. Reconcile: same branch/PR and unchanged main. Remaining slice plan is unchanged.

## Independent MCP slice — in progress

Four tools: bounded/paginated registry list and search, portable item view, and non-executing ui:add argv. Default MCP CLI composition reads embedded Fresh UI bytes offline through an injected catalog port and the shared static publisher. Explicit Fresh UI subpath dependencies at the existing version require exactly four single-line lock workspace-metadata additions, as verified by native reference/private-lock gates.

Scoped check passes five selected files; doc-lint passes all three MCP entrypoints; docs:exports-drift passes; lint passes 13 files. The first whole-package test run found a catalog-order compatibility regression (197/1/0); new tools now append to the catalog and the suite is rerunning. Member lock:update passes its structured check of 206 files in two batches. Independent evaluator transport hit its subscription window limit before issuing a slice verdict; this is a route availability failure, not PASS or FAIL_FIX. The same authorized evaluator session will resume after its indicated reset.

MCP final local evidence: whole-package structured suite 198/0/0, exit 0; post-generation registry/public-doc-lint/embedded-prose/carrier-parity tests 15/0/0, exit 0; root quality:gate exit 0; scoped check/lint/format all pass without drops. Native asset and publish generators refreshed the MCP README carrier and CLI documentation carrier. The export-surface generator refused dirty sources as designed; reran explicitly with its documented `--allow-dirty` flag for this owned implementation and retained source provenance.

Independent MCP review round 1: FAIL_FIX for generic source-string truncation. Repaired once by applying the existing faithful-content policy and complete-response byte guard. Added exact long component+CSS comparisons and both payload/envelope oversize controls. Same evaluator round 2: PASS (read-only source review; no independent command execution claimed). Final whole MCP structured suite: **200/0/0, exit 0**. See slice-mcp-review.md. No new architecture debt accepted.

Reconcile: static-build and design-sync repair commits retained. Concurrent worker owns config/lock/CLI application work; this slice reserves only MCP, its documentation and generated carriers, and the four required dependency-metadata lock lines. Next independent unit: theme documentation authoring/carrier only, with component sources and CLI application behavior left to their existing owners.
