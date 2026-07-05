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
  `epic:telemetry-revamp`, milestone **stable**. **FAI-17 hard-deps Topic-B T3 + T6** — matching
  Topic-B T9's own declared deps (`design/B-telemetry/epic-and-issues.md:156`, DAG `:168`); T3 is the
  adapters/SDK posture the GenAI adapter is built on, T6 is the live seam, and T1's attributes arrive
  transitively through T3 (corrected from the earlier "T1 + T6", F1AI-02).
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

## OQ-3 — Topic-A AI surface at beta.6: is there any AI panel at all? (HIGH, cross-topic with Opus-A)

**Corrected (F1AI-01/F1AI-06).** The ratified Topic-A design does **not** contain a beta.6 dashboard
"AI panel." Its only AI edges are the **stable DDX-19** "codegen-from-UI" handshake `⇄ #238`
(`design/A-dashboard/epic-and-issues.md:52-55`, `:307-316`) and the integrated A–E owner fork **OF-6
"AI-invocation-at-beta.6"**, which is a *telemetry-seam* choice (make the AI `TelemetryPort` invocation
live at beta.6), not a dashboard panel issue (`plan.md:195`). The earlier framing invented a beta.6 AI
panel and made Topic-A hard-depend on FAI-0…3/FAI-6 — that dependency does not exist in the ratified
graph.

- **Recommended:** treat **FAI-0…3 (beta.5)** as a *parity floor* for any future AI consumer (the
  dashboard cannot honestly show/drive AI without a contract-bound, e2e-covered, publishable
  `plugins/ai`), but do **not** inject it as a hard-dep into Topic-A's beta.6 DAG. F-ai carries no
  beta.6 dashboard-panel dependency. If the owner wants a genuinely new beta.6 Topic-A AI panel, that is
  a **Topic-A scope reopen** with its own DAG edits (and only *then* would a generative-UI panel make
  FAI-6 a hard-dep).
- **Rework classification:** with the invented panel removed, deferring OQ-3 is **safe** — no F-ai slice
  set or milestone changes. It becomes rework-forcing **only** if the owner reopens Topic-A to add a
  beta.6 AI panel, which is a Topic-A decision, not a silent F-ai deferral.
- **Decision needed:** Opus-A / owner confirms there is **no** net-new beta.6 Topic-A AI panel (default),
  or explicitly reopens Topic-A to add one.

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
