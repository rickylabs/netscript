# Context Pack: listener readiness diagnostics

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-listener-readiness-diagnostics--0.0.7` |
| Branch | `fix/listener-readiness-diagnostics` |
| Current phase | `implement` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `service` |

## Current State

The plan is locked. Existing socket readiness is bounded, but generated endpoint allocation is not.
The E2E deadline discards the resource lifecycle and sibling health evidence needed to decide H1/H2/H3.

## Completed

- Skills/doctrine/harness bootstrap and branch re-baseline.
- Aspire 13.5 `logs` non-interactive surface verification.
- H1 credibility decision and #1952 contract reconciliation.
- PLAN-EVAL recorded N/A with rationale.

## In Progress

- S2 GREEN is implemented and measured; commit it, then run the complete local gate set.

## Next Steps

1. Commit S2 GREEN.
2. Run the complete local gates and record exact evidence.
3. Push explicit refspec, open the draft PR, and hand off IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Final evidence is one-shot | implement brief / plan D1 | No new polling. |
| Endpoint resolution gets a 2s total bound | code evidence / plan D4 | Socket remains separately bounded. |
| Unhealthy means unreachable at published endpoint | supervisor addendum / #1952 | Logs are supporting evidence only. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| run artifact set | new | Harness activation, research, design, and resumable state. |
| `verify-listener-readiness.ts` | changed | One-shot final snapshot, classification, and log-tail capture. |
| `listener-readiness-gates_test.ts` | changed | Pure diagnostic contract coverage. |
| `_aspire-compat.ts.template` | changed | Total-budget endpoint allocation and structured `ENDPOINT_UNALLOCATED`. |
| `generate-register-infrastructure.ts` | changed | Lazy endpoint callback uses the bounded helper. |
| `embedded.generated.ts` | changed | Canonically regenerated carrier. |
| helper tests | changed | Generator, timeout, and emitted-compile coverage. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | pending | brief command set |
| Fitness | pending | quality/doctrine |
| Runtime | supervisor-owned | no local lease |
| Consumer | PASS | focused helper suite, 35/35 |

## Open Questions

- Which of H1/H2/H3 will a future hosted failure identify?
- Will the supervisor obtain two consecutive Postgres passes at this head?

## Drift and Debt

- Drift: absent service-overlay `.claude` references; actual helper asset/carrier path differs from brief wording.
- Debt: no new debt; existing E2E runtime directory cap is not deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.
