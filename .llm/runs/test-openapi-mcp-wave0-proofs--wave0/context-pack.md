# Context Pack: OMB wave-0 proofs

## Run Metadata

| Field          | Value                                  |
| -------------- | -------------------------------------- |
| Run ID         | `test-openapi-mcp-wave0-proofs--wave0` |
| Branch         | `test/openapi-mcp-wave0-proofs`        |
| Current phase  | implementation                         |
| Archetype      | N/A — proof/measurement slice          |
| Scope overlays | service                                |

## Current State

Research and Design are locked at D1–D12 and separate Qwen PLAN-EVAL passed. The tracked Codex lane
completed S1 with explicit P1 `FAIL`, selecting qualified F1(b). The callback emitted correct
allocated values and a complete manifest, but the generated SQLite users process exited because
`--allow-ffi` is absent. Listener ownership and precise timing for a later HTTP 200 were not
captured, so that observation is ambiguous and cannot satisfy D5. Separate Fable re-review approved
the amended evidence and causal qualifier. S2 is also complete and separately re-reviewed: the
attributed no-DB live spec was measured, but the required DB branch remains unavailable, so the
combined P2 verdict is explicit `FAIL`. P3 has not begun.

## Completed

- Required skills, issue bodies, epic, RFC §§4/9, doctrine, harness, source, and Aspire API reading.
- Current-main re-baseline and shared-host inventory.
- Harness bootstrap commit/push, draft PR #1182, and research phase comment.
- Locked plan, Design checkpoint, measurement schemas, commit slices, and gate set.
- Separate Qwen 3.7 Max/high `plan-eval.md` with `PASS`.
- S1 disposable SQLite scaffold, documented DB preparation, callback experiment, normalized
  evidence, explicit P1 `FAIL`/F1(b) verdict, exact owned-resource teardown, and separate Fable
  approval after one amendment cycle.
- S2 fresh no-DB scaffold measurement with exact attribution/teardown, committed raw-spec input,
  complete/auditable keyword inventory, explicit combined P2 `FAIL`, and separate Fable approval
  after one amendment cycle.

## In Progress

- Supervisor integration and PR reporting for the approved S2 artifact set.

## Next Steps

1. Commit/push reviewed S2 and report its explicit partial-progress FAIL on #1128 without checking
   acceptance or adding a closing keyword.
2. Launch P3 on the required medium-effort implementation route, preserving the one-sender rule.
3. Run separate Fable review after P3, then final hygiene and Qwen IMPL-EVAL.

## Key Decisions

| Decision                               | Source                            | Notes                                            |
| -------------------------------------- | --------------------------------- | ------------------------------------------------ |
| No `packages/**` changes               | User contract / doctrine boundary | Productization belongs to #1133 and later waves. |
| P1 is not pre-decided                  | RFC §9 / #1127                    | Only measured evidence selects F1(a) or F1(b).   |
| Two owned scaffolds run serially       | #1128 / shared-host hazard        | SQLite P1/P2 first, no-DB P2 second.             |
| Incomplete/skipped is FAIL             | RFC §4 / user contract            | Never represent a missing proof as pass.         |
| P1 selects qualified F1(b)             | Plan D5/D6 + reviewed evidence    | The seam worked; owned-run coherence failed.     |
| Formal evaluation stays Qwen/open-only | Harness lane policy               | No closed-model or supervisor fallback.          |

## Files Changed

| Path                                              | Status       | Notes                                                   |
| ------------------------------------------------- | ------------ | ------------------------------------------------------- |
| `.llm/runs/test-openapi-mcp-wave0-proofs--wave0/` | modified/new | Harness records plus reviewed S1/S2 proof artifacts.    |

## Gates

| Gate family      | Current status          | Evidence                                 |
| ---------------- | ----------------------- | ---------------------------------------- |
| Plan-Gate        | PASS                    | Separate Qwen verdict in `plan-eval.md`. |
| Static           | PASS                    | Scoped S1 check/lint/fmt and scope audit.          |
| Runtime          | P1 FAIL; P2 FAIL        | P2 no-DB measured; DB branch remains unavailable.  |
| Resource hygiene | PASS                    | No owned survivors; foreign resources untouched.  |

## Open Questions

- P1 is resolved as explicit `FAIL` / qualified F1(b), with separate Fable approval.
- P2 is resolved as explicit combined `FAIL`, with sound no-DB measurements and separate Fable
  approval; #1128 acceptance remains open because DB measurements are absent.
- P3 remains runnable and not started.
- Evaluator credential availability is resolved: the parser-backed live canary passed with tools,
  reasoning, and streaming supported.

## Drift and Debt

- Drift: supervisor route override, stale overlay read paths, resolved evaluator credential
  inheritance, the significant generated `--allow-ffi` permission defect, S2 command/runtime
  deviations, and resumed-thread effort reporting are recorded in `drift.md`.
- Debt: none.

## Commits

- `b0be3673e57cfcd70388f5dffb2080799017356a` — harness bootstrap / draft-PR seed.
- See the draft PR's commit list + per-slice PR comments for subsequent sign-off commits.
