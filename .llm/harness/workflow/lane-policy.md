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

Fable 5 is back on the Anthropic subscription (2026-07-16). It is the **default orchestrator** and
the **default sub-agent for complex architecture / design / technical decisions**; Codex remains the
default implementer. Every route below is in-plan and auto-selectable — no route requires paid
approval — and each Fable primary carries an in-plan token-limit fallback.

| Task lane (`code lane`)                                                                                                                                                                    | Enforced route                                                                                                                    | Token-limit fallback                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Orchestrator — long-running planning & decision intelligence (`planning_decisions`). This is the supervisor session with `/rc` enabled; there is no separate "mobile orchestration" agent. | **Claude · Anthropic · Fable 5 · low**                                                                                            | Codex · OpenAI · GPT-5.6 Sol · high  |
| Complex architecture / design / technical **decisions** — default sub-agent (`deep_analysis`)                                                                                              | **Claude · Anthropic · Fable 5 · low**                                                                                            | Codex · OpenAI · GPT-5.6 Sol · high  |
| Implementation — most tasks (`normal_implementation`)                                                                                                                                      | **Codex · OpenAI · GPT-5.6 Sol · medium**                                                                                         | —                                    |
| Implementation — complex (`complex_implementation`)                                                                                                                                        | **Codex · OpenAI · GPT-5.6 Sol · high**                                                                                           | —                                    |
| Small fixes / fast iteration (`fast_iteration`)                                                                                                                                            | Codex · OpenAI · GPT-5.6 Luna · max                                                                                               | —                                    |
| Adversarial review of **Codex** work — normal, paired to Sol·medium impl (`review_codex`)                                                                                                  | **Claude · Anthropic · Fable 5 · low**                                                                                            | Claude · Anthropic · Opus 4.8 · low  |
| Adversarial review of **Codex** work — complex, paired to Sol·high impl (`review_codex_complex`)                                                                                           | **Claude · Anthropic · Fable 5 · high**                                                                                           | Claude · Anthropic · Opus 4.8 · high |
| Review of **Claude** work (`review_claude`)                                                                                                                                                | Codex · OpenAI · GPT-5.6 Sol · xhigh                                                                                              | —                                    |
| Delegated **code** chores (`chore_code`)                                                                                                                                                   | **Claude · Anthropic · Opus 4.8 · medium**                                                                                        | Codex · OpenAI · GPT-5.6 Luna · max  |
| Docs / cleanup / easy chores (`documentation_review`)                                                                                                                                      | **Claude · Anthropic · Sonnet 5 · high**                                                                                          | Codex · OpenAI · GPT-5.6 Luna · high |
| Major UI/UX work — lead route (`major_ui_ux_design`)                                                                                                                                       | Claude · OpenRouter · GLM 5.2 · `claude-design-glm-5-2` preset · xhigh                                                            | —                                    |
| Major UI/UX work — adversarial minimum when another lane leads (`major_ui_ux_adversarial_review`)                                                                                          | Claude · OpenRouter · GLM 5.2 · `claude-design-glm-5-2` preset · xhigh                                                            | —                                    |
| Vision-capable adversarial design evidence (`adversarial_design_eval`)                                                                                                                     | OpenCode · OpenRouter · Kimi K2.6 vision · high (`--variant`). Complements — does not replace — the required GLM 5.2 design pass. | —                                    |
| Claude Code workflows (`claude_workflow`)                                                                                                                                                  | Claude · Anthropic · Opus 4.8 · low                                                                                               | —                                    |
| Massive external research / extraction (`research_extraction`)                                                                                                                             | Antigravity CLI · Google · `agy` · low                                                                                            | —                                    |

The `major_ui_ux_*` GLM 5.2 lanes and the OpenCode vision-evidence lane are **dormant** while the
Dev Dashboard is paused (epic #400 moved to `0.0.1-beta.13`); they remain the enforced route for any
major UI/UX work that does run. GLM 5.2 stays scoped to **pure design work** — it is not an
implementation or general-evaluation model.

The issue-body "Gemini 3.5 Flash" reference for research/extraction was superseded by epic #574's
2026-07-10 Antigravity reconciliation. A distinct Gemini-model lane is an owner open question, not
an inferred route.

### Fable 5 restored as default (2026-07-16)

Fable 5 returned to the Anthropic subscription. The prior
`temporary_while_fable_outside_subscription` Opus 4.8 substitution on the orchestrator lane is
**retired**, and the separate `mobile_orchestration` lane is **removed** — mobile supervision is the
same `planning_decisions` session with the `/rc` command enabled, not a distinct agent or route.

- **Orchestrator and complex-decision sub-agent** run **Claude · Fable 5 · low**, in-plan and
  auto-selected.
- **Token-limit resilience.** Each Fable primary has an in-plan fallback for when a Fable session
  hits its token ceiling: the orchestrator and complex-decision lanes fall back to **Codex · GPT-5.6
  Sol · high**. The Codex-review lanes instead fall back to **Claude · Opus 4.8** (same effort) so
  an OpenAI-authored change is never reviewed by an OpenAI-family model — opposite-family review is
  never traded away for a token-limit fallback.
- **Adversarial pairing.** Codex implementation is reviewed by Fable, effort-paired: Sol·medium →
  Fable·low (`review_codex`), Sol·high → Fable·high (`review_codex_complex`).
- **Delegated work.** The Fable orchestrator delegates code chores to **Opus 4.8 · medium** and docs
  / cleanup / easy chores to **Sonnet 5 · high** (Luna fallbacks as above).

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
   review (`review_codex` / `review_codex_complex` on Fable 5); Claude-authored work receives
   GPT-family review (`review_claude` on GPT-5.6 Sol). Mixed work is reviewed per slice by the
   opposite family or by both. Token-limit fallbacks never cross this line.
2. **No implementation lane self-certifies.** After automated gates, the coordinator performs a
   substantive review before its sign-off commit.
3. **Launch identity is data, not prose.** Launch edges require and validate provider, model, and
   effort through the runtime `RouteIdentity` contract and record requested versus observed
   identity.
4. **No implicit paid or higher-effort escalation.** Every canonical route is in-plan; any future
   outside-plan or higher-effort route stays blocked until explicit owner approval, and policy
   selection itself never launches or spends.
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
