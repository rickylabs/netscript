# Context Pack: #1387 typed principal and procedure policy

## Run Metadata

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| Run ID         | `feat-service-principal-procedure-policy--1387` |
| Branch         | `feat/service-principal-procedure-policy`       |
| Current phase  | `impl` — Slice 5 stopped for rescope before product edits (D-9) |
| Archetype      | contracts: 1; service/plugin: 4                 |
| Scope overlays | `SCOPE-service` plus package doctrine           |

## Current State

PLAN-EVAL cycle 1 accepted LD-8 and LD-11 and returned `FAIL_PLAN` only for five bounded gate-set,
ceiling, and text corrections. Those corrections were committed separately without changing the
accepted design. Slice 1 then extended the existing `NetScriptProcedureMeta.access` vocabulary with
optional readonly `authorization.scopes` and `authorization.roles`, plus its contracts/SDK type and
runtime-independence proofs.

Slices 1–4 are each Tier-A **ACCEPTED** (Slice 1 at `2ddd6048`, Slice 2 at `f9b32b4f7` with a D-4
ceiling amendment mid-slice, Slice 3 at `c297064aa` after two rescope stops (D-7, D-8) that traced to
supervisor-brief errors rather than author defects, Slice 4 at `9cc8c4c5f`). Every slice has a
separate opposite-family IMPL-EVAL verdict; Slice 3 carries two independent concurring verdicts
(Opus 5 and DeepSeek V4 Flash 0731) under a coordinator-authorized routing deviation recorded in the
topic supervisor's ledger, not here. Slice 5 must not begin until the supervisor releases it under
its locked ceiling.

**Resume-docs gap, corrected here.** This file and `worklog.md` were not updated after Slice 1
landed — flagged as F-1 by the Slice 4 IMPL-EVAL, since a fresh session trusting this file alone
would have been materially misled about run position despite the commit trail, per-slice Tier-A
documents, and receipt archives all being current. Update this file at each slice boundary going
forward, not only at Slice 1.

Slice 5 was released but stopped before product edits under **D-9**. The required runtime factory
cannot be made public inside the locked ceiling: both explicit package entrypoints
(`packages/service/src/auth/mod.ts` and `packages/service/mod.ts`) need a named
`createContractAuthorizer` value export, and neither is among the ten authorized files. A private
internal import would not satisfy the Design checkpoint or consumer API. Slice 4's ten top-level
receipts were verified and moved byte-identically to `receipts/slice-4-9cc8c4c5f/`; the top level is
empty pending a future, owner-amended Slice 5 attempt.

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

## Next Steps

1. Owner/supervisor adjudicates D-9 and, if accepted, adds only
   `packages/service/src/auth/mod.ts` and `packages/service/mod.ts` to Slice 5 for the two named value
   exports before re-releasing implementation.
2. Do not begin Slice 6; complete and separately evaluate Slice 5 first.
3. Continue Slices 6–9, each with its own Tier-A review and separate opposite-family IMPL-EVAL.
4. The owner amends #1387's compile-time router-rename acceptance line before the final close-gate;
   the implementation PR must state the accepted substitution.
5. Keep `Refs #1387` partial and preserve an empty live closing-issue set until the full leaf and
   close-gate are complete.

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

| Gate                      | Historical Slice 1 result                                                        |
| ------------------------- | -------------------------------------------------------------------------------- |
| Scoped check/lint/fmt     | PASS over contracts and SDK; 114 files, zero findings                            |
| Contracts + SDK tests     | PASS, 93/93                                                                      |
| Contracts JSR audit       | PASS; one sanctioned slow-type info                                              |
| SDK JSR audit             | PASS; only the two known baseline warnings                                       |
| Export drift              | PASS via the exact `docs:exports-drift` task and durable `docs:accuracy` receipt |
| Quality gate              | PASS, including architecture and dependency checks                               |
| Publish dry run           | PASS; full workspace dry run completed                                           |
| Lock/generated carriers   | PASS; byte-identical / no tracked movement                                       |
| E2E/Aspire/Docker/browser | NOT_RUN by the explicit no-lease boundary                                        |

The durable named set is `receipts/evidence-set.json`; it records `SUFFICIENT` for its declared
automated surface. Tier-A acceptance remains a supervisor judgment, not an author
self-certification.

## Drift and Debt

- RTK remains unavailable on this host; repo-native wrappers and raw read-only Git inspection were
  used, as recorded in `drift.md`.
- The gate catalog has no direct `audit-jsr-package` entry. The exact contracts and SDK audit
  commands were therefore run directly; the durable full publish dry run is the receipt-backed
  publishability backstop. No gate tooling was changed outside the Slice 1 ceiling.
- Existing service/plugin/#1278 doctrine debt is preserved and excluded.

## Commits

The branch history contains a separate bounded plan-repair commit, a six-file Slice 1 product
commit, and a following evidence/carrier commit. Treat Git and the draft PR as the authority for
their identifiers; this context carrier intentionally does not claim that a SHA is eternally
current.
