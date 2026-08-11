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

## 2026-08-08 — PLAN-EVAL cycle 1 exposed three undeclared boundary decisions

- **What:** The first RFC draft left receipt duplicate recovery/timeout, relay type ownership, and
  queue reuse-versus-rejection to implementation inference.
- **Source:** Authoritative `plan-eval.md` findings F-B1–F-B3; verdict `FAIL_PLAN`.
- **Expected:** The plan's open-decision sweep should have resolved every choice that could rework
  provider or package boundaries.
- **Actual:** The core laws were sound, but these three decisions were absent from both locked plan
  and FCP questions.
- **Severity:** critical.
- **Action:** lock provider-specific claim algorithms, split database raw relay persistence from
  service decoded runtime/sinks, reject queue-package reuse in v1, and propose queue runtime-DDL
  reconciliation before future code sharing.
- **Evidence:** RFC normative claim/relay/queue sections; `research.md` R21–R25; `plan.md` L14–L16.

## 2026-08-08 — Receipt identity drift was described more strongly than the key can enforce

- **What:** The first draft said scope must be stable but did not state that a changed scope or
  renamed command creates a different unique-key namespace.
- **Source:** `plan-eval.md` F-B4.
- **Expected:** Same raw idempotency key would appear protected by the key-reuse law.
- **Actual:** `(scope, commandName, keyHash)` changes, so no conflicting receipt exists and the
  handler honestly executes as new.
- **Severity:** significant.
- **Action:** add deterministic identity fixtures, execute-as-new negative conformance, and a
  breaking replay migration/alias rule for scope/name changes.
- **Evidence:** RFC canonical identity, semantic law 13, conformance items 5–6.

## 2026-08-08 — Isolation vocabulary needs provider allow-lists and default-only truth

- **What:** Existing planning treated MySQL/SQLite capability as a supported-level set only.
- **Source:** `plan-eval.md` F-B5/F-B7f and current adapter source.
- **Expected:** MySQL omits unsupported `Snapshot`; SQLite could advertise its serializable engine
  level directly.
- **Actual:** The lower MySQL adapter union includes/interpolates `SNAPSHOT`; the evaluator found
  SQLite's Prisma selection surface unavailable even though its engine default is serializable.
- **Severity:** significant.
- **Action:** replace the capability with `selectableIsolationLevels` plus `defaultIsolation`, make
  MySQL four-level allow-list/removal a Stage-6 gate, and put SQLite's default-only acceptance in
  FCP Q2.
- **Evidence:** RFC capability matrix; `research.md` R27/R29; `plan.md` L18/L20.

## 2026-08-08 — Queue runtime DDL is baseline drift, not command-kit precedent

- **What:** `@netscript/queue` already creates PostgreSQL queue/DLQ schema from runtime adapter
  initialization.
- **Source:** `packages/queue/adapters/postgres.adapter.ts` and dead-letter adapter; F-B3.
- **Expected:** The RFC's no-hidden-migration law might read as a repository-wide current invariant.
- **Actual:** It is a normative rule for new command-kit/relay paths; the sibling queue behavior is
  existing drift requiring separate reconciliation before reuse.
- **Severity:** significant.
- **Action:** scope the immediate law to command-kit paths and propose a migration-free queue slice;
  create no issue in this RFC run.
- **Evidence:** RFC queue-decision/rejected-alternative/board sections.

## 2026-08-08 — Launcher metadata formatting arrived with evaluator handoff

- **What:** `.llm/runs/docs-rfc-command-composition-kit--rfc/codex-thread-ids.md` had a pre-existing
  launcher metadata formatting edit when remediation began.
- **Source:** worktree at evaluator HEAD `122301d25`.
- **Expected:** Evaluator commit plus clean authored state.
- **Actual:** The metadata lines were reflowed without changing thread/session identities.
- **Severity:** minor.
- **Action:** preserve and include the formatting reconciliation with run-artifact updates; do not
  discard or regenerate launcher identity state.
- **Evidence:** final raw diff and commit slice S4.
