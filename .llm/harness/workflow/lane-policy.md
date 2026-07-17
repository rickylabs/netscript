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

| Task lane                                                                                               | Enforced route                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Light implementation (small scoped slices)                                                              | Codex · OpenAI · GPT-5.6 Sol · low                                                                                                                                                                                                                        |
| Normal implementation                                                                                   | Codex · OpenAI · GPT-5.6 Sol · medium                                                                                                                                                                                                                     |
| Complex implementation (large / cross-cutting slices)                                                   | Codex · OpenAI · GPT-5.6 Sol · high                                                                                                                                                                                                                       |
| Small fixes / fast iteration                                                                            | Codex · OpenAI · GPT-5.6 Luna · max (incl. swarm Codex sub-agents)                                                                                                                                                                                        |
| Deep technical analysis, research, complex integration                                                  | Primary: Codex · OpenAI · GPT-5.6 Sol · xhigh. Fallback: Claude · Anthropic · Fable 5 · max, only after a classified Codex `quota_exhausted` signal **and** explicit owner approval while Fable 5 is outside the subscription.                            |
| Long-running planning and decision intelligence (orchestrator)                                          | Claude · Anthropic · Opus 4.8 · medium, while Fable 5 is outside the subscription. Fable 5 · medium remains authorized as an explicit owner-requested paid route.                                                                                         |
| Major UI/UX work — lead route                                                                           | Claude · OpenRouter · GLM 5.2 · `claude-design-glm-5-2` preset / `claude-print` · xhigh. Applies to design-system work, dashboard/console surfaces, and significant frontend UX.                                                                          |
| Major UI/UX work — adversarial minimum when another lane leads                                          | Claude · OpenRouter · GLM 5.2 · `claude-design-glm-5-2` preset / `claude-print` · xhigh, required before merge.                                                                                                                                           |
| Documentation, writing, general design support excluding major UI/UX work, interim mobile orchestration | Claude · Anthropic · Opus 4.8 · high. Interim mobile use applies while Fable 5 is outside the Anthropic subscription.                                                                                                                                     |
| Claude workflows                                                                                        | Claude · Anthropic · Opus 4.8 · low                                                                                                                                                                                                                       |
| Massive external research / extraction                                                                  | Antigravity CLI · Google · `agy` · low                                                                                                                                                                                                                    |
| Mobile orchestration (same lane as the orchestrator)                                                    | Claude · Anthropic · Opus 4.8 · medium, while Fable 5 is outside the subscription. Fable 5 · high remains an exceptional, explicit paid/on-demand escalation; policy data never authorizes spend. Reverts to Fable 5 when it returns to the subscription. |
| Review of Claude implementation                                                                         | Codex · OpenAI · GPT-5.6 Sol · xhigh. Mixed authorship uses per-slice opposite-family or dual review.                                                                                                                                                     |
| Review of Codex/OpenAI light implementation (pairs with light implementation)                           | Claude · Anthropic · Opus 4.8 · high. Token-limit fallback: Claude · Anthropic · Sonnet 5 · high (Claude-family only).                                                                                                                                    |
| Review of Codex/OpenAI normal implementation (pairs with normal implementation)                         | Claude · Anthropic · Fable 5 · low — in-plan and auto-selectable (Fable 5 restored, PR #784). Token-limit fallback: Claude · Anthropic · Opus 4.8 · low (Claude-family only).                                                                             |
| Review of Codex/OpenAI complex implementation (pairs with complex implementation)                       | Claude · Anthropic · Fable 5 · medium — in-plan and auto-selectable (Fable 5 restored, PR #784). Token-limit fallback: Claude · Anthropic · Opus 4.8 · medium (Claude-family only).                                                                       |
| Review of Codex/OpenAI fast iteration (pairs with fast iteration, incl. swarm Codex sub-agents)         | Claude · Anthropic · Opus 4.8 · medium. Token-limit fallback: Claude · Anthropic · Sonnet 5 · high (Claude-family only).                                                                                                                                  |
| **Local evaluator pass — PLAN-EVAL / IMPL-EVAL**                                                | Claude · OpenRouter · bound **OPEN-model Qwen evaluation preset** (`qwen/qwen3.7-max`) · `claude-openrouter` profile / `claude-print`. **Closed/paid models (Claude/GPT/Gemini) are PROHIBITED** — they burn paid OpenRouter credit. Minimax M3 remains approved but its current local preset is workflow-fanout, not evaluation. |
| Automated cloud agent (including cloud evaluator runs)                                         | OpenHands · open models only (minimax M3 / Qwen 3.7) · cloud-driven runs only. Unchanged; see `.agents/skills/openhands-handoff/SKILL.md`.                                                                                                                    |

The issue-body “Gemini 3.5 Flash” reference for research/extraction was superseded by epic #574's
2026-07-10 Antigravity reconciliation. A distinct Gemini-model lane is an owner open question, not
an inferred route.

**Forward rule (not a lane).** Any future **max-effort OpenAI implementation** route pairs with a
**Claude · Fable 5 · high** adversarial review. This extends the effort-paired ladder above; when
such a route is introduced, add it as an explicit lane rather than relying on this note.

### Review-pairing ladder, owner-ratified 2026-07-16

The adversarial review of Codex/OpenAI-authored work is now **effort-paired** to the implementation
lane that produced it, and **Fable 5 is reserved for medium+ pairings**:

| Implementation lane                 | Review pairing (`lane`) | Reviewer                                      |
| ----------------------------------- | ----------------------- | --------------------------------------------- |
| `light_implementation` (Sol · low)  | `review_codex_light`    | Opus 4.8 · high (fallback Sonnet 5 · high)    |
| `normal_implementation` (Sol · med) | `review_codex`          | Fable 5 · low (fallback Opus 4.8 · low)       |
| `complex_implementation` (Sol · hi) | `review_codex_complex`  | Fable 5 · medium (fallback Opus 4.8 · medium) |
| `fast_iteration` (Luna · max)       | `review_codex_fast`     | Opus 4.8 · medium (fallback Sonnet 5 · high)  |

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

### Temporary Fable-5 substitution — non-review routes only (revert when they follow #784)

This section is scoped to the **non-review** routes that still carry the conditions
`temporary_while_fable_outside_subscription` or `exceptional_paid_on_demand` in `routing-policy.ts`
(orchestrator/mobile orchestration). The deep-analysis Fable fallback is a separate case — it
carries `fallback_only_after_codex_quota_exhausted`, a quota-classified fallback behind the Codex
primary, not a substitution. This section does **not** apply to the restored review pairings
**`review_codex`** and **`review_codex_complex`**, whose Fable 5 primaries are in-plan and
auto-selectable per the review-pairing ladder above (PR #784, 2026-07-16). For the still-substituted
routes:

- Orchestrator and mobile orchestration are the same lane and both run **Claude · Opus 4.8 ·
  medium** for the duration.
- On these non-review routes, Fable 5 is **never removed** from the matrix. It stays selectable on
  explicit owner request as an outside-plan, approval-gated route (`exceptional_paid_on_demand`),
  and is never auto-selected there — the two review lanes named above are the ratified exceptions.
- Every other lane is unchanged.

### The local evaluator now has a named transport (2026-07-13)

The doctrine already said the right thing: OpenHands is for **cloud-driven** runs, and a
**local-machine** run must use a local adversarial agent for PLAN-EVAL/IMPL-EVAL. What it lacked was
a **named local transport** — so it described a gap and told us to log it. The gap is now filled:

**Local PLAN-EVAL / IMPL-EVAL runs on Claude Code + OpenRouter (`claude-openrouter` profile →
`claude-print`) with the bound open-model Qwen evaluation preset.** An open model is neither Claude-family nor Codex-family, so it
is adversarial to **both** generators — the generator-≠-evaluator invariant is satisfied more
robustly than by a family swap alone.

**Nothing about OpenHands changes.** It remains the default automated **cloud** agent, and its model
rules are inherited **verbatim** by the local lane:

- **OPEN models only** — the approved set is `minimax/minimax-m3` and `qwen/qwen3.7-max`; the
  currently bound local evaluation preset is Qwen, while Minimax's current preset is workflow-fanout.
- **Closed/paid models (Claude/`sonnet`, GPT/`gpt`, Gemini) are PROHIBITED** on either evaluator
  transport. They bill the owner's OpenRouter balance and can silently burn it. This is a
  **cost-protection policy, not a runner implementation detail** — it survives the transport change
  and must not be weakened.

**Ordinary (non-formal) review** — the slice review gate, code/PR review — remains opposite-family
Claude ⇄ Codex. Do not conflate it with the formal evaluator pass.

**Machine binding.** This table is the rendered view of `CANONICAL_ROUTE_POLICY`. The evaluator lane
is backed by data: a companion `routing-policy.ts` slice binds the formal open-model evaluator route
to the `claude-openrouter` profile, adds `qwen/qwen3.7-max` to `OPENROUTER_MODEL_IDS`, and makes
`resolveCanonicalFormalEvaluatorRoute()` **throw** unless the route is Claude + OpenRouter +
`open_only` with an approved open model — so the closed-model prohibition above is enforced **in
code, not in a comment**. That slice and this document land together; the doc is not a substitute
for the binding.

The evaluator lane was, before this, the one lane in the repo that lived only in prose — which is
precisely why an unexamined assumption could survive in it for so long. Keep it in the data.

### OpenRouter through Claude Code

OpenRouter-backed routes driven through Claude Code are a **proven transport** (validated via the
agentic tooling), not a distinct doctrine — it is the transport the local evaluator lane above runs
on. The evaluator rules that govern OpenHands govern them identically: the generator session is
never the evaluator session, and no lane self-certifies. GLM 5.2 remains scoped to **pure design
work** (the `major_ui_ux_*` lanes); it is not an implementation or general-evaluation model.

**Capability, per model (drift D-4, amended).** Reasoning support on this transport is a
**per-model** fact, not a client-wide one. Do not generalize from one model:

| Model on Claude Code + OpenRouter | Reasoning trace | Agentic turn | Lane              |
| --------------------------------- | --------------- | ------------ | ----------------- |
| `minimax/minimax-m3`              | yes             | supported    | workflow fanout; approved open model |
| `qwen/qwen3.7-max`                | yes             | supported    | bound formal evaluator |
| `z-ai/glm-5.2`                    | **none**        | —            | design/UI-UX only |

The **evaluator lane is fully capable**: real reasoning trace, verified agentic turn (real tool
calls), so it can run gates and its `effort` is genuine — **not** nominal.

**GLM 5.2 is the exception, and only GLM.** It returns zero thinking blocks over OpenRouter, so
**never cite "GLM 5.2 · xhigh reasoning" as gate evidence** — state "tools + streaming, no reasoning
trace" instead. This caveat is scoped to the design-verification lane and must not be restated as a
property of the transport.

## Harness invariants

1. **Generator session differs from evaluator session.** The formal evaluator pass (PLAN-EVAL /
   IMPL-EVAL) runs an **open model** — neither Claude-family nor Codex-family, therefore adversarial
   to both — locally on Claude Code + OpenRouter, or in the cloud on OpenHands. For ordinary review,
   GPT-authored work receives Claude-family review; Claude-authored work receives GPT-family review;
   mixed work is reviewed per slice by the opposite family or by both. A missing evaluator is a
   recorded blocker, never a licence to self-review.
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
6. **Evaluator lanes run OPEN models only.** `minimax/minimax-m3` and `qwen/qwen3.7-max` are
   permitted on both the local (Claude Code + OpenRouter) and cloud (OpenHands) evaluator
   transports. Closed/paid models (Claude/`sonnet`, GPT/`gpt`, Gemini) are **prohibited** on them
   because they bill the owner's OpenRouter balance. Cost protection — never weaken it to make a
   route convenient.

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
