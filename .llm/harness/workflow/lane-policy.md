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
| Implementation — light scoped slices (`light_implementation`)                                                                                                                             | **Codex · OpenAI · GPT-5.6 Sol · low**                                                                                            | —                                    |
| Implementation — most tasks (`normal_implementation`)                                                                                                                                      | **Codex · OpenAI · GPT-5.6 Sol · medium**                                                                                         | —                                    |
| Implementation — complex (`complex_implementation`)                                                                                                                                        | **Codex · OpenAI · GPT-5.6 Sol · high**                                                                                           | —                                    |
| Small fixes / fast iteration (`fast_iteration`)                                                                                                                                            | Codex · OpenAI · GPT-5.6 Luna · max                                                                                               | —                                    |
| Adversarial review of **Codex** work — normal, paired to Sol·medium impl (`review_codex`)                                                                                                  | **Claude · Anthropic · Fable 5 · low**                                                                                            | Claude · Anthropic · Opus 4.8 · low  |
| Adversarial review of **Codex** work — light, paired to Sol·low impl (`review_codex_light`)                                                                                                | **Claude · Anthropic · Opus 4.8 · high**                                                                                          | Claude · Anthropic · Sonnet 5 · high |
| Adversarial review of **Codex** work — complex, paired to Sol·high impl (`review_codex_complex`)                                                                                           | **Claude · Anthropic · Fable 5 · medium**                                                                                         | Claude · Anthropic · Opus 4.8 · medium |
| Adversarial review of **Codex** work — fast, paired to Luna·max impl (`review_codex_fast`)                                                                                                 | **Claude · Anthropic · Opus 4.8 · medium**                                                                                        | Claude · Anthropic · Sonnet 5 · high |
| Review of **Claude** work (`review_claude`)                                                                                                                                                | Codex · OpenAI · GPT-5.6 Sol · xhigh                                                                                              | —                                    |
| Delegated **code** chores (`chore_code`)                                                                                                                                                   | **Claude · Anthropic · Opus 4.8 · medium**                                                                                        | Codex · OpenAI · GPT-5.6 Luna · max  |
| Docs / cleanup / easy chores (`documentation_review`)                                                                                                                                      | **Claude · Anthropic · Sonnet 5 · high**                                                                                          | Codex · OpenAI · GPT-5.6 Luna · high |
| Opposite-family single-pass audit of a Claude-generated docs changeset (`docs_audit`). Gate set in [`doc-audit.md`](./doc-audit.md).                                                        | **Codex · OpenAI · GPT-5.6 Sol · medium** (`high` for large changesets)                                                          | — (opposite-family by design)        |
| Final edit-only prose polish after audit + fixes (`docs_polish`). Doctrine in [`doc-audit.md`](./doc-audit.md).                                                                             | **Claude · Anthropic · Fable 5 · medium**                                                                                        | Claude · Anthropic · Opus 4.8 · xhigh → (no Claude surface) Claude · OpenRouter · GLM 5.2 · xhigh |
| Major UI/UX work — lead route (`major_ui_ux_design`)                                                                                                                                       | Claude · OpenRouter · GLM 5.2 · `claude-design-glm-5-2` preset · xhigh                                                            | —                                    |
| Major UI/UX work — adversarial minimum when another lane leads (`major_ui_ux_adversarial_review`)                                                                                          | Claude · OpenRouter · GLM 5.2 · `claude-design-glm-5-2` preset · xhigh                                                            | —                                    |
| Vision-capable adversarial design evidence (`adversarial_design_eval`)                                                                                                                     | OpenCode · OpenRouter · Kimi K2.6 vision · high (`--variant`). Complements — does not replace — the required GLM 5.2 design pass. | —                                    |
| Claude Code workflows (`claude_workflow`)                                                                                                                                                  | Claude · Anthropic · Opus 4.8 · low                                                                                               | —                                    |
| Massive external research / extraction (`research_extraction`)                                                                                                                             | Antigravity CLI · Google · `agy` · low                                                                                            | —                                    |
| **Local evaluator pass — PLAN-EVAL / IMPL-EVAL** (`formal_evaluation`)                                                                                                                     | Claude · OpenRouter · bound **OPEN-model Qwen evaluation preset** (`qwen/qwen3.7-max`) · `claude-openrouter` / `claude-print`    | —                                    |
| Automated cloud agent (including cloud evaluator runs)                                                                                                                                     | OpenHands · open models only (Minimax M3 / Qwen 3.7), cloud-driven runs only                                                      | —                                    |

The `major_ui_ux_*` GLM 5.2 lanes and the OpenCode vision-evidence lane are **dormant** while the
Dev Dashboard is paused (epic #400 moved to `0.0.1-beta.13`); they remain the enforced route for any
major UI/UX work that does run. GLM 5.2 stays scoped to **pure design work** — it is not an
implementation or general-evaluation model.

The issue-body "Gemini 3.5 Flash" reference for research/extraction was superseded by epic #574's
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

### Fable 5 restored as default (2026-07-16)

Fable 5 returned to the Anthropic subscription. The prior Opus 4.8 subscription workaround on the
orchestrator lane is **retired**, and the separate `mobile_orchestration` lane is **removed** —
mobile supervision is the same `planning_decisions` session with the `/rc` command enabled, not a
distinct agent or route.

- **Orchestrator and complex-decision sub-agent** run **Claude · Fable 5 · low**, in-plan and
  auto-selected.
- **Token-limit resilience.** Each Fable primary has an in-plan fallback for when a Fable session
  hits its token ceiling: the orchestrator and complex-decision lanes fall back to **Codex · GPT-5.6
  Sol · high**. The Codex-review lanes instead fall back to **Claude · Opus 4.8** (same effort) so
  an OpenAI-authored change is never reviewed by an OpenAI-family model — opposite-family review is
  never traded away for a token-limit fallback.
- **Adversarial pairing.** Codex implementation follows the #794 effort-paired review ladder:
  Sol·low → Opus·high, Sol·medium → Fable·low, Sol·high → Fable·medium, and Luna·max → Opus·medium.
- **Delegated work.** The Fable orchestrator delegates code chores to **Opus 4.8 · medium** and docs
  / cleanup / easy chores to **Sonnet 5 · high** (Luna fallbacks as above).

### Doc-audit profile — opposite-family audit + Fable prose polish (2026-07-17)

Docs changesets generated by Claude authoring lanes (single/few **Fable 5 · high** sub-agents, or a
Claude workflow fleet on **Opus 4.8 · medium** / **Sonnet 5 · high**) run a fixed two-lane pipeline:
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
  token-limit → **Opus 4.8 · xhigh**; and only if **no Claude-agent surface** is available at all →
  **GLM 5.2 · xhigh** over the `claude-openrouter` transport the design lanes use. GLM is a
  polish-fallback-of-last-resort **only here** — this does not widen GLM beyond its design scope
  elsewhere.

The **gate set, the per-gate audit-log requirement, the polish doctrine, and the pattern-mining
lifecycle** live in [`doc-audit.md`](./doc-audit.md) — not restated here. Both lanes are backed in
data by the `docs_audit` / `docs_polish` entries in
`../../tools/agentic/runtime/routing-policy.ts`.

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

### OpenRouter through OpenCode

OpenCode is the native-WSL terminal/web transport for the vision-capable adversarial design-evidence
lane. Its policy `effort` is passed to `opencode run` as `--variant`; the canonical Kimi model id
remains centralized in `config/models.ts`. This lane adds screenshot/image evidence and does not
supersede the GLM 5.2 requirement for major UI/UX work.

## Harness invariants

1. **Generator session differs from evaluator session.** The formal evaluator pass (PLAN-EVAL /
   IMPL-EVAL) runs an **open model** — neither Claude-family nor Codex-family, therefore adversarial
   to both — locally on Claude Code + OpenRouter, or in the cloud on OpenHands. For ordinary review,
   GPT-authored work receives Claude-family review through the effort-paired `review_codex*` ladder;
   Claude-authored work receives GPT-family review through `review_claude`. Mixed work is reviewed
   per slice by the opposite family or by both. Token-limit fallbacks never cross this line, and a
   missing evaluator is a recorded blocker rather than a licence to self-review.
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
