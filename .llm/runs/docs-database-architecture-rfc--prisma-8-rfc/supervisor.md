# Supervisor Identity — docs-database-architecture-rfc--prisma-8-rfc

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field    | Value                                                                                |
| -------- | ------------------------------------------------------------------------------------ |
| Model    | Codex · OpenAI · GPT-5 family · high (root session; exact routed SKU is not exposed) |
| Session  | `019ffbc7-133b-7852-905d-53a163fe9819`                                               |
| Host     | `YogaBook9i` · WSL2 Linux 6.18.33.2 · user `codex`                                   |
| Checkout | `/home/codex/repos/netscript-547-lffix`                                              |
| Worktree | `/home/codex/repos/netscript-db-rfc`                                                 |
| Branch   | `docs/database-architecture-rfc`                                                     |
| Baseline | `origin/main` @ `cd720529333328bcba5e1a308ce7632f4350efdf` (2026-08-13)              |
| Run ID   | `docs-database-architecture-rfc--prisma-8-rfc`                                       |

## Routes in force

| Task lane                         | Provider / model / effort            | Role in this run                                                             |
| --------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------- |
| `planning_decisions`              | OpenAI · Codex · GPT-5 family · high | Root research coordinator and RFC generator in the active user session       |
| `deep_analysis`                   | Anthropic · Fable 5 · medium         | Architecture decision analysis when the native agentic route is available    |
| `formal_plan_evaluation`          | Anthropic · Fable 5 · medium         | Fresh opposite-family PLAN-EVAL before the RFC file is authored              |
| third-opinion architecture review | OpenRouter · Qwen 3.8 Max · max      | Diversity pass over the full architecture and implementation roadmap         |
| owner-directed final refinement   | Anthropic · Fable 5 · high           | Absolute final review-and-refinement gate after every other substantive gate |

## Recorded lane/eval overrides

- The root session is Codex rather than the default Opus 5 orchestrator. This is the active
  user-facing session surface; exact backend SKU is not exported, so the observed identity is
  recorded without claiming GPT-5.6 Sol.
- The owner explicitly requires Fable 5 **high**, not merely an adversarial review, as the final
  refinement gate. That owner directive overrides the ordinary `docs_polish` Fable-medium effort for
  this run. No substantive model gate may follow it.
- Qwen 3.8 Max is selected as an in-policy independent architecture review for intelligence-family
  diversity. Grok 4.6 will be used only if an existing policy-compliant, observable route is
  present; no unrecorded paid escalation is authorized.
