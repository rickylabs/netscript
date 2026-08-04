# Context Pack: sagas generated KV adapter registration

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-sagas-kv-glue-registration--w2-f` |
| Branch | `fix/sagas-kv-glue-registration` |
| Current phase | `ci-fail` |
| Archetype | `5 — Plugin Package` |
| Scope overlays | `service` |

## Current State

Implementation and the owner runtime protocol are green. The final fresh scaffold under
`.llm/tmp/1184-final/saga-kv-final` proved populated background health, full terminal and
compensating lifecycles, correlation, OTEL traces/spans/logs, and restart durability. Merge
readiness is blocked by an unrelated deterministic `scaffold.runtime` database endpoint-churn
failure after all saga readiness gates pass.

## Completed

- Read amended #1184 and re-baselined all load-bearing claims.
- Selected Archetype 5 + service overlay and required gates.
- Recorded supervisor identity, research, design, plan, waiver, and environmental drift.
- Captured the emitted-glue RED and real generated `KvConnectionError`.
- Registered Redis in regenerated glue and preserved explicit Deno-KV selection.
- Added saga-only supervisor health endpoint/probe after the empty-report verifier RED.
- Allowed KV runtime startup without optional Prisma projection delegates; Prisma remains strict.
- Completed all seven owner runtime evidence steps and cleaned owned resources.
- Passed scoped wrappers, `quality:gate`, doc-lint baseline, and publish dry-run.
- Ran the required full `scaffold.runtime` command from an empty AppHost preflight; final artifact
  passed 51 gates and failed only `behavior.service-health` after DB endpoint churn.

## In Progress

- Slice 4 blocked: `scaffold.runtime` is red outside saga scope; composed review/ready transition
  must not start until the required gate is green or the owner explicitly re-scopes it.

## Next Steps

1. Owner/orchestrator decides whether the DB/AppHost endpoint-churn defect is repaired separately or
   explicitly waived for this slice.
2. Re-run the exact one-pass `scaffold.runtime` command after that blocker is resolved.
3. Complete the composed draft→ready review and close-gate evidence only after a green gate.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Fix the stub with `@netscript/kv/redis` registration | plan D1 | Generated output is not user-editable authority. |
| Keep Deno-KV compatibility by relying on existing provider selection | plan D2 | Registration does not select Redis. |
| Add saga-only health endpoint/probe | owner health bar | Populated report is backed by supervisor startup. |
| Permit missing Prisma projections only for KV backend | runtime evidence | #1093 remains untouched. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `plugins/sagas/src/adapter/resources/*` | changed | Redis registration + health glue + emitted-artifact tests. |
| `packages/cli/.../generate-register-background.ts` | changed | Saga-only endpoint/health probe. |
| `plugins/sagas/services/src/database-client*`, `main.ts` | changed | KV bootstrap without optional Prisma projections. |
| `.llm/runs/fix-sagas-kv-glue-registration--w2-f/*` | changed | Evidence and drift. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | focused suites, scoped wrappers, quality, doc-lint, publish dry-run |
| Fitness | runtime PASS | owner protocol fully evidenced |
| Runtime | PASS | populated health, lifecycle, OTEL, restart |
| Consumer | BLOCKED | local owner protocol passes; full suite 51 pass/1 unrelated DB failure |

## Open Questions

- Required full-suite gate is blocked by DB/AppHost endpoint churn: live Postgres `44973`, users
  Prisma still bound to `50564` after the nominal preserve-AppHost gate.

## Drift and Debt

- Drift: milestone artifacts/legacy docs absent; detached starts exited without attached PTY; empty
  health and KV/Prisma coupling required explicit rescope; full-suite DB endpoint churn is escalated.
- Debt: #1093 remains untouched; no generated schema hand-edit was used.

## Commits

- See the draft PR's commit list + per-slice PR comments.
