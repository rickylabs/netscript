# Context Pack: #1387 typed principal and procedure policy

## Run Metadata

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| Run ID         | `feat-service-principal-procedure-policy--1387` |
| Branch         | `feat/service-principal-procedure-policy`       |
| Current phase  | `impl` — Slice 5 content complete; awaiting Tier-A / IMPL-EVAL |
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

The owner accepted **D-9** and amended Slice 5's ceiling with only the two service entrypoints needed
to publish `createContractAuthorizer`. Slice 5 is now implemented at immutable content head
`c2cbfbf0b3c355682732be5805f0f180498576db`. Contract metadata is authoritative; the match-aware
legacy authorizer runs only for a matched procedure whose metadata is absent, and an absent fallback
match denies. One builder-bound resolver uses the actual REST/RPC mounts and aliases for both authn
and authz. Optional authentication throws during factory construction with a stable namespaced
error.

All seven durable receipts at the receipt root attest the Slice 5 content head and pass. The exact
service audit also passes with only the sanctioned oRPC slow-type info, the generated MCP export
corpus contains the root and `./auth` factory entries, and `deno.lock` remains byte-identical. Slice
5 has not been self-certified: supervisor Tier-A and a fresh opposite-family IMPL-EVAL remain next.

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
- Regenerated the ceiling-exempt MCP export corpus through its checked-in generator; it grew by only
  the two expected public `createContractAuthorizer` entries.

## Next Steps

1. Supervisor performs substantive Slice 5 Tier-A review at `c2cbfbf0b`; no author
   self-certification substitutes for it.
2. Dispatch a fresh opposite-family Slice 5 IMPL-EVAL only after this implementation lane stops.
3. Do not begin Slice 6 until Slice 5 is accepted; then continue Slices 6–9 under their own ceilings.
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

| Gate                      | Slice 5 result                                                                  |
| ------------------------- | ------------------------------------------------------------------------------- |
| Scoped check/lint/fmt     | PASS over 48 service TS/TSX files; zero diagnostics/findings                    |
| Service tests             | PASS, 101/101                                                                   |
| Quality gate              | PASS, including quality scan, dependency checks, and doctrine fitness           |
| Service JSR audit         | PASS; dry-run OK with one sanctioned oRPC slow-type info                        |
| Publish dry run           | PASS; full workspace simulation completed                                       |
| MCP export corpus         | PASS from a real catalog receipt; 7,654 symbols, expected factory entries added |
| Lock                      | PASS; SHA-256 remains `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c` |
| E2E/Aspire/Docker/browser | NOT_RUN by the explicit no-lease boundary                                       |

The current `receipts/evidence-set.json` is `SUFFICIENT` for its seven declared automated gates,
and every constituent receipt has the expected `1387-s5-*` invocation ID, positive duration, and
`gitHead == actualGitHead == c2cbfbf0b...`. Tier-A acceptance remains a supervisor judgment.

## Drift and Debt

- RTK remains unavailable on this host; repo-native wrappers and raw read-only Git inspection were
  used, as recorded in `drift.md`.
- The gate catalog has no direct `audit-jsr-package` entry. The exact contracts and SDK audit
  commands were therefore run directly; the durable full publish dry run is the receipt-backed
  publishability backstop. No gate tooling was changed outside the Slice 1 ceiling.
- Existing service/plugin/#1278 doctrine debt is preserved and excluded.

## Commits

Slice 5's immutable content commit is `c2cbfbf0b3c355682732be5805f0f180498576db`. The following
evidence carrier holds only run documentation and the verified receipt set. Treat Git and the draft
PR as the authority for the evidence carrier's identifier; this file cannot name its own commit SHA.
