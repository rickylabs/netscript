# Context pack — #1466 `NetScriptProcedureMeta`

**Read this first, then the tail of `worklog.md`, both cycles in `evaluate.md`, and `drift.md`.**
This file was rewritten for the slice-2 Tier-A handoff so a resumer does not mistake the slice-1
state for the current branch state.

## Current state

| Field | Value |
| --- | --- |
| Branch | `feat/sdk-procedure-meta`, PR **#1731**, OPEN **draft** |
| Slice-2 content head | **`2863d29e342b135de9e9c41c0508a5032c98261f`** |
| Evidence head | The evidence-only commit containing this context pack; resolve with `git rev-parse HEAD` |
| Base | `21d516224`; no rebase and no force-push |
| PLAN-EVAL | cycle 2 `PASS` |
| Slice-1 IMPL-EVAL | cycle 2 **`PASS`**; its evidence and archives are frozen |
| Current stop | **Slice 2 complete; stop for supervisor Tier-A** |
| Issue reference | **`Refs #1466` — partial.** No closing keyword until all three slices and the close-gate pass. |

## Slice state

- **S1 Contracts vocabulary + builder soundness — COMPLETE**, separate-session IMPL-EVAL `PASS`.
- **S2 SDK declaration propagation plus G-1 — IMPLEMENTED AND EVIDENCED**, awaiting supervisor
  Tier-A. Direct client, `defineServices` client, and query declarations retain exact metadata and
  exact error literals without a metadata-boundary assertion or `any`.
- **S3 Publish and compatibility evidence plus G-4 — NOT RUN.** Do not edit the `CommonErrorMap`
  docs row or `{@link commonErrorMap}` JSDoc before that slice.
- After S3: final all-slices separate-session IMPL-EVAL and the close-gate.

## Slice-2 implementation

- `ProcedureMetaFromNode<TNode>` structurally extracts `~orpc.meta`, with an empty-record fallback.
- `ProcedureMeta<TContract, TAction>` mirrors the existing input/output extractors.
- `ActionMethod` carries an optional readonly `__netscriptProcedureMeta` type marker. It changes
  declarations only and adds no runtime interpretation.
- The new types are physically exported only through the locked `./ports` and `./query` files.
  D-32 records that the existing root star barrel makes `ProcedureMeta` transitively root-visible;
  the out-of-ceiling root barrel was not edited.
- A real-export fixture imports only `@netscript/contracts`, `@netscript/sdk`,
  `@netscript/sdk/ports`, and `@netscript/sdk/query`. It pins exact direct-client, generated-client,
  and query-marker metadata plus exact error-code, status, message, and data literals.
- SDK assertion budgets and doc-JSON independence are executable tests. SDK source has no new
  `@netscript/contracts` dependency and no mapped declaration file was needed.
- `packages/sdk/README.md` documents metadata preservation and keeps the SDK reference's
  entrypoint-only inventory complete.

## G-1 repair

The contracts assertion-budget pin is now statement-bounded at the `export const baseContract`
declaration. Its `[^=;]+?` span cannot cross a divergent declaration into a later dead decoy.

The exact evaluator forgery was reproduced: B2 plus the `_legacyBase` dead decoy left focused check
and lint green while the pin failed 4/1. B2 alone also failed 4/1. After restoration the pin passed
5/5 and `packages/contracts/src/application/contract-primitives.ts` has no diff. See
`audit/g1-declaration-pin-slice2.txt` and D-31. G-4 was not touched.

## Evidence at the immutable content head

The previous top-level receipt set was moved byte-for-byte into the append-only
`receipts/frozen-42874803/` archive before recutting. All eight current receipts explicitly attest
`gitHead == actualGitHead == 2863d29e342b135de9e9c41c0508a5032c98261f`, attempt 8, with unique gate
and invocation IDs.

| Receipt | Outcome |
| --- | --- |
| `check-final.json` | PASS |
| `lint-final.json` | PASS |
| `fmt-check-final.json` | PASS |
| `test-final.json` | PASS — 4258 passed / 0 failed / 19 ignored |
| `public-doc-lint-final.json` | FAIL — expected baseline-red, exactly the unchanged R-1 set of 12 |
| `quality-gate-final.json` | PASS |
| `arch-check-final.json` | PASS |
| `publish-dry-run-final.json` | PASS |

Mechanical sufficiency over those eight literal files only is **INSUFFICIENT for exactly one
reason**: `public-doc-lint did not pass (FAIL)`. That gate is baseline-red on `main`; the acceptance
bar is delta 0 and set identity, not a fabricated green receipt. The exact 12-pair comparison is in
`audit/public-doc-lint-slice2.txt`.

Named supplemental evidence at the same content head:

- `docs:exports-drift` PASS; SDK `entrypoints-only`, zero omitted symbol groups.
- Focused SDK suite PASS, 78 passed / 0 failed.
- G-1 committed-state pin PASS 5/5, with both required red perturbation demonstrations recorded.

## Frozen rulings and boundaries

- `commonErrorMap` stays private. Do not export it or upstream oRPC types to move doc-lint.
- Public doc lint must remain the exact R-1 set of 12.
- Frozen receipt archives are append-only. Never edit, replace, or delete them.
- `deno.lock` is unchanged. Do not reload caches or delete locks/caches.
- No runtime lease was held: no E2E, Aspire, Docker, or browser gate was run.
- PR #1731 remains draft and partial. No ready flip, merge, label/milestone/body mutation, issue
  closure, acceptance-box tick, or closing keyword is authorized.

## Resume point

1. Verify local, remote, and PR heads independently.
2. Review slice 2 at the Tier-A stop; do not redo slice 1 or recut its evidence.
3. If Tier-A accepts slice 2, dispatch slice 3 with its own content head and evidence set; G-4 belongs
   there.
4. After slice 3, run the final separate-session all-slices IMPL-EVAL and close-gate.

The mandatory structured slice-2 PR comment is posted after the evidence commit is pushed by
explicit refspec. If resuming after a transport interruption, verify the comment exists before
dispatching the next lane.
