# Context Pack: production command composition kit RFC

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-rfc-command-composition-kit--rfc` |
| Branch | `docs/rfc-command-composition-kit` |
| Current phase | `research` |
| Archetype | Docs delivery describing Archetypes 1–6 implementation surfaces |
| Scope overlays | `SCOPE-docs`, `SCOPE-service` |

## Current State

The run is activated on the exact requested branch/base in the sole daemon-attached Codex thread.
All named skills and required RFC/harness/doctrine/evaluator authority have been read. Bootstrap
artifacts are ready for the initial commit/explicit-refspec push/draft PR. Detailed proposal and API
re-baselining is the next slice; no product code or RFC file has been created yet.

## Completed

- Verified `HEAD == merge-base(HEAD, origin/main) == fac9e339042c...` and branch name.
- Preserved the staged `implement.md` and `codex-thread-ids.md` receipts.
- Read the RFC process/template, all current doctrine chapters, Archetypes 1–6, docs/service
  overlays, lane/doc-audit policy, gate matrix, plan gate, and PLAN/IMPL evaluator protocols.
- Confirmed live #1361–#1364 and PR #1347 exist; #1361 is open and ratification-only.

## In Progress

- B0 bootstrap commit, explicit-refspec push, draft PR, required labels, and opening phase comment.

## Next Steps

1. Complete B0 and reconcile the live PR surface.
2. Read/re-baseline the proposal against current packages/docs/tests and primary adapter docs.
3. Lock the plan and author the RFC in S2/S3.
4. Run docs/RFC gates, write `final-handoff.md`, and stop at `status:plan-eval` for root-led review.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Docs-only RFC; no package/plugin changes. | brief, #1361 | Implementation is separate. |
| One-store atomicity is the maximum portable claim. | brief, doctrine A11–A13 | Cross-store and exactly-once claims refused. |
| Generator will not launch PLAN/IMPL evaluators. | brief | Root orchestrator owns Fable/Qwen sessions. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/docs-rfc-command-composition-kit--rfc/` | new | Mandatory harness artifacts plus staged session receipts. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | bootstrap PASS; final pending | `worklog.md` gate table |
| Fitness | planned-surface audit pending | `plan.md` and `research.md` |
| Runtime | N/A for docs PR | no product mutation |
| Consumer | analysis pending | S1 re-baseline |

## Open Questions

- Public owner/subpath, receipt schema and canonicalization, adapter truth, typed failures,
  isolation, telemetry/redaction, and relay/saga boundary remain to be locked.

## Drift and Debt

- Drift: runtime controller identity correlation failed read-only; recorded in `drift.md`.
- Debt: no new or deepened architecture debt; existing package verdicts constrain the RFC.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).

