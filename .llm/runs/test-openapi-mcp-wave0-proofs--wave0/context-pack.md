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
the amended evidence and causal qualifier. No S2/S3 work has begun.

## Completed

- Required skills, issue bodies, epic, RFC §§4/9, doctrine, harness, source, and Aspire API reading.
- Current-main re-baseline and shared-host inventory.
- Harness bootstrap commit/push, draft PR #1182, and research phase comment.
- Locked plan, Design checkpoint, measurement schemas, commit slices, and gate set.
- Separate Qwen 3.7 Max/high `plan-eval.md` with `PASS`.
- S1 disposable SQLite scaffold, documented DB preparation, callback experiment, normalized
  evidence, explicit P1 `FAIL`/F1(b) verdict, exact owned-resource teardown, and separate Fable
  approval after one amendment cycle.

## In Progress

- Supervisor integration of the approved S1 artifact set and RFC/epic decision-record update.

## Next Steps

1. Commit/push reviewed S1 and synchronize local/GitHub RFC §9 plus epic #1126.
2. Authorize no-DB P2 and P3 in the tracked Codex thread.
3. Resolve how the explicit DB-backed P2 failure is recorded without productizing the permission
   defect in this proof PR.

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
| `.llm/runs/test-openapi-mcp-wave0-proofs--wave0/` | modified/new | Harness records plus reviewed S1 proof artifacts.       |

## Gates

| Gate family      | Current status          | Evidence                                 |
| ---------------- | ----------------------- | ---------------------------------------- |
| Plan-Gate        | PASS                    | Separate Qwen verdict in `plan-eval.md`. |
| Static           | PASS                    | Scoped S1 check/lint/fmt and scope audit.          |
| Runtime          | P1 FAIL                 | Qualified F1(b); DB-path rescope recommended.      |
| Resource hygiene | PASS                    | No owned survivors; foreign resources untouched.  |

## Open Questions

- P1 is resolved as explicit `FAIL` / qualified F1(b), with separate Fable approval.
- DB-backed P2 is product-blocked; no-DB P2 and P3 remain runnable.
- Evaluator credential availability is resolved: the parser-backed live canary passed with tools,
  reasoning, and streaming supported.

## Drift and Debt

- Drift: supervisor route override, stale overlay read paths, resolved evaluator credential
  inheritance, and the significant generated `--allow-ffi` permission defect are recorded in
  `drift.md`.
- Debt: none.

## Commits

- `b0be3673e57cfcd70388f5dffb2080799017356a` — harness bootstrap / draft-PR seed.
- See the draft PR's commit list + per-slice PR comments for subsequent sign-off commits.
