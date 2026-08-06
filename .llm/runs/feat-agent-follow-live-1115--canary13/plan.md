# Plan — LOCKED

## Scope

Add a read-only `agentic:codex-follow` stream and upgrade `agentic:codex-status` into a mixed Codex
and agy per-session triage surface that answers whether an agent is working, idle, stalled, dead, or
refused and what its most recent activity/artifact is.

## Locked decisions

1. Extract rollout resolution, parsing, and state reduction into a shared pure-first module used by
   both `codex-watch`, `codex-follow`, and `codex-status`.
2. State comes from rollout evidence, not process presence: terminal `task_complete` is `idle`; a
   recent incomplete event is `working`; an incomplete rollout beyond the inactivity threshold is
   `stalled`; a structured error/abort after productive activity is `dead`; the same failure before
   productive activity is `refused`.
3. State output includes evidence and age so consumers need not trust an opaque label. Thresholds
   are explicit CLI options with stable defaults and fake-clock tests.
4. Follow emits readable records for reasoning, agent messages, command/tool start and completion,
   patch/file writes, failures, and turn completion. JSON mode remains line-delimited and
   machine-readable. Raw bookkeeping and user prompts are excluded.
5. `--thread-id` resolution is byte-for-byte shared with watch; `--rollout` remains available for
   deterministic tests and direct use.
6. Status reports thread id, model, effort, cwd/worktree, last activity/reasoning, structured
   failure, and last artifact. Prefer the current branch commit; retain the last rollout file-write
   when no repository commit can be resolved.
7. All behavior is read-only. No polling sleep is introduced; follow uses filesystem events and
   exits on terminal success or failure.
8. Preserve the pre-existing `deno.lock` change and never stage it.
9. Read agy's worktree→conversation index and transcript JSONL directly; report it through the same
   session vocabulary, include current step/dispatch issue/non-zero command exit, and let
   `--worktree` resolve/filter either runtime without consulting process state.

## Commit slices

1. **Plan contract** — locked run artifacts and D6 composed evaluator row.
2. **Rollout contract** — shared resolver/parser/state reducer with fake-clock fixtures.
3. **Follow + status** — public tasks, readable/JSON output, filesystem-follow behavior, session
   inventory, and artifact evidence.
4. **Discovery + evaluation** — README/tooling index, focused gates, separate IMPL-EVAL, acceptance
   evidence, and ready transition.

## Gate set

- Focused pure parser/state tests covering working, idle, stalled, dead, refused, and quoted-error
  negative controls.
- Follow tests for filtering, thread resolution, append streaming, and terminal exit without sleeps.
- Status tests for per-session identity/worktree/artifact evidence and pretty/JSON contracts.
- Scoped check/lint/fmt for `.llm/tools/agentic` plus focused docs checks.
- No-new-ignore scan and `deno.lock` staged-diff proof.

## Risks

- Rollout schema variants could cause false terminal states. Mitigation: tolerate top-level and
  payload event types, ignore malformed/truncated records, and preserve explicit evidence.
- A stale rollout may belong to a healthy but blocked process. Mitigation: report `stalled` and age,
  never infer `dead` without structured failure evidence.
- Failure prose quoted in prompts could cause false refusal. Mitigation: inspect only trusted
  error/abort records.
- High-volume token bookkeeping could swamp follow output. Mitigation: a strict event allowlist.

## Open-decision sweep

- Resolved now: state vocabulary, evidence hierarchy, terminal semantics, shared resolver, and
  public command shapes.
- Safe to defer: none of the live issue's Codex or agy acceptance surface.
