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

## Amendment plan remediation (independent FAIL_FIX)

Locked qualified family: core 0.65.0, Anthropic 0.19.5, OpenAI 0.27.0, MCP 0.8.0, Preact 0.19.5; transitive ai-client 0.37.0, openai-base 0.12.4. The preceding patch candidate is selected because the newer core/Preact pair fails default dependency-age qualification. Cold graph resolves one core with no module errors; independently verify peers before PASS. No global age policy change.

Ordered amendment slices (each under 30 files):

1. A1 family manifests: packages/ai/deno.json and packages/fresh/deno.json. Prove declared peer compatibility with registry metadata and frozen package check.
2. A2 graph peer sweep: .llm/tools/deps/check-ai-peers.ts and check-ai-peers_test.ts. Inventory every resolved npm package without a name-prefix assumption; metadata supplies the actual AI core peer. Bound registry subprocess concurrency. Keep exactly-one-core enforcement. Add graph-selection regression; mutations MUST disable graph selection and peer-policy separately, each fail then restored pass. Structured test and cold guard prove this slice.
3. A3 lock refresh: root deno.lock and packages/fresh-ui/deno.lock; update required AI-family graph edges only, preserve unrelated pinned versions. Frozen AI/Fresh/FreshUI checks detect missing graph edges. No new advisory baseline.
4. A4 owned bridge qualification and docs: inspect upgraded upstream APIs used by packages/ai/src/adapters and Fresh AI; edit owning bridge only if required. README/run update. Provider suite and production bundles prove behavior; scoped lint/fmt, quality:scan, arch:check, JSR audits, all-export doc lint and publish dry-runs prove ownership/publishability. Baseline F-7 debt explicitly adjudicated.
5. A5 new independent IMPL-EVAL on final source; original source PASS remains superseded. No merge/publication.

Risk register: API drift across pre-1.0 minor releases -> inspect upstream definitions, adapt owning bridge only, prove provider streaming/tools/usage/abort and production bundles; selective lock drift -> preserve unrelated original records, frozen check both locks and review semantic diff; peer surprises -> optional unchanged peers remain absent unless checks require them, exactly-one-core catches MCP/client dependency divergence; guard cost -> bounded subprocess concurrency and deduplicated exact metadata specifiers, structured one-line result; age policy -> use the default-age-qualified family, no policy bypass; shipment -> owner release and exact published consumer gate remain open.

Open-decision sweep: regression host must resolve now, selected exported graph-inventory helper exercised directly by new regression (existing policy regression retained). Optional peers safe to defer: status-quo absence with frozen checks as detector. Lock refresh mechanism safe to defer: native update plus reviewed selective restoration and frozen checks. API adaptations safe to defer until upstream/source check: only owning adapter files, any public contract change re-audited, material design drift returns to PLAN-EVAL. Version choice settled above; no other material decisions open.

JSR rubric before slices: exported AI/Fresh public contracts remain owned/native; AbortSignal, message/tool/usage port types stay unchanged. Upstream-derived bridge typings/re-exports can change under upgrade, creating private references/slow types or incompatible consumer contracts; all-export deno doc --lint, publish dry-run and audit-jsr-package run for AI/Fresh, and Fresh UI consumer checks/publication where touched. Re-audit any shifted public surface and rescope rather than publish an unqualified break. Existing baseline AI private-type documentation debt is explicitly accepted only by independent evaluator; never declare doc-lint green from a zero combined summary. Native fixture imports and production bundle also check consumer resolution.

## Final review/CI follow-up amendment

Independent amendment PASS remains source-qualified, but later review and full CI found three necessary fixes. B1 standard @std/cli parseArgs accepts --published-version=v and space-separated form, rejects unknown/missing/duplicate values before workspace validation. B2 enumerate version-only metadata for each declared range, then query peerDependencies for every exact release with at most eight registry subprocesses per batch; no combined-field npm output can lose a middle release's peer. Existing cold inventory remains name-independent. B3 update the sole CLI MCP runtime constant and its existing assertions from ^0.3.8 to the qualified exact 0.8.0; existing workspace-mutator test checks the real generated root map matches owning AI manifest for local and JSR modes. No other family/lock/bridge change.

Slices B1-B2 guard + two adjacent regressions, each causal mutation/restored pass; B3 one resolver constant plus existing test assertions. Causal regression fixture includes no-peer first release, incompatible middle and compatible last, proving metadata loss fails. Argument test covers both forms and rejects unsafe fallback cases. Changed source under 10 files. Gates structured guard and CLI selected source/test/lint/fmt, live cold guard, genuine published-negative probes for both argument forms, quality/architecture + carrier freshness. CLI JSR/doc/publish audit baseline qualified. Because generated scaffold output changes, call full one-pass scaffold.runtime --cleanup --format pretty per release-gates, not narrower commands; preserve raw failed gate names if unavailable. e2e-cli-prod post-publish authority remains owner work, no release dispatch. Run only inside owner folder and keep operational runtime output private.

Risks: npm output omission can false-green; exact-release peer queries remove it. Unknown flag or equals spelling can select workspace by accident; standard strict parser removes it. CLI source pin must travel in a coordinated release with the AI family; source version remains unreleased and published-consumer claim stays open. Existing baseline docs remain explicitly adjudicated; any new CLI doc findings fixed. Open decisions none. Targeted PLAN-EVAL hard stop before these source edits.

## Review repair plan
Scope: Rebuild pruned root lock from main, selectively restore the reviewed AI 0.65 graph, retain every main workspace/graph entry and MCP/Zod4 cluster; prove deps checks, frozen install and Fresh UI lock check.. Archetype: existing owning run; bounded repair preserves public contracts. Read harness retrieval order, run-loop, lane-policy, gate matrix and applicable doctrine. Scoped structured check/test/lint/fmt, quality/architecture, owning JSR and publication, dependency and generated-asset freshness gates. PLAN-EVAL: N/A for mechanical merge/repair of already independently reviewed contracts; select PLAN-EVAL if substantive integration decisions emerge. Slices: merge main preserving both intentions; each canonical generator in its own commit; gates; exact-source independent IMPL-EVAL; closeout. No release, merge of PR, or publication.
