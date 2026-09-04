# Worklog: GitHub Copilot cloud lane for the NetScript harness

## Run Metadata

| Field          | Value                                            |
| -------------- | ------------------------------------------------ |
| Run ID         | `feat-copilot-cloud-harness--copilot-cloud-lane` |
| Branch         | `feat/copilot-cloud-harness`                     |
| Archetype      | `6 - CLI / Tooling`                              |
| Scope overlays | docs, GitHub workflow                            |

## Design

Research is complete. The separate Fable 5.1 plan generator must lock the implementation design and
populate this section before PLAN-EVAL. No implementation files may be created before PLAN-EVAL
returns `PASS`.

## Progress Log

| Time              | Slice     | Step      | Notes                                                                                                                   |
| ----------------- | --------- | --------- | ----------------------------------------------------------------------------------------------------------------------- |
| 2026-09-04T17:45Z | bootstrap | activated | Clean worktree from merged matrix head; feature row selected; deep research and PLAN-EVAL required.                     |
| 2026-09-04T18:24Z | research  | generated | Gemini 3.8 Flash high completed the bounded research-only pass; no implementation files changed.                        |
| 2026-09-04T18:25Z | research  | verified  | Primary-source sweep corrected unsupported quota, policy, API, and status claims.                                       |
| 2026-09-04T18:28Z | plan      | blocked   | Fable limit, Go rate limit, then OpenRouter paid-training guardrail exhausted the declared plan route before inference. |
| 2026-09-04T18:45Z | research  | ruling    | Owner made OpenCode Copilot the default for supported non-OpenAI/non-Anthropic models; device authorization started.    |

## Research receipts

- GitHub GraphQL `suggestedActors(CAN_BE_ASSIGNED)` returned `copilot-swe-agent` for this
  repository.
- Agent Tasks REST documents typed dispatch plus eight terminal/non-terminal states without UI
  scraping.
- Copilot CLI documents programmatic JSONL, model/effort selection, permissions, autopilot, and a
  soft per-session AI-credit cap.
- OpenCode documents a native GitHub Copilot device-login provider; Claude Code documents no such
  provider.
- No billable Copilot task, repository policy mutation, or tool installation occurred in research.
- Plan attempts consumed no useful model tokens. The OpenCode expense watcher and OpenRouter
  guardrail both failed closed before plan generation.
- GitHub's current catalog confirms Gemini 3.8 Flash, Kimi K3, and Grok 4.6 are Copilot models. Kimi
  and Grok are the immediate high-cost routes displaced by the Copilot entitlement.
- Owner correction at 2026-09-04T19:07Z: Gemini remains on the native Google subscription through
  `agy` for every role, including deep research. Copilot-first routing applies to supported
  non-native families such as Kimi K3 and Grok 4.6; the prior broader wording is superseded.

## Gate Results

Not run; plan generation is blocked on a declared route becoming available, and PLAN-EVAL remains
pending.
