# Binding-repair-eval — plugin-service-auth--1383 (third plan-evaluation turn)

- Evaluator: Muse Spark (`opencode-go/muse-spark-1.3-contributor`), same independent session as rounds 1–2 — not planner family/session (Fable/Anthropic), not coordinator/author (Astra/OpenAI). Both authored this run's composite plan; independence holds against both.
- Authority: `matrix-binding-evaluator.json`, role `plan_evaluation`, tier `complex`, first route `muse_spark_1_3@max`, no fallback. History preserved: `plan-eval.md` (FAIL_FIX) and `plan-eval-2.md` (PASS) untouched; maxRounds/repairInFlight policy applied without reset.
- Reviewed HEAD: `5f9d9393d` (exact; plan.md + amendment-1 + repair-plan stable since). Evaluating `binding-repair-plan.md` as an amendment to the composite plan (rounds 1–2 verdicts stand for their scope).
- Compliance: read-only evaluation. No product edits, commits, GitHub mutations, dispatches, AppHost starts, or releases. Empirical `oc.prefix().router()` probes + `deno doc` only; no runtime rerun. Wrote only this file.

## Defect confirmation (source-backed)

The S5 failure is real and correctly diagnosed. The generated connector assembles `{ version: 'v1', namespace: '<name>' }` [observed - `new-plugin-use-case.ts:710-715`] but passes the **flat** `ContractDefinition` to `createContractAuthorizer` [observed - `new-plugin-use-case.ts:732`]. The assembler nests the implementation as `os.prefix('/v1/<ns>').router(implemented)` under `{ v1: { <ns> } }` plus a flat-under-version compatibility spread [observed - `plugin-contract-binder.ts:137-160`]. The authorizer compiles REST patterns from `route.path` and RPC keys from object-key paths [observed - `contract-authorizer.ts:100-108,172-196`], so it compiled `/api/guarded-fixture` + `/api/rpc/listGuardedFixtures` while the wire serves `/api/v1/<ns>/guarded-fixture` + `/api/rpc/v1/<ns>/listGuardedFixtures` → `no-contract-procedure` deny → 403 on a valid read session. `s5-runtime-finding.json` records exactly this (REST read expected 200 / actual 403; TS2345 direct-router experiment reverted). The binding (`rpcPath`, deprecated-alias remap) was never the mismatch (B4 verified at `create-plugin-service.ts:188-197`).

## Mount-helper verification (empirical, not inferred)

- `oc.prefix('/v1/<ns>').router(flat)` keeps **flat keys** and prefixes route **paths** (probed live: keys `["listGuardedFixtures"]`, path `/v1/gf/guarded-fixture`). Wrapped as `{ [version]: { [namespace]: … } }`, the compiled geometry is: REST pattern `joinPath('/api', '/v1/<ns>/<path>')` = live REST path — MATCH; RPC key `/v1/<ns>/<procedure>` = live RPC relative path — MATCH; deprecated flat alias remaps through the existing binder rule — MATCH (B4). REST uses paths only, RPC uses keys only: no double-prefix hazard (the two channels are separable in the resolver).
- Per-procedure `meta.access` survives `prefix().router()` (probed: `access` block intact on the prefixed procedure); `EnhancedContractRouter<T, Record<never,never>>` merges error maps preserving the plugin contract (B6; `MergedErrorMap<X, Record<never,never>>` assignability probed). `ContractPolicyContract` accepts the nested record shape. No lazy handling needed — contract side has no lazy variant (B5, B7 verified via `deno doc`).
- Validation (non-empty, no `/`) is sufficient: segments flow into object keys (inert) and literal route-path matching (no fs traversal surface).
- Shared coordinates: `PluginContractAssemblyConfig` → `PluginContractMount & { handlers }` is members-identical; all call sites already pass `{ version, namespace, handlers }`. Generated single-constant/two-consumer wiring removes the divergence class by construction. Fail-closed on mismatch (deny-all) is the safe direction; future `assemble`-returns-contract hardening correctly scoped out.
- Alternatives A–E correctly rejected: B/C/D each widen surface or duplicate geometry; E breaks SDK/OpenAPI paths for all core consumers. `contract-base` already depends on `@orpc/contract` (B8) — no new edge. First-party routers unaffected (all `v1/<ns>`, none authorized, S3 public postures stand).

## Boundedness

Within #1383 target 5 (guarded generation): one additive export + one type on `contract-base`, one type-level refactor, test-only `packages/service` change, generator template wiring, unchanged S5 assertions. Deferrals (first-party adoption, #1384, #1382, core metadata, releases) preserved. No weaker generated read test — the probe already asserts SDK `POST /api/rpc/v1/<ns>/<proc>` explicitly and stays unchanged.

## Findings (brief-compliance — two bounded corrections required)

**F1 — receipt handling contradicts the brief.** Plan §5 line 124 says the PASS "receipt **replaces** `s5-runtime-finding.json`". The brief's correction #1 requires preserving `s5-runtime-finding.json` and adding a **separately named** PASS receipt, never overwriting failure. The plan must say `s5-runtime-PASS.json` (or equivalent distinct name), not "replaces".

**F2 — doc-lint baseline comparison unnamed.** The brief's correction #2 requires "no new findings and honest baseline comparison, not an invented whole-package doc-lint PASS" against the 15-finding baseline. The plan requires `doc:lint` as a gate (§4 line 101, §5 line 132) but never names the baseline-compare step (capture before/after counts, assert delta ≤ 0 on the touched surface). The gate command must include the comparison explicitly.

## Verdict

`FAIL_FIX`

Bounded corrections only — the technical repair itself verifies end to end against native source, geometry, types, and the failed S5 acceptance:

1. §5 line 124: write the S5 PASS to a separately named receipt (e.g. `s5-runtime-PASS.json`); preserve `s5-runtime-finding.json` unmodified.
2. §5 gate list: add the explicit doc-lint baseline comparison step (before/after finding counts on `packages/plugin`; PASS requires no new findings vs the 15-finding baseline).

No rescope: the helper, mount geometry, proof set, and sequencing (S5a/S5b → S6 → runtime → IMPL-EVAL) are sound. No owner decision outstanding.

## Limits

Plan-amendment review only. S5 re-run, `scaffold.plugins`/`scaffold.runtime` execution, exact-head CI, and any release/publication are downstream and unclaimed.
