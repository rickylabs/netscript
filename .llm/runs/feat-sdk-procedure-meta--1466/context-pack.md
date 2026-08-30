# Context pack — #1466 `NetScriptProcedureMeta`

## Current state

- Branch: `feat/sdk-procedure-meta`
- Evaluator head integrated: `1df5ff3e44ff1e5deff899b932b5922040a674e4`
- PLAN-EVAL cycle 2: `PASS`
- Active slice: 1 — contracts vocabulary + builder soundness
- Slice state: cycle-3 docs-site repair content committed at
  `235482767edd8a9793c9d6bf6f766441c51ef313`; attempt-4 receipts recut at that exact content head
- Pre-repair receipts: archived unchanged under `receipts/frozen-c9a391811/` by
  `9649b349cda5372838df20f4f17811d79c77e1e6`
- Current receipt verdict: six PASS, two terminal FAIL (`test`, `public-doc-lint`); explicit named-set
  sufficiency is `INSUFFICIENT`

## Implemented locally

- NetScript-owned authentication and procedure-metadata types with no imports.
- Canonical `BaseContractMeta = NetScriptProcedureMeta & Record<never, never>` in the base builder
  annotation and both route aliases; `BaseContractErrors` remains generic position 3.
- Real-export exact-equality and negative fixtures, runtime metadata storage test, contracts
  assertion-budget scanner, and contracts-side doc-JSON independence test.
- Contracts README and module/JSDoc ownership and additive-compatibility documentation.
- SDK doctest exact-equality guard references public `BaseContractMeta`. The independent T-2 guard
  is now the contracts test's unannotated inference probe over the real
  `oc.$meta<NetScriptProcedureMeta>({}).errors(commonErrorMap)` expression; a temporary perturbed
  expected type produced `TS2344`, then was restored.
- `BaseContractErrors`, `CommonErrorMap`, and `commonErrorMap` are public NetScript-owned adapter
  vocabulary with ownership JSDoc; upstream oRPC types remain unexported per AP-14.
- The complete contracts reference inventory now documents all six branch-added public symbols,
  their NetScript ownership and compatibility rules, and the unsupported runtime mutation of the
  exported `commonErrorMap` singleton.

## Gate state

- PASS receipts at `23548276`: `check`, `lint`, `fmt-check`, `quality-gate`, `arch-check`, and
  `publish-dry-run`.
- FAIL receipt: quiet-load root `test` passed 4248, failed 1, ignored 19. The earlier fd-exhaustion
  failure cleared; the sole residual is the out-of-scope `hybrid-launcher_test.ts` worker-descendant
  cancellation failure. This leaf changes zero `.llm/tools` files.
- FAIL receipt: exact 16-entrypoint `public-doc-lint` reports 12 `private-type-ref` findings. The
  measured comparison is base `13878a80a` = 12, pre-repair `f9056f879` = 14, cycle 1 `3c3f9b7c` =
  13, cycle 2 `bb1a489a` = 12, and cycle 3 `23548276` = 12. The final delta is 0; the terminal
  failure is the repository baseline, not an incremental cost from this slice. See D-1.
- Assertion baselines remain `contract-primitives.ts = 0` and `procedure-meta.ts = 0`.
- Supplemental contracts JSR audit passes with one sanctioned oRPC slow-types INFO; it is outside
  the named eight receipts.
- Supplemental `deno task docs:exports-drift` exits 0 at `23548276`; raw command, exit code, and
  output are preserved in `audit/docs-exports-drift.txt` outside the named eight. D-7 records why
  this branch-sensitive check should be proposed for future contracted gate sets.
- Expensive gates and slice 2 remain NOT RUN.

## Resume point

Tier-A must review the landed cycle-3 docs repair and the two terminal FAIL findings. The root-test
failure is a scoped repository-tooling blocker; public doc lint is baseline-red with zero slice
delta. IMPL-EVAL remains a separate session and has not been run. Do not start slice 2 before slice
1 is signed off.
