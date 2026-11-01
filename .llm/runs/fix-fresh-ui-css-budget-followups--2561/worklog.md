# Worklog

## Design

1. Public surface: stable CSS/markup; maintainers get a documented fixed growth policy,
   a checkout-independent budget test, and a reproducible parity command in CI.
2. Vocabulary: component CSS excludes registry/theme; baseline fixture freezes original
   CSS/tokens/specimens; rule contract is the ordered parsed selector/declaration/media list.
3. Ports: existing Deno filesystem/compression and structured test wrappers, Node filesystem/
   subprocess APIs, pinned Playwright browser harness and existing variant-parity engine.
4. Constants: raw220000/gzip28000 fixed ceilings; baseline schema version, safe registry
   path roots, original provenance SHA and exact input hashes; no runtime theme attribute.
5. Commit slices: plan+draft; then budget test/docs, maintained .llm/tools/css code/tests/
   fixtures, browser integration and CI/classifier wiring with focused/full gates and
   separate reviewer PASS; then final delivery evidence. Every slice updates this run.
6. Deferred: new components, token/design changes, adaptive per-file budget scaling,
   other epic owners' work and inherited public-export documentation findings.
7. Contributor path: .llm/tools/css/README.md explains replay inputs, negative controls,
   and the reviewed baseline/budget update process.

PLAN-EVAL N/A: bounded follow-up repair with existing engines and explicit acceptance;
no public/runtime redesign. Owner evaluation override remains read-only Claude Opus5.5,
requested high effort, separate Anthropic session. Public evidence omits session identifiers.

Intake: #2558 merged as6a6a82e; #2561 has exactly three unfinished cells and no other PR.
Branch starts at that main. Scope is one cohesive validation unit; no sibling split needed.
