# Topic B — Telemetry production-grade revamp

**Kind:** refactor · **Milestone:** beta.5→beta.6 (feeds A), stable tail · **Epic:** NEW `telemetry-revamp` · **Status:** existing package, uneven quality

## §1 Owner's original brief (verbatim intent — PRESERVE, DO NOT DILUTE)

- The telemetry package quality is **uneven**; **workers is the best** implementation — level the
  rest of the framework up to it.
- Establish a **framework-wide telemetry convention** with **exhaustive metadata**.
- **Real e2e** telemetry (not mocked).
- **Integrate telemetry into the dashboard** (Topic A).
- The vision: **TRUE E2E GROUPED traces** — a single grouped trace spanning the real pipeline
  (owner's original illustrative chain: *button-click → python task pipeline → trigger → saga →
  services*).

> **Owner correction (2026-07-04):** the literal "button→python→trigger→saga→services" chain was
> "a stupid example — let Fable decide the flow." Keep the *essence* (true grouped E2E traces across
> the real stack, cross-language where the pipeline actually crosses languages); **derive the
> concrete showcase flow from eis-chat's real pipeline.**

## §2 Ratified decisions for this topic

- Its own **epic** (`telemetry-revamp`, D1), the enabler half of Spine-1.
- Lands **enough by beta.6 to power the dashboard** (convention + per-package parity + query/export
  surface). Richest interactive views + AI-adapter at **stable**.

## §3 eis-chat reference (see `specs/02`)

- The **"static archaeology ⋈ live telemetry" join** in `docs/PRODUCT.md` (legacy-archeo graph ⋈
  SigNoz traces, joined on OTel resource attributes) is the real telemetry showcase — richer than
  the retracted illustrative chain.
- `.agents/skills/aspireify/references/opentelemetry.md`, `.agents/skills/aspire-monitoring/`
  (diagnostics-bridge) — reusable OTel + Aspire monitoring references.
- Seam usage: eis-chat's `workers`/`streams`/`services` are the real cross-component pipeline to
  instrument end-to-end.

## §4 Delegated to Fable — telemetry grouped-trace flow

Derive the concrete grouped-trace showcase flow from eis-chat's real pipeline. **Fable picks the
milestone for the hardest cross-language (Deno→subprocess) hop: beta.6 flagship vs stable tail.**

## §5 Dependencies / constraints

- Feeds Topic A (dashboard) — the **query/export surface** the dashboard consumes must be a first-
  class deliverable, not an afterthought.
- Existing `@netscript/telemetry` package is rich (attributes, config, `context/w3c.ts`,
  core/tracer+span, instrumentation, `orpc/tracing-plugin`, `runtime/instrumentation-registry`,
  diagnostics) — **revamp, don't greenfield**. `workers` plugin is the parity target.
- W3C trace-context propagation (`TRACEPARENT`/`TRACESTATE`), OTel semantic conventions, messaging
  **span-links for fan-in**, cross-language subprocess propagation.

## §6 What B (Sonnet 5 workflow) must research for this topic

- Full inventory of `@netscript/telemetry` current surface + per-plugin instrumentation quality
  (workers=best; grade sagas/triggers/streams/ai/auth). `analysis/B-telemetry/`.
- OTel semantic conventions + W3C trace-context + span-links + cross-language propagation state of
  the art. Distill to `research/B-telemetry/`.
- How eis-chat wires SigNoz + the archeo join (attributes carried, propagation). `analysis/`.
- Aspire OTLP/dashboard telemetry ingestion surface (what the dashboard can consume). `matrix/`.

## §7 What Fable must produce for this topic

- `telemetry-revamp` epic + sub-issues: framework-wide convention; per-package parity leveling;
  W3C/cross-language propagation; span-links for fan-in; **dashboard query/export surface**; real
  e2e trace assertions. Milestones distributed beta.5→beta.6, AI-adapter+rich-views at stable.
- Resolution of the grouped-trace flow + cross-language-hop milestone, with the real eis-chat
  pipeline as the worked example.
