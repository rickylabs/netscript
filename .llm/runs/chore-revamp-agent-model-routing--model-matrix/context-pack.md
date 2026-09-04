# Context Pack: agent model routing and subscription expense policy revamp

## Run Metadata

| Field          | Value                                            |
| -------------- | ------------------------------------------------ |
| Run ID         | `chore-revamp-agent-model-routing--model-matrix` |
| Branch         | `chore/revamp-agent-model-routing`               |
| Current phase  | `implementation`                                 |
| Archetype      | `6 - CLI / Tooling`                              |
| Scope overlays | docs                                             |

## Current State

Draft PR #1989 is open from baseline `a2d7f5f6f686115b5c31bab085692df6e1582aa7`. The complete owner
matrix has been normalized into the plan, active code surfaces and official subscription contracts
have been inventoried. PLAN-EVAL cycle 1 found three bounded design issues; they were repaired at
`372409ab6`, and cycle 2 in the same Grok 4.6 xhigh session returned `PASS`. S1 is implemented and
locally green, pending its atomic commit/push.

## Accepted owner decisions

- The 2026-09-04 matrix replaces every prior delegation ruling.
- `gpt-6-astra` is target-available and is active, not provisional.
- OpenCode Go and Ollama credentials are target-available through secure local provisioning.
- Provider priority: Claude → Codex → Google → OpenCode Go → Ollama → OpenRouter.
- The selected generator/evaluator pair must differ by vendor family; fallback composition must
  provide a legal evaluator for every generator candidate.

## Locked architecture

- Typed five-tier workload matrix plus four-tier coordinator matrix.
- Logical model identity separated from provider-specific capability/slugs.
- Evaluation round/repair/notification policy encoded in data.
- Paid OpenCode routes require a fresh structured allowance decision before spawn.
- Secrets remain in mode-600 local env files and never enter argv, logs, receipts, or git.
- Active docs/skills derive from/check against the matrix; historical runs stay untouched.

## Next Steps

1. Implement S1–S4 with per-slice checks, commits, pushes, and PR comments.
2. Run bounded Go/Ollama live smokes and full focused gates.
3. Run separate Grok 4.6 xhigh IMPL-EVAL.
4. Promote the PR only after exact-head CI and review-thread gate.

## Files Changed

| Path                                                         | Status       | Notes                                                  |
| ------------------------------------------------------------ | ------------ | ------------------------------------------------------ |
| `.llm/runs/chore-revamp-agent-model-routing--model-matrix/*` | modified/new | research, plan, design, continuity, and drift evidence |
| `.llm/tools/agentic/config/models.ts`                        | modified     | current provider model slugs only                      |
| `.llm/tools/agentic/runtime/delegation-matrix.ts`            | new          | authoritative matrix and family composition            |
| `.llm/tools/agentic/runtime/delegation-matrix_test.ts`       | new          | exact owner-matrix and invariant coverage              |

## Gates

| Gate family | Current status | Evidence                                |
| ----------- | -------------- | --------------------------------------- |
| Plan        | PASS cycle 2   | `plan-eval.md`, repair head `372409ab6` |
| Static      | NOT_RUN        | implementation hard stop                |
| Fitness     | NOT_RUN        | implementation hard stop                |
| Runtime     | NOT_RUN        | implementation hard stop                |
| Consumer    | N/A            | no published package/plugin changes     |

## Drift and Debt

- Drift: legacy flat route policy is superseded; tracked in `drift.md`.
- Debt: no new debt accepted.
