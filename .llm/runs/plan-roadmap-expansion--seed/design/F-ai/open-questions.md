# Topic F-ai — Open questions for owner ratification

> Planning artifact. Each OQ has a **recommended default** so Stage-E can lock even without an answer.
> None of these is a blocker for PLAN-EVAL — they are ratification forks, not gaps.

## OQ-1 — E9/#248 GenAI-span adapter ownership: F-ai FAI-17 vs Topic-B T9 (HIGH)

`design/B-telemetry/epic-and-issues.md` scopes the full `TelemetryPort` GenAI-semconv OTel adapter as
Topic-B **T9** (stable) and the *live minimal span* as Topic-B **T6** (beta.6). Charter item (g) and
F-ai FAI-17 name the **same** `@netscript/ai/otel` adapter. Building it twice is the risk.

- **Recommended:** **co-own, F-ai implements.** The adapter is `@netscript/ai` *source*, so F-ai is the
  implementation lane; Topic-B contributes the semconv attribute builders (T1 `SpanNames`/
  `createGenAiAttributes`) and the dashboard views. File **once**, cross-labelled `epic:ai-stack` +
  `epic:telemetry-revamp`, milestone **stable**. FAI-17 hard-deps Topic-B T1 + T6.
- **Decision needed:** owner confirms the single-issue co-own and which epic is primary. Until then
  FAI-17 and B-T9 must not both be filed as independent build slices.

## OQ-2 — reasoning-effort/token-cap + BYOK: file two NEW issues (MEDIUM)

Gap 4 (`analysis/F-ai/02 §4`) has **no existing GitHub issue** — unlike every other gap, which maps to
an open #238 child. FAI-10 (per-call `modelOptions` passthrough) and FAI-11 (BYOK per-request keys)
would be **newly filed** under `epic:ai-stack`.

- **Recommended:** file both, milestone beta.7, `priority:p2`. FAI-10 is *extend-not-greenfield*
  (`openRouterReasoningModelOptions` + `ReasoningEffort` already exist, `F/01 §2.3`) — scope it as
  lift-to-the-port.
- **Decision needed:** owner approves filing two new issues (vs folding both into a single
  "provider-options" issue). Recommend two — BYOK is a distinct multi-tenant seam from reasoning caps.

## OQ-3 — dashboard beta.6 AI panel: invoke vs observe (HIGH, cross-topic with Opus-A)

The Topic-A dashboard AI panel (OF-6, AI-invocation-at-beta.6) can either **invoke** AI (binds the
`/v1/ai` contract, hard-dep FAI-0 parity floor + FAI-6 generative-UI renderer) or only **observe** AI
telemetry (depends on Topic-B T6 live seam + soft-dep FAI-17 rich views). The dependency shape differs.

- **Recommended:** treat the parity floor **FAI-0…3 (beta.5)** as a hard-dep either way (the dashboard
  cannot honestly show AI without a contract-bound, e2e-covered, publishable `plugins/ai`); confirm
  with Opus-A whether the panel *renders generative-UI* (then FAI-6 becomes a hard-dep) or is
  telemetry-only.
- **Decision needed:** Opus-A / owner clarifies the panel's exact AI surface at beta.6.

## OQ-4 — beta.5/beta.6/beta.7 milestones do not exist yet (MEDIUM, shared A–E)

The F-ai DAG re-sequences #238's beta.3/beta.4 children into a beta.5–stable train, but those
milestones must be **created** in GitHub first (shared obligation with Topics A–E per Stage-C fork 1).
Also: first JSR publish of `plugins/ai` (FAI-3), being prerelease-only, yields `latest: null` on JSR
(MEMORY jsr-prerelease-latest-null) — cosmetic, self-heals at first non-prerelease; not a blocker.

- **Recommended:** owner creates `0.0.1-beta.5/6/7` milestones at ratification; accept the cosmetic
  `latest: null` caveat and document it in FAI-3.
- **Decision needed:** milestone creation is owner-gated (no issue can be milestoned until they exist).

## OQ-5 — generative-UI vocabulary density at beta.6 (MEDIUM)

Owner-fork 4. Ship the recursive renderer + a **minimal** catalog (layout + chart/stat/table +
`button`) + sandboxed-HTML fallback at beta.6, or the full 30+-component eis-chat vocabulary?

- **Recommended:** **minimal at beta.6, full at stable.** The recursive renderer (FAI-6) is the
  load-bearing gap; vocabulary breadth is purely additive and reworks nothing. Shipping the renderer +
  a small catalog proves the pattern end-to-end (FAI-9 e2e) without gating beta.6 on 30 components.
- **Decision needed:** owner confirms the minimal-first density.

## OQ-6 — #388 emitter count: 6 vs 7 (LOW)

#388's scope says "7 emitters"; `aiStarterResources` shows **6** (`models`, `barrel`, `tool`, `agent`,
`stream-proxy`, `chat-route` — `F/01 §4.1`, verified). Reconcile during FAI-1.

- **Recommended:** treat the source list as authority; the 7th is likely a manifest/registry emitter —
  confirm in-slice and update #388 rather than inventing a 7th.
- **Decision needed:** none pre-implementation; FAI-1 reconciles.

## OQ-7 — TanStack AI pre-1.0 pin discipline as a gate (LOW, accept-with-pin)

Owner-fork 5. `@tanstack/ai@^0.39.0` + `@tanstack/ai-mcp@0.2.1` (exact) are pre-1.0 with a fast
breaking cadence.

- **Recommended:** **accept-with-exact-pin + documented upgrade-watch** (eis-chat runs it in prod). Add
  an exact-pin lint assertion to the FAI slices touching TanStack surfaces; do NOT hold for 1.0.
- **Decision needed:** owner ratifies the pin-as-gate posture (already the corpus recommendation).

## OQ-8 — #262 gateway + #247 orchestration milestone (LOW)

The flagship-correction comment bumped #262 (P5 gateway) and #247 (E8 orchestration) to beta.4 as a
unit (`F/04 §5`), but neither is parity-critical nor a dashboard dependency.

- **Recommended:** re-sequence both **back to stable** — keeping them at beta.4 pads the near-term
  train with non-load-bearing work. Not in the 18-slice F-ai set; deferred explicitly.
- **Decision needed:** owner confirms the de-prioritization.
