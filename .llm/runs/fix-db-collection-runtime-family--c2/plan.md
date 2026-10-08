# Plan

Issue #2039. Archetype: Archetype 2 integration; Fresh frontend overlay, existing Keep shape retained. Scope: Align the supported Collection runtime across SDK query collections, Fresh live queries and durable stream producers. Existing doctrine/debt applies; no new abstraction or package is planned.

Locked decision: Pin qualified DB 0.6.17/react-db 0.1.95/query-db-collection 1.2.1/durable-state 0.3.1 in owning manifests/catalog, guard isolated consumer graphs, prove real worker stream Collection through actual adapter with production SSR, client hydration and teardown; preserve public builder contracts

Gates: structured scoped check/test/lint/fmt; mutation proof for every new regression; cold consumer evidence where dependency resolution changes; quality:scan, arch:check and JSR public/publish audit for changed packages. Runtime gates follow the selected archetype. No release cut or merge.

PLAN-EVAL: Selected: hard stop until independent PLAN-EVAL PASS; multiple owning packages and actual SSR/hydration dependency boundary

Slices: S1 bootstrap/design; S2 issue-specific implementation and regression/mutation gates; S3 independent review/evaluation evidence.

Risk: published-consumer acceptance depends on a coordinated release containing the fix. Do not claim shipment before that receipt exists. Defer only owner release acceptance, not source behavior or required tests.

Open decisions: none unless findings change the contract; record and obtain PLAN-EVAL before implementing any changed material design.
