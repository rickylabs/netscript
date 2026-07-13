# Lane Policy — Canonical Routing and Harness Invariants

This document is the single human-facing source for NetScript task routing. The machine-readable
bindings live in `../../tools/agentic/runtime/routing-policy.ts` as `CANONICAL_ROUTE_POLICY`; the
table below is its rendered policy view. Skills, templates, and operator docs reference this file
instead of copying the routes.

To change a **model id**, edit `../../tools/agentic/config/models.ts` (the single source for
model-id strings); the lane bindings in `routing-policy.ts` reference those constants. Tool versions
and endpoints live in `config/versions.ts` and `config/endpoints.ts`. See the "Maintenance map" in
`../../tools/agentic/README.md` for the full where-to-change-what table; a guard test
(`config/no-hardcoded-volatile_test.ts`) fails if any of these values is hardcoded outside
`config/`.

## Canonical routes

| Task lane                                                                                                                             | Enforced route                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Normal implementation                                                                                                                 | Codex · OpenAI · GPT-5.6 Sol · medium                                                                                                                                                                                                                     |
| Small fixes / fast iteration                                                                                                          | Codex · OpenAI · GPT-5.6 Luna · max                                                                                                                                                                                                                       |
| Deep technical analysis, research, complex integration                                                                                | Primary: Codex · OpenAI · GPT-5.6 Sol · xhigh. Fallback: Claude · Anthropic · Fable 5 · max, only after a classified Codex `quota_exhausted` signal **and** explicit owner approval while Fable 5 is outside the subscription.                            |
| Long-running planning and decision intelligence (orchestrator)                                                                        | Claude · Anthropic · Opus 4.8 · medium, while Fable 5 is outside the subscription. Fable 5 · medium remains authorized as an explicit owner-requested paid route.                                                                                         |
| Major UI/UX work — lead route                                                                                                         | Claude · OpenRouter · GLM 5.2 · `claude-design-glm-5-2` preset / `claude-print` · xhigh. Applies to design-system work, dashboard/console surfaces, and significant frontend UX.                                                                          |
| Major UI/UX work — adversarial minimum when another lane leads                                                                        | Claude · OpenRouter · GLM 5.2 · `claude-design-glm-5-2` preset / `claude-print` · xhigh, required before merge.                                                                                                                                           |
| Vision-capable adversarial design evidence                                                                                             | OpenCode · OpenRouter · Kimi K2.6 vision · high variant. This visual-evidence lane complements and does not replace the required GLM 5.2 design pass for major UI/UX work.                                                                                |
| Documentation, writing, general design support excluding major UI/UX work, review of GPT implementation, interim mobile orchestration | Claude · Anthropic · Opus 4.8 · high. Interim mobile use applies while Fable 5 is outside the Anthropic subscription.                                                                                                                                     |
| Claude workflows                                                                                                                      | Claude · Anthropic · Opus 4.8 · low                                                                                                                                                                                                                       |
| Massive external research / extraction                                                                                                | Antigravity CLI · Google · `agy` · low                                                                                                                                                                                                                    |
| Mobile orchestration (same lane as the orchestrator)                                                                                  | Claude · Anthropic · Opus 4.8 · medium, while Fable 5 is outside the subscription. Fable 5 · high remains an exceptional, explicit paid/on-demand escalation; policy data never authorizes spend. Reverts to Fable 5 when it returns to the subscription. |
| Review of Claude implementation                                                                                                       | Codex · OpenAI · GPT-5.6 Sol · xhigh. Mixed authorship uses per-slice opposite-family or dual review.                                                                                                                                                     |

The issue-body “Gemini 3.5 Flash” reference for research/extraction was superseded by epic #574's
2026-07-10 Antigravity reconciliation. A distinct Gemini-model lane is an owner open question, not
an inferred route.

### Temporary Fable-5 substitution (revert when Fable 5 returns)

Fable 5 left the Anthropic subscription. Routes carrying the condition
`temporary_while_fable_outside_subscription` in `routing-policy.ts` are substitutions, not new
doctrine, and revert to their Fable 5 bindings once Fable 5 is back on the plan:

- Orchestrator and mobile orchestration are the same lane and both run **Claude · Opus 4.8 ·
  medium** for the duration.
- Fable 5 is **never removed** from the matrix. It stays selectable on explicit owner request as an
  outside-plan, approval-gated route (`exceptional_paid_on_demand`), and is never auto-selected.
- Every other lane is unchanged.

### OpenRouter through Claude Code

OpenRouter-backed routes driven through Claude Code are a **proven transport** (validated via the
agentic tooling), not a distinct doctrine. The evaluator rules that govern OpenHands govern them
identically: the generator session is never the evaluator session, and no lane self-certifies. GLM
5.2 remains scoped to **pure design work** (the `major_ui_ux_*` lanes); it is not an implementation
or general-evaluation model.

### OpenRouter through OpenCode

OpenCode is the native-WSL terminal/web transport for the vision-capable adversarial design-evidence
lane. Its policy `effort` is passed to `opencode run` as `--variant`; the canonical Kimi model id
remains centralized in `config/models.ts`. This lane adds screenshot/image evidence and does not
supersede the GLM 5.2 requirement for major UI/UX work.

## Harness invariants

1. **Generator session differs from evaluator session.** GPT-authored work receives Claude-family
   review; Claude-authored work receives GPT-family review. Mixed work is reviewed per slice by the
   opposite family or by both.
2. **No implementation lane self-certifies.** After automated gates, the coordinator performs a
   substantive review before its sign-off commit.
3. **Launch identity is data, not prose.** Launch edges require and validate provider, model, and
   effort through the runtime `RouteIdentity` contract and record requested versus observed
   identity.
4. **No implicit paid escalation.** Outside-plan or higher-effort Fable routes remain blocked until
   explicit owner approval; policy selection itself never launches or spends.
5. **Major UI/UX work requires GLM 5.2.** Design-system work, dashboard/console surfaces, and
   significant frontend UX are either led through the `claude-design-glm-5-2` route or receive its
   adversarial design pass before merge.

## Selection and handoff rules

- Record the selected lane and any owner override in `supervisor.md` and `drift.md`.
- Source-code work uses a daemon-attached native-WSL session when mobile supervision is required.
- Batch workflows persist and commit `workflow.js` before execution.
- Every brief starts with `use harness` and includes a `## SKILL` section.
- Native Claude mobile sessions and experimental provider-gateway sessions are different surfaces;
  never claim gateway output is mobile-visible native Claude.
- #582 owns rollout, promotion, and production canaries. This policy selects and validates routes
  but does not promote them.

## Supervisor identity

Every run directory records model, session, host, checkout/worktree, branch, baseline, selected
lanes, and overrides in `supervisor.md`. A run without that file is not activated.
