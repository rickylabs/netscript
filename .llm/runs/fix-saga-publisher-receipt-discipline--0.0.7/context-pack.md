# Context Pack: saga publisher receipt discipline (#1365)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-saga-publisher-receipt-discipline--0.0.7` |
| Branch | `fix/saga-publisher-receipt-discipline` |
| Current phase | `plan` |
| Archetype | `3 — Runtime/Behavior` for core; `5 — Plugin Package` for sagas/workers |
| Scope overlays | `docs` |

## Current State

S1 research and design are complete against owner-locked base `5197e70b7`. No product or test code
has been written. The plan selects a companion `publishSagaOrThrow(...)` core helper plus a
repository discarded-receipt gate, rich missing-endpoint diagnostics, preservation/testing of the
already-correct scaffold sample, public-doc correction, and generated derivatives. Separate-session
PLAN-EVAL is the hard stop before S2 and is parked for the primary to dispatch.

## Completed

- Read required harness, doctrine, Deno toolchain, repo-tools, PR, RTK, JSR-audit, and CLI skills.
- Re-verified every issue citation at the locked base.
- Classified `plugin-sagas-core` as Archetype 3 and `plugins/sagas`/`plugins/workers` as Archetype 5.
- Measured whole-package static baselines for all three packages.
- Derived docs/export asset cascade from the generators themselves.
- Diffed the #1764 carrier and isolated its single generated-ceiling collision.
- Locked the implementation path ceiling and S2 slices.

## In Progress

- Commit and explicit-refspec push of S1 harness artifacts only.

## Next Steps

1. Primary dispatches a separate opposite-family PLAN-EVAL when its routing change is resolved.
2. If PLAN-EVAL passes, S2 implements the contract/helper and quality rail first.
3. S2 implements rich publisher diagnostics and package tests.
4. S2 locks the already-correct emitted sample with worker/docs derivation tests and fixes all four
   public-doc discard examples plus the stale 8092 reference.
5. S2 regenerates in-ceiling derivatives and runs static/whole-package gates.
6. The exact future runtime command is
   `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`, but it remains prohibited until
   the primary grants a serialized runtime lease.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Use `publishSagaOrThrow(...)` plus a discarded-receipt quality rule | Doctrine A1/A2/A5/A13/A14; TypeScript capability; issue option (b) | Companion helper preserves the non-throwing port and external structural implementers. |
| Keep server discovery keys raw-hyphen | AppHost generator/tests and SDK server resolver | `services__sagas-api__http__0` is the correct server key. |
| Defer browser full-key parity | SDK browser fallback and scope boundary | The full-key asymmetry is real, but shorthand resolution works and publisher runtime is unaffected. |
| Preserve S5 sample behavior and add derivation proof | Current generator source | No gratuitous rewrite of already-correct product behavior. |
| Own public docs in this leaf | `CLAUDE.md` docs exception and docs overlay | Three unsafe prose pages plus two reference pages are in ceiling. |
| Treat MCP corpus overlap as mechanical | #1764 focused diff | Regenerate in leaf and again at integrated head. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-saga-publisher-receipt-discipline--0.0.7/supervisor.md` | new | Run identity and overrides |
| `.llm/runs/fix-saga-publisher-receipt-discipline--0.0.7/research.md` | new | Re-baselined evidence |
| `.llm/runs/fix-saga-publisher-receipt-discipline--0.0.7/plan.md` | new | Locked design, ceiling, slices, and gates |
| `.llm/runs/fix-saga-publisher-receipt-discipline--0.0.7/worklog.md` | new | Design checkpoint and measured results |
| `.llm/runs/fix-saga-publisher-receipt-discipline--0.0.7/context-pack.md` | new | Resumable handoff |
| `.llm/runs/fix-saga-publisher-receipt-discipline--0.0.7/drift.md` | new | Material deviations |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | measured | Three package check/lint/fmt suites pass; known doc-lint baselines recorded |
| Fitness | measured | Quality and doctrine scanners pass; JSR baseline exceptions quantified |
| Runtime | `NOT_RUN — lease required` | Primary correction; no runtime evidence retained |
| Consumer | partial/static | Workers whole-package suite and docs static gates pass; runtime consumer proof is lease-blocked |

## Open Questions

- No design question remains open. PLAN-EVAL is pending primary dispatch.
- Runtime merge-readiness remains intentionally unmeasured until a serialized lease is granted.

## Drift and Debt

- Drift: S5 already fixed the fallback/sample behavior; browser normalization is only a partial
  asymmetry; #1764 is not in the locked base; runtime commands now require a lease.
- Debt: no new architecture debt entry is planned. Existing saga/workers cardinality, JSR module-tag,
  private-type doc-lint, and worker thinness debt are baseline-only and must not increase.

## Commits

- S1 artifact commit is recorded by branch history after the explicit-refspec push. No PR exists by
  owner instruction.
