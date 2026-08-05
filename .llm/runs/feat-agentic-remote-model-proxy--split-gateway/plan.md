# Plan: Claude Remote Control split model gateway

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-agentic-remote-model-proxy--split-gateway` |
| Branch | `feat/agentic-remote-model-proxy` |
| Phase | `plan` |
| Target | internal agentic CLI/tooling and docs |
| Archetype | `6 - CLI / tooling` |
| Scope overlays | `docs` |

## Archetype

Archetype 6 is the closest fit because the deliverable is a process-owning command-line flow. It
is internal tooling rather than a publishable CLI package, so package-only JSR gates are N/A while
the layering, permission, process lifecycle, security, runtime, and consumer gates apply.

## Current Doctrine Verdict

N/A for internal `.llm` agent tooling. Repository agentic standards and Archetype 6 boundaries are
the governing contracts.

## Goal

Provide a first-class NetScript command that starts Claude Code with Anthropic Remote Control while
routing model inference to an explicitly selected OpenRouter model, including safe fork/resume,
bypass-permission launch, credential isolation, cleanup, and auditable tests.

## Scope

- Add the DeepSeek V4 Flash 0731 model identifier to central configuration.
- Add a split gateway with exact request classification, forced model selection, upstream-specific
  authentication, streamed response forwarding, loopback-only binding, and secret-blind evidence.
- Add a lifecycle launcher for resume/fork, bypass permissions, effort, working directory, and
  Remote Control.
- Add focused unit/integration tests, a root task, and operator/Claude-manager documentation.
- Run a live forked canary without mutating the original conversation.

## Non-Scope

- No third-party proxy installation or copied implementation.
- No transcript synchronization outside Claude's supported Remote Control channel.
- No LAN listener, model hot-switching, cost accounting, or generic arbitrary upstream URL.
- No mutation or termination of the existing `loopback-deepseek-0731` canary.

## Hidden Scope

- Strip all client Anthropic auth headers before OpenRouter and never inject OpenRouter auth into
  Anthropic passthrough requests.
- Remove hop-by-hop headers and rebuild upstream URLs from compile-time constants to prevent SSRF.
- Fail closed on malformed model requests and validate fork/resume combinations before spawning.
- Keep volatile model IDs/endpoints exclusively in `config/` and teach hardcode guards the new ID.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Route only exact `/v1/messages` requests to OpenRouter; all other paths go to Anthropic. | minimal and auditable control/data split |
| D2 | Force the configured OpenRouter model in the JSON body. | prevents alias drift and client-selected bypass |
| D3 | Hold the OpenRouter key only in the gateway process; child Claude receives no alternate-provider key. | credential non-interference |
| D4 | Bind `127.0.0.1` on an ephemeral port and allow only configured upstreams. | least exposure and no SSRF surface |
| D5 | Separate pure routing/launch planning from Deno network/process adapters. | SOLID testability and lifecycle clarity |
| D6 | Use `claude remote-control` for new sessions and the interactive `--remote-control` path for fork/resume if required by Claude's CLI contract. | preserve supported session semantics |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| exact Claude invocation form | resolved now | encode and test new vs resume/fork variants explicitly |
| gateway control endpoints | safe to defer | no operator need for mutable state in this slice |
| additional OpenRouter models | safe to defer | model parameter is typed against central configured IDs |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Claude rejects loopback base URL before issuing control traffic | live canary; record blocked runtime truth without weakening controls |
| OAuth or OpenRouter credentials cross upstream boundaries | header allow/deny tests with opaque sentinels |
| streaming/tool use is buffered or corrupted | pass response body through and run SSE-focused handler tests plus live canary |
| child/proxy leaks after exit or signal | single lifecycle owner, abort controller, deterministic cleanup tests |
| model literal or endpoint drifts outside config | existing volatile-value guard plus targeted test |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-1 | risk | keep routing, adapters, launcher, and CLI parsing bounded and separate |
| AP-11 | risk | isolate Deno env/network/process access at adapters/entrypoint edges |
| AP-19 | risk | document exact Deno permissions and credential sources |
| AP-24 | risk | use typed routing policy/data rather than switch growth |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1/F-2/F-3/F-5 | yes | scoped review, file-size and layering scans |
| F-6/F-7/F-8 | no | internal non-JSR tool |
| F-9/F-10/F-11/F-12/F-15/F-16/F-17/F-18/F-19 | yes | task declaration, tests, scoped wrappers/manual evidence |
| F-CLI-1..31 | applicable subset | manual structural evidence plus `arch:check` where supported |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `.llm/harness/debt/arch-debt.md` | none expected | record only if live/runtime limitation is intentionally carried |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | focused tests | `deno test --no-lock` for new Claude gateway modules | pass |
| 2 | scoped check/lint/fmt | repository wrappers over `.llm/tools/agentic` and changed config/docs | pass |
| 3 | volatile values | `deno test .../config/no-hardcoded-volatile_test.ts` | pass |
| 4 | agentic regression | relevant Claude/runtime/config tests | pass |
| 5 | docs/tasks | docs maintenance and task invocation smoke | pass |
| 6 | runtime | launch a forked DeepSeek session with bypass and Remote Control | attached URL or precisely classified blocker |
| 7 | adversarial | OpenCode `openrouter/x-ai/grok-4.5`, variant high | findings addressed or recorded |
| 8 | IMPL-EVAL | formal Qwen evaluator in a separate session | PASS |

## Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Introduce split-gateway policy, adapters, launcher, and focused tests | focused test/check/lint/fmt | `config/*`, `claude/*`, `deno.json` |
| 2 | Integrate operator doctrine and live canary evidence | docs gates and live forked smoke | agentic README, harness tooling, Claude-manager skill/mirror, run artifacts |
| 3 | Address Grok and formal evaluator findings | rerun affected gates | implementation/tests/run artifacts |

## Deferred Scope

- Dynamic provider switching, cost telemetry, LAN hosting, and non-OpenRouter inference providers.

## Drift Watch

- Any need to expose a key to Claude, route more than `/v1/messages`, use a non-loopback listener,
  or bypass Claude's supported OAuth flow requires rescope.
