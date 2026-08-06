# Worklog: Claude Remote Control split model gateway

## Run Metadata

| Field          | Value                                            |
| -------------- | ------------------------------------------------ |
| Run ID         | `feat-agentic-remote-model-proxy--split-gateway` |
| Branch         | `feat/agentic-remote-model-proxy`                |
| Archetype      | `6 - CLI / tooling`                              |
| Scope overlays | `docs`                                           |

## Design

### Public Surface

- Root task launching an inference-only Claude OpenRouter session through a split model gateway
  (supersedes the pre-rescope Remote Control surface).
- Pure handler and launch-plan functions exported for focused tests and reuse.

### Domain Vocabulary

- `RemoteModelGatewayOptions` — immutable model and privately held credential inputs.
- `RemoteModelGatewayPorts` — upstream fetch boundary.
- `RemoteModelLaunchOptions` — validated inference-only argv inputs.
- `RemoteModelGateway` — loopback server lifecycle handle.

### Ports

- upstream fetch port — streams requests and responses without coupling policy to `fetch`.
- shared credential resolver — obtains only the OpenRouter key at the gateway edge.
- child process port — owns Claude spawn/status/signal lifecycle.

### Constants

- model IDs in `config/models.ts`; endpoints and loopback binding in `config/endpoints.ts`.
- finite request paths, auth header names, and launch modes are typed constants near their policy.

### Commit Slices

| # | Slice                        | Gate                                     | Files                                      |
| - | ---------------------------- | ---------------------------------------- | ------------------------------------------ |
| 1 | split gateway and launcher   | focused Deno tests + scoped static gates | agentic config/Claude modules, `deno.json` |
| 2 | docs, canary, and evidence   | docs/runtime gates                       | README/skill/run artifacts                 |
| 3 | evaluator-driven corrections | affected gate reruns                     | bounded by findings                        |

### Deferred Scope

- provider/model hot-switching, LAN access, cost tracking, and third-party provider generalization.

### Contributor Path

Add an OpenRouter model ID in `config/models.ts`, then invoke the same gateway launcher with that
typed identifier; do not add endpoint or model literals to the launcher.

## Progress Log

| Time       | Slice              | Step            | Notes                                                                                                                                                                                   |
| ---------- | ------------------ | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-05 | pre-implementation | research/design | no implementation files changed; awaiting PLAN-EVAL                                                                                                                                     |
| 2026-08-05 | slice 1            | implementation  | Added the split gateway, validated Remote Control launcher, shared credential resolver, central configuration, root task, and focused tests. Awaiting Tier-A slice review and sign-off. |
| 2026-08-05 | slice 1 | Tier-A review | Found and fixed API-auth precedence leaking into the OAuth-only child; independently reran 25 tests and scoped check/lint/fmt with zero findings. Slice accepted for commit. |
| 2026-08-05 | slice 2 | live canary | Remote Control daemon exited on the custom-base guard; interactive fork had no `bridgeSessionId`. OpenCode/Grok returned `FAIL_RESCOPE`. |
| 2026-08-05 | slice 2 | rescope canary | Renamed/restricted the launcher to inference-only, added size/route guards and docs, then resumed fork `9863df69-98b0-4d11-b15d-9bb0115f9301`; DeepSeek returned exact sentinel `OPENROUTER_CANARY_OK` with bypass active. |

## Gate Results

| Gate                                               | Result | Evidence                                                                                 |
| -------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| focused gateway/launcher/credential/OpenCode tests | PASS   | `deno test --no-lock ...`; 25 passed, 0 failed                                           |
| scoped check                                       | PASS   | `run-deno-check.ts`; 12 files, 0 findings                                                |
| scoped lint                                        | PASS   | `run-deno-lint.ts`; 12 files, 0 findings                                                 |
| scoped format                                      | PASS   | `run-deno-fmt.ts`; 12 files, 0 findings                                                  |
| volatile-value guard                               | PASS   | included in focused run; 4 passed, 0 failed                                              |
| provider/task regressions                          | PASS   | 13 passed, 0 failed                                                                      |
| root task invalid-input smoke                      | PASS   | rejected an unconfigured model with exit code 2 before credential/network/process access |
| OpenCode/Grok 4.5 high adversarial review | FAIL_RESCOPE → addressed | Remote Control claim removed; inference-only contract and explicit rejection implemented |
| live inference canary | PASS | tmux `loopback-deepseek-openrouter`; exact `OPENROUTER_CANARY_OK` through DeepSeek |
| Remote Control compatibility | UNSUPPORTED | Claude 2.1.222 daemon exits; interactive registry lacks `bridgeSessionId` |
| formal local IMPL-EVAL | PASS | separate OpenCode/Qwen session independently verified tests, static gates, docs, PR trail, and live sentinel |
| GitHub required checks | PASS | `code-quality`, `surface-diff`, and change classification passed; non-applicable expensive lanes skipped by path policy |

## Handoff Notes

- PLAN-EVAL should challenge the credential split, exact path classifier, lifecycle cleanup, and
  whether the runtime canary is defined without overstating Remote Control support.
- Slice 1 did not run a live Remote Control canary, commit, push, PR operation, or documentation
  integration; those remain supervisor-owned.
