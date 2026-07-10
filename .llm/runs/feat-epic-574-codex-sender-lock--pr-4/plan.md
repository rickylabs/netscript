# Plan: Codex single-sender ownership and safe remote recovery (#580)

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `feat-epic-574-codex-sender-lock--pr-4` |
| Branch | `feat/epic-574-codex-sender-lock` |
| Phase | `plan` |
| Target | `.llm/tools/agentic` internal runtime tooling |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `docs` (README and run evidence) |

## Archetype and Doctrine Verdict

Archetype 6 applies because this work owns CLI lifecycle commands and OS/process adapters. The codebase verdict marks `@netscript/cli` for restructuring, but this internal tool surface is outside that package; new files still follow thin CLI, explicit ports, edge-only effects, and bounded-file rules. No package doctrine debt is created or deepened.

## Goal

Make duplicate Codex sends impossible before rival spawn and implement honest, inspected, anchored recovery for managed, unmanaged, stale-socket, disconnected, and version-skew app-server states while preserving the existing runtime contracts and later-issue boundaries.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| L1 | Extend `runtime/*` contracts/actions/ports; do not introduce a parallel controller or result schema. | Required by the issue and preserves #576–#579 compatibility. |
| L2 | Store one JSON ownership record per canonical native worktree under the NetScript agentic state root; filename is a deterministic fingerprint. | Durable across processes, collision-safe, and avoids exposing paths in filenames. |
| L3 | Record schema version, canonical worktree, owner PID, thread/session ID when known, state (`launching`/`active`/`idle`), timestamps, and a random lease token; never record prompt, credentials, user identity, or command text. | Minimum auditable ownership without sensitive payloads. |
| L4 | Acquire with atomic create; validate an existing record against injected PID/session observation. Live `launching` or `active` ownership blocks before any process spawn and returns resume guidance. | Deterministic single sender; time is not ownership truth. |
| L5 | Resume requires the existing session/thread and never acquires a rival launch owner or calls `send-message-v2`. | Steering continues the same mobile-visible thread. |
| L6 | Diagnose daemon state as `managed`, `unmanaged`, `stale_socket`, `disconnected`, `version_skew`, or `absent`, with observed CLI/daemon versions, socket state, remote-control state, anchored PIDs, active sessions, and child commands. | Acceptance requires explicit skew and lifecycle diagnosis. |
| L7 | Repair preflight refuses any active session/turn or active child command. It also refuses any PID outside anchored `$HOME/.codex/.../codex app-server` argv and any socket outside the single known control-socket path. | No interruption of active work and no broad process killing. |
| L8 | Apply order is inspect → anchored PID termination → known stale socket removal (only when diagnosed stale) → managed restart/pair → verify connected/version-aligned → persist redacted evidence. | Recovery is explainable, testable, and fail-closed. |
| L9 | OS/process/filesystem operations live behind injected ports; tests use fixtures/dry-run and never destroy the actual daemon. | Meets safety requirement. |
| L10 | Interactive mobile/sleep/network reconnect canaries are recorded owner-accepted-working, not executed or represented as raw evidence. | Honors owner directive while keeping runtime detection honest. |
| L11 | #581 global routing/default migration and #582 rollout/model promotion remain absent and regression-tested. | Locked issue boundary. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Exact state-root helper reuse after focused implementation inspection | safe to defer | Must reuse the existing state adapter/root; does not change the ownership schema. |
| Whether diagnosis is one file or split state/adapter files | safe to defer | Follow the 350 LOC adapter cap; split only by named responsibility. |
| Live reconnect canary scheduling | safe to defer | Owner-accepted; owned by coordinator/rollout, not code correctness here. |
| Lock format, stale semantics, repair anchoring, refusal policy | resolved now | Locked in L2–L9. |

## Scope

- Durable worktree sender ownership used by Codex launch planning/execution.
- Resume guidance for an already-owned worktree.
- Explicit daemon/control-socket/version/connectivity diagnosis.
- Safe repair plan/apply through injected adapters, plus redacted recovery evidence.
- CLI/README documentation and non-interactive tests.

## Non-Scope / Deferred Scope

- #581 routing policy or global default migration.
- #582 rollout, sole-supervisor promotion, or GPT-5.6 Sol max promotion.
- Provider/profile/evidence/quota contract rewrites from #577–#579.
- Broad process-name killing, arbitrary socket cleanup, actual daemon destruction in tests.
- Fabricated mobile/sleep/network reconnect results.

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| PID reuse makes an old lock appear live. | Validate process identity plus session/turn evidence; retain fail-closed conflict diagnostics. |
| Crash between acquisition and thread ID persistence. | `launching` is owned; atomic replace updates it after identity observation. |
| Repair kills unrelated or active work. | Inspect sessions/children first; exact anchored argv predicate; refuse ambiguous evidence. |
| Socket/version facts race between plan and apply. | Re-observe immediately in apply and verify after restart; do not execute a stale plan blindly. |
| Evidence leaks host/user data. | Persist enumerated/redacted facts only; tests scan forbidden payloads. |
| Later issues regress. | Preserve deferred-boundary tests for #581/#582 and no global-default action. |

## Anti-Patterns to Avoid

| AP | Plan |
| -- | ---- |
| AP-1 | New TS files target ≤350 LOC; command/presentation ≤150 LOC; hard cap 500. |
| AP-2/AP-9 | Reuse Deno primitives and existing state/runtime seams; add only ownership and daemon domain behavior. |
| AP-11/AP-25 | No module-load effects; filesystem/process effects stay in adapters. |
| AP-13 | Structured result/evidence only; CLI rendering remains the presentation edge. |
| AP-16/AP-17 | Use existing `runtime/adapters`, ports, and named ownership/remote-control vocabulary. |
| AP-18 | Assert parsed semantics, not giant snapshots. |
| AP-19 | Keep existing task permissions; document repair effects. |
| AP-23 | CLI parser remains thin; no repair body in `agentic-runtime.ts`. |

## Commit Slices and LOC Budgets

| # | Proof | Files | LOC budget | Slice gate |
| - | ----- | ----- | ---------- | ---------- |
| 1 | Research/design locks scope and safety before code. | run-dir `research.md`, `plan.md`, `worklog.md`, `context-pack.md`, `drift.md`, existing `supervisor.md`/`codex-thread-ids.md` | docs only | plan artifacts + `git diff --check` + secret scan |
| 2 | A worktree has one durable sender owner; duplicate launch blocks before spawn and resume keeps the thread. | `runtime/contract.ts`, `runtime/ports.ts`, focused ownership module/adapter/tests, `codex-adapter.ts`, controller/planner tests, run artifacts | domain/ports ≤200 each; adapter ≤350; tests ≤500 | focused `deno test --no-lock` + scoped check/lint/fmt |
| 3 | Daemon states are explicit and repair is active-work-safe, anchored, verified, evidenced, and documented. | focused remote-control domain/adapter/tests, `planner.ts`, controller wiring/tests, CLI/output as needed, `README.md`, deferred-boundary tests, run artifacts | command ≤150; domain/ports ≤200; adapter ≤350; tests ≤500 | full agentic/runtime tests + scoped wrappers + diff/secret/lock gates |

## Validation Plan

| Order | Gate | Command/check | Expected |
| ----- | ---- | ------------- | -------- |
| 1 | Focused behavior | `deno test --no-lock <changed tests>` | 0 failures |
| 2 | Check | `.llm/tools/run-deno-check.ts --root .llm/tools/agentic --ext ts,tsx` | exit 0, 0 findings |
| 3 | Lint | `.llm/tools/run-deno-lint.ts --root .llm/tools/agentic --ext ts,tsx` | exit 0, 0 findings |
| 4 | Format | `.llm/tools/run-deno-fmt.ts --root .llm/tools/agentic --ext ts,tsx` | exit 0, 0 findings |
| 5 | Integrity | `git diff --check`; focused secret scan; compare `deno.lock` blob/hash | exit 0; no secrets; unchanged |
| 6 | Final runtime | all `.llm/tools/agentic/*_test.ts` and `runtime/**/*_test.ts` | 0 failures |
| 7 | Manual structural | no `pkill`; anchored PID and known socket literals only; #581/#582 boundaries intact | PASS |

## Arch-Debt Implications

- None expected. If implementation requires deepening an existing doctrine violation, stop and record/rescope before proceeding.

## Drift Watch

- Existing lock/state location differs from research assumptions.
- Current Codex process argv/socket differs from the anchored pattern documented by the remote skill.
- Controller action model cannot express safe re-observation without a contract-compatible extension.
- Interactive canaries remain owner-accepted only; never upgrade them to executed evidence.
