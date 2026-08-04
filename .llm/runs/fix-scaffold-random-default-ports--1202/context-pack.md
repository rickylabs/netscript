# Context Pack: randomized scaffold default ports

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-scaffold-random-default-ports--1202` |
| Branch | `fix/scaffold-random-default-ports` |
| Current phase | Post-evaluation correction; orchestrator proof pending |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | service |

## Current State

The fixed 3001 failure is a host-port collision, not stale Prisma wiring. Generated app/service
Aspire resources now omit automatic host pins, standalone fallbacks are seeded in 49152–65535,
and plugin APIs use seeded high-range pins where direct endpoint consumers still require them. The
earlier local runtime one-pass was green (70/70), but the executing repo-wide cloud test exposed
three missed CLI regressions after that evaluation. The correction restores plugin service `Port`
emission alongside the seeded high-range `HostPort` and makes the durable-parity test use the
project seed. The orchestrator owns the new runtime/cloud proof; the Windows-service identification
remains owner-owned.

## Completed

- RED-first generated-output contract and seeded high-range allocator implemented.
- Focused suites, scoped check/lint/fmt, quality/architecture, and CLI publish dry-run passed.
- Clean serialized `scaffold.runtime` passed 70/70 with cleanup and zero survivors.
- The prior IMPL-EVAL passed before the three repo-wide regressions were exposed; this correction
  supersedes that implementation snapshot.
- Focused regression files now pass (28 passed, 3 Redis integration tests ignored without an
  endpoint); scoped CLI check/fmt, quality scan, and architecture check pass.

## Next Steps

1. Push the correction with the explicit branch refspec and post its gate evidence.
2. Leave the clean runtime/cloud DoD unchecked for the orchestrator-owned proof run.

## Drift and Debt

- Authorized composed PLAN-EVAL; live comment-count discrepancy; inherited lockfile modification.
- An executing cloud test later exposed three CLI regressions; the earlier evaluator snapshot was
  therefore insufficient and is not treated as the current-head verdict.
- No new architecture debt planned.
