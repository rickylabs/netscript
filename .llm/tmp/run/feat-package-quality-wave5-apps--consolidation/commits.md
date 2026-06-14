# Commits — Wave 5 Apps Consolidation

Append `- <sha>: <message>` after each commit.

- 21c56d0: harness: bootstrap wave5 apps consolidation run + plan
- a0e5bcc: refactor(service): split service-builder into impl + rpc + listener seams [A1]
- e67edf1: docs(service): add Package Role archetype section to README [A2] — Phase A done
- 5367093: refactor(sdk): collapse root barrels into src/ (single source root) [B3] — Phase B done
- 29bcc30: refactor(fresh-ui): introduce src/ as single source root [C1] — runtime→src/runtime, primitives→src/presentation, root shells kept; manifest/registry/tokens stay at root (CLI contract); C2 deferred (drift). Phase C done.
- bcbdf55: docs(fresh-ui,sdk): align archetype docs with doctrine [C-docs] — fresh-ui A3→A4 (DSL/Builder, A3 folded in); explicit Archetype 4 naming added to fresh-ui + sdk READMEs (service already named). Docs only.
- 43ffcc7: refactor(fresh): introduce src role layering [D1] — codex (WSL native worktree). 157 files, +2413/-2423, almost entirely 100%-similarity renames into `src/`. builders/route/form/query/defer/config/vite + cache helpers → `src/application/`; server/streams/interactive → `src/runtime/`; error → `src/diagnostics/error/`; telemetry → `src/internal/package-telemetry/`; testing → `src/testing/`. Split page-compat (1111 LOC) into 7 type modules; split builder/mod.tsx → form-support+route-support. `deno.json` exports rationalized to 12 keys (`./utils` REMOVED); root shells kept for CLI import-map (server.ts, builders/mod.ts, route/mod.ts, query/mod.ts, config/vite.ts). plugins/workers + plugins/sagas deno.json repointed `@netscript/fresh/streams` into src/. Deleted 4 test-jsx* scratch files. Phase D structural done.
