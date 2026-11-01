# Worklog

## Design

1. Public surface: static `/create/`, generated component references, existing `find_guidance` tool. No new package exports.
2. Domain vocabulary: compact preset metadata, initial builder payload, component identity/alias, contextual disambiguation.
3. Ports: Web fetch/import/CompressionStream, native Deno bundle and filesystem, existing CLI codec, registry and docs corpus. No new abstraction layer.
4. Constants: existing preset/style IDs; shared raw/gzip payload budgets; named workspace component inventory.
5. Commit slices: plan artifacts; implementation in `tools/docs-site/fresh-ui/`, `docs/site/design-system/components.page.ts`, `tools/fresh-ui-browser/docs-tests/components.spec.ts`, `packages/mcp/src/domain/docs/component-guidance.ts`, `packages/mcp/tests/component-guidance_test.ts`, `packages/fresh-ui/tests/publish-size.test.ts`, generated carrier outputs; final evidence. Gates: site build/rendered checks, docs links/accuracy/snippets, builder browser tests, MCP routing tests, every carrier freshness task, scoped static wrappers, quality/architecture. Full CLI runtime checked at readiness or recorded unproven/policy skip.
6. Deferred scope: independently controlled unsupported pickers until S6b/resolver contracts ship; no fake choices.
7. Contributor path: `tools/docs-site/fresh-ui/README.md` explains metadata, bundles, budgets and adding anatomy. MCP component routing derives names from corpus pages.

## Bootstrap

Matrix resolved feature tier. Owner override, verbatim: **IMPL-EVAL: `claude -p --model claude-opus-5-5 --effort high`, read-only.** Implementation/evaluation remain separate sessions and vendor families. Public run has repo-relative paths and no session IDs. Owner-specific draft/Refs/no-label/READY process overrides generic boilerplate.

PLAN-EVAL: N/A for bounded static payload and routing repair with issue-defined contract.
