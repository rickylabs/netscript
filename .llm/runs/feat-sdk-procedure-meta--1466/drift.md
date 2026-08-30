# Drift — #1466 `NetScriptProcedureMeta`

## D-1 — full public doc-lint cannot satisfy the approved receipt contract

- Date: 2026-08-30
- Slice: 1 — contracts vocabulary + builder soundness
- Severity: significant
- Status: open; blocks slice-1 sign-off

### Planned

`plan.md` contracts slice 1 requires contracts doc lint, and the final eight-receipt set requires a
PASS `public-doc-lint` receipt from `deno doc --lint` over every contracts and SDK export
entrypoint.

### Observed

After fixing the only new `missing-jsdoc` diagnostic, the exact full-export command
`deno task doc:lint --root packages/contracts --pretty` exits 1 with 11 `private-type-ref`
diagnostics and no other diagnostics. Ten arise from the real oRPC builder types exposed by
`contract-primitives.ts`; one is the existing CRUD oRPC reference. `deno doc --lint --private` also
exits 1, so Deno provides no flag that converts this class to a passing doc-lint verdict.

The package JSR audit separately recognizes this exact boundary and reports its slow-types check as
INFO because `@netscript/contracts` is on the doctrine's sanctioned oRPC slow-types allowlist. That
sanction does not affect `deno doc --lint` exit status or the `public-doc-lint` catalog gate.

### Impact

The implementation can satisfy the product/type contract, but the approved final receipt set cannot
be SUFFICIENT: `public-doc-lint-final.json` would be a terminal FAIL receipt. Re-exporting oRPC
types, erasing the builder types, adding an assertion, or changing generic position 3 would violate
the binding plan and the #1350 error-channel guarantee, so none was attempted.

### Decision required

The coordinator/evaluator must rule how the sanctioned oRPC slow-type baseline is represented in the
named evidence set—for example, by a catalog-level allowlisted doc-lint wrapper or an explicit
revision of the contracted gate. The implementation leaf will not silently weaken, rename, or omit
`public-doc-lint`.

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
