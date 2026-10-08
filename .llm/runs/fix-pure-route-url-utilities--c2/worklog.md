# Worklog

## Design

Public surface and domain: D1 Pure URL helpers: getBoundLinkProps is an ordinary function passing null context to the existing validated URL builder. This repairs route.href, paired href/partialHref/getLinkProps together without duplicating route construction. No hook invocation or try/catch in utilities. Link calls a directly named useNavigationContext hook during component render; required hooks remain explicit. D2 Explicit search: existing useCurrentSearch(target) supplies current parsed values to pure href/getLinkProps; existing usePageRoute().getLinkProps captures its hook context once and supports preserveSearchParams. Pure helpers use schema defaults regardless of the context flag; retain input types and document migration. D3 Regression: adjacent pure-hook instrumentation and SSR paired/schema/encoding tests plus real production Fresh fixture: memoized send/read href before state/callback and native TanStack useChat, conditional/variable links, rerender/unmount, state identity, current search, A-to-B repeated back/forward navigation and live resume, no browser errors. Every new test has a causal source mutation and restored pass. D4 Gates: Fresh full unit suite, frozen scoped check/type fixtures/lint/fmt, quality/architecture, JSR/public dry-run, baseline per-entrypoint doc comparison if required, native production SSR/browser and generated carrier/corpus freshness. No release/scaffold/CLI changes, release gates N/A. Owner publication and qualified published consumer remain necessary; Refs #2040 until all acceptance including publication exists. EIS router href-to-nav.makeHref facade becomes removable after qualification. Workload feature capped by absent privileged-row authority; decision-heavy implicit-search semantics require selected independent PLAN-EVAL before implementation.

Ports: preserve existing owning package contracts. Constants: existing finite vocabulary; additional values only when needed by the issue. Contributor path: extend existing implementation and adjacent regressions.

Commit slices: bootstrap plan, source/test/mutation evidence, independent evaluation evidence. No speculative files.

PLAN-EVAL: Selected: implicit-search migration, paired helpers and production hook/navigation acceptance require independent PLAN-EVAL before source changes; workload capped at feature.

## Nine phases

1. Bootstrap: clean clone, fetch, fresh branch from current main.
2. Research: issue, MCP, selected skills/doctrine and existing implementation examined.
3. Plan & Design: locked design recorded above.
4. Plan-Gate: Selected: implicit-search migration, paired helpers and production hook/navigation acceptance require independent PLAN-EVAL before source changes; workload capped at feature.
5. Implement: pending.
6. Gate: pending; raw exit codes to be recorded.
7. Evaluate: pending; independent different-vendor session mandatory.
8. Release: N/A, owner explicitly requires unmerged PRs.
9. Close: pending source delivery and handoff; publication remains owner work.
