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

Opus 5 high is the **default orchestrator**. Fable 5 medium is the **default sub-agent for complex
architecture / design / technical decisions**; Codex remains the default implementer. Every native
route below is in-plan and auto-selectable — no route requires paid approval — and each primary
carries an in-plan token-limit fallback where declared.

| Task lane (`code lane`)                                                                                                                                                                    | Enforced route                                                                                                                    | Token-limit fallback                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Orchestrator — long-running planning & decision intelligence (`planning_decisions`). This is the supervisor session with `/rc` enabled; there is no separate "mobile orchestration" agent. | **Claude · Anthropic · Opus 5 · high**                                                                                            | Codex · OpenAI · GPT-5.6 Sol · high  |
| Complex architecture / design / technical **decisions** — default sub-agent (`deep_analysis`)                                                                                              | **Claude · Anthropic · Fable 5 · medium**                                                                                         | Codex · OpenAI · GPT-5.6 Sol · high  |
| Implementation — light scoped slices (`light_implementation`)                                                                                                                             | **Codex · OpenAI · GPT-5.6 Sol · low**                                                                                            | —                                    |
| Implementation — most tasks (`normal_implementation`)                                                                                                                                      | **Codex · OpenAI · GPT-5.6 Sol · medium**                                                                                         | —                                    |
| Implementation — complex (`complex_implementation`)                                                                                                                                        | **Codex · OpenAI · GPT-5.6 Sol · high**                                                                                           | —                                    |
| Small fixes / fast iteration (`fast_iteration`)                                                                                                                                            | Codex · OpenAI · GPT-5.6 Luna · max                                                                                               | —                                    |
| Adversarial review of **Codex** work — normal, paired to Sol·medium impl (`review_codex`)                                                                                                  | **Claude · Anthropic · Fable 5 · low**                                                                                            | Claude · Anthropic · Opus 5 · low  |
| Adversarial review of **Codex** work — light, paired to Sol·low impl (`review_codex_light`)                                                                                                | **Claude · Anthropic · Opus 5 · high**                                                                                          | Claude · Anthropic · Sonnet 5 · high |
| Adversarial review of **Codex** work — complex, paired to Sol·high impl (`review_codex_complex`)                                                                                           | **Claude · Anthropic · Fable 5 · medium**                                                                                         | Claude · Anthropic · Opus 5 · medium |
| Adversarial review of **Codex** work — fast, paired to Luna·max impl (`review_codex_fast`)                                                                                                 | **Claude · Anthropic · Opus 5 · medium**                                                                                        | Claude · Anthropic · Sonnet 5 · high |
| Review of **Claude** work (`review_claude`)                                                                                                                                                | Codex · OpenAI · GPT-5.6 Sol · xhigh                                                                                              | —                                    |
| Delegated **code** chores (`chore_code`)                                                                                                                                                   | **Claude · Anthropic · Opus 5 · medium**                                                                                        | Codex · OpenAI · GPT-5.6 Luna · max  |
| Docs / cleanup / easy chores (`documentation_review`)                                                                                                                                      | **Claude · Anthropic · Sonnet 5 · high**                                                                                          | Codex · OpenAI · GPT-5.6 Luna · high |
| Documentation authoring (`documentation_authoring`)                                                                                                                                        | **Antigravity CLI · Google · Gemini 3.6 Flash · low**                                                                             | —                                    |
| Opposite-family single-pass audit of a Claude-generated docs changeset (`docs_audit`). Gate set in [`doc-audit.md`](./doc-audit.md).                                                        | **Codex · OpenAI · GPT-5.6 Sol · medium** (`high` for large changesets)                                                          | — (opposite-family by design)        |
| Final edit-only prose polish after audit + fixes (`docs_polish`). Doctrine in [`doc-audit.md`](./doc-audit.md).                                                                             | **Claude · Anthropic · Fable 5 · medium**                                                                                        | Claude · Anthropic · Opus 5 · xhigh → (no Claude surface) Claude · OpenRouter · GLM 5.2 · xhigh |
| Major UI/UX work — lead route (`major_ui_ux_design`)                                                                                                                                       | Claude · OpenRouter · GLM 5.2 · `claude-design-glm-5-2` preset · xhigh                                                            | —                                    |
| Major UI/UX work — adversarial minimum when another lane leads (`major_ui_ux_adversarial_review`)                                                                                          | Claude · OpenRouter · GLM 5.2 · `claude-design-glm-5-2` preset · xhigh                                                            | —                                    |
| Vision-capable adversarial design evidence (`adversarial_design_eval`)                                                                                                                     | OpenCode · OpenRouter · Kimi K3 vision · high (`--variant`). Complements — does not replace — the required GLM 5.2 design pass. | —                                    |
| Claude Code workflows (`claude_workflow`)                                                                                                                                                  | Claude · Anthropic · Opus 5 · low                                                                                               | —                                    |
| Massive external research / extraction (`research_extraction`)                                                                                                                             | Antigravity CLI · Google · Gemini 3.6 Flash · low                                                                                 | —                                    |
| **Local PLAN-EVAL** (`formal_plan_evaluation`)                                                                                                                                              | Native opposite-family: Fable 5 · medium for Codex plans; Sol · high for Claude plans                                            | Minimax M3 · high for third opinion/native quota limit; AGY Gemini 3.6 Flash · high if OpenRouter is limited |
| **Local IMPL-EVAL** (`formal_impl_evaluation`)                                                                                                                                              | Native opposite-family: Fable 5 · medium for Codex work; Sol · xhigh for Claude work                                             | DeepSeek V4 Flash 0731 · max for third opinion/native quota limit; AGY Gemini 3.6 Flash · high if OpenRouter is limited |
| Automated cloud agent (including cloud evaluator runs)                                                                                                                                     | **TEMPORARILY PAUSED by owner (2026-08-06)** — use local toolchain until trigger path is fixed                                    | —                                    |

The `major_ui_ux_*` GLM 5.2 lanes and the OpenCode vision-evidence lane are **dormant** while the
Dev Dashboard is paused (epic #400 moved to `0.0.1-beta.13`); they remain the enforced route for any
major UI/UX work that does run. GLM 5.2 stays scoped to **pure design work, plus exactly one named
exception: the `docs_polish` no-Claude-surface last-resort fallback** (2026-07-17, above) — it is
not an implementation or general-evaluation model.

**Owner decision (2026-08-03).** Documentation authoring routes to Gemini through the Antigravity
CLI (`agy`) on the owner's Google subscription. Gemini over OpenRouter is **not** an approved route:
it spends OpenRouter credit where a subscription already exists. This remains a generator lane
only; it does not change the formal evaluator lane, its approved open-model set, or the prohibition
on Gemini over evaluator transports.

**Owner decision (2026-08-08).** PLAN-EVAL is conditional: use it before implementation only for
genuinely complex/decision-heavy work, multi-PR/wave planning, or when adversarial planning advice
is useful. Small/mechanical issues with complete contract/scope/acceptance/gates record
`PLAN-EVAL: N/A`. IMPL-EVAL remains mandatory unless the owner explicitly waives it. Both use a
fresh native opposite-family Claude ⇄ Codex session by default. Use the phase-bound OpenRouter open
model only for a genuine third opinion or native-family quota limit. If OpenRouter is then limited,
fall back to a fresh Antigravity CLI (`agy`) Gemini 3.6 Flash high session on the Google
subscription. OpenHands is not a normal local evaluator and is reserved for explicitly
cloud-driven work. Record every escalation and requested/observed identity.

**Forward rule (not a lane).** Any future **max-effort OpenAI implementation** route pairs with a
**Claude · Fable 5 · high** adversarial review. This extends the effort-paired ladder above; when
such a route is introduced, add it as an explicit lane rather than relying on this note.

### Review-pairing ladder, owner-ratified 2026-07-16

The adversarial review of Codex/OpenAI-authored work is now **effort-paired** to the implementation
lane that produced it, and **Fable 5 is reserved for medium+ pairings**:

| Implementation lane                 | Review pairing (`lane`) | Reviewer                                      |
| ----------------------------------- | ----------------------- | --------------------------------------------- |
| `light_implementation` (Sol · low)  | `review_codex_light`    | Opus 5 · high (fallback Sonnet 5 · high)    |
| `normal_implementation` (Sol · med) | `review_codex`          | Fable 5 · low (fallback Opus 5 · low)       |
| `complex_implementation` (Sol · hi) | `review_codex_complex`  | Fable 5 · medium (fallback Opus 5 · medium) |
| `fast_iteration` (Luna · max)       | `review_codex_fast`     | Opus 5 · medium (fallback Sonnet 5 · high)  |

**Rationale.** The high volume of Sol-low/medium implementation was consuming Fable capacity through
review. Fable is reserved for the medium+ pairings (`review_codex`, `review_codex_complex`) where
its depth is warranted; the small-slice and fast-iteration lanes review on Opus with a Claude-family
Sonnet 5 token-limit fallback. `review_codex_complex` **changed** from Fable · high to Fable ·
medium. Fable 5 is restored to the Anthropic plan (PR #784, 2026-07-16): the Fable review primaries
are in-plan and auto-selectable, the prior Opus substitution is retired for these lanes, and their
Opus entries exist only as token-limit fallbacks. Invariants are unchanged: opposite-family review
is never traded away (every fallback is Claude-family), the generator is never the evaluator, and no
route authorizes implicit paid escalation.

#### Sol effort selection for implementation slices (owner-ratified 2026-07-16)

Selection guidance, not new lanes — how to pick the Codex · GPT-5.6 Sol effort for a given slice:

- **low** — the default workhorse. All non-long-running, non-complex work; targeted mid-complexity
  fixes. Start here unless the slice clearly needs more.
- **medium** — only when there is real potential for additional research or decision-taking
  mid-slice.
- **high** — genuinely new features or complex fixes.
- **max** — escalation tier: architectural / deep-thinking / multiple-possible-outcome work, or
  tasks left unresolved by a lower-effort agent.

These efforts map onto the implementation lanes above (`light_implementation` · low,
`normal_implementation` · medium, `complex_implementation` · high) and drive the effort-paired
review pairing; `max` is the escalation tier and, per the forward rule, pairs with a Fable 5 · high
adversarial review.

### Native Claude orchestration and analysis defaults (2026-08-08)

The single mobile-visible `planning_decisions` session is **Claude · Opus 5 · high**. Complex
architecture, design, and technical decision analysis delegates to **Claude · Fable 5 · medium**.
There is no separate `mobile_orchestration` lane: enable `/rc` on the orchestrator itself.

- **Token-limit resilience.** The orchestrator and complex-decision lanes fall back to **Codex ·
  GPT-5.6 Sol · high**. The Codex-review lanes instead fall back to **Claude · Opus 5** (same effort) so
  an OpenAI-authored change is never reviewed by an OpenAI-family model — opposite-family review is
  never traded away for a token-limit fallback.
- **Adversarial pairing.** Codex implementation follows the #794 effort-paired review ladder:
  Sol·low → Opus·high, Sol·medium → Fable·low, Sol·high → Fable·medium, and Luna·max → Opus·medium.
- **Delegated work.** The Opus orchestrator delegates deep analysis to **Fable 5 · medium**, code chores to **Opus 5 · medium**, and docs
  / cleanup / easy chores to **Sonnet 5 · high** (Luna fallbacks as above).

### Doc-audit profile — opposite-family audit + Fable prose polish (2026-07-17)

Docs changesets generated by Claude authoring lanes (single/few **Fable 5 · high** sub-agents, or a
Claude workflow fleet on **Opus 5 · medium** / **Sonnet 5 · high**) run a fixed two-lane pipeline:
**generate → single-pass Sol audit → fix cycle(s) → single-pass Fable polish → merge**.

- **`docs_audit`** — a single **opposite-family** pass by **Codex · GPT-5.6 Sol · medium** (`high`
  for large changesets) over the **entire changeset** — never one audit per authoring sub-agent,
  because the failure modes that matter (baseline drift, cross-page contradictions, false
  completeness claims) only exist at changeset scope. The audit is opposite-family by design (Codex
  reviewing Claude-generated docs restores family diversity), so the generator is never the auditor
  and there is **no cross-family fallback**. Every accuracy gate is executed by the auditor (commands
  run, `deno doc` inspected) — verdicts from evidence, never from the generator's claims.
- **`docs_polish`** — a final **edit-only** prose pass by **Claude · Fable 5 · medium** after the
  audit and after fixes land. It edits in place for voice/flow/precision; it does not re-author from
  scratch unless the **audit findings** judged a document's prose bad enough to warrant it, and it
  never changes technical claims (accuracy doubts return to `docs_audit`). Fallback chain (depth 2):
  token-limit → **Opus 5 · xhigh**; and only if **no Claude-agent surface** is available at all →
  **GLM 5.2 · xhigh** over the `claude-openrouter` transport the design lanes use. GLM is a
  polish-fallback-of-last-resort **only here** — this does not widen GLM beyond its design scope
  elsewhere.

The **gate set, the per-gate audit-log requirement, the polish doctrine, and the pattern-mining
lifecycle** live in [`doc-audit.md`](./doc-audit.md) — not restated here. Both lanes are backed in
data by the `docs_audit` / `docs_polish` entries in
`../../tools/agentic/runtime/routing-policy.ts`.

### Native-first formal evaluation (2026-08-08)

PLAN-EVAL and IMPL-EVAL normally run in fresh **native opposite-family sessions**. Fable 5 medium
evaluates Codex-authored work; Codex GPT-5.6 Sol high (PLAN) or xhigh (IMPL) evaluates
Claude-authored work. The generator session never evaluates itself.

The phase-bound OpenRouter presets remain available only for a genuine third opinion or when the
native opposite-family route is quota-blocked: Minimax M3 high for PLAN-EVAL and DeepSeek V4 Flash
0731 max for IMPL-EVAL. If that escalation hits an OpenRouter limit, the final fallback is a fresh
AGY Gemini 3.6 Flash high session on the Google subscription. OpenHands is reserved for explicitly
cloud-driven work.

**Machine binding.** This table is the rendered view of `CANONICAL_ROUTE_POLICY`.
`resolveCanonicalFormalEvaluatorRoute()` **throws** unless the requested native family or explicit
fallback reason matches the phase-bound route. Approved OpenRouter model identities remain
centralized in `config/models.ts`.

### OpenRouter through Claude Code

OpenRouter-backed routes driven through Claude Code are a **proven escalation transport** (validated
via the agentic tooling), not the default local evaluator. The generator session is never the
evaluator session, and no lane self-certifies. GLM 5.2 remains scoped to **pure design
work** (the `major_ui_ux_*` lanes) **plus exactly one named exception — the `docs_polish`
no-Claude-surface last-resort fallback (2026-07-17)**; it is not an implementation or
general-evaluation model.

**Capability, per model (drift D-4, amended).** Reasoning support on this transport is a
**per-model** fact, not a client-wide one. Do not generalize from one model:

| Model on Claude Code + OpenRouter | Reasoning trace | Agentic turn | Lane              |
| --------------------------------- | --------------- | ------------ | ----------------- |
| `minimax/minimax-m3`              | yes             | supported    | PLAN-EVAL; workflow fanout uses a distinct preset |
| `deepseek/deepseek-v4-flash-0731` | yes             | supported    | IMPL-EVAL |
| `z-ai/glm-5.2`                    | **none**        | —            | design/UI-UX; sole other use: `docs_polish` last-resort fallback |

The **evaluator lane is fully capable**: real reasoning trace, verified agentic turn (real tool
calls), so it can run gates and its `effort` is genuine — **not** nominal.

**GLM 5.2 is the exception, and only GLM.** It returns zero thinking blocks over OpenRouter, so
**never cite "GLM 5.2 · xhigh reasoning" as gate evidence** — state "tools + streaming, no reasoning
trace" instead. This caveat is scoped to the lanes GLM may run on — the design-verification lanes
and the `docs_polish` last-resort fallback — and must not be restated as a property of the
transport.

### OpenRouter through OpenCode

OpenCode is the native-WSL terminal/web transport for the vision-capable adversarial design-evidence
lane. Its policy `effort` is passed to `opencode run` as `--variant`; the canonical Kimi model id
remains centralized in `config/models.ts`. This lane adds screenshot/image evidence and does not
supersede the GLM 5.2 requirement for major UI/UX work.

## Harness invariants

1. **Generator session differs from evaluator session.** Formal evaluation normally uses a fresh
   native opposite-family Claude ⇄ Codex session. OpenRouter is permitted only for third opinion or
   native quota exhaustion; OpenHands only for explicitly cloud-driven work. Mixed work is reviewed
   per slice by the opposite family or by both. A missing evaluator is a recorded blocker rather
   than a licence to self-review.
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
6. **Relay evaluator lanes run OPEN models only.** OpenRouter escalation uses
   `minimax/minimax-m3` or `deepseek/deepseek-v4-flash-0731`; cloud OpenHands remains governed by
   its approved open-model set. Closed models are prohibited on those relay surfaces because they
   burn paid OpenRouter credit. Native Claude/Codex evaluation is not a relay route.

## Selection and handoff rules

- Record the selected lane and any owner override in `supervisor.md` and `drift.md`.
- Source-code work uses a daemon-attached native-WSL session when mobile supervision is required.
- Batch workflows persist and commit `workflow.js` before execution.
- Every brief — including ordinary/adversarial review, formal evaluation, implementation, and
  side-fix prompts — starts with `use harness` and includes a `## SKILL` section.
- Native Claude mobile sessions and experimental provider-gateway sessions are different surfaces;
  never claim gateway output is mobile-visible native Claude.
- #582 owns rollout, promotion, and production canaries. This policy selects and validates routes
  but does not promote them.

## Supervisor identity

Every run directory records model, session, host, checkout/worktree, branch, baseline, selected
lanes, and overrides in `supervisor.md`. A run without that file is not activated.
