# Context Pack: #1387 typed principal and procedure policy

## Run Metadata

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| Run ID         | `feat-service-principal-procedure-policy--1387` |
| Branch         | `feat/service-principal-procedure-policy`       |
| Current phase  | `impl` — stopped after Slice 1                  |
| Archetype      | contracts: 1; service/plugin: 4                 |
| Scope overlays | `SCOPE-service` plus package doctrine           |

## Current State

PLAN-EVAL cycle 1 accepted LD-8 and LD-11 and returned `FAIL_PLAN` only for five bounded gate-set,
ceiling, and text corrections. Those corrections were committed separately without changing the
accepted design. Slice 1 then extended the existing `NetScriptProcedureMeta.access` vocabulary with
optional readonly `authorization.scopes` and `authorization.roles`, plus its contracts/SDK type and
runtime-independence proofs.

Slice 1 is stopped at its Tier-A boundary. Slice 2 must not begin until the supervisor performs the
substantive Tier-A review and releases the next slice.

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

1. Supervisor performs the substantive Tier-A review of Slice 1 and its receipt set.
2. If accepted, the supervisor explicitly releases Slice 2 under its locked ceiling.
3. The owner amends #1387's compile-time router-rename acceptance line before the final close-gate;
   the implementation PR must state the accepted substitution.
4. Keep `Refs #1387` partial and preserve an empty live closing-issue set until the full leaf and
   close-gate are complete.

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
