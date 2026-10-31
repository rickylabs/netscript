# Worklog

## Design

1. Public surface: plugin import/export/download/GitHub PR; shared typed
   figmaTokenSources; ui:apply --preset URL; init --preset URL.
2. Vocabulary: FigmaCollection/Variable, snapshot bundle, DTCG round-trip bundle,
   portable registry theme, version-1 preset; names remain owned by code.
3. Ports: narrow Figma variables API; fetch GitHub adapter; existing CLI fs,
   transport, paths and token engine. No new CLI effect abstraction.
4. Constants: DTCG schema/version, collection file mapping, source filenames,
   extension identifier and GitHub API origin. Reuse public preset catalog.
5. Commit slices:
   - Bootstrap plan/run artifacts (this run directory); PLAN-EVAL.
   - Shared source composition + licensed plugin snapshot/DTCG/import/export/UI,
     tests and name CI (tools/figma-plugin, fresh-ui token adapter/entrypoint,
     script/tests, deno.json/CI); fixture/schema/mock/build wrappers.
   - URL preset + init application wiring/docs/tests (CLI ui/v2, init/root
     composition and maintainer init, CLI census/reference); structured native
     URL tests, clean scaffold check, docs accuracy and quality gate.
   - Regenerated carriers and final evidence (existing carriers/run); full gates,
     independent IMPL-EVAL and exact-head CI before READY.
6. Deferred: Code Connect/library components phase 2; Community publication and
   manual Figma host acceptance cannot run in CI.
7. Contributor path: tools/figma-plugin/README.md describes the full flow,
   shared importer, named inventory, install contract, test and build commands.

## Bootstrap

Read assignment in full, relevant skills, prior S1/S2 memory and current code.
Resolved feature matrix; owner-selected Claude Opus 5.5/high overrides evaluation
route without waiving session/vendor independence. RTK missing. No secrets read.
