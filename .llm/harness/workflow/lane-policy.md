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

### OpenRouter through Claude Code

OpenRouter-backed routes driven through Claude Code are a **proven transport** (validated via the
agentic tooling), not a distinct doctrine. The evaluator rules that govern OpenHands govern them
identically: the generator session is never the evaluator session, and no lane self-certifies. GLM
5.2 remains scoped to **pure design work** (the `major_ui_ux_*` lanes); it is not an implementation
or general-evaluation model.

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
