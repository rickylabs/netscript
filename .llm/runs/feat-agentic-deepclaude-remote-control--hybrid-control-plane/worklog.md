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

## Handoff Notes

- Slice 1 is ready for Tier-A substantive review; the implementation lane did not commit or push.
- OpenCode's JSON event stream does not report provider/model identity. Slice 1 therefore reports
  observed identity explicitly as the adapter-observed argv route (`source: opencode_argv`) rather
  than overstating it as provider-response attestation. A stronger provider attestation requires an
  upstream OpenCode metadata seam or a separately designed evidence source.
