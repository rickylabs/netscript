# Context Pack: production command composition kit RFC

## Run Metadata

| Field          | Value                                                           |
| -------------- | --------------------------------------------------------------- |
| Run ID         | `docs-rfc-command-composition-kit--rfc`                         |
| Branch         | `docs/rfc-command-composition-kit`                              |
| Current phase  | `plan-eval-remediation-cycle-1`                                 |
| Archetype      | Docs delivery describing A4/A2/A3/A5/A6 implementation surfaces |
| Scope overlays | `SCOPE-docs`, `SCOPE-service`                                   |

## Current State

The run is active on the exact requested branch/base in the sole daemon-attached Codex thread. Draft
PR #1389 remains open and draft. Fable PLAN-EVAL cycle 1 is preserved at evaluator commit
`122301d25` with authoritative `FAIL_PLAN` findings F-B1–F-B7. This authoring turn is remediating
those findings without launching or approving evaluation. The RFC now locks provider receipt-claim
and timeout algorithms, the service → database relay split, queue non-reuse/runtime-DDL
reconciliation, identity-drift behavior, MySQL/SQLite capability truth, generated transaction
typing, and the batch corrections. No product code or export changed.

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
- Passed docs links/accuracy, scoped format/diff, RFC structural/terminology, review-thread, and PR
  check reconciliation; captured current package doc-lint findings as future implementation bars.
- Read `plan-eval.md` completely and preserved its evaluator commit/verdict.
- Re-verified queue, service/database dependency, MySQL, worker, telemetry, CLI, Prisma generated
  type, and primary provider-lock surfaces for F-B1–F-B7.
- Reconciled the plan's open-decision sweep so no provider/package/migration/generator choice is
  silently deferred.

## In Progress

- Proportionate remediation validation, commit/push, PR phase comment/body/label reconciliation, and
  exact cycle-2 handoff.

## Next Steps

1. Run scoped Markdown/RFC/link/type/diff checks and record exact results.
2. Commit and push only `HEAD:refs/heads/docs/rfc-command-composition-kit`.
3. Keep the PR draft, restore exactly `status:plan-eval`, and post the remediation phase comment.
4. Root orchestrator steers the existing Fable session using `final-handoff.md`; this generator does
   not launch or self-certify cycle 2.

## Key Decisions

| Decision                                                | Source                         | Notes                                                                          |
| ------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------ |
| Docs-only RFC; no package/plugin changes.               | brief, #1361                   | Implementation is separate.                                                    |
| One-store atomicity is the maximum portable claim.      | brief, doctrine A11–A13        | Cross-store and exactly-once claims refused.                                   |
| Generator will not launch PLAN/IMPL evaluators.         | brief                          | Root orchestrator owns Fable/Qwen sessions.                                    |
| No weak command store; KV is refused in v1.             | Deno KV/runtime research       | Same-commit truth is encoded by conformance, not a boolean callers can ignore. |
| Service/database/contracts/telemetry focused subpaths.  | doctrine + dependency analysis | No new package or root export growth; avoids package cycle.                    |
| Consumer-owned generated schemas with JCS codecs.       | JSR/Prisma/provider analysis   | No hidden migrations or provider-JSON fiction.                                 |
| Provider-specific receipt claims and bounded waits.     | PLAN-EVAL F-B1 + primary docs  | No generic duplicate catch or callback retry.                                  |
| Relay runtime in service over raw database persistence. | PLAN-EVAL F-B2 + doctrine      | New direct service → database edge; no reciprocal dependency.                  |
| No direct queue reuse in v1.                            | PLAN-EVAL F-B3 + queue source  | Share algorithm/tests; reconcile runtime DDL before future code sharing.       |
| Scope/name drift executes as new.                       | PLAN-EVAL F-B4 + unique key    | Determinism tests and replay migration/alias required.                         |
| Generated transaction type + honest isolation split.    | PLAN-EVAL F-B5–F-B7 + probes   | MySQL allow-list; SQLite default-only FCP; explicit root-method omission.      |

## Files Changed

| Path                                               | Status   | Notes                                                                                        |
| -------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------- |
| `.llm/runs/docs-rfc-command-composition-kit--rfc/` | modified | Evaluator artifact preserved; remediation evidence/handoff and launcher metadata reconciled. |
| `rfcs/0000-command-composition-kit.md`             | modified | Draft RFC remediation only; no framework/product implementation.                             |

## Gates

| Gate family | Current status                                                | Evidence                    |
| ----------- | ------------------------------------------------------------- | --------------------------- |
| Static      | PASS; format/diff/docs/RFC/PR gates green                     | `worklog.md` gate table     |
| Fitness     | PASS_DESIGN with existing doc-lint baseline findings recorded | `plan.md` and `research.md` |
| Runtime     | N/A for docs PR                                               | no product mutation         |
| Consumer    | current CLI/scaffold analysis PASS; generated proof deferred  | S1 re-baseline              |

## Open Questions

- FCP policy only: idempotency default, acceptance/timing of SQLite's default-only capability,
  correlation telemetry plus existing-precedent cleanup, and retention defaults. Provider claims,
  relay ownership, and queue reuse are resolved and not open.

## Drift and Debt

- Drift: runtime identity, cycle-1 undeclared boundary decisions, queue runtime DDL, identity drift,
  isolation truth, and launcher metadata reconciliation are recorded in `drift.md`.
- Debt: no new or deepened architecture debt; existing package verdicts constrain the RFC.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
