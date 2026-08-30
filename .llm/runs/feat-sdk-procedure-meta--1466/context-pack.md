# Context pack — #1466 `NetScriptProcedureMeta`

## Current state

- Branch: `feat/sdk-procedure-meta`
- Evaluator head integrated: `1df5ff3e44ff1e5deff899b932b5922040a674e4`
- PLAN-EVAL cycle 2: `PASS`
- Active slice: 1 — contracts vocabulary + builder soundness
- Slice state: bounded repair content committed at `3c3f9b7c999d2fa9ec9d31c0b4f455ae890f4b0d`;
  attempt-2 receipts recut at that exact content head
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
- SDK doctest exact-equality guard now references public `BaseContractMeta` and was proven capable
  of failing by a temporary stale expectation (`TS2344`).
- `BaseContractErrors` is now public as a NetScript-owned adapter alias; upstream oRPC types remain
  unexported per AP-14.

## Gate state

- PASS receipts at `3c3f9b7c`: `check`, `lint`, `fmt-check`, `quality-gate`, `arch-check`, and
  `publish-dry-run`.
- FAIL receipt: root `test` passed 4246, failed 2, ignored 19. Failures are outside the leaf:
  `codex-follow_test.ts` hit `Too many open files`, and `hybrid-launcher_test.ts` observed a worker
  descendant surviving cancellation. The focused repaired SDK doctest passed 3/3.
- FAIL receipt: exact 16-entrypoint `public-doc-lint` reports 13 `private-type-ref` findings. The
  measured comparison is base `13878a80a` = 12, pre-repair `f9056f879` = 14, repaired `3c3f9b7c` =
  13. Fresh alias findings for `MergedErrorMap` and `commonErrorMap` leave delta +1; see D-1.
- Supplemental contracts JSR audit passes with one sanctioned oRPC slow-types INFO; it is outside
  the named eight receipts.
- Expensive gates and slice 2 remain NOT RUN.

## Resume point

Tier-A must review the landed repair and the two terminal FAIL findings. IMPL-EVAL remains a separate
session and has not been run. Do not start slice 2 before slice 1 is signed off.
