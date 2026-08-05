# Context Pack: Claude Remote Control split model gateway

## Run Metadata

| Field          | Value                                            |
| -------------- | ------------------------------------------------ |
| Run ID         | `feat-agentic-remote-model-proxy--split-gateway` |
| Branch         | `feat/agentic-remote-model-proxy`                |
| Current phase  | `close — merge-ready`                            |
| Archetype      | `6 - CLI / tooling`                              |
| Scope overlays | `docs`                                           |

## Current State

The original Remote Control goal was rescoped after a live failure and Grok `FAIL_RESCOPE`.
The branch now provides a truthful inference-only OpenRouter launcher; tests/static gates and the
live DeepSeek sentinel pass, and separate local OpenCode/Qwen IMPL-EVAL returned `PASS`.

## Completed

- Live OpenRouter fork smoke and precise Remote Control failure classification.
- Official-doc and prior-art research.
- Harness bootstrap, research, plan, and Design checkpoint.
- Split gateway, launcher, central DeepSeek route, shared credential resolver, root task, and tests.

## In Progress

- All implementation, review, evaluation, and GitHub gates.

## Next Steps

1. Merge PR #1314 when desired.

## Key Decisions

| Decision                        | Source  | Notes                                         |
| ------------------------------- | ------- | --------------------------------------------- |
| split exact `/v1/messages` only | plan D1 | other traffic remains Anthropic OAuth/control |
| keys never cross upstreams      | plan D3 | child never gets OpenRouter token             |
| loopback ephemeral gateway      | plan D4 | no LAN or arbitrary upstream                  |

## Files Changed

| Path                                                         | Status   | Notes                                               |
| ------------------------------------------------------------ | -------- | --------------------------------------------------- |
| `.llm/runs/feat-agentic-remote-model-proxy--split-gateway/*` | new      | harness plan artifacts only                         |
| `.llm/tools/agentic/claude/remote-model-*`                   | new      | gateway, launcher, and focused tests                |
| `.llm/tools/agentic/lib/openrouter-credential*`              | new      | shared non-persisting credential resolver and tests |
| `.llm/tools/agentic/config/{models,endpoints}.ts`            | modified | central model and upstream endpoint                 |
| `.llm/tools/agentic/opencode/opencode-run.ts`                | modified | consumes the shared credential convention           |
| `deno.json`                                                  | modified | root launcher task                                  |

## Gates

| Gate family                              | Current status | Evidence                                                  |
| ---------------------------------------- | -------------- | --------------------------------------------------------- |
| Plan-Gate                                | PASS           | local Qwen session `0443e94a-7711-4c0b-a4ce-145907722a21` |
| Focused tests                            | PASS           | 25 passed, 0 failed                                       |
| Scoped check/lint/fmt                    | PASS           | 12 files, 0 findings each                                 |
| Volatile/config and provider regressions | PASS           | 4 + 13 tests passed                                       |
| Runtime canary                           | PASS | exact sentinel in `loopback-deepseek-openrouter` |
| Remote Control | UNSUPPORTED | current Claude custom-base guard; no attachment claim |
| Formal IMPL-EVAL | PASS | separate local OpenCode/Qwen evaluator artifact `evaluate.md` |
| GitHub CI | PASS | applicable required jobs green; path-inapplicable lanes skipped |

## Open Questions

- None requiring design resolution.

## Drift and Debt

- Drift: owner-requested Grok review recorded as an additional gate.
- Debt: none.

## Commits

- See the future draft PR commit list and slice comments.
