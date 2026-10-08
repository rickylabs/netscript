# Plan

Issue #2041. Archetype: ARCHETYPE-2-integration + ARCHETYPE-3-runtime-behavior + SCOPE-frontend/native. Scope: Reconnect the existing SDK/Fresh native RPC channel after an actual document reload. Existing doctrine/debt applies; no new abstraction or package is planned.

Locked decision: Capture native document epoch in the existing SDK default binding adapter; Fresh synchronously closes the retired logical port and upgrades a replacement behind one stable physical binding, with stale/final admission guards and strict actual CEF reload proof

Gates: structured scoped check/test/lint/fmt; mutation proof for every new regression; cold consumer evidence where dependency resolution changes; quality:scan, arch:check and JSR public/publish audit for changed packages. Runtime gates follow the selected archetype. No release cut or merge.

PLAN-EVAL: Selected: decision-heavy cross-package native lifecycle/protocol metadata, hard stop until independent PLAN-EVAL PASS; workload capped at feature

Slices: S1 bootstrap/design; S2 issue-specific implementation and regression/mutation gates; S3 independent review/evaluation evidence.

Risk: published-consumer acceptance depends on a coordinated release containing the fix. Do not claim shipment before that receipt exists. Defer only owner release acceptance, not source behavior or required tests.

Open decisions: none unless findings change the contract; record and obtain PLAN-EVAL before implementing any changed material design.
