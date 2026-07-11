# Worklog — issue #665

## Design

### Public surface

- `launch-codex-slice.ts`: add explicit `--allow-route-mismatch` launch option.
- Runtime route-identity helper: produce an enforcement decision with exit/operator-action semantics.

### Domain vocabulary

- Requested and observed launch identity, `matched | pending | mismatch`, mismatch fields, route
  enforcement decision.

### Ports

- Existing `Deno.Command` launcher boundary and app-server stdio process; no speculative port.

### Constants

- Existing provider/model/effort vocabulary remains authoritative; add only a stable route-mismatch
  operator-action string if needed.

### Commit slices

1. Applied per-turn route plus default-on mismatch escalation; runtime unit suite and scoped wrappers.

### Deferred scope

- Upstream CLI fix and unrelated beta-7 launcher findings.

### Contributor path

- Start at `codex/launch-codex-slice.ts`, follow pure route comparison/enforcement into
  `runtime/launch-route-identity.ts`, then copy focused adjacent tests.

## Root-cause evidence

- 2026-07-11, Codex CLI 0.144.1: probe thread `019f532a-084c-7751-9a98-6279804a0571` requested
  `--model gpt-5.6-sol -c model_reasoning_effort=medium`. `thread/start` reported model
  `gpt-5.6-sol`, provider `openai`, `reasoningEffort: "low"`; emitted `turn/start` had `effort: null`.
  Host config default is `model_reasoning_effort = "low"`. Exit 0.
- Quoted-TOML control probe thread `019f532a-87fb-70e0-95f8-a88a53923329` also reported
  `reasoningEffort: "low"`. Exit 0.
- Verdict: the config override is not applied to the child turn by `send-message-v2`; observed
  identity is correctly reading the applied default. Fix the launch/application side.

## Plan-Gate

- PLAN-EVAL owner-waived in the slice brief (carried drift D1). Plan and Design recorded before edits.

## Implementation

- Added a minimal v2 JSONL app-server client. It spawns `codex -c
  model_reasoning_effort=<requested> app-server`, requests the explicit model/cwd at `thread/start`,
  and also sends explicit `turn/start.effort`. The launcher consumes the authoritative response.
- Replaced only the buggy compiled `debug app-server send-message-v2` helper edge; preserved named
  child profiles, sender ownership, worktree safety, thread recording, and route comparison.
- Added default-on route enforcement. Pending/mismatched identity exits 1 with a `BLOCKED:` operator
  action. `--allow-route-mismatch` is the deliberate operator opt-out.
- Added focused tests for per-turn effort, authoritative identity parsing, default blocking, and the
  explicit opt-out while retaining the pre-existing route-identity tests.

## Runtime proof

- Direct app-server control probe `019f532c-33e7-7962-b6df-711b46872f98`: requested medium and
  `thread/start` returned medium, proving the correct underlying input path.
- New checked-in client smoke `019f532e-3903-7133-b8d9-2a35aa196c2d`: requested
  provider=openai/model=gpt-5.6-sol/effort=medium; authoritative response returned exactly those
  values, agent replied `CLIENT_ROUTE_OK`, `turn/completed` arrived, process exit 0.

## Gate evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Focused route/client unit tests | PASS | 4 passed, 0 failed before full suite |
| Full agentic unit suite | PASS | 224 passed, 0 failed; exit 0 |
| Scoped check wrapper | PASS | 98 files, 1 batch, 0 failed batches/codes |
| Scoped lint wrapper | PASS | 98 files, 0 findings; exit 0 |
| Scoped format wrapper | PASS | 98 files, 0 findings; exit 0 |
| Live applied-route smoke | PASS | thread `019f532e-3903-7133-b8d9-2a35aa196c2d`, medium observed, exit 0 |

## Reconcile

- Issue #665 remains open pending merge by the owner/orchestrator. No PR was opened as instructed.
- No scope drift or architecture debt found. Independent IMPL-EVAL remains outside this generator
  session.
