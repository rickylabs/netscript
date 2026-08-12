# Context Pack: docs snippet compile gate for #1374

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `test-1374-docs-compile-gate--leaf` |
| Branch | `test/1374-docs-snippet-compile-gate` |
| Current phase | `plan-eval` (awaiting separate-session verdict) |
| Archetype | N/A — internal docs tooling |
| Scope overlays | `SCOPE-docs` |

## Current State

Phase 1 research and a decision-complete plan are ready for a separate native Claude/Fable 5
medium PLAN-EVAL. Implementation has not started and is forbidden until this thread is resumed with
`PASS`.

## Completed

- Harness bootstrap and supervisor identity.
- Live issue read without re-deriving its verified Evidence section.
- Workspace resolver probe: exact `@netscript/*` workspace entrypoints resolve from synthetic
  consumer files; TSX needs explicit Preact JSX mapping.
- Full census: 578 fences, 288 `ts`/`tsx`, 35 Tier-1 candidates.
- Current accuracy/export-drift checker and Pages/core-CI wiring research.
- Locked plan: 18 Tier-1 checked, 17 reason-marked exemptions, 253 outside floor.

## In Progress

- Draft PR publication, followed by an immediate stop for PLAN-EVAL.

## Next Steps

1. Separate-session Claude/Fable 5 medium reads the plan protocol, plan gate, `research.md`,
   `plan.md`, and `worklog.md` Design section.
2. Evaluator writes `plan-eval.md` with `PASS` or `FAIL_PLAN` and posts the PLAN-EVAL phase comment.
3. Only after orchestrator resumes this same thread with `PASS`: switch `status:plan` to
   `status:impl` and implement slices 1–4 in order.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| OS-temp page-isolated synthetic modules | `plan.md` D1 | No tracked generated files or gitignore rule. |
| Exact workspace `exports` import map | `plan.md` D2 | No wildcard/private entrypoint mapping. |
| Marker/census contract | `plan.md` D3 | 35 = 18 checked + 17 exempt; 253 outside floor. |
| Pages workflow trigger | `plan.md` D4 | `ci.yml` keeps current accuracy step, no duplicate snippet job. |
| Accuracy demotion | `plan.md` D5 | Named survivors/removals, drift checker unchanged. |
| Actual red controls | `plan.md` D6 | Three spawned CLI failures plus two dialect green controls. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/test-1374-docs-compile-gate--leaf/supervisor.md` | new | Identity and routes. |
| `.llm/runs/test-1374-docs-compile-gate--leaf/research.md` | new | Full requested research and census. |
| `.llm/runs/test-1374-docs-compile-gate--leaf/plan.md` | new | Locked Phase 2 design. |
| `.llm/runs/test-1374-docs-compile-gate--leaf/worklog.md` | new | Filled Design checkpoint. |
| `.llm/runs/test-1374-docs-compile-gate--leaf/context-pack.md` | new | Resume state. |
| `.llm/runs/test-1374-docs-compile-gate--leaf/drift.md` | new | Phase 1 no-divergence record. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan-Gate | PENDING | Separate-session evaluation required. |
| Static/fitness/consumer | NOT_RUN | Implementation has not begun. |
| Runtime | N/A | Compilation-only slice. |

## Open Questions

None in the generator plan. Evaluator may return findings.

## Drift and Debt

- Drift: none in Phase 1.
- Debt: none created; named boundary issues remain external.

## Commits

- See the draft PR's commit list + per-slice PR comments. Phase 1 has one plan commit.
