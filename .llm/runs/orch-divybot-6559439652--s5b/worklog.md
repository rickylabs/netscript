# S5b worklog

## Routing

Feature matrix resolved via JSON. Owner override quoted verbatim: “Independent separate-family evaluation is mandatory; continue owner preference `claude -p --model claude-opus-5-5 --effort high`, read-only.” Implementation OpenAI; evaluator Anthropic in separate sessions.

## Design

1. **Public surface:** tools-side `generate`, `connect`, `verify` commands; `generateLibrary`, `validateLibrary`, native `importLibrary`/`exportLibrary`; separate plugin/build target.
2. **Domain vocabulary:** library bundle, component set, Cartesian variant, token binding, inventory coverage, registry identity, native import receipt and HTML mapping. Existing ComponentContract/Registry/FigmaCollection are the source contracts.
3. **Ports:** native Figma components/variables and filesystem publication; pure generation receives data, import receives a narrow structural Plugin API. Native mock exercises rollback and preflight.
4. **Constants:** bundle version, generated owner marker, bounded variant counts, visual registry kinds, routing collection precedence, native binding fields.
5. **Commit slices:** (1) validated generation/coverage/fixtures; (2) native import/export, Code Connect, commands/build/CI/docs. Each includes this worklog and context pack, scoped wrapper gates, independent substantive review before sign-off commit.
6. **Deferred scope:** active S3, #2559/#2574/#2573/#2453 and visual restyling; live editor/MCP UNPROVEN, #2418/#2412 stay open.
7. **Contributor path:** `tools/figma-component-library/README.md`, then typed contract/generator. New component joins through existing registry+contract, identity override only when names differ.

PLAN-EVAL selected: external import transaction and mapping identity boundaries merit an independent design check before code.

## Intake/reconcile

Issue/comment and duplicate PR sweep complete; no covering PR. Both S3 PRs still open. Owner-specific Refs-only/no-label/public-privacy requirements override generic delivery template defaults. RTK unavailable; native commands used.
