# Supervisor Identity — feat-copilot-cloud-harness--copilot-cloud-lane

| Field    | Value                                                                             |
| -------- | --------------------------------------------------------------------------------- |
| Model    | Codex desktop task; exact surfaced model/effort unavailable to repository process |
| Session  | Codex task `019ffaa3-32ae-7b02-92a5-d7ae146d8cbd`                                 |
| Host     | N5 NAS / Linux / `agent`                                                          |
| Checkout | `/home/agent/projects/netscript/repo`                                             |
| Worktree | `/home/agent/projects/netscript/worktrees/copilot-cloud-harness`                  |
| Branch   | `feat/copilot-cloud-harness`                                                      |
| Baseline | `1c9eeef1a58316cff416bb9049e90346a78c89cc` (`origin/main`, 2026-09-04)            |
| Run ID   | `feat-copilot-cloud-harness--copilot-cloud-lane`                                  |

## Routes in force

| Task lane             | Provider / model / effort                                    | Role in this run                                           |
| --------------------- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| Bootstrap coordinator | Codex desktop; observed identity unavailable                 | Harness activation, integration, PR lifecycle              |
| Deep research         | Google subscription / Gemini 3.8 Flash / high / native `agy` | Copilot product, CLI, API, quota, and cloud-agent research |
| Plan                  | Claude subscription / Fable 5.1 / low                        | Convert research into a bounded integration plan           |
| PLAN-EVAL             | Matrix-selected opposite-family open evaluator               | Adversarial review before implementation                   |
| Implementation        | Codex / gpt-6-astra / low / `/root/copilot_harness_impl`     | Implement only the ratified slices                         |
| IMPL-EVAL             | Muse Spark 1.3 / xhigh / OpenCode Go                         | PASS in separate Meta-family session                       |

## Recorded lane/eval overrides

- Implementation session: Codex collaboration task `/root/copilot_harness_impl`, model
  `gpt-6-astra`, effort `low`; worktree
  `/home/agent/projects/netscript/worktrees/copilot-cloud-harness`; exact starting head `ea31286ab`.
  This separate implementation session does not self-certify; coordinator owns slice review and
  separate-family IMPL-EVAL dispatch.

- The already-running Codex desktop task is the bootstrap coordinator because it cannot self-migrate
  and cannot attest an exact model identity. It may integrate but may not self-evaluate.
- The user explicitly requested a research pass, a plan, and review, so PLAN-EVAL is selected even
  though the workload stays in the unprivileged `feature` row.

## Plan route attempts

| Time              | Requested route                    | Observed result                                                                                           | Disposition                                      |
| ----------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| 2026-09-04T18:25Z | Fable 5.1 low / native Claude      | HTTP 429 before inference; 0 input/output tokens; monthly spend limit                                     | Declared model fallback selected                 |
| 2026-09-04T18:26Z | Muse Spark 1.3 xhigh / OpenCode Go | Expense watcher blocked before spawn: `provider_rate_limited`                                             | Same-model transport fallback selected           |
| 2026-09-04T18:27Z | Muse Spark 1.3 xhigh / OpenRouter  | Provider rejected before inference: paid-training endpoint excluded by account privacy guardrail          | Owner account toggle or Go-window reset required |
| 2026-09-04T19:15Z | GitHub Copilot connector preflight | Device OAuth succeeded; live catalog exposed exact Fable 5.1, Gemini 3.8 Flash, Kimi K3, and Grok 4.6 IDs | Plan fallback transport is available             |

The plan was generated in separate session `ses_f92227a5affeSmWoi4FJ4jgLm7` through the
catalog-attested Copilot Fable fallback, then passed independent PLAN-EVAL at `c12796b85` in GLM 5.3
session `ses_f9213f890ffelYPJ3h8zaNa8O4`. The evaluator's OpenCode Go transport failed closed with
`provider_rate_limited`; the same logical model completed through OpenRouter.

IMPL-EVAL used Muse Spark 1.3 Contributor at `xhigh` in separate Meta-family session
`ses_f91eab379ffemMwLhQi30rc9wB`. OpenRouter first failed before inference because its account
training guard excluded the endpoint; the same matrix model completed through OpenCode Go and
returned PASS at implementation head `64e664867`.

## Owner routing ruling — 2026-09-04

OpenCode's native GitHub Copilot provider becomes the first transport for every Copilot-supported
matrix model except the OpenAI, Anthropic, and Gemini families. OpenAI remains native Codex/ChatGPT;
Anthropic remains native Claude; Gemini remains native Google `agy`, with catalog-attested Copilot
Gemini allowed as a same-model fallback. Kimi K3 and Grok 4.6 are the confirmed priority savings
targets. The connector's live model catalog must be attested after device authorization; absent
models fail over through the pre-existing provider chain rather than being guessed.

The `deep_research` route is native Gemini 3.8 Flash through `agy`, then catalog-attested Copilot
Gemini 3.8 Flash, then native Luna. Generic OpenCode Go, Ollama, OpenRouter, and Claude are not
admitted to that role.

The native Claude subscription remains the default Fable route. Because the plan attempt returned a
terminal subscription-limit response before inference, `github-copilot/claude-fable-5.1` is allowed
only as the same-model fallback for this plan attempt; this does not change the family default.
