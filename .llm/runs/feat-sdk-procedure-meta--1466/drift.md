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

Cycle 1 did not fully match that expectation. Its exact 16-entrypoint argv reported 13 findings:
exporting `BaseContractErrors` cleared its three consumer references, but the now-public alias
introduced two findings, one for upstream `MergedErrorMap` and one for the private `commonErrorMap`
value used through `typeof`. That reduced the pre-repair slice head from 14 to 13 but left a +1
incremental cost versus the 12-finding base.

Cycle 2 was authorized to correct the NetScript-owned half of that boundary. `commonErrorMap` now
has a public NetScript-owned `CommonErrorMap` contract, and both are exported with ownership JSDoc.
The alias describes its six `data` fields with the existing public NetScript error vocabulary and
`ContractObjectSchema`; it does not expose the private lower-case schema constants. The exact
16-entrypoint argv at content head `bb1a489ace2c162c1caca065fc2762d7807330d0` reports 12 findings.
The measured sequence is therefore: base `13878a80a` = 12, pre-repair `f9056f879` = 14, cycle 1
`3c3f9b7c` = 13, cycle 2 `bb1a489a` = 12. The final incremental cost is 0.

The package JSR audit separately recognizes this exact boundary and reports its slow-types check as
INFO because `@netscript/contracts` is on the doctrine's sanctioned oRPC slow-types allowlist. That
sanction does not affect `deno doc --lint` exit status or the `public-doc-lint` catalog gate.

### Impact

The honest final `public-doc-lint-final.json` remains terminal FAIL because the repository baseline
itself is 12 findings, but this bounded repair adds no findings relative to it. The final twelve
include the permitted residual references from `baseContract` to upstream `ContractBuilder` and
`Schema`, and from `BaseContractErrors` to upstream `MergedErrorMap`; the other nine are unchanged
baseline findings outside this leaf. Generic position 3, exact metadata position 4, and the #1350
error-channel guarantee remain intact. Re-exporting `ContractBuilder`, `Schema`, or
`MergedErrorMap` would violate AP-14 and was not done.

### Decision required

The unchanged contracted public-doc-lint gate is recut as a terminal FAIL receipt, with the exact
base/pre-repair/cycle-1/cycle-2 finding counts recorded beside it. Receipt sufficiency remains an
honest mechanical result. Tier-A and separate-session IMPL-EVAL own final sign-off; this
implementation lane does not self-certify.

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

## D-3 — base reconciliation is inert for the repaired surface

- Date: 2026-08-30
- Slice: 1 repair
- Severity: informational
- Status: reconciled; no rebase or merge performed

The fixed plan base is `21d516224fe35e92957f0998ee848bbf2024eda0`; current `origin/main` is
`13878a80a`, three commits ahead. The coordinator measured both the commit log and diff for
`packages/contracts` plus `packages/sdk` as empty across that range. The drift is therefore inert
for this repair, and holding the base fixed preserves comparability between the pre-repair and
attempt-2 receipts. No rebase or merge of `main` was performed.

## D-4 — attempt-1 archive and attempt-2 receipt recut

- Date: 2026-08-30
- Slice: 1 repair
- Severity: operational
- Status: landed for Tier-A review

Commit `9649b349cda5372838df20f4f17811d79c77e1e6` moved the eight attempt-1
receipts unchanged to `receipts/frozen-c9a391811/`. They remain append-only terminal evidence for
pre-repair head `c9a391811` and are not current proof.

After repair commit `3c3f9b7c999d2fa9ec9d31c0b4f455ae890f4b0d`, all eight contracted paths were
recut through `run-gate.ts` with `--attempt 2`. Every receipt records
`gitHead == actualGitHead == 3c3f9b7c999d2fa9ec9d31c0b4f455ae890f4b0d`; gate IDs and invocation IDs
are unique. Six receipts PASS. `public-doc-lint` is terminal FAIL with the 13-finding measurement in
D-1. `test` is terminal FAIL after 4246 passed / 2 failed / 19 ignored because two out-of-scope
agentic-tooling tests failed (`Too many open files` in `codex-follow_test.ts`; a surviving worker
descendant in `hybrid-launcher_test.ts`). The focused SDK doctest passes 3/3, so the original
`TS2344` repair is cleared even though the root catalog test receipt is red.

Sufficiency recomputed over the eight explicit files is **INSUFFICIENT** solely because those two
receipts did not pass. The supplemental contracts JSR audit passes with one sanctioned oRPC
slow-types INFO and is explicitly excluded from the named set.

## D-5 — annotation-derived exactness guards were tautological

- Date: 2026-08-30
- Slice: 1 repair, cycle 2
- Severity: significant
- Status: corrected with an inferred upstream probe

The cycle-1 SDK doctest and the pre-existing contracts fixture derived a builder field from an
explicit `ContractBuilder<..., BaseContractErrors, BaseContractMeta>` annotation and compared that
field to the same annotation argument. That equality can fail when the two written types differ,
but it cannot detect a divergent initializer because the annotation absorbs the initializer's
inferred type. It therefore did not independently pin T-2 against an oRPC inference change.

`packages/contracts/tests/procedure-meta-inference_test.ts` now constructs the same
`oc.$meta<NetScriptProcedureMeta>({}).errors(commonErrorMap)` expression without an annotation. It
compares the inferred `~orpc.meta` to public `BaseContractMeta` and the inferred `~orpc.errorMap` to
public `BaseContractErrors` with exact `Equal<>` assertions. The test imports `commonErrorMap` from
the internal application module because inference must use the actual error-map value; it remains
under the contracted root `test` gate.

A temporary perturbation of the expected metadata type to `Record<never, never>` produced
`TS2344: Type 'false' does not satisfy the constraint 'true'` at the inferred-meta assertion. The
perturbation was restored before commit. This inferred probe, rather than the explicit annotation,
now supplies the independent T-2 pin. The working `.meta(publicMeta)` check, both negative
`@ts-expect-error` checks, and runtime metadata-storage assertions were not changed.

## D-6 — cycle-2 quiet-load root test retains one out-of-scope tooling failure

- Date: 2026-08-30
- Slice: 1 repair, cycle 2
- Severity: operational
- Status: scoped blocker recorded; no tooling change attempted

The attempt-3 root `test` gate was run serially at immutable content head `bb1a489a`, with no other
gate from this lane running. It completed with 4248 passed, 1 failed, and 19 ignored. The earlier
`Deno.watchFs` / `Too many open files` failure did not recur. The sole remaining failure is
`.llm/tools/agentic/claude/hybrid-launcher_test.ts` observing a worker descendant that survived
cancellation. This slice changes zero files under `.llm/tools`, so the terminal FAIL is preserved as
an out-of-scope repository-tooling blocker rather than skipped, narrowed, or repaired here.

All eight contracted receipts were recut serially with `--attempt 3`. Every receipt records
`gitHead == actualGitHead == bb1a489ace2c162c1caca065fc2762d7807330d0`; all gate IDs and invocation
IDs are unique. Six PASS, while root `test` and the baseline-red `public-doc-lint` are terminal FAIL.
Exact-file sufficiency is therefore **INSUFFICIENT** for those two reasons only.

## D-7 — the contracted receipt set was blind to branch-owned docs-site export drift

- Date: 2026-08-30
- Slice: 1 repair, cycle 3
- Severity: significant
- Status: branch drift repaired; gate-set change proposed for coordinator / IMPL-EVAL ruling

The `Deploy docs site to Pages` workflow ran `deno task docs:exports-drift` and correctly rejected
the contracts reference page's complete-inventory declaration. The page omitted six public symbols
introduced by this branch: `commonErrorMap`, `BaseContractErrors`, `BaseContractMeta`,
`CommonErrorMap`, `NetScriptAuthenticationRequirement`, and `NetScriptProcedureMeta`.

Attribution is unambiguous. The task exits 0 on `origin/main` at `13878a80a`, but failed on every
measured branch head: `c9a391811`, `f9056f879`, `b4157a9d`, and `c2ae8c425`. Three omissions existed
from the first slice-1 content commit, while the other three followed the bounded adapter repair.
This was branch-owned public-documentation drift, not the host-zombie or public-doc-lint baseline.

The PLAN-EVAL-approved eight-receipt set includes `public-doc-lint`, which is already red on main
and cannot distinguish this regression. It excludes `docs:exports-drift`, which is green on main
and precisely detected the branch's public-surface/documentation mismatch. The evidence design was
therefore structurally blind to the branch-owned check that worked, allowing four branch heads to
carry the regression without a named receipt signaling it.

Cycle 3 documents all six symbols in the complete contracts inventory. The metadata entries state
NetScript ownership and the additive-optional-readonly compatibility rule. The error-map entries
state that codes, HTTP statuses, message literals, and data schemas are stable contract, and that
mutating the exported `commonErrorMap` singleton is unsupported even though JavaScript can do so at
runtime. `deno task docs:exports-drift` exits 0 at content head
`235482767edd8a9793c9d6bf6f766441c51ef313`; the raw command, exit code, and output are preserved in
`audit/docs-exports-drift.txt` as supplemental evidence outside the named eight.

### Proposal — not a plan amendment

Add a distinct `docs-exports-drift` gate to future contracted evidence sets whenever a slice changes
a package's published surface, and require it at the immutable content head. This implementation
thread does not amend the approved plan or add a catalog entry. IMPL-EVAL and the coordinator own
the decision.
