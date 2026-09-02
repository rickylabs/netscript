# Drift Log: Aspire 13.5 teardown and leak-check

Drift is append-only. No drift recorded at bootstrap.

## 2026-08-30 — IMPL-EVAL cycle 1 force lifecycle correction

- Severity: significant
- Source: `origin/research/aspire-13.5-0.0.7` S7 `evaluate.md`, evaluated head `473286671`.
- Divergence: slice 3 interpreted the V7-proven force argv as a second command after normal stop. S2
  V6 proves the resulting no-running call exits 0 without persistent cleanup, violating the planned
  A13/AP-10 false-clean boundary.
- Resolution: slice 6 uses force as the single stop command only while the exact owned AppHost PID
  identity is running, reports already-gone as action-required, and confirms PID/helper/container
  disappearance independently of mutation-command exit codes.
- Scope impact: none. Phase B remains lease-backed and no runtime was started.

## 2026-08-30 — Phase-B live descendant ownership failure

- Severity: significant
- Source: lease-backed 13.5.3 receipts `phase-b-03-cli-terminated.json` through
  `phase-b-06-teardown-apply.json`.
- Divergence: synthetic tests predicted that re-parented `aspire-managed`/DCP descendants would
  retain path evidence and classify owned. Live SIGKILL reproduced the PID-1 tree, but the reporter
  emitted empty evidence arrays and classified those run descendants `unproven`.
- Resolution: none in this phase. The owner explicitly prohibited product-source changes; the exact
  failure was preserved, owned-only cleanup completed, and acceptance evidence was withheld.
- Scope impact: a follow-up product-fix slice is required before #1429/#1719 can close.

## 2026-08-30 — Static reporter-fix resolution

- Severity: resolution of significant drift.
- Source: `phase-b-04-leak-check.json`, `phase-b-06-teardown-apply.json`, and
  `receipts/07-red-phase-b-live-snapshot.json`.
- Resolution: `aspire-managed server --contentRoot <path>` and resolved helper cwd now become
  explicit process evidence; sibling worktree attribution is derived from the active worktree
  parent instead of `/home/codex/repos`; AppHost-helper matching accepts any contained evidence
  path. Mutation still requires positive containment, stable PID identity, age, and an OK AppHost
  census.
- Scope impact: none. Foreign/unproven rows remain non-actionable; no runtime rerun occurred.

## 2026-08-31 — D-189 early census exposes staged cleanup

- Severity: evidence clarification; acceptance adjudication withheld.
- Source: `receipts/d189-01-before-kill.json` through
  `receipts/d189-04-leak-check-before-apply.json`.
- Observation: the first completed post-SIGKILL census at 1.093 s found the AppHost registration
  gone while re-parented DCP/controller/service processes, non-persistent Redis, and Persistent
  PostgreSQL survived. At 64.262 s, the processes and Redis had self-cleaned; PostgreSQL remained
  with `com.microsoft.developer.usvc-dev.persistent=true`.
- Resolution: none required in this evidence-only lease. The structured receipt makes the held
  wording decidable and intentionally does not decide whether documented Persistent lifetime is a
  disqualifying run-owned survivor.
- Scope impact: no product redesign and no acceptance checkbox change.

## 2026-08-31 — Final reporter observes its control plane

- Severity: low; non-actionable observation.
- Source: `receipts/d189-11-independent-leak-check.json`.
- Observation: with Aspire and all Docker resource inventories at zero, the reporter emitted the
  current Codex command carrier and its transient `aspire ps` probe as `unproven` process rows.
- Resolution: both rows remained untouched, as required. No ownership shortcut was added during
  the evidence lease.
- Scope impact: none; the full output is retained rather than silently filtered from the receipt.

## 2026-08-31 — Persistent network required exact owned cleanup

- Severity: operational cleanup evidence.
- Source: `receipts/d189-09a-owned-network-inspect.json` and
  `receipts/d189-09b-owned-network-remove.json`.
- Observation: after exact control stop, one empty detached custom network remained. Its creator
  PID/start labels matched the owned DCP/container evidence captured before SIGKILL.
- Resolution: removed only that exact positively proven owned network ID; foreign/unknown resources
  were never mutated. The subsequent four-part census was exact zero.
- Scope impact: none.
