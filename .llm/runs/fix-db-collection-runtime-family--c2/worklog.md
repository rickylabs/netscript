# Worklog

## Design

Public surface and domain: Pin qualified DB 0.6.17/react-db 0.1.95/query-db-collection 1.2.1/durable-state 0.3.1 in owning manifests/catalog, guard isolated consumer graphs, prove real worker stream Collection through actual adapter with production SSR, client hydration and teardown; preserve public builder contracts

Ports: preserve existing owning package contracts. Constants: existing finite vocabulary; additional values only when needed by the issue. Contributor path: extend existing implementation and adjacent regressions.

Commit slices: bootstrap plan, source/test/mutation evidence, independent evaluation evidence. No speculative files.

PLAN-EVAL: Selected: hard stop until independent PLAN-EVAL PASS; multiple owning packages and actual SSR/hydration dependency boundary

## Nine phases

1. Bootstrap: clean clone, fetch, fresh branch from current main.
2. Research: issue, MCP, selected skills/doctrine and existing implementation examined.
3. Plan & Design: locked design recorded above.
4. Plan-Gate: Selected: hard stop until independent PLAN-EVAL PASS; multiple owning packages and actual SSR/hydration dependency boundary
5. Implement: pending.
6. Gate: pending; raw exit codes to be recorded.
7. Evaluate: pending; independent different-vendor session mandatory.
8. Release: N/A, owner explicitly requires unmerged PRs.
9. Close: pending source delivery and handoff; publication remains owner work.

## Design details

Public surface: unchanged SDK collection and Fresh query/factory APIs; additive optional native StreamDB preload/close on existing owned handle. Domain vocabulary: exact supported DB family and complete resolved npm identity; worker execution schema fixture; source Collection/subscriber lifecycle. Ports: existing NetScriptStreamDB and SDK query client/collection only; no new ports/classes/packages. Constants: supported versions only in owning manifests/catalog, test fixture witnesses qualified immutable family. Slices/files/gates locked in plan D1-D4/S2-S5. Contributor path: owning manifest update -> cold guard -> adjacent factory integration and production fixture -> independent source/publication consumer qualification. Deferred: coordinated release and exact published consumer, no source regression deferred. PLAN-EVAL selected and hard stop before any source implementation.

Gate `baseline-doc-sdk`: raw exit `1`. Command: `deno task doc:lint --root packages/sdk`. Full raw output retained privately.

Gate `baseline-doc-fresh`: raw exit `1`. Command: `deno task doc:lint --root packages/fresh`. Full raw output retained privately.

Phase 4 Plan-Gate complete: independent GLM max PLAN-EVAL PASS at 3ecd0c25729c5cc98dee3ebca2b9daf24781caea; mandatory hard stop satisfied before source. Refined S2-S5 authoritative. Phase 5 implementation begins after evaluator termination.
