# Drift Log: generated SQLite/libsql service `--allow-ffi`

## 2026-08-04 — Milestone composed PLAN-EVAL

- **What:** No local formal PLAN-EVAL is spawned or awaited for this per-PR milestone slice.
- **Source:** Owner instruction; milestone-run evaluator rule and orchestrator ruling D6.
- **Expected:** Generic run-loop uses a separate local PLAN-EVAL before implementation.
- **Actual:** Gate row is `composed per milestone-run.md (orchestrator waiver)`; the plan is locked
  and implementation proceeds in this run. Independent evaluation composes draft→ready augment,
  OpenHands, and the orchestrator pre-merge gate.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md`, `plan.md` D6, `plan-eval.md`.

## 2026-08-04 — P2 experiment hardcodes no-DB classifier fields

- **What:** The mandated unchanged P2 script wrote valid DB operation/view measurements into
  `P2-db.json` but labeled the scaffold `no-db` and repeated the no-non-2xx interpretation.
- **Source:** `p2-measure-live-spec.ts` lines 291 and 320–324; generated `P2-db.json`.
- **Expected:** A DB-branch artefact identifies the DB scaffold and interprets its six non-2xx
  responses per operation.
- **Actual:** Measurement payload shows 32,414 bytes, six operations, six non-2xx responses per
  operation, and 4,497-byte error views; classifier prose remains hardcoded to no-DB.
- **Severity:** significant
- **Action:** defer (impact assessment only; orchestrator owns re-scope)
- **Evidence:** `P2-db.json`; epic #1126 comment
  `https://github.com/rickylabs/netscript/issues/1126#issuecomment-5172565198`.

## 2026-08-04 — Implementation and live-evidence slices signed off together

- **What:** Planned slices 2 and 3 are represented by one implementation/evidence commit.
- **Source:** The same generated scaffold had to carry the controlled RED→GREEN owner proof, and
  the P2 measurement depended on that GREEN instance while this slice held the serialized AppHost
  slot.
- **Expected:** Separate code/test and live-evidence commits.
- **Actual:** RED was captured before the source edit and every individual gate is recorded, but
  the source, semantic test, live proof JSON, P2 artefact, and final run-artifact updates are signed
  off atomically after the single serialized live session.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `worklog.md`, `proofs/red-runtime.json`, `proofs/green-runtime.json`, and the final
  implementation commit.
