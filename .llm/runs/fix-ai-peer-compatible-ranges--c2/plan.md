# Plan

Issue #2036. Archetype: Archetype 2 integration; source dependency tooling. Scope: Keep AI provider and Fresh AI adapter resolutions peer-compatible without consumer overrides. Existing doctrine/debt applies; no new abstraction or package is planned.

Locked decision: Pin the existing qualified AI core/provider family and add an all-admitted-version peer metadata plus cold Deno resolution guard; preserve provider transport and validate production bundling

Gates: structured scoped check/test/lint/fmt; mutation proof for every new regression; cold consumer evidence where dependency resolution changes; quality:scan, arch:check and JSR public/publish audit for changed packages. Runtime gates follow the selected archetype. No release cut or merge.

PLAN-EVAL: N/A: issue and registry evidence fully specify the bounded compatibility contract; exact pins avoid a framework/API upgrade decision

Slices: S1 bootstrap/design; S2 issue-specific implementation and regression/mutation gates; S3 independent review/evaluation evidence.

Risk: published-consumer acceptance depends on a coordinated release containing the fix. Do not claim shipment before that receipt exists. Defer only owner release acceptance, not source behavior or required tests.

Open decisions: none unless findings change the contract; record and obtain PLAN-EVAL before implementing any changed material design.

# AI peer correction plan

CI reveals Fresh UI private lock stale after manifest changes and reports @tanstack/openai-base@0.10.16 peer ^0.59.0 against core 0.52.3. The first guard wrongly selected only @tanstack/ai-* packages, omitting openai-base. The first source PASS is superseded for final scope.

Use the latest exact peer-coherent family: core 0.65.1, Anthropic 0.19.5, OpenAI 0.27.0, MCP 0.8.0 (its actual core dependency ^0.65.0), Preact 0.20.0. Transitive openai-base 0.12.4 peers ^0.65.0, ai-client 0.38.0 aligns. Inspect public upstream API through package source; adapt only owning bridge if changed. Provider behavior regressions must still pass; no release claims. Pins alone cannot freeze future transitive patches, so live guard examines every npm package with an AI core peer, independent of name prefix, plus enforces exactly one core. Add the missing transitive package regression to existing meaningful policy test or new graph-selection regression, with causal mutations.

Refresh root and Fresh UI private lock only required graph edges and preserve unrelated versions where native update refreshes metadata; do not accept new advisory baseline. Run both frozen provider/Fresh/FreshUI checks after selective refresh, provider suite, production bundles, all required quality/JSR/publish gates. Update documented family and guard description. Independent PLAN-EVAL required because this amendment upgrades multiple upstream APIs. After PASS implement, then a new independent IMPL-EVAL on final source. Refs #2036 until a fixed published consumer exists.

Qualification update before implementation: default Deno dependency-age policy rejects newly-published core 0.65.1 and Preact 0.20.0. The cold graph for core 0.65.0 / Anthropic 0.19.5 / OpenAI 0.27.0 / MCP 0.8.0 / Preact 0.19.5 resolves one core, no unresolved modules, under the unchanged default age policy. Select that exact family; transitive ai-client 0.37.0 and openai-base 0.12.4 align. Preserve the policy; do not disable it. The independent evaluator should adjudicate this qualified candidate before source implementation. Evidence retained privately.
