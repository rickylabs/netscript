# Worklog: issue #604 Codex quota signal

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-604-quota-signal--codex` |
| Branch | `feat/604-quota-exhausted-signal` |
| Lane | WSL Codex implementation agent under beta-7 orchestrator session `df71d36c` |
| Surface | Internal `.llm/tools/agentic` infrastructure; no package/plugin archetype |

## Design

### Public Surface

- `classifyCodexFailure(output)` returns `quota_exhausted`, `model_capacity`, or `other` as a
  discriminated union.
- `deno task agentic:codex-status` adds a bounded `failure` field for the newest rollout.

### Domain Vocabulary

- `CodexFailure` is the finite classified-failure contract.
- `resetAt` is an ISO timestamp derived from Codex's date-less clock time using the host-local
  timezone and the next occurrence of that time.

### Ports

- No new port. The classifier is pure; the existing status wrapper remains the rollout reader.

### Constants

- All volatile message patterns live in `config/codex-failure-patterns.ts`.

### Commit Slice

| # | Slice | Gate |
| --- | --- | --- |
| 1 | Classifier, newest-rollout status projection, fixtures/tests, and run evidence | Scoped agentic check/lint plus full agentic tests |

### Deferred Scope

- #603 slice-runner consumption is deferred because no #603 branch is present in this worktree;
  the classifier is self-contained for later adoption.
- Routing transitions remain owned by the existing lane policy/runtime state machine.

### Contributor Path

Update volatile message forms in `config/codex-failure-patterns.ts`; extend semantic behavior next
to `classify-codex-failure_test.ts`; consume the classifier without exposing `other.raw` in status.

## Drift

| ID | Severity | Decision |
| --- | --- | --- |
| D1 | owner-waived | PLAN-EVAL explicitly waived in the slice brief; plan recorded here before implementation. |

## Progress Log

| Date | Step | Evidence |
| --- | --- | --- |
| 2026-07-11 | Plan | Locked the classifier/config/status design above before implementation. |
| 2026-07-11 | Implementation | Added config-owned patterns, pure stdout/stderr classification, host-local reset parsing, and newest-rollout status projection. |
| 2026-07-11 | Review | Restricted rollout projection to structured error/abort records so quoted prompts cannot create false quota signals; status never exposes `other.raw`. |
| 2026-07-11 | Reconcile | #603 was not present locally, so no runner wiring was attempted; classifier remains directly importable. No PR action taken per slice brief. |

## Gate Results

| Gate | Command | Result | Evidence |
| --- | --- | --- | --- |
| Focused classifier tests | `deno test --no-lock -A .llm/tools/agentic/codex/classify-codex-failure_test.ts` | PASS | 7 passed, 0 failed; includes beta.6 text, capacity, no-time, 12h/24h, rollover, and prompt false-positive guard. |
| Agentic tests | `deno test --no-lock -A .llm/tools/agentic/` | PASS | 216 passed, 0 failed. |
| Scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/agentic --ext ts,tsx` | PASS | 92 files, 1 batch, 0 diagnostics. |
| Scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/agentic --ext ts,tsx` | PASS | 92 files, 0 findings. |
| Scoped format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/agentic --ext ts,tsx` | PASS | 92 files, 0 findings after formatting the owned test import. |
| Live status smoke | `deno task agentic:codex-status --sessions 1` | PASS | Exit 0; JSON included `failure: null` for the current non-failing rollout despite the quoted quota fixture in its prompt. |
| Whitespace | `git diff --check` | PASS | Exit 0. |
