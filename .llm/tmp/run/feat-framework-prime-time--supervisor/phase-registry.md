# Phase Registry — feat-framework-prime-time--supervisor

Supervisor run; each phase group below is an independent harness slice that merges into the umbrella
branch `feat/framework-prime-time`. Status legend: `planned` → `plan-eval` → `impl` → `impl-eval` →
`merged`.

## Wave A — startable now (no cross-slice deps)

### Blocker batch (gates all downstream waves)

| group | slice | sev | status | PLAN-EVAL | IMPL-EVAL | branch |
| --- | --- | --- | --- | --- | --- | --- |
| A-G1 | sagas-durable-store | blocker | planned | — | — | — |
| A-G2 | sagas-idempotency-e2e | blocker | planned | — | — | — |
| A-G3 | sagas-telemetry-spans | blocker | planned | — | — | — |
| A-G4 | service-auth-seam | blocker | planned | — | — | — |
| A-G5 | service-graceful-shutdown | blocker | planned | — | — | — |
| A-G6 | worker-applied-keys-dedup | blocker | planned | — | — | — |
| A-G7 | rbp-dlq-contract | blocker | planned | — | — | — |

The remaining ~67 Wave-A high/medium slices and Waves B/C/D are tracked in `register.md` and will be
promoted into this registry as generator-lane capacity is allocated (per user sign-off on cadence).

## Notes

- Each slice brief must mandate `use harness`, activate ALL relevant skills + ARCHETYPE + SCOPE,
  adhere to the Architecture Doctrine, and hit the production/enterprise bar (no stubs/no-ops; real
  persistence, error-handling, idempotency, observability, graceful shutdown; full tests; gates
  green).
- PLAN-EVAL (OpenHands minimax-M3) and IMPL-EVAL (OpenHands qwen3.7-max) are separate sessions from
  the generator. No slice implementation before its PLAN-EVAL returns PASS.
- Two FAIL cycles on any slice → escalate to user.
