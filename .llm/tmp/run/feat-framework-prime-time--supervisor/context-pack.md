# Framework Prime-Time — Supervisor Run Context Pack

Run-id: `feat-framework-prime-time--supervisor`
Umbrella branch: `feat/framework-prime-time` (base: `origin/main` @ `f85da9c0`)
Baseline confirmed: worktree sits on the true `origin/main` (includes S2 #67, S3 #70, OTel #68,
queue-pg S5 #71). Local `main` (cc3b8731) is a stale pointer and is irrelevant.

## What this run is

Production / enterprise prime-time hardening of the NetScript framework. The docs revamp is PAUSED;
this run fixes ALL framework caveats discovered by an exhaustive gap sweep, parallelized across
harness slices. Each slice: research → PLAN-EVAL (OpenHands minimax-M3, separate session) → WSL Codex
impl → IMPL-EVAL (OpenHands qwen3.7-max, separate session) → merge into this umbrella branch.

## Gap-sweep result (corrected)

- Source: dynamic workflow `wf_08960ad9-c46` (sweep) + `wfwcq826v` (18-gap delta re-verify).
- **210 verified gaps → 199 implement + 11 document-as-limitation.**
- **21 blocker-severity gaps**, concentrated in the saga durability/cascade core, auth seam,
  graceful-shutdown lifecycle, queue reliability/back-pressure, and end-to-end idempotency.
- **120 slices**: Wave A = 74 (no deps, startable now), B = 30, C = 11, D = 5.

### Delta correction (fixes the deltaReverified:0 defect)

The original synthesis carried 135 stable gaps judged against an older tree. 18 cited source files
that changed on main (the S2/S3/S5/OTel landings); they were re-verified against current main
(`wfwcq826v`, 18 agents): **0 fixed, 11 still-real, 7 reframe-as-deliberate-limitation**; by
disposition **7 implement, 11 document-as-limitation**. None are blockers. The streams
consume/subscribe surface and triggers `defer`/reserved-kinds already throw loud Unsupported errors
by design — honest limitations to document, not silent stubs to build.

## Dominant root & critical path

Root cause **G1 — saga store durability**: the saga service builds the runtime store-less, so
`dbClient` is dropped, the `SagaInstance` table is dead storage, and spawn/schedule/compensate
cascades plus trigger→saga and saga→worker dispatch (G2/G4/G5) are all meaningless until a concrete
Prisma/KV `SagaStorePort` is instantiated and injected.

Critical path:
`sagas-durable-store → sagas-cascade-runtime → sagas-engine-dispatch-completion →
triggers-saga-dispatch-action`.

## Wave-A blocker slices (first parallel batch — gate everything downstream)

| slice | sev | gaps | units |
| --- | --- | --- | --- |
| `sagas-durable-store` | blocker | 8 | plugin-sagas-core, plugins/sagas, plugins/sagas/services |
| `sagas-idempotency-e2e` | blocker | 5 | plugin-sagas-core, plugins/sagas |
| `sagas-telemetry-spans` | blocker | 3 | plugins/sagas, telemetry |
| `service-auth-seam` | blocker | 2 | packages/service |
| `service-graceful-shutdown` | blocker | 2 | packages/service |
| `worker-applied-keys-dedup` | blocker | 2 | plugins/workers, queue |
| `rbp-dlq-contract` | blocker | 1 | packages/queue |

Wave-A also holds ~67 high/medium independent slices that can run concurrently once the
generator-lane capacity is set. Waves B/C/D unlock on their `dependsOn` predecessors.

## State / next steps

- [x] Gap sweep complete + delta correction merged into the register.
- [x] Baseline confirmed = origin/main f85da9c0.
- [ ] Draft umbrella PR opened (this commit = run scaffold).
- [ ] Present register + Wave-A program to user for sign-off. NO Codex generator before sign-off.
- [ ] Decompose Wave-A blocker slices into per-slice harness runs (research → PLAN-EVAL → Codex →
      IMPL-EVAL → merge).
- [ ] Post-sweep PR housekeeping: close #65/#63 scratch, salvage #53's CI workflow.

## Hard rules in force

Claude supervises only (no framework code, no self-certify). Evaluator session ≠ generator session.
PLAN-EVAL PASS before any slice. Commit-by-slice, push (explicit refspec — branch tracks
`refs/heads/main`, so a bare push would hit main), comment PR, append commits.md. Option-A catalog
law. `@netscript/cli` published last. No JSR publish until scorecard passes AND user dispatches.
Do not touch `packages/aspire/src/public/mod.ts`, `scaffold-versions.ts`, or version pins (LD-8).
