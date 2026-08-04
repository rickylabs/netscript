# Context Pack: randomized scaffold default ports

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-scaffold-random-default-ports--1202` |
| Branch | `fix/scaffold-random-default-ports` |
| Current phase | IMPL-EVAL passed; cloud runtime runner unavailable |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | service |

## Current State

The fixed 3001 failure is a host-port collision, not stale Prisma wiring. Generated app/service
Aspire resources now omit automatic host pins, standalone fallbacks are seeded in 49152–65535,
and plugin APIs use seeded high-range pins where direct endpoint consumers still require them. The
clean local runtime one-pass is green (70/70), and the formal open-model IMPL-EVAL passed. Cloud CI
remains the owner-declared verdict source; the Windows-service identification remains owner-owned.

## Completed

- RED-first generated-output contract and seeded high-range allocator implemented.
- Focused suites, scoped check/lint/fmt, quality/architecture, and CLI publish dry-run passed.
- Clean serialized `scaffold.runtime` passed 70/70 with cleanup and zero survivors.
- Separate-session Qwen 3.7 Max IMPL-EVAL passed with no blocking findings.

## Next Steps

1. Obtain an executing cloud `scaffold-runtime` verdict when GitHub assigns a runner.
2. Require that green verdict before checking S3/cloud DoD or promoting to ready-to-merge.

## Drift and Debt

- Authorized composed PLAN-EVAL; live comment-count discrepancy; inherited lockfile modification.
- Cloud runtime job and one retry were cancelled before runner assignment (`runner_id: 0`, zero
  steps/logs); static and other executing cloud lanes passed.
- No new architecture debt planned.
