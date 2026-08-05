# Context Pack: Claude Remote Control split model gateway

## Run Metadata

| Field          | Value                                            |
| -------------- | ------------------------------------------------ |
| Run ID         | `feat-agentic-remote-model-proxy--split-gateway` |
| Branch         | `feat/agentic-remote-model-proxy`                |
| Current phase  | `implement`                                      |
| Archetype      | `6 - CLI / tooling`                              |
| Scope overlays | `docs`                                           |

## Current State

Slice 1 passed Tier-A substantive review after fixing child auth-source scrubbing. Focused/static
gates pass. No live Remote Control canary has run.

## Completed

- Live OpenRouter fork smoke and precise Remote Control failure classification.
- Official-doc and prior-art research.
- Harness bootstrap, research, plan, and Design checkpoint.
- Split gateway, launcher, central DeepSeek route, shared credential resolver, root task, and tests.

## In Progress

- Slice 1 commit, explicit-refspec push, and draft PR opening.

## Next Steps

1. Review, commit, and push slice 1; open the draft PR and record the slice comment.
2. Integrate docs and run the live forked canary.
3. Run the owner-requested Grok/OpenCode adversarial review.

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
| Runtime canary                           | not run        | supervisor-owned slice 2 action                           |

## Open Questions

- None requiring design resolution.

## Drift and Debt

- Drift: owner-requested Grok review recorded as an additional gate.
- Debt: none.

## Commits

- See the future draft PR commit list and slice comments.
