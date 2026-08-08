# Context Pack: production command composition kit RFC

## Run Metadata

| Field          | Value                                                           |
| -------------- | --------------------------------------------------------------- |
| Run ID         | `docs-rfc-command-composition-kit--rfc`                         |
| Branch         | `docs/rfc-command-composition-kit`                              |
| Current phase  | `rfc-authoring`                                                 |
| Archetype      | Docs delivery describing Archetypes 1–6 implementation surfaces |
| Scope overlays | `SCOPE-docs`, `SCOPE-service`                                   |

## Current State

The run is active on the exact requested branch/base in the sole daemon-attached Codex thread.
Bootstrap commit `ad643e15...` and research/plan commit `e0b98f289...` were pushed by explicit
refspec; draft PR #1389 is live at `status:plan`. The full re-baseline and plan gate are complete,
and the RFC now carries the exact contracts, semantic laws, adapter truth, relay boundary,
conformance plan, migration, and decomposition. No product code or export changed.

## Completed

- Verified `HEAD == merge-base(HEAD, origin/main) == fac9e339042c...` and branch name.
- Preserved the staged `implement.md` and `codex-thread-ids.md` receipts.
- Read the RFC process/template, all current doctrine chapters, Archetypes 1–6, docs/service
  overlays, lane/doc-audit policy, gate matrix, plan gate, and PLAN/IMPL evaluator protocols.
- Confirmed live #1361–#1364 and PR #1347 exist; #1361 is open and ratification-only.
- Opened draft PR #1389 with required labels, `status:research`, and research phase comment.
- Proved the transaction callback typing defect and typed-error defect with removed focused probes.
- Locked future package ownership, logical row ownership, JCS hashing/codec contract, adapter
  refusal rules, worker/saga boundary, telemetry redaction, and implementation decomposition.
- Authored `rfcs/0000-command-composition-kit.md` from the repository template, keeping `0000` and
  `Draft` through maintainer discussion.
- Tightened the S2 surface with attempt identity across receipt/audit/outbox, schema-backed outbox
  codecs, deterministic scope inputs, and explicit relay retry/terminal dispositions.

## In Progress

- S2 source-alignment review and coherent RFC commit/push.

## Next Steps

1. Commit/push S2 and post its implementation-phase evidence comment without starting evaluation.
2. Run docs/RFC, source-alignment, JSR-design, diff/lock, and PR/thread gates in S3.
3. Write `final-handoff.md`, update the PR/body, and stop at `status:plan-eval` for root-led review.

## Key Decisions

| Decision                                               | Source                         | Notes                                                                          |
| ------------------------------------------------------ | ------------------------------ | ------------------------------------------------------------------------------ |
| Docs-only RFC; no package/plugin changes.              | brief, #1361                   | Implementation is separate.                                                    |
| One-store atomicity is the maximum portable claim.     | brief, doctrine A11–A13        | Cross-store and exactly-once claims refused.                                   |
| Generator will not launch PLAN/IMPL evaluators.        | brief                          | Root orchestrator owns Fable/Qwen sessions.                                    |
| No weak command store; KV is refused in v1.            | Deno KV/runtime research       | Same-commit truth is encoded by conformance, not a boolean callers can ignore. |
| Service/database/contracts/telemetry focused subpaths. | doctrine + dependency analysis | No new package or root export growth; avoids package cycle.                    |
| Consumer-owned generated schemas with JCS codecs.      | JSR/Prisma/provider analysis   | No hidden migrations or provider-JSON fiction.                                 |

## Files Changed

| Path                                               | Status | Notes                                                     |
| -------------------------------------------------- | ------ | --------------------------------------------------------- |
| `.llm/runs/docs-rfc-command-composition-kit--rfc/` | new    | Mandatory harness artifacts plus staged session receipts. |
| `rfcs/0000-command-composition-kit.md`             | new    | Draft RFC; no framework/product implementation.           |

## Gates

| Gate family | Current status                                               | Evidence                    |
| ----------- | ------------------------------------------------------------ | --------------------------- |
| Static      | bootstrap/API probes PASS as classified; final pending       | `worklog.md` gate table     |
| Fitness     | planned-surface and runtime-law design PASS                  | `plan.md` and `research.md` |
| Runtime     | N/A for docs PR                                              | no product mutation         |
| Consumer    | current CLI/scaffold analysis PASS; generated proof deferred | S1 re-baseline              |

## Open Questions

- FCP policy only: idempotency required-by-default opt-out, SQLite release timing, correlation ID
  telemetry opt-in, and retention defaults. These do not block the RFC core.

## Drift and Debt

- Drift: runtime controller identity correlation failed read-only; recorded in `drift.md`.
- Debt: no new or deepened architecture debt; existing package verdicts constrain the RFC.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
