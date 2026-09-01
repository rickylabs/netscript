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
- `SenderOwnershipDecision.kind = 'blocked' | 'repair-required' | 'available'` — the operator-facing
  launch decision does not reuse the evidence classifier's `stale` term.
- `SenderOwnershipDecision.reason` and the matching diagnostic fields distinguish `live_owner`,
  `ownership_conflict`, `provenance_unknown`, and `owner_inactive` for machine-readable routing.
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
| 4 | **GREEN — explicit audited repair:** add pure orchestration, strict local adapter, read-only `thread/read`, CLI subcommand, evidence-before-CAS sequencing, and real lifecycle behavior. Also wires D11's repair-command union path (PLAN-EVAL cycle 2 R1 correction). | Exact Slice 3 command passes; restart stale evicts with receipt; active/foreign/unknown retain record; CLI exit matrix passes. | new `runtime/sender-lease-repair.ts`, new `runtime/adapters/local-sender-lease-repair-adapter.ts`, `runtime/adapters/local-sender-ownership-adapter.ts`, new `codex/codex-thread-read.ts`, `runtime/cli/agentic-runtime.ts`, `runtime/contract.ts`, `runtime/contract_test.ts`, `runtime/planner.ts`, `runtime/planner_test.ts`, plus Slice 3 tests |
| 5 | **RED — resume known-negative:** add subprocess test whose fake child prints the exact active-writer conflict and exits 0; assert wrapper code 1 and rejection text present, plus positive control. | Targeted structured test exits non-zero because current wrapper returns 0 on rejection. The test reads `Deno.Command` code directly, never a pipeline. | new `codex/codex-resume_test.ts` |
| 6 | **GREEN — rejection propagation:** add pure disposition parser and wire the wrapper so recognized rejection wins over child exit 0 while output remains unchanged. | Exact Slice 5 command passes; focused runner/compatibility tests pass. | `codex/codex-resume.ts`, new `codex/codex-resume-result.ts`, `codex/codex-resume_test.ts` |
| 7 | **Integration/docs:** document the guarded command and safety rule against the landed #1774 README content (`a3ddcbb59`, shipped, already in the base — no reconciliation step), run full structured agentic gates, raw diff/status checks, Tier-A substantive review, then the final CLI E2E merge-readiness gate. | Scoped check/test/lint/fmt PASS, full agentic suite PASS, `git diff --check` PASS, `deno task e2e:cli` PASS. | `.llm/tools/agentic/README.md`, owned run artifacts; source fixes only if a gate exposes an in-scope defect |

### Deferred Scope

- Pre-thread launching-record recovery — lacks rollout/thread evidence and stays fail-closed.
- Queued-message cancellation — upstream thread-store capability outside #1751.
- Broad garbage collection/retention — unnecessary and too dangerous for this leaf.
- New task alias in `deno.json` — the existing `agentic:runtime` task (already in the base since #1774 shipped) is sufficient.

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
| 2026-08-31 | plan-eval | Cycle 1 | Separate evaluator returned `FAIL_PLAN`; F1-F4 were amended in D2/D7/D11 and the declared manifest. |
| 2026-08-31 | plan-eval | Cycle 2 | `plan-eval-cycle-2.md` returned `PASS` at `c13da3e23`; implementation authorized. |
| 2026-08-31 | planning | Cycle 2 residuals | Supervisor landed mandatory record corrections R1/R2 at `6e6564fba` before Slice 1 dispatch. |
| 2026-08-31 | 1 | RED contract/classification | Added the finite PID, rollout, thread, provenance, staleness, and eviction-reason contracts plus table-driven expectations. The classifier remains a fail-closed `indeterminate` seam; no launch, repair, adapter, record, or resume behavior changed. |
| 2026-08-31 | 1 | RED gate | Targeted structured test wrapper exited 1: 16 passed, 11 failed. All 11 failures are the new contract expectations (7 `preserve`, 4 `stale`); existing and new `indeterminate` cases pass. |
| 2026-08-31 | 1 | Handoff | Implementation-lane commit/push/comment is followed by a hard stop for Tier-A substantive review. Slice 2 is not dispatched. |
| 2026-08-31 | 1 | Tier-A acceptance | Coordinator and supervisor accepted the committed RED boundary at `c6dd9e363`; the test blob hash was later reconfirmed unchanged through Slice 2. |
| 2026-08-31 | 2 | GREEN accepted | Supervisor accepted `dc8361a06`: exact Slice 1 test went 27/27 green by implementation alone; focused launch/adapters were 17/17 and the full agentic suite was 515/515. |
| 2026-08-31 | 3 | RED repair lifecycle | Added only the four declared test files for audited restart-stale apply, changed-token CAS, foreign/unknown no-op, strict rollout failure, read-only thread state, CLI dry-run, and a real live child/writer whose record must survive. All sender, evidence, and session paths are test-owned/injected and assert they are not the production sender root; child cleanup is bounded and reaped in `finally`. |
| 2026-08-31 | 3 | RED gate | Exact targeted structured wrapper exited 1 with `REAL_EXIT=1`: 0 passed, 10 failed, 0 ignored. Every failure names an expected missing Slice 4 module, command, or injected CLI runner; no implementation behavior was added. |
| 2026-08-31 | 3 | Handoff | Commit/push/comment is followed by a hard stop for Tier-A substantive review. Slice 4 is not started. |
| 2026-08-31 | 4 | GREEN accepted | Supervisor verified and committed `1cfae0f39` after the implementation turn stalled: all five earlier RED blobs remained byte-identical; Slice 3 went 10/10 green; the full agentic suite went 526/526 green; scope was exactly the nine declared implementation files. |
| 2026-08-31 | 5 | RED resume known-negative | Added only the real-wrapper subprocess test. Both cases use a test-owned executable fake `bash` under `.llm/tmp`, inspect `Deno.Command(...).output().code` directly, and assert the production sender root is not used. No thread message can be delivered because the fake shell records the invocation instead of executing it. |
| 2026-08-31 | 5 | RED gate | Exact targeted structured wrapper used `out=$(cmd); rc=$?` and returned `REAL_EXIT=1`: 1 passed, 1 failed, 0 ignored. The positive accepted-child control remains exit 0. `codex resume returns non-zero when the real wrapper receives an active-writer rejection` fails with actual 0 versus expected 1 while the exact rejection text remains present. |
| 2026-08-31 | 5 | Reconcile/handoff | PR #1802 remains the single leaf PR and no scope or decision changed. Commit/push/comment is followed by a hard stop for Tier-A substantive review; Slice 6 is not started. |
| 2026-08-31 | 6 | GREEN accepted | Supervisor verified and committed `00877bcbd`: all six protected test blobs remained byte-identical; D8's pure classifier recognizes either output stream and maps only `accepted` to exit 0; Slice 5 went 2/2 and the full agentic suite went 528/528. |
| 2026-08-31 | 7 | Integration/docs drafted | Updated the current agentic README with three-signal provenance-bound staleness, preserve-only launch, explicit audited sender-lease repair, and the non-zero resume rejection contract. No main integration, E2E, Aspire, Docker, or browser gate was run. |
| 2026-08-31 | 7 | Static gate blocked | Direct capture produced check `REAL_EXIT=0` over 173 files, lint `REAL_EXIT=1` with 14 findings across 9 files outside the declared manifest, and initial format `REAL_EXIT=1` for the Slice 6 `codex-resume.ts` import layout. The authorized in-manifest formatting fix made the repeated format gate `REAL_EXIT=0` over 173 files. |
| 2026-08-31 | 7 | Blocked handoff | Per the file ceiling, no unrelated lint source was edited. The full agentic test gate, commit, explicit-refspec push, and PR comment were not run because the required lint gate cannot pass within scope. See `drift.md`. |
| 2026-08-31 | 7 | Landed | Slice 7 documentation and the declared formatting-only source correction landed at `1cf52be67`; the branch later parked at integration commit `de24161b6`. |
| 2026-08-31 | integration | Parked flake initially misattributed | Two clean reruns at `de24161b6` initially left the 4,463/1/19 failure unidentified. A later 20-run audit reproduced it twice and identified the protected local repair-adapter test's non-idempotent child cleanup. All future root runs persist `--output` reports. |
| 2026-08-31 | integration | Current main merged | Captured all six protected tests plus `deno.lock`, fetched `origin/main` as `62ea359b13b292f5f4335ff77b8b9df1ecdf5ae7`, and merged it exactly once in `2bf9ca1b2`. All seven post-merge blobs match pre-merge byte-for-byte. |
| 2026-08-31 | integration | Revalidation | Root suite 4,498/0/19 and agentic suite 531/531 passed; agentic check/lint/fmt and `arch:check` passed; three generated-corpus checks passed; MCP export-corpus freshness alone failed outside this leaf's scope. Every command used direct `out=$(cmd 2>&1); rc=$?` capture, never a pipeline. |
| 2026-08-31 | amendment | Contract RED | Added the two required profile-provenance regressions and direct operator-decision expectations. The first focused run exited 1 before implementation with 12 compile errors for the absent `profileHome`, `reason`, and `repair-required` contract. |
| 2026-08-31 | amendment | Flake repair | Authorized the protected local repair-adapter test ceiling change. `stopAndReap` now narrowly accepts only `NotFound` or `TypeError: Child process has already terminated`, retains status capture before kill, and awaits status on every path. No assertion was removed or weakened. |
| 2026-08-31 | amendment | Profile provenance | Sender records persist the exact activation `CODEX_HOME`; production repair derives its session root from that record. Legacy records still parse but produce unknown evidence without probing a default home. Apply re-observation rejects profile changes. |
| 2026-08-31 | amendment | Ownership vocabulary | Authorized the protected ownership-test ceiling change. Operator decisions now distinguish `blocked/live_owner`, `blocked/provenance_unknown`, `blocked/ownership_conflict`, and `repair-required/owner_inactive` in both the decision and emitted diagnostic. No assertion was dropped; discriminating assertions were added. |
| 2026-08-31 | amendment | Focused GREEN | Structured focused suite passed 52/52 with exit 0 after implementation. Final stress, merge, and complete gates remain pending. |
| 2026-08-31 | amendment | Final-freeze integration | Captured the amended six-test baselines plus `deno.lock`, fetched `origin/main` at `8f1fcb2bc3b9b3ef57c222825f50ee2db43a2f1d`, and merged it in `50431f9cd`. Every post-merge blob is byte-identical to its pre-merge capture. |
| 2026-08-31 | amendment | Stress gate blocked | The required 50-run full-file repetition produced exits 1 at iterations 1, 9, 23, and 40 (46/50 clean). All four failures are `pid.first` actual `dead` versus expected `alive`, not the repaired cleanup exception. A name-filtered diagnostic run made the same fixture defect deterministic. The child uses an unresolved top-level promise, which Deno exits when no pending operation remains, so it is not guaranteed live through observation. No further protected-test change was made without authorization. |
| 2026-09-01 | amendment | Stress repair authorized | The coordinator confirmed both protected-ceiling exceptions cover completing the repair. The live child now waits on parent-held stdin, an additive case sends an already-terminated child through `stopAndReap`, and every original assertion remains. The required full-file repetitions then passed 50/50; iterations 1-50 and the aggregate exit were all 0. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| No automatic launch eviction | Eviction is the safety-critical action and must be explicit/audited. | Plan D4; current launch lines 376-393 |
| Unknown/foreign/conflicting evidence preserves | False eviction harms another live lane. | Issue obligation 5; Plan D2/D3 |
| Test subprocess code directly | Pipeline tails mask the command status. | Owner Plan obligation; Plan D9 |
| PLAN-EVAL required | Safety-critical mutation and TOCTOU reasoning. | Harness Plan-Gate; Plan D10 |
| Keep `blocked` plus a structured reason | A live owner requires wait/resume, unknown provenance requires fail-closed investigation, a foreign record is an ownership conflict, and an inactive provenance-bound owner requires explicit repair. Separate reason values are carried in the decision and diagnostic so callers can branch without parsing prose. | Coordinator challenge; amendment contract |
| Preserve internal evidence term `stale` | `SenderLeaseStaleness` remains the exact three-probe authorization result; only the ambiguous operator-facing ownership kind is replaced. This retains a precise safety predicate while giving launch callers actionable outcomes. | Amendment design review |
| Missing profile provenance never falls back | A legacy record remains loadable, but probing `$HOME/.codex` could confidently inspect the wrong tree; unknown provenance therefore returns fail-closed evidence and a blocked decision. | Coordinator amendment |

### Authorized protected-ceiling changes

- `sender-ownership_test.ts`: original `74b0ba6118ec4961ed50da639791fe52e3faa09a`,
  amended baseline `978cd23d073035e1d578193a299806a0fe9b77fb`. The diff replaces the removed
  operator kind expectation and adds reason/diagnostic and legacy-provenance assertions; no assertion
  was removed or weakened.
- `local-sender-lease-repair-adapter_test.ts`: original
  `2e2817d0c27628e0f9e1ca922c47ec35738102ce`, amended baseline
  `e12c023b90b8debc66d2f6ad720f3a9b9cdd9f14`. The diff narrowly fixes
  `stopAndReap`, gives the live child a real pending stdin operation, and adds an
  already-terminated cleanup regression; no existing assertion was changed, removed, or weakened.
- The other four protected blobs remain `7be38302ac6ed20f29571213d18172283e1aded5`,
  `d3ca0b51fcb87aeee81e4202e5f527ed569fba12`,
  `7113e271dfa15e9f2dc53b6922c4d5055e086430`, and
  `546b5f0185876fd51c9b5ee28b57a19fe37562b7` respectively.

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
| Plan artifact contract | `plan-eval-cycle-2.md` plus supervisor residual commit `6e6564fba` | PASS | Cycle 2 verdict is `PASS`; mandatory R1/R2 record corrections landed before implementation. |
| Slice 1 type-check | structured `run-deno-check.ts` over the two owned TS files | PASS | 2 files selected; 0 failed batches and 0 diagnostics. |
| Slice 1 lint | structured `run-deno-lint.ts` over the two owned TS files with `--config jsr-package-settings.json` | PASS | 2 files selected and processed; 0 findings. The default root config refusal is recorded in `drift.md`. |
| Slice 1 format | structured `run-deno-fmt.ts` over the two owned TS files | PASS | 2 files selected and processed; 0 findings. |
| Slice 5 type-check | structured `run-deno-check.ts` over `codex-resume_test.ts` | PASS | 1 file selected; 0 failed batches and 0 diagnostics. |
| Slice 5 lint | structured `run-deno-lint.ts` over `codex-resume_test.ts` with `--config jsr-package-settings.json` | PASS | 1 file selected and processed; 0 findings. |
| Slice 5 format | structured `run-deno-fmt.ts` over `codex-resume_test.ts` | PASS | 1 file selected and processed; 0 findings. |
| Slice 5 scope/diff | authoritative raw Git status plus `git diff --check` | PASS | Only the new test and owned `worklog.md`/`context-pack.md` are changed; no whitespace errors. |
| Slice 7 full agentic check | structured `run-deno-check.ts --root .llm/tools/agentic --ext ts,tsx` with direct capture | PASS, exit 0 | 173 files selected in 2 batches; 0 failed batches and 0 diagnostics. |
| Slice 7 full agentic lint | structured `run-deno-lint.ts --root .llm/tools/agentic --ext ts,tsx --config jsr-package-settings.json` with direct capture | BLOCKED, exit 1 | 173 files processed; 14 findings across 9 out-of-manifest files. No finding is in the Slice 6/7 files. |
| Slice 7 full agentic format | structured `run-deno-fmt.ts --root .llm/tools/agentic --ext ts,tsx` with direct capture | PASS after in-scope fix, exit 0 | Initial run found only `codex-resume.ts`; after formatting that declared file, 173 files processed with 0 findings. |
| Slice 7 raw Git/test ceilings | authoritative raw Git status, `git diff --check`, and `git hash-object` | PASS | Diff check exit 0; only README, the formatting-only declared source fix, and three run artifacts are modified. All six protected test blobs match. |
| Diff hygiene | raw `git diff --check` | PASS | No whitespace errors across the five Slice 1 files. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Plan-Gate | PASS | `plan-eval-cycle-2.md` at `c13da3e23`; residual correction `6e6564fba` | Cycle 2 authorized implementation; R1/R2 are already corrected. |
| jsr-audit | N/A | Internal `.llm/tools` surface | No package/plugin public surface. |
| Package doctrine/quality | N/A | Intended file manifest | No `packages/**` or `plugins/**` edits. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Sender staleness contract | EXPECTED RED | `run-deno-test.ts -- --allow-all .llm/tools/agentic/runtime/sender-ownership_test.ts` | Exit 1; 16 passed, 11 failed, 0 ignored. Failures are only the 7 new `preserve` and 4 new `stale` expectations against the fail-closed seam. |
| Sender lifecycle | PASS | Supervisor verification at `1cfae0f39` | Slice 3 suite 10/10 and full agentic suite 526/526 after Slice 4. |
| Resume known-negative | EXPECTED RED | `run-deno-test.ts -- --allow-all .llm/tools/agentic/codex/codex-resume_test.ts` | `REAL_EXIT=1`; 1 passed, 1 failed. Rejected path returns actual 0 rather than expected 1; accepted path remains 0. |
| Slice 6 supervisor verification | PASS | Supervisor evidence at `00877bcbd` | Slice 5 test 2/2 and full agentic suite 528/528; all six test blobs unchanged. |
| Slice 7 full agentic suite | NOT_RUN | Required lint blocker | Stopped before this gate because a required prior gate cannot be green within the declared manifest. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Compatibility wrappers | NOT_RUN | Planned Slices 6-7 | Existing command flags/task remain stable. |
| Scaffold/release consumer | N/A | Scope | No generated/published surface. |

### Current-main integration evidence (`2bf9ca1b2`)

The root report is persisted at
`.llm/tmp/fix-agentic-sender-lease-recovery--1751/integration-2bf9ca1b2/root-suite.json`; the scoped
agentic report is beside it as `agentic-suite.json`. `.llm/tmp` is ignored and neither report is
committed. Every exit below was captured directly with `out=$(cmd 2>&1); rc=$?`; no pipeline was
used.

| Gate | Exit | Result |
| --- | ---: | --- |
| Root structured suite (`--output .../root-suite.json --pretty`) | 0 | 4,498 passed / 0 failed / 19 ignored / 4,517 total |
| Full `.llm/tools/agentic` suite (`--output .../agentic-suite.json --pretty`) | 0 | 531 passed / 0 failed / 0 ignored |
| Scoped agentic check | 0 | 174 files, 2 batches, 0 failed batches, 0 diagnostics |
| Scoped agentic lint with `jsr-package-settings.json` | 0 | 174/174 processed, 0 findings |
| Scoped agentic format | 0 | 174/174 processed, 0 findings |
| `deno task arch:check` | 0 | No blocking dependency or doctrine findings; existing warnings remain non-fatal |
| `deno task check:mcp-export-corpus` | 1 | Stale MCP export-surface corpus; out of #1751 scope, not regenerated |
| `deno task check:assets-barrel` | 0 | Generated asset barrels fresh; no diff left behind |
| `deno task check:agent-docs-prose` | 0 | `fresh: true`, no stale paths |
| `deno task check:publish-assets` | 0 | Publish assets fresh |
| `git diff --exit-code -- deno.lock` | 0 | No lockfile diff; blob stayed `a1522e6ecc98dd4232312385b0cea4e52f5fa4b2` |
| Raw `git status --short --branch` before artifact edits | 0 | Clean integrated worktree |
| Raw `git diff --check` before artifact edits | 0 | No whitespace errors |

Protected tests were captured independently before and after the merge and remained:

- `sender-ownership_test.ts` — `74b0ba6118ec4961ed50da639791fe52e3faa09a`
- `sender-lease-repair_test.ts` — `7be38302ac6ed20f29571213d18172283e1aded5`
- `local-sender-lease-repair-adapter_test.ts` — `2e2817d0c27628e0f9e1ca922c47ec35738102ce`
- `codex-thread-read_test.ts` — `d3ca0b51fcb87aeee81e4202e5f527ed569fba12`
- `agentic-runtime_test.ts` — `7113e271dfa15e9f2dc53b6922c4d5055e086430`
- `codex-resume_test.ts` — `546b5f0185876fd51c9b5ee28b57a19fe37562b7`

## Handoff Notes

- PLAN-EVAL should inspect the staleness truth table, whether `idle`/`not_loaded` are sufficiently
  non-active when combined with terminal rollout + dead PID, and the re-observation/audit-before-CAS
  ordering.
- Spot-check the unsafe current auto-release at `launch-codex-slice.ts:376-393` and false-zero
  mapping at `codex-resume.ts:165-168`.
- Do not run repair or inspect the live sender registry as part of PLAN-EVAL.

## Slice 1 RED Evidence

The committed RED boundary is intentional and precedes Slice 2's behavior implementation.

| Evidence | Result | Detail |
| --- | --- | --- |
| Targeted test | EXPECTED RED, exit 1 | 27 total: 16 passed, 11 failed, 0 ignored; two grouped assertion shapes (`indeterminate` vs expected `preserve` for 7 cases, and `indeterminate` vs expected `stale` for 4 cases). |
| Type-check | PASS | Structured wrapper selected both owned TS files; 0 failed batches/diagnostics. |
| Lint | PASS | Structured wrapper processed both files with explicit checked-in root-local config; 0 findings. |
| Format | PASS | Structured wrapper selected and processed both files; 0 findings. |

The failing test names cover the full stale conjunction (terminal and proven-absence forms), each
negative signal in isolation, alive PID evidence, working/stalled rollout, and an active writer.
Foreign ownership, unknown signals, provenance/identity mismatch, insufficient debounce, missing
session identity, and conflicting absence remain fail-closed and already pass as `indeterminate`.
At the Slice 1 RED boundary, Tier-A review and Slice 2 had not started; the later progress rows above
record their acceptance and completion.

## Slice 3 RED Evidence

The exact focused command used real shell exit capture (`out=$(cmd); rc=$?`) and did not use a
pipeline. Its structured result was `REAL_EXIT=1`, 10 total, 0 passed, 10 failed, 0 ignored, with
the following failing test names:

1. `restart-stale apply persists both evidence passes before exact-token eviction`
2. `foreign ownership is a no-op before probing or receipt persistence`
3. `unknown evidence is fail-closed with no receipt or eviction`
4. `changed-token CAS race retains the replacement sender record`
5. `strict rollout inventory errors stay unknown rather than proven absent`
6. `a real live child writer preserves its sender record and is boundedly reaped`
7. `thread/read request is read-only and normalization preserves systemError as unknown`
8. `thread/read parser distinguishes a bound not-loaded thread from JSON-RPC absence`
9. `runtime CLI parses one sender-lease dry-run through the guarded planner command`
10. `runtime CLI dry-run uses injected roots and reports planned without mutation`

The grouped failure reasons are the three absent Slice 4 modules
(`sender-lease-repair.ts`, `local-sender-lease-repair-adapter.ts`, and `codex-thread-read.ts`), the
currently unsupported `repair sender-lease` CLI parse, and the absent injected CLI runner. This is
the intended pre-implementation RED shape. Structured check, lint, and non-mutating format wrappers
over the four owned test files each passed with four files selected and zero diagnostics/findings.

## Slice 5 RED Evidence

The exact focused command used real shell exit capture (`out=$(cmd); rc=$?`) and no pipeline. The
structured result was `REAL_EXIT=1`, 2 total, 1 passed, 1 failed, 0 ignored. The failing test was:

1. `codex resume returns non-zero when the real wrapper receives an active-writer rejection`

The failure is the intended missing Slice 6 behavior: the subprocess code read directly from
`Deno.Command(...).output().code` was `0`, while the test expects `1`. The exact
`thread-store conflict: already has an active writer` text was present. The positive control
`codex resume keeps an accepted child result at exit zero` passed. Both cases spawn the real
`codex-resume.ts` wrapper with a test-owned executable fake `bash`; its trace proves it received the
wrapper's `-lc` command, but it never executes Codex or sends a thread message. The fixture root is
under ignored `.llm/tmp`, asserts it is outside the production sender registry, and is removed in
`finally`. Structured check, lint, and non-mutating format wrappers each selected the one owned test
file and passed with zero diagnostics/findings. The committed-ceiling candidate blob is
`546b5f0185876fd51c9b5ee28b57a19fe37562b7`; the five earlier RED blobs were independently
rechecked and remain exactly `74b0ba6118ec4961ed50da639791fe52e3faa09a`,
`7be38302ac6ed20f29571213d18172283e1aded5`,
`2e2817d0c27628e0f9e1ca922c47ec35738102ce`,
`d3ca0b51fcb87aeee81e4202e5f527ed569fba12`, and
`7113e271dfa15e9f2dc53b6922c4d5055e086430`.

During fixture development, the first fake shell was created under the host's no-exec system temp
mount. Executable lookup fell through to the real shell once and the wrapper targeted the fixed
fixture UUID; Codex returned `no rollout found for thread id` before accepting or queueing any
message. The final committed test eliminates that fallback: the fake is under executable, ignored
`.llm/tmp`, and the spawned wrapper's `PATH` contains only the fake-bin directory. No production
sender path was read or mutated.
