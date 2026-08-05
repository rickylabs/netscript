# Worklog: hybrid Claude Remote Control

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-agentic-deepclaude-remote-control--hybrid-control-plane` |
| Branch | `feat/agentic-deepclaude-remote-control` |
| Archetype | N/A — internal tooling |
| Scope overlays | docs |

## Design

### Public Surface

- `deno task agentic:claude-hybrid -- --cwd <path> [--model <approved-id>]`
- MCP tool `delegate_openrouter({ task, context?, model?, effort? })`

### Domain Vocabulary

- `HybridDelegationRequest` / `HybridDelegationResult` — bounded worker contract.
- `HybridModelPolicy` — approved model and effort mapping.
- `HybridWorkerPort` — cancellable worker execution seam.
- `HybridLaunchEvidence` — native bridge and delegated model identity evidence.

### Ports

- `HybridWorkerPort` — isolates OpenCode process execution for tests and cancellation.
- `TemporaryConfigPort` — makes ephemeral MCP configuration lifecycle testable.
- Existing OpenRouter credential resolver — provider secret boundary.

### Constants

- Model IDs and endpoints remain in `.llm/tools/agentic/config/`.
- Request/result byte limits, timeout, concurrency, MCP tool name, and exit codes are named once in
  the hybrid contract module.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Bounded delegation contract and OpenCode adapter | Focused tests + scoped static wrappers | hybrid delegation modules/tests, config, run artifacts |
| 2 | MCP protocol and native Remote Control lifecycle | Protocol/lifecycle tests + live canary | MCP server, launcher, tests, task, run artifacts |
| 3 | Docs, mirror, regressions, formal evaluation | All agentic/docs gates + IMPL-EVAL | README, skills, run artifacts |

### Deferred Scope

- Transparent model interception, progress streaming, persistent cost accounting, arbitrary
  providers, and zero-Claude-quota operation.

### Contributor Path

Add an approved model in centralized config, map it in the hybrid model policy, add adapter and
protocol tests, then run the documented canary; never add credentials or endpoints to the launcher.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-05 | Plan | Research | Confirmed no official version overlap for custom gateway + Remote Control. |
| 2026-08-05 | Plan-Gate | Evaluation | OpenCode/Minimax separate session returned `PASS`; Qwen transport failures recorded in drift. |
| 2026-08-05 | Slice 1 | Contract | Added UTF-8 byte-bounded task/context/result contracts, DeepSeek-only centralized policy, timeout/cancellation, and a two-worker concurrency gate. |
| 2026-08-05 | Slice 1 | Isolation | Added a dedicated OpenCode adapter using argv-based `Deno.Command`, a minimal allow-listed child environment, exact credential redaction/reflection rejection, and `setsid` process-group TERM-to-KILL cleanup. Existing `runOpenCode` was not weakened. |
| 2026-08-05 | Slice 1 | Live evidence | Native OpenCode JSON canary returned a `text` event at `part.text`; the production adapter then returned exact `HYBRID_ADAPTER_OK` with requested/observed DeepSeek identity and `opencode_argv` observation source. |
| 2026-08-05 | Slice 1 | Reconcile | No related issue/PR state was changed by the implementation lane. Supervisor review narrowed the allow-list to DeepSeek and required process-group escalation, malformed-input coverage, and real JSON-shape evidence; all were incorporated before sign-off. |
| 2026-08-05 | Slice 1 | Tier-A review | Supervisor inspected the contract, adapter, environment boundary, queue, TERM-to-KILL process-group cleanup, output parser, and tests; independently reran 18 tests and the scoped wrappers with five explicit files. Accepted `opencode_argv` as invocation attestation only, with provider-response attestation explicitly deferred rather than overstated. |
| 2026-08-05 | Slice 2 | MCP protocol | Added a standalone newline JSON-RPC server (without coupling internal tooling to the published MCP package) exposing exactly `delegate_openrouter`; initialize/list/call, bounded structured failures, concurrent calls, duplicate-id rejection, and `notifications/cancelled` → `AbortController` are covered. |
| 2026-08-05 | Slice 2 | Native lifecycle | Added the interactive `claude --remote-control [name] --mcp-config <0600 file> --dangerously-skip-permissions` launcher. It preserves native OAuth, strips Anthropic/OpenRouter endpoint and API/auth overrides, uses `Deno.execPath()` for the MCP child, validates cwd/HOME before side effects, restricts temporary writes to Linux/WSL `/tmp`, grants the MCP child read access only to the centralized OpenRouter credential file (no network/sys permission), and owns TERM→bounded KILL plus config cleanup. |
| 2026-08-05 | Slice 2 | Attachment truth | A matching `~/.claude/sessions/<pid>.json` record with PID, cwd/name, session id, and non-empty `bridgeSessionId` is mandatory. Missing/mismatched evidence terminates Claude and fails closed; a merely alive process is never reported attached. No live Remote Control canary was started by this lane. |
| 2026-08-05 | Slice 2 | Reconcile | Scope remains the approved native-control/delegated-worker design. Supervisor pre-review findings (OAuth preservation, no strict MCP mode, injected lifecycle seams, bounded escalation, trusted Deno path, duplicate request ownership, and centralized volatile values) were incorporated before handoff. |
| 2026-08-05 | Slice 2 | Canary repair | Supervisor's first live canary exposed two real integration mismatches: partial `--allow-env` cannot call `Deno.env.toObject()`, and Claude's session registry derives its own `name` even when a Remote Control display label is requested. The MCP entrypoint now snapshots only its centralized permitted names with `Deno.env.get`; an exact generated-permissions subprocess test boots the real stdio server. Attachment continues to require exact PID, cwd, and non-empty bridge ID but treats registry name as observed metadata, with boolean-only mismatch diagnostics on failure. |
| 2026-08-05 | Slice 2 | Tier-A review | Supervisor inspected JSON-RPC concurrency/cancellation ownership, stdio write serialization, credential-free config generation, exact credential-file read permission, OAuth preservation, registry attachment proof, signal seams, and bounded termination. Independently reran 32 tests and scoped check/lint/fmt across ten owned TypeScript files; accepted the slice for commit. |
| 2026-08-05 | Slice 2 | Live canary | Claude Code 2.1.222 attached native Remote Control with bypass permissions; `/mcp` reported `netscript-hybrid` connected with one tool. One `delegate_openrouter` call returned exact `HYBRID_REMOTE_DEEPSEEK_OK`; requested and argv-observed routes both resolved to `openrouter` / `deepseek/deepseek-v4-flash-0731` / `high` in 6109 ms. The tmux session remains live for inspection. |
| 2026-08-05 | Slice 3 | Grok adversarial review | OpenCode/Grok 4.5 high reproduced a merge-blocking sandbox mismatch: scoped `--allow-run=setsid` permits worker spawn but denies the adapter's `Deno.kill(-pid, signal)`, so deployed cancellation/timeout cleanup was not guaranteed despite unit-fake coverage. Remediation and an exact-permissions orphan test are required before IMPL-EVAL. The review process later exited 143 while probing signals, so no unsupported PASS verdict was recorded. |
| 2026-08-05 | Slice 3 | Grok finding remediation | Replaced forbidden `Deno.kill` with the explicitly permitted `kill` executable while retaining scoped `--allow-run=setsid,kill`. A TERM-resistant leader/descendant fixture now runs through the exact generated MCP argv; cancellation returns `cancelled`, escalates TERM→KILL, and the descendant PID disappears. Supervisor independently reran 34 focused/volatile tests with zero failures. |

## Gate Results

| Gate | Result | Evidence |
| --- | --- | --- |
| Focused contract/adapter + volatile guard | PASS | `deno test -A ...hybrid-delegation_test.ts ...hybrid-opencode-adapter_test.ts ...no-hardcoded-volatile_test.ts`: 18 passed, 0 failed. |
| Scoped check | PASS | Wrapper selected 5 owned files; 0 findings / 0 failed batches. |
| Scoped lint | PASS | Wrapper selected 5 owned files; 0 findings. |
| Scoped format | PASS | Wrapper selected 5 owned files; 0 findings / 0 failed batches. |
| OpenCode JSON-shape canary | PASS | DeepSeek emitted `step_start`, `text` with `part.text`, and `step_finish`; exact sentinel `HYBRID_JSON_SHAPE_OK`. |
| Production adapter canary | PASS | Exact `HYBRID_ADAPTER_OK`; requested and observed route both DeepSeek/high, observation source `opencode_argv`. |
| Lock hygiene | PASS | `deno.lock` unchanged. |
| Slice 2 focused protocol/lifecycle + prior slice + volatile guard | PASS | 33 passed, 0 failed, including a real subprocess using generated MCP permission argv. |
| Slice 2 scoped check | PASS | Wrapper selected 8 hybrid files; 0 findings / 0 failed batches. |
| Slice 2 scoped lint | PASS | Wrapper selected 8 hybrid files; 0 findings. |
| Slice 2 scoped format | PASS | Wrapper selected 8 hybrid files; 0 findings / 0 failed batches. |
| Native Remote Control → MCP → DeepSeek canary | PASS | Claude 2.1.222 proved a non-empty bridge session, MCP connected, and one delegated call returned exact `HYBRID_REMOTE_DEEPSEEK_OK` with matching requested/argv-observed route identity. |
| Exact-permissions process-group cancellation | PASS | Real MCP subprocess under `--allow-run=setsid,kill` cancelled a TERM-resistant worker group and left no descendant orphan. |

## Handoff Notes

- Slice 2 is ready for Tier-A substantive review; the implementation lane did not commit or push. The supervisor owns and coordinates live canary state.
- OpenCode's JSON event stream does not report provider/model identity. Slice 1 therefore reports
  observed identity explicitly as the adapter-observed argv route (`source: opencode_argv`) rather
  than overstating it as provider-response attestation. A stronger provider attestation requires an
  upstream OpenCode metadata seam or a separately designed evidence source.
