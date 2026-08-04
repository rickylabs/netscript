# Context Pack: randomized scaffold default ports

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-scaffold-random-default-ports--1202` |
| Branch | `fix/scaffold-random-default-ports` |
| Current phase | Plan locked; bootstrap commit/draft PR pending |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | service |

## Current State

The fixed 3001 failure is a host-port collision, not stale Prisma wiring: every dynamic sibling is
healthy, and the owner attributes the fixed-port collision to a Windows autostart service forwarded
through WSL2. The plan uses dynamic Aspire endpoints by default and deterministic high-range
standalone fallbacks. The runtime suite will stop forcing 3001. Cloud CI is the owner-declared
runtime verdict source; one local serialized pass is still required as evidence.

## Completed

- Required skills, milestone evaluator rule, Archetype-6 profile, doctrine, gate matrix, and JSR
  rubric read.
- Live issue body and all live comments read.
- Current main and generator/service/plugin/app listener paths re-baselined.
- Plan-Gate recorded as composed under the explicit milestone waiver.

## Next Steps

1. Commit/push bootstrap artifacts and open the draft PR with plan-phase labels.
2. Add and run the generated-output test RED before source implementation.
3. Implement the shared high-range allocation and dynamic host-pin defaults.
4. Run focused/scoped/framework gates, then queue the serialized runtime one-pass.

## Drift and Debt

- Authorized composed PLAN-EVAL; live comment-count discrepancy; inherited lockfile modification.
- No new architecture debt planned.

