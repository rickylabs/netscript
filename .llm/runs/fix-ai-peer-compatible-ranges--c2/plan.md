# Plan

Issue #2036. Archetype: Archetype 2 integration; source dependency tooling. Scope: Keep AI provider and Fresh AI adapter resolutions peer-compatible without consumer overrides. Existing doctrine/debt applies; no new abstraction or package is planned.

Locked decision: Pin the existing qualified AI core/provider family and add an all-admitted-version peer metadata plus cold Deno resolution guard; preserve provider transport and validate production bundling

Gates: structured scoped check/test/lint/fmt; mutation proof for every new regression; cold consumer evidence where dependency resolution changes; quality:scan, arch:check and JSR public/publish audit for changed packages. Runtime gates follow the selected archetype. No release cut or merge.

PLAN-EVAL: N/A: issue and registry evidence fully specify the bounded compatibility contract; exact pins avoid a framework/API upgrade decision

Slices: S1 bootstrap/design; S2 issue-specific implementation and regression/mutation gates; S3 independent review/evaluation evidence.

Risk: published-consumer acceptance depends on a coordinated release containing the fix. Do not claim shipment before that receipt exists. Defer only owner release acceptance, not source behavior or required tests.

Open decisions: none unless findings change the contract; record and obtain PLAN-EVAL before implementing any changed material design.
