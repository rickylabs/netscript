# Worklog — orch-divybot-752--fresh-ui-design-guide

## S0 — Bootstrap, research, plan (2026-10-21)

- Reset stale worktree (`6f6cbdf`) to `origin/main` `a833dfa` (0.0.8 cut).
- Routing: `deno task agentic:matrix -- --tier feature --json` → see `supervisor.md`.
- Sibling harness#751 (same upstream #2406) is live; agreed file split over SendMessage. #751 owns
  chrome/nav/`ui:add page`/`registry-styles.ts`/`netscript-build` skill; this run owns docs, MCP corpus,
  app guidance builder, fresh-ui primitives, caveats issue.
- Baselines: `deno task check:agent-docs-prose` → fresh (10 s, Lume 669 files). `tokens:build` under the frozen
  lock fails (lru-cache); `--no-lock` build reproduces committed `registry/theme/*` byte-for-byte.

### Design checkpoint

1. **Public surface** — theme-seed `tokens.css`/`tokens.json` (same names, derived values, documented header);
   generated `apps/<app>/AGENTS.md` + `WEB-LAYER.md` Design and theming section; docs pages
   `/web-layer/how-to/design-with-fresh-ui/` (new) and `/web-layer/how-to/customize-fresh-ui/` (theme chain);
   MCP embedded corpus + `find_guidance` routing for theme/design intents.
2. **Domain vocabulary** — brand knobs; derived tokens; theme chain; app chrome (see `plan.md`).
3. **Ports** — none new; existing `GuidanceConcept` table and `DocsCorpusPort` carriers.
4. **Constants** — `MCP_EMBEDDED_DOC_PATHS`, `MCP_EMBEDDED_DOCS_MAX_BYTES` (+ rationale), alpha percentages in
   DTCG sources only, concept `theming-and-design`, convention reference ids.
5. **Commit slices** — S0 plan; S1 derived tokens; S2 docs; S3 MCP; S4 app guidance; S5 close (see `plan.md`).
6. **Deferred scope** — #751's items; second theme item / runtime switcher; `Page` shell component;
   tokens lock repair; `contrast-color()` foregrounds. Filed in the caveats issue.
7. **Contributor path** — `docs/site/web-layer/how-to/design-with-fresh-ui.md`; token derivation in
   `packages/fresh-ui/tokens/semantic.tokens.json`.

PLAN-EVAL: not selected (justification in `plan.md`).
