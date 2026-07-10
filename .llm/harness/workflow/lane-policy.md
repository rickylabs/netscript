# Lane Policy — Canonical Routing and Harness Invariants

This document is the single human-facing source for NetScript task routing. The machine-readable
bindings live in `../../tools/agentic/runtime/routing-policy.ts` as `CANONICAL_ROUTE_POLICY`; the
table below is its rendered policy view. Skills, templates, and operator docs reference this file
instead of copying the routes.

## Canonical routes

| Task lane | Enforced route |
| --- | --- |
| Normal implementation | Codex · OpenAI · GPT-5.6 Sol · medium |
| Small fixes / fast iteration | Codex · OpenAI · GPT-5.6 Luna · max |
| Deep technical analysis, research, complex integration | Primary: Codex · OpenAI · GPT-5.6 Sol · xhigh. Fallback: Claude · Anthropic · Fable 5 · max, only after a classified Codex `quota_exhausted` signal. |
| Long-running planning and decision intelligence | Temporary owner override through Sunday 2026-07-12: Claude · Anthropic · Fable 5 · medium. From Monday 2026-07-13: Codex · OpenAI · GPT-5.6 Sol · max. |
| Documentation, writing, design, review of GPT implementation, interim mobile orchestration | Claude · Anthropic · Opus 4.8 · high. Interim mobile use applies while Fable 5 is outside the Anthropic subscription. |
| Claude workflows | Claude · Anthropic · Opus 4.8 · low |
| Massive external research / extraction | Antigravity CLI · Google · `agy` · low |
| Mobile orchestration after Fable 5 returns to the subscription | Claude · Anthropic · Fable 5 · low by default. Higher effort is an exceptional, explicit paid/on-demand escalation while outside the plan; policy data never authorizes spend. |
| Review of Claude implementation | Codex · OpenAI · GPT-5.6 Sol · xhigh. Mixed authorship uses per-slice opposite-family or dual review. |

The issue-body “Gemini 3.5 Flash” reference for research/extraction was superseded by epic #574's
2026-07-10 Antigravity reconciliation. A distinct Gemini-model lane is an owner open question, not
an inferred route.

## Harness invariants

1. **Generator session differs from evaluator session.** GPT-authored work receives Claude-family
   review; Claude-authored work receives GPT-family review. Mixed work is reviewed per slice by the
   opposite family or by both.
2. **No implementation lane self-certifies.** After automated gates, the coordinator performs a
   substantive review before its sign-off commit.
3. **Launch identity is data, not prose.** Launch edges require and validate provider, model, and
   effort through the runtime `RouteIdentity` contract and record requested versus observed identity.
4. **No implicit paid escalation.** Outside-plan or higher-effort Fable routes remain blocked until
   explicit owner approval; policy selection itself never launches or spends.

## Selection and handoff rules

- Record the selected lane and any owner override in `supervisor.md` and `drift.md`.
- Source-code work uses a daemon-attached native-WSL session when mobile supervision is required.
- Batch workflows persist and commit `workflow.js` before execution.
- Every brief starts with `use harness` and includes a `## SKILL` section.
- Native Claude mobile sessions and experimental provider-gateway sessions are different surfaces;
  never claim gateway output is mobile-visible native Claude.
- #582 owns rollout, promotion, and production canaries. This policy selects and validates routes but
  does not promote them.

## Supervisor identity

Every run directory records model, session, host, checkout/worktree, branch, baseline, selected
lanes, and overrides in `supervisor.md`. A run without that file is not activated.
