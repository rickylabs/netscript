# Plan: #1751 stale sender lease recovery and resume rejection propagation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-agentic-sender-lease-recovery--1751` |
| Branch | `fix/agentic-sender-lease-recovery` |
| Base | `main` @ `5197e70b716eafb82fbb12ddb9a910c248ddb86a` |
| Milestone / taxonomy | `0.0.7`; `type:fix`; `area:tooling`; `priority:p1`; `Refs #574` (metadata only; this phase changes none) |
| Phase | `plan` → selected PLAN-EVAL hard stop |
| Target | `.llm/tools/agentic` internal CLI/runtime safety tooling |
| Archetype | Operationally Archetype 6 — CLI / Tooling |
| Scope overlays | none |

## Archetype

Archetype 6 is the smallest useful validation shape because the affected surface is a user-run
command flow (`agentic:runtime`, Codex launch, and Codex resume) with durable state and process/file
adapters. This is not a published `packages/**` CLI package, so the greenfield package folder shape,
JSR gates, and package doctrine verdict do not apply literally. The relevant Archetype-6 constraints
are thin CLI composition, side effects at adapter/CLI edges, semantic lifecycle tests, finite exit
codes, and no `Deno.exit` below a CLI edge.

## Current Doctrine Verdict

N/A to this internal `.llm/tools` surface. The measured doctrine verdict covers `packages/*` and
`plugins/*`; neither denominator changes. No architecture-debt entry is created or closed.

## Axioms in Play

| Principle | Why it matters |
| --- | --- |
| Contract before behavior | The staleness inputs, decision union, eviction receipt, and resume disposition are finite types before any mutation or exit-code behavior changes. |
| Explicit side-effect edge | PID, rollout, app-server, evidence-file, and record-removal effects live behind the local repair adapter; pure classification remains testable. |
| Fail closed on unknown ownership | A foreign/malformed record, unreadable inventory, thread error, signal mismatch, or race preserves the record. |
| Wrap existing primitives | Reuse the sender CAS store, rollout parser, app-server JSONL protocol, and existing `agentic:runtime` repair entry point. |

## Goal

Make stale sender ownership recoverable without risking a live lane: classify staleness only from
debounced PID, rollout, and authoritative thread-state evidence; expose an explicit audited repair
command; and guarantee a printed resume rejection produces a non-zero command exit.

## Scope

- Define finite three-signal staleness and resume-result contracts.
- Remove automatic stale-record deletion from Codex launch.
- Add `deno task agentic:runtime repair sender-lease --worktree <canonical-path>
  [--dry-run] [--json]`.
- Re-observe immediately before mutation, persist an auditable finite reason, and remove only the
  exact lease-token-matched record.
- Propagate the known thread-store resume rejection as exit 1 while preserving its output.
- Add RED-before-GREEN unit, adapter, CLI, and lifecycle coverage for restart-stale ownership, a
  real live owner/writer that must remain, foreign/unknown ownership, and resume rejection.
- Update the canonical agentic README only after reconciling #1774's concurrent edit.

## Non-Scope

- No sender record, Codex thread, rollout, daemon, socket, or process is inspected or mutated during
  this Research + Plan phase.
- No generic force-delete flag, broad sender-directory sweep, PID kill, daemon restart, or thread
  archive/delete operation.
- No cancellation or draining of a message already queued by upstream Codex after a rejected
  resume; #1751 requires truthful delivery status, not a thread-store redesign.
- No changes to routing policy, model configuration, `deno.lock`, caches, packages/plugins, release
  behavior, labels, milestones, PRs, or merges.
- No `deno.json` edit; the existing `agentic:runtime` task already has the required permissions.

## Hidden Scope

- The current launch path must stop auto-releasing records even after a classifier calls them stale;
  otherwise the explicit audit command can be bypassed.
- Rollout inventory errors must remain distinct from proven absence. The current forgiving resolver
  cannot be used as eviction evidence without a strict adapter result.
- Repair apply must repeat the complete observation after dry-run/initial classification and before
  lease-token CAS removal to narrow the live-writer race.
- The audit must be durable before deletion. A post-delete finalization failure must leave at least
  an `authorized` receipt rather than an unaudited disappearance.
- `planCodexCommand` and its tests consume the old two-boolean ownership observation and must be
  reconciled with the new preserve-only launch decision.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Introduce `PidLivenessEvidence`, `RolloutLeaseEvidence`, `ThreadWriterEvidence`, `SenderLeaseStalenessObservation`, and a `preserve \| stale \| indeterminate` result before behavioral edits. | Names every input and prevents booleans from erasing unknown/mismatch provenance. |
| D2 | Stale requires two dead PID samples separated by `SENDER_PID_DEBOUNCE_MS`, plus an exact inactive/absent rollout, plus `thread/read` reporting `idle`, `not_loaded`, or proven absence. | No single signal evicts. Positive, stalled, contradictory, malformed, or unknown evidence preserves. |
| D3 | `active` thread state, any alive PID sample, `working`/`stalled` rollout, worktree/thread mismatch, `systemError`, unreadable inventory, missing session identity, or foreign record is non-evictable. | False-positive eviction has cross-lane destructive impact; conservative false-blocking is recoverable. |
| D4 | Launch never evicts. An existing record returns `duplicate_sender_risk`/`ownership_conflict` with an operator action to resume or run the explicit repair command. | Separates detection from the dangerous mutation and guarantees audit cannot be bypassed. |
| D5 | Repair is the narrow `agentic:runtime repair sender-lease` subcommand, supports dry-run, accepts no force flag, targets one canonical worktree, and never scans the sender directory. | Reuses the repo-native guarded repair surface and avoids the #1774-conflicted `deno.json`. |
| D6 | Apply re-reads the unchanged lease token, repeats all probes, atomically writes an `authorized` redacted receipt, CAS-removes the exact record, then finalizes the receipt as `evicted`. | Makes the decision auditable and bounds time-of-check/time-of-use drift. Unknown or changed state aborts. |
| D7 | The receipt stores a finite reason (`restart_stale_ownership`), record identity without `leaseToken`, all three evidence summaries, timestamps, worktree/session identity, and `authorized \| evicted` outcome. | Operators can explain why eviction was permitted without persisting prompts, credentials, or the lease secret. |
| D8 | Resume outcome is `accepted \| rejected \| failed`. The known `thread-store conflict: already has an active writer` signature forces exit 1 even when the child exits 0; output remains present. | A printed rejection cannot be reported as delivery success. |
| D9 | The known-negative resume test spawns the real wrapper behind a test-owned fake `bash`, then inspects the subprocess code and combined output directly. | Proves the OS-visible exit contract without sending a message and avoids pipeline-status false evidence. |
| D10 | PLAN-EVAL is required and uses a fresh native Fable 5 medium session. | Eviction and live-writer race decisions are safety-critical and benefit from adversarial review. |

### Staleness truth table

`stale` is reachable only from the two compatible conjunctions below; everything else is
`preserve` (positive live evidence) or `indeterminate` (unknown/conflict).

| PID evidence | Rollout evidence | Thread evidence | Result |
| --- | --- | --- | --- |
| two debounced dead samples | exact terminal `idle` / `dead` / `refused`, matching session + worktree | `idle` / `not_loaded` / `absent` | `stale` |
| two debounced dead samples | proven absent from a readable exact inventory | proven absent | `stale` |
| any other combination | any | any | never `stale` |

In particular, `stalled` is never terminal; rollout-absent plus thread-present is conflicting; and a
launching record without a session id lacks two of the required signals and remains fail-closed.

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Three-signal truth table | resolved now | Locked in D2/D3 and must not be weakened during implementation. |
| Mutation/audit ordering | resolved now | Locked in D6; an authorization receipt exists before CAS removal. |
| Repair command placement | resolved now | Locked in D5 under the existing task; no root task addition. |
| Exact upstream rejection taxonomy beyond the witnessed active-writer conflict | safe to defer | Treat other non-zero child results as `failed`; add new structured rejection reasons only from observed evidence. |
| Cancellation of an upstream message that was already queued despite rejection | safe to defer | Separate upstream capability; truthful non-zero propagation is the accepted #1751 obligation. |
| Automatic cleanup of pre-thread (`launching`, no session id) records | safe to defer | Required three-signal evidence is unavailable, so this issue intentionally fails closed. |
| README merge timing with #1774 | safe to defer until final docs slice | Reconcile the current `main`/landed #1774 version before the one small README edit; never overwrite it wholesale. |

No open decision would force implementation rework if deferred.

## Risk Register

| Risk | Mitigation |
| --- | --- |
| False-positive eviction steals a live lane. | Three-signal conjunction, explicit apply, full re-observation, exact worktree/session matching, and lease-token CAS; no force path. |
| A permission/race error looks like a missing rollout. | Strict adapter result has `unknown`; only a successful readable inventory can yield `absent`. |
| PID reuse makes a dead owner appear alive. | Preserve the lease. This is a safe false negative, never grounds eviction. |
| Writer becomes active between probe and remove. | Re-run the whole observation immediately before CAS, keep the window effect-local, abort on any changed record/state, and exercise active-writer lifecycle coverage. PLAN-EVAL must challenge this mitigation. |
| Audit finalization fails after deletion. | Persist `authorized` atomically first; report `changed: true`/failure if finalization fails so an auditable reason survives. |
| Rejection matcher mistakes ordinary prose for a real rejection. | Match the specific thread-store conflict signature in process output, not generic words such as “rejected” or quoted user content; pin positive and negative fixtures. |
| Test claims exit behavior through a pipeline tail. | Use `Deno.Command.output().code`, or shell `out=$(cmd); rc=$?`; forbid `cmd | tail` in tests/gates. |
| Real-process lifecycle test flakes. | Use a test-owned child with readiness handshake and bounded cleanup, not arbitrary sleeps or host PIDs. |
| Tests touch the operator's live sender registry. | Inject temp sender/evidence/session roots; assert production `$HOME/.config/.../senders` is never a test path. |
| #1774 conflicts in shared files. | No `deno.json` edit. Isolate README to final slice and reconcile after #1774; record any divergence in `drift.md`. |

## Anti-Patterns to Resolve or Avoid

| AP / concern | Status | Plan |
| --- | --- | --- |
| AP-11 / AP-25 side effects outside adapters | risk | Keep PID, filesystem, app-server, clock, evidence, and removal effects behind the local repair adapter/CLI edge. |
| AP-18 giant snapshots | risk | Assert typed decisions, retained/deleted record, receipt reason/outcome, process exit, and rejection substring semantically. |
| AP-1 command monolith | risk | Pure contract/classifier, repair orchestration, local adapter, thread-read protocol, and CLI parsing remain separate focused files. |
| Unknown-as-absent collapse | existing defect risk | Introduce explicit `unknown`; never reuse the forgiving rollout resolver as destructive evidence. |

## Intended File Manifest

No file outside this list is intended. A new need triggers plan/drift review before editing.

### Contracts and repair behavior

- `.llm/tools/agentic/runtime/sender-ownership.ts`
- `.llm/tools/agentic/runtime/sender-ownership_test.ts`
- `.llm/tools/agentic/runtime/sender-lease-repair.ts` (new)
- `.llm/tools/agentic/runtime/sender-lease-repair_test.ts` (new)
- `.llm/tools/agentic/runtime/adapters/local-sender-ownership-adapter.ts`
- `.llm/tools/agentic/runtime/adapters/local-sender-lease-repair-adapter.ts` (new)
- `.llm/tools/agentic/runtime/adapters/local-sender-lease-repair-adapter_test.ts` (new)
- `.llm/tools/agentic/codex/codex-thread-read.ts` (new)
- `.llm/tools/agentic/codex/codex-thread-read_test.ts` (new)

### Command integration and launch safety

- `.llm/tools/agentic/runtime/cli/agentic-runtime.ts`
- `.llm/tools/agentic/runtime/cli/agentic-runtime_test.ts` (new)
- `.llm/tools/agentic/codex/launch-codex-slice.ts`
- `.llm/tools/agentic/codex/launch-codex-slice_test.ts`
- `.llm/tools/agentic/runtime/adapters/codex-adapter.ts`
- `.llm/tools/agentic/runtime/adapters_test.ts`

### Resume rejection

- `.llm/tools/agentic/codex/codex-resume.ts`
- `.llm/tools/agentic/codex/codex-resume-result.ts` (new)
- `.llm/tools/agentic/codex/codex-resume_test.ts` (new)

### Documentation and run evidence

- `.llm/tools/agentic/README.md` — **shared with #1774; final isolated reconciliation only**.
- `.llm/runs/fix-agentic-sender-lease-recovery--1751/{supervisor,research,plan,worklog,context-pack,drift,plan-eval}.md`

### Explicitly not edited

- `deno.json` — **shared with #1774; no edit required** because `agentic:runtime` already exists.
- `deno.lock`, `.llm/harness/workflow/lane-policy.md`, routing/model config, sender records, and all
  package/plugin files.

## Fitness and Gate Selection

| Gate | Required | Expected evidence |
| --- | --- | --- |
| Scoped type-check | yes | Structured `run-deno-check.ts` over `.llm/tools/agentic` passes. |
| Scoped test | yes | Structured `run-deno-test.ts` targeted RED/GREEN receipts during slices; full agentic suite passes at final head. |
| Scoped lint | yes | Structured `run-deno-lint.ts` over `.llm/tools/agentic` passes. |
| Scoped format | yes | Structured `run-deno-fmt.ts` over owned TS files passes. |
| Archetype-6 structural review | yes, manual | CLI stays thin; Deno/process/filesystem effects remain in CLI/adapters; focused files remain below relevant manual caps. |
| Runtime lifecycle | yes | Temp-root restart-stale apply succeeds with receipt; real live child/writer remains blocked and record survives; unknown/foreign cases mutate nothing. |
| Resume known-negative | yes | Wrapper subprocess exits non-zero and retains the exact rejection string despite fake child exit 0. |
| Compatibility wrapper | yes | Existing task/flags remain; `compatibility-wrappers_test.ts` stays green. |
| Agentic full suite | yes | Full `.llm/tools/agentic/` test run through the structured wrapper. |
| CLI E2E merge readiness | yes, final only | `deno task e2e:cli` passes before branch is called merge-ready; not an intermediate loop. |
| `quality:gate`, `arch:check`, jsr-audit, publish/doc-lint | N/A | No `packages/**` or `plugins/**` source/public surface changes. |
| Release-gate class / `scaffold.runtime` | N/A | No scaffold, plugin copy, DB wiring, Aspire generation, or release-cut surface changes. |

## Validation Plan

All TS check/test/lint/fmt verdicts use the structured wrappers. RED commits record the expected
non-zero result and the named failing test; GREEN commits rerun the exact command to zero.

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Targeted contract/lifecycle tests | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all <owned *_test.ts files>` | RED on the committed failing-test slice; PASS after its paired GREEN slice. |
| 2 | Scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/agentic --ext ts,tsx` | PASS with zero failed entries. |
| 3 | Scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/agentic --ext ts,tsx` | PASS. |
| 4 | Scoped format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/agentic --ext ts,tsx` | PASS; no mutating root format task. |
| 5 | Full agentic tests | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all .llm/tools/agentic/` | PASS, including compatibility and lifecycle cases. |
| 6 | Known-negative exit inspection | Test-owned `Deno.Command` invocation of `codex-resume.ts`; inspect `.code` and combined stdout/stderr directly. | Code `1`; exact active-writer rejection present. No pipeline. |
| 7 | Diff hygiene | raw `git diff --check` plus authoritative raw Git status | PASS; no lock/source drift outside manifest. |
| 8 | Merge readiness | `deno task e2e:cli` | PASS once, after implementation/evaluation fixes and before ready-for-merge claim. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `.llm/harness/debt/arch-debt.md` | none | No relevant existing debt and no package/plugin doctrine debt introduced. |

## Deferred Scope

- Generic recovery for pre-thread launching records, because the required rollout/thread signals do
  not exist.
- Upstream queue cancellation after a rejected resume.
- Generalized Codex error-code taxonomy beyond the witnessed conflict.
- Automated multi-record garbage collection or retention policy.

## Dependencies

- Existing `LocalSenderOwnershipAdapter` CAS operations.
- Existing rollout parser/tail helpers, used behind a strict observation adapter.
- Codex app-server 0.151.0 `thread/read` request/response contract.
- Existing `agentic:runtime` CLI/task permissions.
- #1774 reconciliation before the README slice.

## Drift Watch

- Any need to add a force flag, scan multiple sender records, mutate a Codex thread, or alter the
  three-signal truth table is significant rescope.
- Any source file outside the intended manifest, especially `deno.json` or files touched by #1774,
  must be logged before edit.
- If `thread/read` behavior differs from the generated 0.151.0 schema on the implementation host,
  stop and return to PLAN-EVAL rather than infer absence from an error.

## PLAN-EVAL

Selected and required. This plan creates an eviction path whose false positive can steal a live
lane's lease. A separate native Anthropic Fable 5 medium session must read the Plan-Gate protocol,
spot-check current code, challenge D2/D3/D6 and the active-writer race, and write `plan-eval.md`.
Implementation is prohibited until the verdict is `PASS`.
