# W4-B preflight — runnable page-builder tutorial

Observed on 2026-08-06 before dispatch:

- No current tutorial demonstrates the page builder as the default product workflow, despite public
  `withResource`, `withLayer`, `withLayout`, `withForm`, query/cache/dehydration, telemetry, and
  contract-first surfaces.
- Owner evidence shows Loom used none of the differentiators even though examples were reachable.
- W4-B must consume the actual patterns retained by W4-A; it cannot start in parallel with W4-A.

## Required supervisor mission

1. Inspect the published public surface with `deno doc`/filtered symbols and the W4-A executable
   source. Do not write examples from memory or import private/internal paths.
2. Build one focused, runnable tutorial whose real route demonstrates the retained resource flow:
   contract-first route, typed SDK/query factory, `withResource`, `withLayer`, `withLayout`,
   `withForm`, cache-first QueryIsland, server/client dehydration, telemetry, partial navigation,
   and mutation/error state where supported.
3. Replace every named hand-rolled tutorial pattern for which the page builder owns a public
   equivalent; record the before/after usage inventory rather than merely adding API-name prose.
4. Compile every snippet/example against published entrypoints and run the full browser flow against
   a real generated service, including loading/error/empty/success and form/mutation behavior.
5. Add a tutorial adoption smoke/ledger using the Loom corpus, but keep uncontrolled measured-agent
   adoption separate from deterministic docs acceptance.
6. Run example type checks, docs links/accuracy/site build, changed-file audit, source alignment,
   Playwright flow, and any package doc/publish gate required if public examples move.
7. Open a draft PR with `Refs #1208`. If the owner-directed Phase 2 sweep remains on this issue, do
   not close it from Phase 1; either complete the recorded Phase 2 checklist or obtain an explicit
   separately tracked disposition before adding a closing keyword.
8. Leave the PR at `status:impl-eval` for separate Qwen evaluation.

A page containing the API names but not executing the composed flow is not a tutorial proof.
