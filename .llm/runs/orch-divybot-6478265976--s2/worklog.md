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
