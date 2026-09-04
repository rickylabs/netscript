# Context Pack: agent model routing and subscription expense policy revamp

## Run Metadata

| Field          | Value                                            |
| -------------- | ------------------------------------------------ |
| Run ID         | `chore-revamp-agent-model-routing--model-matrix` |
| Branch         | `chore/revamp-agent-model-routing`               |
| Current phase  | `critical post-eval repair`                      |
| Archetype      | `6 - CLI / Tooling`                              |
| Scope overlays | docs                                             |

## Current State

Draft PR #1989 is open from baseline `a2d7f5f6f686115b5c31bab085692df6e1582aa7`. The complete owner
matrix has been normalized into the plan, active code surfaces and official subscription contracts
have been inventoried. PLAN-EVAL cycle 1 found three bounded design issues; they were repaired at
`372409ab6`, and cycle 2 in the same Grok 4.6 xhigh session returned `PASS`. S1 is committed at
`605ae0e02`; S2 is committed at `da80e6eec`; S3 is committed at `b2d3106f0`; S4 is committed at
`e4bf9dd8c`. S5 live catalog discovery corrected nonexistent Ollama capabilities for Qwen 3.8
Flash/Max and Grok 4.6; full agentic/static gates and the guarded OpenCode Go turn pass. Independent
IMPL-EVAL cycle 1 in session `ses_f93062116ffe1eRZWsVs5ukzqK` returned a bounded `FAIL_FIX` at
`9f8ee61a6`. The repair corrects native Claude and dated Ollama ids, proves an expense denial cannot
spawn OpenCode, and updates the stale README resolver claim. IMPL-EVAL cycle 2 in the same session
returned a historical `PASS` at exact head `8740b16de` through the OpenRouter/Grok provider
fallback. Subsequent owner cost-dashboard evidence and the live Go usage API supersede that PASS for
merge readiness: the old watcher used flat 12/30/60 USD limits and the coordinator selected the
privileged `architecture` row without recorded authority. Repair is active; PR #1989 remains draft.

## Accepted owner decisions

- The 2026-09-04 matrix replaces every prior delegation ruling.
- `gpt-6-astra` is target-available and is active, not provisional.
- OpenCode Go and Ollama credentials are target-available through secure local provisioning.
- OpenRouter paid-training participation is intentional and must not disqualify an otherwise legal
  fallback endpoint.
- Provider priority: Claude → Codex → Google → OpenCode Go → Ollama → OpenRouter.
- The selected generator/evaluator pair must differ by vendor family; fallback composition must
  provide a legal evaluator for every generator candidate.
- `complex` and `architecture` may be selected only with explicit owner or milestone-coordinator
  authority and a recorded rationale; otherwise selection is capped at `feature`.

## Locked architecture

- Typed five-tier workload matrix plus four-tier coordinator matrix.
- Logical model identity separated from provider-specific capability/slugs.
- Evaluation round/repair/notification policy encoded in data.
- Go routes fetch live authenticated usage and apply selected-model effective limits before spawn;
  other paid OpenCode routes require a fresh structured allowance decision.
- Secrets remain in mode-600 local env files and never enter argv, logs, receipts, or git.
- Active docs/skills derive from/check against the matrix; historical runs stay untouched.

## Next Steps

1. Finish full agentic and repository gates for the live-usage / privileged-tier repair.
2. Commit, push, and post the value-free blocked live receipt to draft PR #1989.
3. Run a new separate-session, different-family feature-tier IMPL-EVAL without OpenCode Go while it
   is rate-limited; only then return to exact-head CI/review.

## Files Changed

| Path                                                         | Status       | Notes                                                  |
| ------------------------------------------------------------ | ------------ | ------------------------------------------------------ |
| `.llm/runs/chore-revamp-agent-model-routing--model-matrix/*` | modified/new | research, plan, design, continuity, and drift evidence |
| `.llm/tools/agentic/config/models.ts`                        | modified     | current provider model slugs only                      |
| `.llm/tools/agentic/runtime/delegation-matrix.ts`            | new          | authoritative matrix and family composition            |
| `.llm/tools/agentic/runtime/delegation-matrix_test.ts`       | new          | exact owner-matrix and invariant coverage              |
| `.llm/tools/agentic/runtime/routing-policy.ts`               | rewritten    | matrix-derived active route resolution                 |
| `.llm/tools/agentic/runtime/contract.ts`                     | modified     | distinct Go and Ollama provider identities             |
| `.llm/tools/agentic/runtime/cli/routing-state.ts`            | modified     | new matrix evaluator inspection output                 |
| `.llm/tools/agentic/runtime/subscription-expense.ts`         | new          | fail-closed normalized allowance decisions             |
| `.llm/tools/agentic/lib/provider-credential.ts`              | new          | mode-600 provider-scoped credential loading            |
| `.llm/tools/agentic/opencode/opencode-run.ts`                | modified     | paid-route expense preflight before process spawn      |
| `.llm/harness/workflow/lane-policy.md`                       | rewritten    | exact human view of workload/coordinator matrix        |
| `.llm/harness/evaluator/{plan-protocol,protocol}.md`         | rewritten    | tier-specific evaluation selection and loop policy     |
| `.agents/skills/{netscript-harness,claude-manager}/SKILL.md` | modified     | new routing and paid-provider operating contract       |

## Gates

| Gate family | Current status | Evidence                                                                    |
| ----------- | -------------- | --------------------------------------------------------------------------- |
| Plan        | PASS cycle 2   | `plan-eval.md`, repair head `372409ab6`                                     |
| Static      | PASS S1-S3     | per-slice structured checks                                                 |
| Fitness     | PASS repair    | injected command-spawn denial proof                                         |
| Runtime     | PASS repair    | 572 agentic tests plus guarded OpenCode Go live turn                        |
| Docs parity | PASS S4        | typed table parity plus stale-policy scan                                   |
| Repo check  | PASS S5        | 3,140 files / 27 batches, no diagnostics                                    |
| Repo test   | PASS* S5       | 5,263 pass; two unchanged browser fixtures pass when moved off no-exec temp |
| Consumer    | N/A            | no published package/plugin changes                                         |
| IMPL-EVAL   | SUPERSEDED     | historical C2 PASS at `8740b16de`; new live evidence requires another cycle |

## Drift and Debt

- Drift: legacy flat route policy is superseded; tracked in `drift.md`.
- Debt: no new debt accepted.
