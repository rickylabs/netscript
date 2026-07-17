# Drift Log — fix #791 Aspire/CLI generator emission

## 2026-07-16 — prior branch unavailable as a remote head

- **What:** `git fetch origin fix/781-beta10-stabilization` failed because the remote ref no longer
  exists.
- **Expected:** Fetch the named prior branch and read its re-baseline.
- **Actual:** The shared checkout preserves the full branch at local ref `4e9113e`; the requested
  research file was read from that immutable commit.
- **Severity:** minor.
- **Action:** Use the local ref as the preserved source and record its commit hash.

## 2026-07-16 — base advanced beyond the carried re-baseline

- **What:** The prior research was based on `0daa575b`; the current origin base is `7d353be`.
- **Actual:** DB CLI-mode task argv is already clean on the newer base, while the app/Tauri/task and
  tool generators still emit the invalid flag. All other #791 findings remain reproducible in
  their stated owner.
- **Severity:** minor.
- **Action:** Preserve the already-correct DB CLI path and narrow finding 2 edits to remaining
  task-backed generators.

## 2026-07-16 — service overlay references absent legacy docs

- **What:** `SCOPE-service.md` references `.claude/04-services.md` and
  `.claude/06-infrastructure.md`.
- **Actual:** Neither file exists in this checkout.
- **Severity:** minor.
- **Action:** Use the current service overlay, Aspire topology/generator source, and repository
  doctrine as authority; do not create replacement docs in this fix slice.

## 2026-07-16 — evaluator dispatch retained by supervisor

- **What:** Harness normally requires separate PLAN-EVAL and IMPL-EVAL sessions.
- **Actual:** The owner explicitly reserved all evaluator triggers for the supervisor.
- **Severity:** minor workflow constraint.
- **Action:** This session prepares artifacts and implementation evidence but does not dispatch or
  self-certify either evaluator pass.

## 2026-07-16 — supervisor authorizes implementation without a plan-eval artifact

- **What:** The implementation lane stopped after plan commit `79ccd9bb` because no separate-session
  `plan-eval.md` existed.
- **Actual:** The supervisor recorded the plan commit and PR #795, then explicitly instructed this
  lane to continue the locked implementation while retaining evaluator dispatch externally.
- **Severity:** significant workflow override.
- **Action:** Treat the supervisor's written continuation as the user-authorized Plan-Gate waiver
  permitted by `run-loop.md`; do not fabricate a PLAN-EVAL verdict or artifact.
