# Worklog: #1751 stale sender lease recovery and resume rejection propagation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-agentic-sender-lease-recovery--1751` |
| Branch | `fix/agentic-sender-lease-recovery` |
| Archetype | Operational Archetype 6 — CLI / Tooling |
| Scope overlays | none |

## Design

Recorded before implementation. No source file has been created or changed in this phase.

### Public Surface

- `deno task agentic:runtime repair sender-lease --worktree <path> [--dry-run] [--json]` — one
  explicit, auditable repair operation; no force or directory-wide mode.
- `decideSenderOwnership(...)` — preserve-only launch ownership decision; an existing record is
  never auto-removed by launch.
- `classifySenderLeaseStaleness(...)` — pure three-signal classification used only to authorize the
  repair path.
- `codex-resume.ts` — same flags and output, but a thread/resume rejection is exit 1.
- No package export, JSR entrypoint, command name outside `agentic:runtime`, generated output, or
  consumer import changes.

Archetype-6 package spine abstracts, extension registries, templates, public/maintainer surfaces,
and generated-project validation are N/A: this is repo-internal tooling, not `packages/cli`.

### Domain Vocabulary

- `PidProbeState = 'alive' | 'dead' | 'unknown'` — one PID sample.
- `PidLivenessEvidence` — two samples plus the measured debounce interval; only two dead samples are
  negative evidence.
- `RolloutLeaseState = 'working' | 'stalled' | 'idle' | 'dead' | 'refused' | 'absent' | 'unknown'`
  — exact rollout evidence with thread/worktree identity when present.
- `ThreadWriterState = 'active' | 'idle' | 'not_loaded' | 'absent' | 'unknown'` — normalized
  app-server `thread/read` state; `systemError` normalizes to unknown.
- `SenderLeaseStaleness = 'preserve' | 'stale' | 'indeterminate'` — destructive authorization is
  possible only for `stale`.
- `SenderLeaseEvictionReason = 'restart_stale_ownership'` — finite recorded reason for #1751.
- `SenderLeaseEvictionEvidence` — redacted pre/post receipt with three evidence summaries and
  `authorized | evicted` outcome; excludes prompt, credentials, and `leaseToken`.
- `CodexResumeDisposition = 'accepted' | 'rejected' | 'failed'` — output-aware resume result.
- `CodexResumeRejectionReason = 'thread_store_active_writer'` — witnessed known-negative reason.

### What Each Signal Proves

| Signal | Positive/preserving proof | Negative contribution | Unknown handling |
| --- | --- | --- | --- |
| PID | Any alive sample preserves. | Two dead samples separated by the debounce interval. | Preserve/indeterminate. |
| Rollout | `working` or `stalled` preserves; identity mismatch conflicts. | Exact terminal snapshot or proven exact absence. | Preserve/indeterminate. |
| Thread | `active` preserves. | `idle`, `not_loaded`, or proven absence. | `systemError`, parse/transport failure, or ambiguity preserves. |

### Ports

- `SenderLeaseRepairPort.observe(worktree, record)` — obtains canonical path, debounced PID,
  strict rollout, and read-only thread evidence.
- `SenderLeaseRepairPort.persistEvidence(evidence)` — atomically stores redacted authorization and
  completion receipts.
- `SenderLeaseRepairPort.evict(worktree, leaseToken)` — exact lease-token CAS removal only.
- The local adapter uses existing filesystem/process/rollout primitives and a focused
  `thread/read` JSONL client. No generic process-kill or thread-mutation port exists.
- Resume result classification stays pure over the existing `CommandResult`; no speculative new
  transport abstraction is introduced.

### Constants

- `SENDER_PID_DEBOUNCE_MS` — named non-zero interval used and asserted by fake-clock/unit tests.
- `SENDER_LEASE_EVICTION_REASONS` — `['restart_stale_ownership']` with derived union.
- `SENDER_LEASE_EVIDENCE_SCHEMA_VERSION` — receipt schema version.
- `CODEX_THREAD_RUNTIME_STATES` — app-server state vocabulary normalized at the adapter boundary.
- `CODEX_RESUME_REJECTION_SIGNATURES` — specific structured/text signature for the witnessed
  thread-store active-writer conflict.
- Existing exit classes remain: 0 success/no-change, 1 resume/process failure, 2 resume usage;
  runtime repair uses the existing 0 success/planned, 3 usage, 4 blocked, 5 failed pattern.

### Commit Slices

RED commits are intentionally failing and must be committed before their paired GREEN commit. Each
RED record names the failing tests and real non-zero wrapper result in this worklog.

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | **RED — contract/classification:** add finite signal/result types and table tests proving restart-stale requires the full conjunction and every single/foreign/unknown/live signal preserves. | Targeted structured test wrapper exits non-zero only on the new classification expectations. | `runtime/sender-ownership.ts`, `runtime/sender-ownership_test.ts` |
| 2 | **GREEN — preserve-only launch + classifier:** implement the truth table; remove launch auto-eviction; direct existing owners to resume/repair; reconcile data-only Codex planning tests. | Exact Slice 1 test command passes; focused launch/adapters tests pass. | `runtime/sender-ownership.ts`, `codex/launch-codex-slice.ts`, `codex/launch-codex-slice_test.ts`, `runtime/adapters/codex-adapter.ts`, `runtime/adapters_test.ts` |
| 3 | **RED — repair lifecycle:** add failing tests for restart-stale apply/receipt, changed-token race, foreign/unknown no-op, strict rollout error, CLI dry-run, and a real live child/writer whose record survives. | Targeted structured repair/adapter/CLI tests exit non-zero on missing behavior; live child cleanup is bounded. | new `runtime/sender-lease-repair_test.ts`, new `runtime/adapters/local-sender-lease-repair-adapter_test.ts`, new `codex/codex-thread-read_test.ts`, new `runtime/cli/agentic-runtime_test.ts` |
| 4 | **GREEN — explicit audited repair:** add pure orchestration, strict local adapter, read-only `thread/read`, CLI subcommand, evidence-before-CAS sequencing, and real lifecycle behavior. | Exact Slice 3 command passes; restart stale evicts with receipt; active/foreign/unknown retain record; CLI exit matrix passes. | new `runtime/sender-lease-repair.ts`, new `runtime/adapters/local-sender-lease-repair-adapter.ts`, `runtime/adapters/local-sender-ownership-adapter.ts`, new `codex/codex-thread-read.ts`, `runtime/cli/agentic-runtime.ts`, plus Slice 3 tests |
| 5 | **RED — resume known-negative:** add subprocess test whose fake child prints the exact active-writer conflict and exits 0; assert wrapper code 1 and rejection text present, plus positive control. | Targeted structured test exits non-zero because current wrapper returns 0 on rejection. The test reads `Deno.Command` code directly, never a pipeline. | new `codex/codex-resume_test.ts` |
| 6 | **GREEN — rejection propagation:** add pure disposition parser and wire the wrapper so recognized rejection wins over child exit 0 while output remains unchanged. | Exact Slice 5 command passes; focused runner/compatibility tests pass. | `codex/codex-resume.ts`, new `codex/codex-resume-result.ts`, `codex/codex-resume_test.ts` |
| 7 | **Integration/docs:** reconcile #1774, document the guarded command and safety rule, run full structured agentic gates, raw diff/status checks, Tier-A substantive review, then the final CLI E2E merge-readiness gate. | Scoped check/test/lint/fmt PASS, full agentic suite PASS, `git diff --check` PASS, `deno task e2e:cli` PASS. | `.llm/tools/agentic/README.md` (shared, reconciled only), owned run artifacts; source fixes only if a gate exposes an in-scope defect |

### Deferred Scope

- Pre-thread launching-record recovery — lacks rollout/thread evidence and stays fail-closed.
- Queued-message cancellation — upstream thread-store capability outside #1751.
- Broad garbage collection/retention — unnecessary and too dangerous for this leaf.
- New task alias in `deno.json` — existing runtime task is sufficient and avoids #1774.

### Contributor Path

To add a future stale reason, start in `sender-ownership.ts` by extending the finite evidence/reason
union and truth-table tests. Add observation IO only in `local-sender-lease-repair-adapter.ts`, then
add a lifecycle case in `sender-lease-repair_test.ts`. CLI parsing remains a thin mapping in
`runtime/cli/agentic-runtime.ts`. To add a resume rejection, add the narrow signature and negative
fixture in `codex-resume-result.ts`/`codex-resume_test.ts`; never infer success from output absence
when the child exit is non-zero.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-31 | planning | Bootstrap | Read harness activation/run-loop, lane policy, Archetype 6, gate matrix, Plan-Gate, evaluator protocol, templates, and tooling/RTK skills. |
| 2026-08-31 | planning | Re-baseline | Verified branch/base/no-upstream and inspected current ownership, launch, rollout, app-server, resume, runner, and repair code. No sender record was read or changed. |
| 2026-08-31 | planning | Design | Locked three-signal fail-closed classification, explicit audited repair, known-negative exit capture, seven RED/GREEN commit slices, and intended file manifest. |
| 2026-08-31 | planning | Plan-Gate selection | PLAN-EVAL required; native Fable 5 medium opposite-family evaluator selected. Implementation hard-stopped. |
| 2026-08-31 | planning | Artifact validation | Required artifacts/sections, evaluator-file absence, untracked whitespace, and raw Git scope passed; only this run directory is untracked. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| No automatic launch eviction | Eviction is the safety-critical action and must be explicit/audited. | Plan D4; current launch lines 376-393 |
| Unknown/foreign/conflicting evidence preserves | False eviction harms another live lane. | Issue obligation 5; Plan D2/D3 |
| Test subprocess code directly | Pipeline tails mask the command status. | Owner Plan obligation; Plan D9 |
| PLAN-EVAL required | Safety-critical mutation and TOCTOU reasoning. | Harness Plan-Gate; Plan D10 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Owner supplied Codex/Sol-high for plan generation rather than canonical Claude planning lane. | minor | yes |
| Expected `rtk` binary is unavailable on this host; focused raw read-only commands were used, while verdict commands remain wrapper/raw-Git sourced. | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Branch/base/upstream | authoritative raw Git via `Deno.Command` | PASS | Exact base `5197e70b...`; expected branch; no upstream. |
| Plan artifact contract | focused Deno file/section validator + `git diff --no-index --check` | PASS | Required sections present; `plan-eval.md` correctly absent for separate evaluator authorship; whitespace clean. |
| Source check/lint/fmt | planned after implementation | NOT_RUN | No source edit is authorized in this phase. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Plan-Gate | PENDING | `research.md`, `plan.md`, this `## Design` section | Separate evaluator must write `plan-eval.md`. |
| jsr-audit | N/A | Internal `.llm/tools` surface | No package/plugin public surface. |
| Package doctrine/quality | N/A | Intended file manifest | No `packages/**` or `plugins/**` edits. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Sender lifecycle | NOT_RUN | Planned Slices 3-4 | Must use temp roots and test-owned processes only. |
| Resume known-negative | NOT_RUN | Planned Slices 5-6 | Must capture direct subprocess code and rejection string. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Compatibility wrappers | NOT_RUN | Planned Slices 6-7 | Existing command flags/task remain stable. |
| Scaffold/release consumer | N/A | Scope | No generated/published surface. |

## Handoff Notes

- PLAN-EVAL should inspect the staleness truth table, whether `idle`/`not_loaded` are sufficiently
  non-active when combined with terminal rollout + dead PID, and the re-observation/audit-before-CAS
  ordering.
- Spot-check the unsafe current auto-release at `launch-codex-slice.ts:376-393` and false-zero
  mapping at `codex-resume.ts:165-168`.
- Do not run repair or inspect the live sender registry as part of PLAN-EVAL.
