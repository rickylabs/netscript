# Drift Log: OMB S4 OpenAPI projection domain

Drift is append-only.

## 2026-08-04 — Milestone PLAN-EVAL composition

- **What:** The standard local formal PLAN-EVAL session is replaced by the milestone-run composed
  evaluation path.
- **Source:** User directive citing `.llm/harness/workflow/milestone-run.md` § Evaluator protocol and
  orchestrator ruling D6.
- **Expected:** Ordinary `run-loop.md` launches a separate local PLAN-EVAL before implementation.
- **Actual:** No local PLAN-EVAL is spawned or awaited; the plan is locked and implementation begins
  in the same run. Draft→ready augment review, OpenHands, and the orchestrator pre-merge gate compose
  evaluation.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `plan-eval.md`; `worklog.md` Plan Gate row.

## 2026-08-04 — Supervisor route assignment

- **What:** The owner assigned the current Codex session as the PR implementation supervisor.
- **Source:** User task contract.
- **Expected:** Canonical primary `planning_decisions` route is Fable 5 low.
- **Actual:** Current Codex session owns planning/merge authority; implementation and opposite-family
  review still use their bound routes.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md`.

## 2026-08-04 — MCP package test task temp-write permission

- **What:** The package test task gained test-only write permission.
- **Source:** Slice 4 package gate.
- **Expected:** Existing `deno task test` passes without changing its task permissions.
- **Actual:** Three pre-existing tests call `Deno.makeTempDir()` and the task omitted `--allow-write`,
  producing permission-only failures after 74 tests passed. Running the identical suite with write
  permission passed, so the package task was corrected and then passed 78/78.
- **Severity:** minor
- **Action:** accept
- **Boundary:** No published/runtime permission, projection I/O, or production behavior changed.
- **Evidence:** `packages/mcp/deno.json`; `worklog.md` Package tests row.

## 2026-08-04 — Scoped lint/format explicit package config

- **What:** Final lint and format wrappers were rerun with `--config packages/mcp/deno.json`.
- **Source:** Slice 5 validation.
- **Expected:** Scoped wrappers launched from the repo root inherit the root config.
- **Actual:** Deno 2.9.3 rejected the root string-array `workspace` shape before examining source,
  producing zero lint/format findings but non-zero tool exits. The same wrappers, file selection,
  and non-mutating modes passed against the owned package config (77 files, zero findings).
- **Severity:** minor
- **Action:** accept
- **Boundary:** Root config migration is repo-wide and out of scope; no config or lockfile was changed.
- **Evidence:** `worklog.md` final scoped lint/format rows.

## 2026-08-04 — OpenHands provider-prefixed model identifier

- **What:** The independent evaluator required one corrected dispatch.
- **Source:** Composed IMPL-EVAL handoff.
- **Expected:** The lane-policy model id `qwen/qwen3.7-max` runs through the OpenRouter workflow.
- **Actual:** Actions run `30861232769` failed before token use or verdict because the OpenHands SDK
  required the LiteLLM-compatible `openrouter/qwen/qwen3.7-max` identifier. The dispatcher accepted
  that corrected approved route in dry-run; run `30861395106` then completed successfully with a
  formal `PASS` and committed `evaluate.md`.
- **Severity:** minor
- **Action:** accept
- **Boundary:** No implementation source or lockfile was changed by either evaluator run.
- **Evidence:** PR comments `5172694135` and `5172753320`; Actions runs `30861232769` and
  `30861395106`.

## 2026-08-04 — Augment composed reviewer unavailable

- **What:** The draft-to-ready Augment path did not produce a review.
- **Source:** Composed milestone evaluation.
- **Expected:** Augment supplies the draft-to-ready review component.
- **Actual:** The bot reported that the account had no review credits. The separate OpenHands
  evaluator completed with `PASS` and found no substitute blocker; the milestone orchestrator
  retains the final pre-merge ruling.
- **Severity:** minor
- **Action:** accept
- **Evidence:** PR comment `5172543505`; `evaluate.md` External Composed-Path Evidence.

## 2026-08-04 — Stage-D undeclared command-surface correction

- **What:** The changed-file audit found a command policy/port directory regroup and its dependent
  import edits in the lane diff without an acceptance-row declaration.
- **Source:** Milestone orchestrator Stage-D ruling on PR 1195.
- **Expected:** This lane ships only the S4 OpenAPI projection domain; command execution remains in
  the separately gated execution fork.
- **Actual:** The first implementation head also moved the existing command policy, catalog port,
  executor port, and their consumers into `domain/command/` to reduce doctrine cardinality.
- **Severity:** significant
- **Action:** unwind
- **Boundary:** The OpenAPI projection imports none of the command surface. The exact rejected head
  is preserved on remote branch `feat/mcp-command-policy-parked`; the PR restores every command
  file and consumer to the fixed base before re-running gates.
- **Evidence:** parked head `c0aae1a40bcd6a5a42afb9f282ff39b7ac3dce3a`; reduced-diff audit and
  gate rows in `worklog.md`.
