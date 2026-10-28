# S1 research — 2026-10-28

- Rebased the dispatcher's shallow starting checkout onto `origin/main`
  `057397d3e3881a690492f518088140111711240e`, which includes S0 #2432.
- Checked #2414 comments and all PRs mentioning the issue or tokens. No existing
  PR implements S1. #2408 is earlier theming work; #2427 is the design handoff.
- Design reference: `origin/docs/fresh-ui-design-system` at
  `e6ff8413683911a3a7ef82b0edacdc97ffdecb8c`. Its documentation and Figma exports
  were inspected as an ignored working copy. They are inputs, not a replacement
  branch base. Figma export contains seven collections and 1,229 variables; 523
  variables have WEB syntax. Target collection modes govern alias resolution.
- Consulted saved NetScript memory: Studio Utility is the future default; this
  task explicitly retains NS One. CLI format/lint need scoped configuration.
- NetScript MCP is not attached to the agent tool list. Called its actual local
  `createMcpCliServer` with `find_guidance`, `search_docs`, and `find_export`.
  Guidance points to the copy-source registry and `customize-fresh-ui` recipe.
- S0 uses Style Dictionary 5.7.1, a frozen package lock, and a browser/axe harness.
  Existing build hand-renders outputs after dictionary token lookup; semantic
  sources contain raw strings. The actual design route and `_app.tsx` are CLI
  templates, not a checked-in playground application.
- Read doctrine axioms, public surface, archetypes, relevant rules, and gate
  matrix. CLI remains Archetype 6; token engine is a focused integration inside
  fresh-ui, with the frontend overlay. Existing fresh-ui runtime debt is outside
  this token-only slice; no inherited defect is silently accepted as a pass.
- Primary references:
  - https://www.designtokens.org/tr/2025.10/format/
  - https://www.designtokens.org/tr/2025.10/resolver/
  - https://github.com/style-dictionary/style-dictionary/issues/1590
  The resolver expands ordered sources and modifiers before Style Dictionary
  resolves token aliases/transforms and runs registered output formats.
- Environment: Deno 2.9.7 and GitHub CLI available; RTK is absent. Commands will
  run directly, while verdicts come from repository structured wrappers.
