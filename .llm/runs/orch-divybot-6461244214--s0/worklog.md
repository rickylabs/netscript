# S0 worklog

## Design

1. Public surface: fresh-ui tokens:build/check, existing package tests, and a reusable Playwright test command documented in `tools/fresh-ui-browser/README.md`.
2. Domain vocabulary: design route, light/dark theme, viewport (390/1280), before baseline, axe violation, keyboard activation.
3. Ports: Deno CLI scaffold/task, Playwright Browser/Page/Test APIs, axe analysis, CI artifact upload; standard upstream APIs compose directly.
4. Constants: default route list, theme list, viewport widths, theme storage key, deterministic animation settings, serious/critical violation threshold (all other axe results retained).
5. Commit slices: plan/bootstrap; token hygiene with frozen build/check and package tests; browser harness/CI/baseline with browser and workflow gates; final reviewed evidence. Exact surfaces and gates are in plan.md.
6. Deferred scope: token redesign, docs redesign, backend changes, release/merge. They belong to later epic slices.
7. Contributor path: `tools/fresh-ui-browser/README.md` explains app/route configuration, baseline updates, results and extension.

## Routing override

Owner instruction verbatim: “Run PLAN-EVAL before implementing, and IMPL-EVAL after, both in the opposite family: claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only. Fix once, record both verdicts in the run dir.” Separate Anthropic evaluator sessions preserve independence.

## Bootstrap

- Feature routing query: exit 0.
- Issue/comments and covering-PR search: exit 0; no duplicate found.
- Memory consulted: environment tool-gap note; RTK unavailable.
- MCP guidance/search/export queries: exit 0 through repository stdio server.
- Fetched complete history and fast-forwarded to main before implementation. Baseline is now `1582e1c9e1adcaa0a8a92900ec3b5b4b0db3e92d`.
- Reconcile: exact scope remains issue #2413. Owner forbids label changes. Final PR-body closing line follows delivery instructions, with Refs at the start.
