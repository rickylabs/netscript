# Plan

Issue #2068. Archetype: ARCHETYPE-2-integration + ARCHETYPE-1-contract. Scope: Fresh AI send retains full native UI/Model messages, data and linked cancellation with one physical subscription. Existing doctrine/debt applies; no new abstraction or package is planned.

Locked decision: One documented owning rich send-input structural union separated from reduced rendering projection; direct unchanged forwarding to existing native transport and existing hub retained, native compile/identity/actual HTTP+SSE proof, no dependency or upstream export changes

Gates: structured scoped check/test/lint/fmt; mutation proof for every new regression; cold consumer evidence where dependency resolution changes; quality:scan, arch:check and JSR public/publish audit for changed packages. Runtime gates follow the selected archetype. No release cut or merge.

PLAN-EVAL: Selected independent PLAN-EVAL PASS against immutable current main 8aad14940c52cd3a4db7efa57d56d50ae131df6c; verify fresh main equality before implementation, feature capped

Slices: S1 bootstrap/design; S2 issue-specific implementation and regression/mutation gates; S3 independent review/evaluation evidence.

Risk: published-consumer acceptance depends on a coordinated release containing the fix. Do not claim shipment before that receipt exists. Defer only owner release acceptance, not source behavior or required tests.

Open decisions: none unless findings change the contract; record and obtain PLAN-EVAL before implementing any changed material design.
