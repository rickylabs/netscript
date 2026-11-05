# Worklog

## Owner routing override

“PLAN-EVAL and IMPL-EVAL: `claude -p --model claude-opus-5-5 --effort high`, read-only.”
“model: gpt-6-astra”, “effort: high”, “tier: feature”.
The assignment selects this implementation seat. Matrix recorded in supervisor.md; no evaluator self-certification.

## Design

1. Public surface: static `/create/`, `/design-system/components/<registry-name>/`, Markdown twins, existing ns1_ code consumed by init/ui:apply, MCP guidance.
2. Vocabulary: preset = fixed token choice; flavor = Studio preset; style = component anatomy (Utility only); component page = registry metadata + S3 behavior + native prop docs; example = actual mounted registry component.
3. Ports: registry JSON, contracts public API, deno doc JSON, shipped preset CSS, existing codec, Lume page generator, browser DOM/Preact, MCP DocsCorpusPort.
4. Constants: discover TOKEN_PRESETS and registry item kinds; one Utility style descriptor; document byte limit 12,288; shared route/asset roots. No duplicated token values.
5. Commit slices: (1) builder/generated pages, build and fixture gates; (2) MCP/Markdown + carriers, retrieval and freshness gates; (3) proof/evaluation. Exact touched surfaces and gates in plan.md.
6. Deferred: unshipped styles and resolver axes, server features, release/merge; preserve truthful capability boundaries.
7. Contributor path: `tools/docs-site/fresh-ui/README.md` explains generator inputs, fixture extension, browser bundle and freshness commands.

## Bootstrap

Assignment read in full; repository skills, supplied leaf profile, routing and prior memory consulted. No duplicate PR. PLAN-EVAL selected explicitly by owner; implementation waits for independent PASS. RTK missing; Deno 2.9.7 present. No source changes yet.
