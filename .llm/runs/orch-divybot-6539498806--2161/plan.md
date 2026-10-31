# Plan & Design — READY FOR REVIEW

1. Add a shared selector taking candidate paths plus a readTextFile port, returning sourceFiles and excludedSourceFiles. Recognize the exact first-line line-comment directive, allowing BOM, horizontal indentation and CRLF; no substring matching or module evaluation. Preserve ordering and fixed manifest excludes.
2. Apply it before imports in BOTH triggers writers (generate-runtime-registries.ts and trigger-registry-compiler.ts), BOTH workers writers (runtime-registry-generator.ts and registry-compiler.ts, including pluginDirs), and saga registry candidates. Preserve all empty-registry behavior and strict generated resolvers. Carry optional exclusion evidence only when nonempty.
3. Extend protocol-2 entry validation with one optional excludedSourceFiles field: canonical project-relative existing paths, bounded, unique, disjoint from selected files. Propagate to GeneratedPluginRegistry and doctor messages in both healthy and drift cases. Older producer payloads remain valid; unknown keys remain errors.
4. Test directive semantics, all three generators, generated imports/loading with real valid definitions plus a throwing helper, installed plugins and doctor path names, and unmarked helper failures naming each module. Every fixture retains a valid definition. Exercise standalone plugin command-line registry rewrites after generation, proving marked modules remain excluded and runtime/standalone writers select the same marked fixtures. If actual processor startup cannot be safely exercised independently of the forbidden full E2E, report it unproven and require the coordinator's CI verdict.
5. Document syntax, scope, regeneration and doctor reporting in each plugin README. Explain why module opt-out fits static, sandboxed discovery.

## Gates

Focused tests through run-deno-test.ts; scoped run-deno-check/lint/fmt.ts with explicit TS roots and unstable-kv; quality:gate; scoped doc:lint and JSR audit for changed shared CLI export. Semantic installed-project import smoke is local; full scaffold.runtime CI is mandatory and coordinator-owned, never run locally. Review threads checked before READY. Independent PLAN-EVAL before implementation, slice review before commits, IMPL-EVAL on exact pushed head before/after ready.

## Risks and decisions

- Optional protocol metadata: preserve old exact entry shape when no exclusions and reject unknown fields; regression-test legacy payloads.
- False matches: directive recognized only as a first-line comment, never in executable strings, examples or later comments.
- Hidden helpers: excluded modules are never imported by generated registries, but explicit imports retain ordinary semantics. Doctor names skipped modules; invalid unmarked modules still fail clearly.
- Worker policies: configuration referencing excluded jobs must retain existing unresolved-policy errors rather than silently dropping config.
- Static saga inspection can still see factory calls; filter candidates before rendering without touching empty-saga handling.
- Added file remains below folder-cardinality and LOC limits; unchanged legacy monoliths are not refactored for this leaf.
- Open decisions: none requiring implementation rework. Accepted new debt: none.

## Research scope clarification

The workers standalone compile-registry command has a second selector; apply the same directive there. AI also produces protocol-2 runtime registries; apply the shared marker before its existing AST definition-shape selection so the mechanism is consistent for every installed runtime registry. Extend declared write surface with plugins/ai/src/cli/ai-registry-compiler.ts, its tests and README. These are scan-only changes, with no AI runtime changes.

The triggers standalone compiler also consumes the shared selector. JSR audit skill read before implementation: exported selector result types and directive constant require explicit annotations/JSDoc; no new dependencies or export-map entries. Planned surface is covered by scoped doc lint and audit-jsr-package.ts.
