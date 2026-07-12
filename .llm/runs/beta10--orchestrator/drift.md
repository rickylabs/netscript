# Drift Log: beta.10 orchestrator

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-07-13 — Evaluator lane is prose-only; the machine binding cannot express it

- **What:** The evaluator route is the one lane in this repo that is **not fully data**. Naming a
  local evaluator transport (OD-7b) exposed three concrete gaps in
  `.llm/tools/agentic/runtime/routing-policy.ts` and `runtime/provider-profiles.ts` that make the
  new lane inexpressible today.
- **Source:** `.llm/tools/agentic/runtime/routing-policy.ts`,
  `.llm/tools/agentic/runtime/provider-profiles.ts`, `.llm/tools/agentic/config/models.ts`
  (read-only inspection; the `.ts` surface is owned by a parallel Codex slice).
- **Expected:** `.llm/harness/workflow/lane-policy.md` states its table is "the rendered policy
  view" of `CANONICAL_ROUTE_POLICY`, i.e. every lane is backed by data.
- **Actual:** Three divergences:
  1. `CANONICAL_ROUTE_POLICY` carries exactly **one** `purpose: 'evaluation'` route —
     `review_claude` (Codex reviews Claude-authored work). There is **no open-model evaluator
     route**, and no `review_codex` route for the Claude-reviews-Codex direction (that direction
     lived only in the `documentation_review` row, whose purpose is `documentation`, not
     `evaluation`). The opposite-family **guard** exists in code (`candidateAllowed` /
     `selectFallbackCandidate`), but because the default implementation lane is Codex, a
     `purpose: 'evaluation'` selection for Codex-authored work resolves to
     `blocked: opposite_family_unavailable` — the guard is there, the candidate it needs is not.
  2. `OpenRouterPreset.purpose` is `'workflow-fanout' | 'creative-design' | 'long-running-medium'` —
     there is **no `'evaluation'` member**, so an evaluator preset cannot be typed at all. The
     nearest existing preset is `claude-fanout-minimax-m3` (`claude-openrouter` + minimax M3), whose
     `agenticTurn` is **`unverified`** — an evaluator must run gates, so this needs verification
     before a verdict from that lane is trusted.
  3. **`qwen/qwen3.7-max` has no binding at all** — it is named as an allowed open model by policy
     but is absent from `OPENROUTER_MODEL_IDS` and `OPENROUTER_PRESET_MODELS`. Of the two
     policy-approved open models, only minimax M3 is expressible.
- **Severity:** significant
- **Action:** **RESOLVED** by the companion `routing-policy.ts` slice (Codex, 246 tests pass): it
  adds `qwen/qwen3.7-max` to `OPENROUTER_MODEL_IDS`, binds a formal open-model evaluator route to
  the `claude-openrouter` profile, and makes `resolveCanonicalFormalEvaluatorRoute()` **throw**
  unless the route is Claude + OpenRouter + `open_only` with an approved open model — the
  closed-model prohibition is now enforced **in code, not in a comment**. The two slices land
  together; `lane-policy.md` § "Machine binding" reflects the bound state. Gap #2
  (`agenticTurn: 'unverified'`) was also **answered with evidence**: the preset's agentic turn is
  **supported** (verified by probe).
- **Evidence:** `.llm/harness/workflow/lane-policy.md` § "The local evaluator now has a named
  transport (2026-07-13)" and § "Machine binding"; baseline `routing-policy.ts`
  L18/L33/L184-190/L255/L279-281; `provider-profiles.ts` L140/L148-157; `config/models.ts` L46-49.
- **Note:** the evaluator lane was the **only** lane in the repo living purely in prose — which is
  exactly why an unexamined assumption could persist in it. That is the durable lesson, independent
  of which transport wins: keep the route in the data.

## 2026-07-13 — RETRACTED and corrected: the D-4 "no reasoning trace" claim is GLM-only

- **What:** I initially propagated the blanket claim _"Claude Code emits no reasoning trace for any
  non-Anthropic slug, so evaluator `effort` is nominal"_ into four doctrine surfaces. **That claim
  is false and has been removed.** The zero-reasoning behaviour is **specific to GLM 5.2 over
  OpenRouter** — it is not a property of the client, the transport, or the evaluator lane.
- **Source:** D-4 AMENDMENT in this log — probes of all three open models on the same transport
  (`claude -p`, `ANTHROPIC_BASE_URL=https://openrouter.ai/api`).
- **Expected:** (my stale doctrine) no reasoning trace on the transport; `effort` nominal; evaluator
  possibly unable to run gates (`agenticTurn: 'unverified'` on the minimax preset).
- **Actual:** `minimax/minimax-m3` and `qwen/qwen3.7-max` both return a **real reasoning trace** and
  have a **verified agentic turn** (both made real tool calls). Only `z-ai/glm-5.2` returns zero
  thinking blocks. The **evaluator lane is therefore fully capable**: it can run gates, and its
  `effort` is genuine, not nominal. The GLM caveat is scoped to the design-verification lane.
- **Severity:** significant — a false statement was briefly load-bearing in doctrine.
- **Action:** fix — corrected in `evaluator/protocol.md`, `evaluator/plan-protocol.md`,
  `workflow/lane-policy.md` (lane row + per-model capability table), and the `openhands-handoff`
  skill. Each now states capability **per model**, never per transport.
- **Lesson:** the original D-4 generalized a client-wide rule from one model's behaviour; I then
  amplified it into four files without probing a second model. **Probe the second case before
  generalizing**, and treat an inherited caveat as a claim to verify — not a fact to propagate.
- **Evidence:** `.llm/harness/workflow/lane-policy.md` § "Capability, per model (drift D-4,
  amended)"; `evaluator/protocol.md` § "Capability (verified, drift D-4 amended)".

## 2026-07-13 — Brief churn: evaluator-doctrine scope revised twice mid-slice

- **What:** This slice's brief was superseded twice while in flight (OD-7 → OD-7a → OD-7b), each
  time changing the substance, not just the wording.
- **Source:** Orchestrator steering messages to the evaluator-doctrine agent.
- **Expected:** A single locked brief per slice.
- **Actual:** OD-7 ("no OpenHands; adversarial review is Claude ⇄ Codex — remove OpenHands as the
  evaluator transport") → OD-7a ("keep OpenHands' model rules/skill/templates; re-home them onto
  Claude Code + OpenRouter; open models only") → OD-7b ("OpenHands stays as the default automated
  cloud agent, untouched; the only change is to **name** the local evaluator transport that the
  skill already said was missing"). Work written under OD-7/OD-7a was reverted:
  `workflow/agent-handoff.md` and `workflow/run-loop.md` were restored to baseline via
  `git checkout`, and the `openhands-handoff` skill was **not** deleted or renamed (OD-7 had
  proposed deciding its fate).
- **Severity:** minor (process)
- **Action:** accept — final state implements OD-7b. Landed diff is additive: the local evaluator
  transport is named, no OpenHands cloud capability was removed, and the CI-gate trigger template in
  `AGENTS.md` is untouched.
- **Evidence:** `git diff` on branch `docs/evaluator-claude-codex`; `AGENTS.md` unchanged.
