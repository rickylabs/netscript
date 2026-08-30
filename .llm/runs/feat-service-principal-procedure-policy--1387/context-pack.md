# Context Pack: #1387 typed principal and procedure policy

## Run Metadata

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| Run ID         | `feat-service-principal-procedure-policy--1387` |
| Branch         | `feat/service-principal-procedure-policy`       |
| Current phase  | `impl` — Slice 7 evidence complete; awaiting Tier-A review |
| Archetype      | contracts: 1; service/plugin: 4                 |
| Scope overlays | `SCOPE-service` plus package doctrine           |

## Current State

PLAN-EVAL cycle 1 accepted LD-8 and LD-11 and returned `FAIL_PLAN` only for five bounded gate-set,
ceiling, and text corrections. Those corrections were committed separately without changing the
accepted design. Slice 1 then extended the existing `NetScriptProcedureMeta.access` vocabulary with
optional readonly `authorization.scopes` and `authorization.roles`, plus its contracts/SDK type and
runtime-independence proofs.

Slices 1–6 are each Tier-A **ACCEPTED** (Slice 1 at `2ddd6048`, Slice 2 at `f9b32b4f7` with a D-4
ceiling amendment mid-slice, Slice 3 at `c297064aa` after two rescope stops (D-7, D-8) that traced to
supervisor-brief errors rather than author defects, Slice 4 at `9cc8c4c5f`, Slice 5 at `c2cbfbf0b`
after a D-9 ceiling amendment for its export surface, Slice 6 at `11e83f064`). Every slice has a
separate opposite-family IMPL-EVAL verdict; Slice 3 carries two independent concurring verdicts
(Opus 5 and DeepSeek V4 Flash 0731) under a coordinator-authorized routing deviation, Slices 5 and 6
were evaluated by DeepSeek after the native route hit an account-wide monthly spend limit — all
recorded in the topic supervisor's ledger, not here.

Slice 7 is now implemented at immutable content head `897a06cd7170ca021da1836b3cbcbf790cf97a2f`
with a `SUFFICIENT` eight-receipt evidence set. It publishes a credential-free bounded
`OperationAccessSummary`, adds the same optional `access` field to the list/detail result types and
MCP schemas, and exports the type from `./openapi-projection`. Neither flow populates access data and
the existing generic `authNote` is unchanged. Slice 7 remains at its Tier-A boundary awaiting
substantive supervisor review; this author has not self-certified it and has not started Slice 8.

**Resume-docs gap, recurring — this file was not the only casualty.** First flagged as F-1 by the
Slice 4 IMPL-EVAL (this file and `worklog.md` frozen after Slice 1); the same class recurred and was
flagged again by the Slice 6 IMPL-EVAL (frozen at "Slice 5 awaiting Tier-A" after Slice 6 had already
landed and been accepted). Both times the gap was in the evidence, not the record — commit trail and
per-slice Tier-A documents stayed current — but a fresh session trusting only this file would have
been materially misled about run position twice now. **Update this file at every Tier-A
certification, not only when an author happens to.**

## Completed

- Re-verified the merged #1466 metadata exports and shape against the research after S0.
- Repaired all five PLAN-EVAL findings in the bounded artifact locations.
- Probed `check:agent-docs-prose` at base and contracted all generated carriers at their staling
  slices and final readiness.
- Added the Slice 1 metadata shape to the one existing contract vocabulary; no enforcement or second
  policy vocabulary was introduced.
- Proved runtime metadata storage, readonly authorization arrays, rejection of a parallel `public`
  policy, SDK propagation through a renamed procedure, and absence of the old SDK procedure key.
- Cut and verified the named durable receipts at the immutable content head, including command
  arguments, duration, and work-bearing output.
- Proved `deno.lock` byte-identical and every named generated carrier unchanged.
- Implemented Slice 5 contract traversal, REST/RPC/alias matching, LD-6 fallback precedence,
  scope/role decisions, and construction-time optional-auth rejection.
- Bound one resolver into both middleware stages from the builder's effective RPC wiring options;
  standalone scope authorizers now expose match-aware composition without losing `AuthorizerPort`
  compatibility.
- Implemented Slice 6: `createOpenAPISpec` post-processes generated operations via oRPC's public
  `traverseContractProcedures`, projecting LD-9's exact security mapping (none/required/optional)
  while preserving every user-supplied operation field.
- Implemented Slice 7's type/schema contract only: optional list/detail `access` fields share one
  bounded `OperationAccessSummary`; a typed schema example proves literal construction while both
  flows continue to omit the field.
- Regenerated the MCP export corpus under its standing exemption; it moved from 7,654 to 7,655
  symbols with the expected new type and widened list/detail signatures.
- Regenerated the ceiling-exempt MCP export corpus at Slice 5 through its checked-in generator; it
  grew by only the two expected public `createContractAuthorizer` entries, then stayed unchanged at
  Slice 6 (a runtime-behavior-only change, no new exported signature).

## Next Steps

1. Supervisor performs substantive Tier-A review of Slice 7 and records the separate-session
   evaluator outcome outside this author lane.
2. Only after that release, continue Slices 8–9, each with its own Tier-A review and separate
   opposite-family IMPL-EVAL.
3. The owner amends #1387's compile-time router-rename acceptance line before the final close-gate;
   the implementation PR must state the accepted substitution.
4. Keep `Refs #1387` partial and preserve an empty live closing-issue set until the full leaf and
   close-gate are complete.
5. At the leaf's own pre-merge/close-gate boundary, fold in whatever `main` has advanced to by then
   in one regeneration pass — the topic supervisor's ledger tracks each intervening main advance and
   has so far found no product-path intersection requiring earlier action.

## Open follow-ups filed off this run (not slice work)

| Issue | What | Why deferred |
| --- | --- | --- |
| #1787 | `ServiceBuilder`'s `TCustom` is a phantom type parameter | Fix needs a consumer position on `service-builder.ts` (Slice 2's ceiling only); makes the parameter invariant — a breaking change, plan-level decision |
| #1789 | No `build()`-level RPC test exercises the real context wiring; `withContext` drops class-instance prototypes | Pre-existing test-coverage gap and an undocumented constraint, both outside Slice 3's ceiling |

## Key Decisions

| Decision                         | Source                  | Rule                                                                 |
| -------------------------------- | ----------------------- | -------------------------------------------------------------------- |
| One additive metadata vocabulary | Plan LD-1/LD-2, Slice 1 | `access.authorization` only; never add a parallel procedure policy   |
| Service owns principal/context   | Doctrine, plan LD-3     | Plugin re-exports public service types                               |
| Opt-in enforcement               | Migration census, LD-5  | Existing consumers and scaffolds remain unchanged                    |
| Contract wins over fallback      | Plan LD-6/LD-7          | One resolver informs authentication and authorization                |
| Optional fails at construction   | Accepted LD-8           | Reject during `createContractAuthorizer()` construction              |
| Rename proof substitution        | Accepted LD-11          | Metadata follows the procedure; the old SDK key must fail type-check |

## Slice 1 Product Ceiling

All product edits stayed inside the six-file ceiling:

- `packages/contracts/src/domain/procedure-meta.ts`
- `packages/contracts/tests/procedure-meta_test.ts`
- `packages/contracts/tests/procedure-meta-independence_test.ts`
- `packages/contracts/tests/type-fixtures/procedure-meta_type.ts`
- `packages/sdk/tests/procedure-meta-independence_test.ts`
- `packages/sdk/tests/type-fixtures/procedure-meta_type.ts`

## Gates

| Gate                      | Slice 5 result                            | Slice 6 result                                  |
| ------------------------- | ------------------------------------------ | ------------------------------------------------ |
| Scoped check/lint/fmt     | PASS, 48 files, zero findings              | PASS, 48 files, zero findings                    |
| Service tests             | PASS, 101/101                              | PASS, 102/102                                    |
| Quality gate              | PASS                                       | PASS                                              |
| Service JSR audit         | PASS; one sanctioned oRPC slow-type info   | PASS (via `publish:dry-run`; direct-audit receipt is convention-only, no catalog entry — see Drift) |
| Publish dry run           | PASS                                       | PASS, 30,619 ms                                  |
| MCP export corpus         | PASS; 7,654 symbols, two new entries       | PASS; 7,654 symbols, **unchanged** (runtime-only change, no new signature) |
| Lock                      | PASS, byte-identical                       | PASS, byte-identical                             |
| E2E/Aspire/Docker/browser | NOT_RUN, no lease                          | NOT_RUN, no lease                                |

Slice 5: `receipts/evidence-set.json` at content `c2cbfbf0b3c355682732be5805f0f180498576db`,
SUFFICIENT, 7 receipts. Slice 6: content `11e83f06426469b48a67c2211d954ac916cd6fda`, evidence
`3d6e4d239f1c056d894e8e2f7c69b97a54483c6b`, SUFFICIENT, 8 receipts (`tier-a-slice-6.md`). Both
verdicts: supervisor Tier-A **ACCEPTED** plus a separate opposite-family IMPL-EVAL
**ACCEPTED_WITH_FINDINGS** (DeepSeek V4 Flash 0731, native route quota-exhausted both times —
`evaluate-slice-5.md`, `evaluate-slice-6.md`). Neither slice was author-self-certified.

Slice 7: content `897a06cd7170ca021da1836b3cbcbf790cf97a2f`, `SUFFICIENT` evidence set,
8/8 durable receipts. Scoped check selected 116 files; lint/fmt selected 115; MCP tests passed
136/136; exports drift, corpus freshness, quality/doctrine, and full publish dry run passed. The
direct MCP JSR audit exited 0 with its three existing warnings. MCP public doc lint remained
excluded as base-red. This is author evidence only; Tier-A acceptance is still pending.

## Drift and Debt

- RTK remains unavailable on this host; repo-native wrappers and raw read-only Git inspection were
  used, as recorded in `drift.md`.
- The gate catalog has no direct `audit-jsr-package` entry. The exact contracts and SDK audit
  commands were therefore run directly; the durable full publish dry run is the receipt-backed
  publishability backstop. No gate tooling was changed outside the Slice 1 ceiling.
- Existing service/plugin/#1278 doctrine debt is preserved and excluded.

## Commits

Slice 5's immutable content commit is `c2cbfbf0b3c355682732be5805f0f180498576db`; Slice 6's is
`11e83f06426469b48a67c2211d954ac916cd6fda`; Slice 7's is
`897a06cd7170ca021da1836b3cbcbf790cf97a2f`. Each has its own evidence commit holding only run
documentation and the verified receipt set. Treat Git and the draft PR as the authority for the
evidence carrier's identifier; this file cannot name its own commit SHA.
