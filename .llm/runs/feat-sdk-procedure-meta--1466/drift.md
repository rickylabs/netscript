# Drift — #1466 `NetScriptProcedureMeta`

## D-1 — full public doc-lint was already red on the base; slice must add no findings

- Date: 2026-08-30
- Slice: 1 — contracts vocabulary + builder soundness
- Severity: significant
- Status: corrected after base-vs-head reconciliation; terminal repository-baseline FAIL remains

### Planned

`plan.md` contracts slice 1 requires contracts doc lint, and the final eight-receipt set described a
PASS `public-doc-lint` receipt from `deno doc --lint` over every contracts and SDK export
entrypoint. The earlier D-1 analysis incorrectly treated the slice head as the baseline and
therefore attributed the repository's existing doc-lint debt to this slice.

### Observed

The coordinator re-ran the exact contracted 16-entrypoint `deno doc --lint` argv on both immutable
heads. `origin/main` at `13878a80a` reports 12 `private-type-ref` findings; slice head `f9056f879`
reports 14. The +2 incremental cost is one changed declaration: the base annotated
`baseContract` as `ReturnType<typeof oc.errors<...>>` (one finding for private `oc`), while slice 1's
explicit `ContractBuilder<Schema, Schema, BaseContractErrors, BaseContractMeta>` annotation reports
three private names (`ContractBuilder`, `Schema`, and `BaseContractErrors`).

`BaseContractErrors` is a NetScript-owned exported alias that was omitted from the public entrypoint.
Publishing that alias is the bounded repair: it clears the new finding and the two pre-existing
findings where `BaseContractRoute` / `BaseContractOutputRoute` already reference it. `ContractBuilder`
and `Schema` remain upstream oRPC types and are not re-exported under AP-14.

The repaired-head measurement did not fully match that expectation. The exact 16-entrypoint argv
reports 13 findings: exporting `BaseContractErrors` clears its three consumer references, but the
now-public alias itself introduces two findings, one for upstream `MergedErrorMap` and one for the
private `commonErrorMap` value used through `typeof`. Net change from the 14-finding slice head is
-1; incremental cost versus the 12-finding base is therefore +1. The brief explicitly bounds this
lane to reporting a fresh `MergedErrorMap` finding rather than chasing it further, so the residual
is left for Tier-A/evaluator disposition.

The package JSR audit separately recognizes this exact boundary and reports its slow-types check as
INFO because `@netscript/contracts` is on the doctrine's sanctioned oRPC slow-types allowlist. That
sanction does not affect `deno doc --lint` exit status or the `public-doc-lint` catalog gate.

### Impact

The honest final `public-doc-lint-final.json` remains terminal FAIL because the repository baseline
is already red, and this bounded repair leaves a measured +1 incremental `private-type-ref` cost.
Generic position 3, exact metadata position 4, and the #1350 error-channel guarantee remain intact.
Re-exporting `ContractBuilder`, `Schema`, or `MergedErrorMap` would violate AP-14 and is prohibited;
changing the alias representation or exposing `commonErrorMap` is outside this repair.

### Decision required

Recut the unchanged contracted public-doc-lint gate as a terminal FAIL receipt, record the exact
base-vs-repaired-head finding counts beside it, and recompute receipt sufficiency honestly. Tier-A
and separate-session IMPL-EVAL own the final sign-off; this implementation lane does not
self-certify.

## D-2 — NAS migration preserves the terminal receipt set before repair

- Date: 2026-08-30
- Slice: 1 — contracts vocabulary + builder soundness
- Severity: operational
- Status: checkpointed

The current host is being replaced after the immutable implementation commit and receipt run but
before the bounded repair and Tier-A sign-off. The eight exact-head JSON receipts are therefore
committed and pushed even though three are terminal FAIL receipts. This is evidence preservation,
not a gate waiver or self-certification. The NAS resume must regenerate the receipts after repair;
it must not treat the preserved red set as current proof.
