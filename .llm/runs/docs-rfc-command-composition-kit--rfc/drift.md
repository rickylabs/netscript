# Drift Log: production command composition kit RFC

Drift is append-only. Record facts that diverge from the carried proposal, plan, doctrine, or
current-state documentation.

## 2026-08-08 — Runtime identity correlation unavailable

- **What:** The desired-state runtime controller could not match this worktree to a persisted
  runtime identity.
- **Source:** `deno task agentic:runtime status --worktree /home/codex/repos/ns-rfc-command-kit`.
- **Expected:** A read-only session snapshot associated with the pre-staged Codex thread.
- **Actual:** Exit 3, `MISSING_IDENTITY`, zero sessions, `changed: no`.
- **Severity:** minor.
- **Action:** accept for this run; preserve the checked-in thread receipt and do not repair/restart
  an active daemon-attached session.
- **Evidence:** `codex-thread-ids.md`; `supervisor.md`.

## 2026-08-08 — Owner-controlled evaluator routing

- **What:** Formal review/evaluation is reserved for existing external sessions steered by the root
  orchestrator.
- **Source:** Owner implementation brief.
- **Expected:** Harness default would route a selected formal PLAN/IMPL evaluation via its canonical
  separate-session lanes.
- **Actual:** This generator must prepare inputs, stop at `status:plan-eval`, and must not trigger
  PLAN-EVAL/IMPL-EVAL itself; root will steer Fable cross-RFC review and a final Qwen adversarial
  pass.
- **Severity:** significant.
- **Action:** accept as explicit owner override; do not self-certify and do not launch a rival
  session.
- **Evidence:** `implement.md`; `supervisor.md`.

## 2026-08-08 — Proposal outbox inventory is stale

- **What:** The proposal says the repository has no outbox primitive.
- **Source:** Carried RFC-B §1.1 and §3.5.
- **Expected:** No `outbox` match in packages/plugins.
- **Actual:** `packages/plugin-sagas-core/src/ports/saga-outbox-port.ts` publicly defines a reserved
  T2 `SagaOutboxPort`; it has no adapter/caller and cannot join a command transaction.
- **Severity:** significant.
- **Action:** cite it as narrow prior art, do not reuse it as atomicity proof, and define a
  command-specific transaction-bound row/store contract.
- **Evidence:** `research.md` R9 and proposal-adjudication table.

## 2026-08-08 — Proposal overstates current adapter/helper portability

- **What:** The proposal treats `withTransaction` as reusable verbatim, SQLite as a current adapter,
  `maxIsolation` as a truthful scalar, and #1293 as a MySQL command blocker.
- **Source:** Carried RFC-B §§3.1, 4, and 6.
- **Expected:** A sound transaction-client callback and current exported adapters for the full
  matrix.
- **Actual:** The helper asserts the full root client; focused check compiled invalid root-only
  calls; no SQLite adapter subpath exists; isolation is a provider set/configuration; #1293 targets
  another package's class/error hook while `@netscript/database/adapters/mysql` already exists.
- **Severity:** significant.
- **Action:** require a true `TTx`, exact supported-level sets, separate feasibility/current-support
  columns, treat SQLite as unproven, and classify #1293 as adjacent.
- **Evidence:** `research.md` R2/R3/R12/R13; focused probe transcript in `worklog.md`.

## 2026-08-08 — Proposal concurrency and telemetry APIs are unsafe as written

- **What:** The proposal offers `expectVersion(current)` and emits raw scope/key/version attributes.
- **Source:** Carried RFC-B §§3.3 and 3.6.
- **Expected:** A race-free portable version check and safe command telemetry.
- **Actual:** Read-then-compare does not make the mutation conditional; raw identifiers and versions
  are high-cardinality and may contain sensitive application data.
- **Severity:** significant.
- **Action:** make CAS repository-specific with a zero-row typed conflict, and restrict default
  telemetry to stable names, enums, booleans, and counts.
- **Evidence:** Prisma OCC docs; OTel attribute requirement/convention guidance; `research.md`.
