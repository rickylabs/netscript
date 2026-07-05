# Stage C — Fable synthesis of the B corpus (working positions into the Opus deep-dives)

Supervisor synthesis after reading the full B corpus (5 agents, 75 files) + verifying the four
decision-critical B2 files byte-for-byte (`A/03-fresh-ui-vs-nsone-gap-inventory`,
`E/sdk-link-mode-and-service-seam`, `B/eis-chat-real-pipeline-map`, `B/eis-chat-pipeline-diagram`).
These are **working positions**, not the locked design — the Opus 4.8 deep-dives detail/validate/
push-back with evidence; I lock in Stage E; adversarial (F1) + PLAN-EVAL (G) still gate.

## Cross-cutting shape of the roadmap

- **Spine-1 = telemetry-revamp (enabler) + dev-dashboard (headline), co-landing beta.6.** The corpus
  confirms they are tightly coupled: the dashboard's live data is Aspire OTLP first (13.4.6 pin
  clears `WithCommand`), converging on telemetry's query/export surface as it lands. Both epics are
  NEW.
- **Docs cut (C+D) at beta.7** is gated by two structural precursors the corpus surfaced: the #232
  rescope (or new docs-cut child epic) and the docs IA-reconciliation (`capabilities/` vs 9 pillar
  folders). Neither is optional; both precede authoring fan-out.
- **E (desktop/single-process) is smaller and less blocked than the spec framed** (172a-2
  misattribution; server-side mount seam already ships). It stays beta.8/stable, ships fully.

## Delegated decision 1 — D-NSONE (RESOLVED, provisional-lock)

**Resolution: promote the missing L3 "blocks" layer (and the semantic delta) into
`@netscript/fresh-ui`; do NOT re-import the L0–L2 primitives (they are already fresh-ui's own copy
output, byte-identical).** Rationale:
- Evidence: fresh-ui and eis-chat share L0–L2 verbatim (5/5 sampled byte-identical; 37/41 components
  same name+path; mechanism = `netscript ui:add` copy-source, `copyOwnership: app-owned-after-copy`).
  The "eis-chat looks more finished" premise is a used-in-a-real-app effect, not a better system.
- The real gap is fresh-ui has **no `blocks/` layer at all** — eis-chat has 9 L3 blocks + 11 block
  CSS files. fresh-ui's own L0–L4 doctrine calls for L3; its absence is pre-existing internal debt.
- So the owner's promotion lean is correct but **re-costed cheap**: promote the generically-dashboard
  blocks (breadcrumbs, context-rail, **plugin-gated-view** — directly on-target for a plugin-shaped
  dashboard, activity-feed, member-rail, connector) as the canonical L3 layer. Leave the 4
  eis-chat-exclusive MCP components (`html-block`/`mcp-widget`/`ui-block`/`icon`) OUT of the general
  registry unless the dashboard's panel IA actually needs live MCP-content rendering (Opus-A decides).
- **Precursor slice (WSL Codex framework, before beta.6):** (a) scripted full-tree byte-diff of the
  32 unsampled pairs to confirm no divergence; (b) reconcile the `markdown` build-path split
  (template+codegen vs compiled) — internal fresh-ui debt independent of D-NSONE; (c) add the L3
  blocks layer to the registry with the copy-source model + `*.prompt.md`/`*.d.ts` convention.
- Opus-A: confirm the block shortlist, decide MCP-component scope, and size the fresh-ui promotion
  slice as the dashboard's precursor.

## Delegated decision 2 — telemetry grouped-trace flow (RESOLVED, provisional-lock)

**Resolution: two-tier.**
- **beta.6 flagship showcase = Flow B (framework-native multi-process pipeline):** eischat enqueue →
  workers-api → workers (separate OTEL-wired process) → `channelClient` oRPC callback to the
  single-writer service → streams fan-out. Five real OS processes, all already emitting at the infra
  layer; it demonstrates "does telemetry survive **our own** worker/queue/single-writer/streams
  architecture" — squarely NetScript's value proposition and the honest "grouped E2E trace across the
  real stack." beta.6 work = application-span instrumentation + **span-links for the streams fan-in**
  + fixing the triggers W3C-parenting bug + lifting streams (F) and ai (F) off zero + the oRPC-tracing
  plugin on the eischat callback. This is what powers the dashboard's trace view.
- **stable tail = Flow A cross-language hop (the duckdb.exe subprocess):** browser → BFF → GenAI
  (real W3C client propagation + GenAI-semconv spans already working) → MCP tool (HTTP) → **duckdb.exe
  CLI subprocess** — the ONE genuine non-Deno/runtime boundary in the real code, currently dark.
  Placed at **stable** because it needs net-new work to be honest: wrap `Deno.Command` in a span +
  inject `TRACEPARENT`/`TRACESTATE` per the OTel env-carrier spec + a per-language trace shim to
  actually stitch a child span (duckdb has no OTel SDK, so the beta-honest deliverable is documenting
  the hop's duration/outcome as a Deno-side span; a true continued child span is the harder stable
  demo). This is the "cross-language where the pipeline actually crosses languages" essence — a
  showcase-completeness item, not a beta.6 dashboard-enabler.
- Rationale for the split: the spec asks Fable to pick the milestone for "the hardest cross-language
  (Deno→subprocess) hop: beta.6 flagship vs stable tail." The hardest hop (duckdb, dark, needs a
  language shim + built demo) is stable; the beta.6 flagship is the representative multi-process flow
  that is mostly wiring already-emitting processes together. Also verify: MCP HTTP transport
  traceparent propagation (unconfirmed), streams real UI consumer (unconfirmed) — both are Opus-B
  open items.

## Telemetry-revamp scope correction (from B2)

Not "level everyone up to workers." The epic must include: (1) the mandated package **ports/adapters
restructure** (kill forbidden `core/`, role-vocab drift, orphan `src/public/mod.ts`, duplicated
`./registry`; add the dedicated OTEL-adapter subpath export) — a tracked arch-debt "Refactor"
verdict; (2) resolve the `OTEL_DENO`-thin vs bring-an-SDK fork (Deno built-in limits: no async-metric
flush on exit, attribute-less span links, HTTP server spans not auto-errored); (3) **triggers
W3C-parenting bugfix**; (4) streams + ai **from-zero** instrumentation (ai is load-bearing given the
flagship AI mandate); (5) real **span-links for fan-in** (only exist today in the database Prisma
bridge); (6) the **dashboard query/export surface** as a first-class beta.6 deliverable (consume
Aspire `/api/telemetry/*` HTTP API — the CLI `aspire otel` path is broken per tracked debt).

## E scope correction (from E1/E2)

- Strike the 172a-2 dependency framing. Real precursor = **`@netscript/sdk` `ClientLinkPort`
  in-process adapter** (server-side `ServiceApp` `.fetch()` mount seam already ships) — small,
  additive, unblocked; sequence it before beta.8 as its own small slice under #327 (Opus-E confirms
  whether precursor-epic vs sub-slice).
- tursodb single-writer relocation remains real (exclusive OS file lock, os error 33). eis-chat
  already validated option (b) — dashboard-desktop + external services over 127.0.0.1 — in prod;
  option (c) true single-process is the stable-tier target.
- The E deliverable is a real **rescope of #327** (desktop currently WATCH/unscheduled) + promoting
  #375 out of Backlog — surface to owner.

## Owner-facing forks (carry to ratification — do NOT self-decide)

1. **Missing `0.0.1-beta.6` / `0.0.1-beta.7` GitHub milestones** — must exist before issue-filing
   (AGENTS.md milestone obligation). Owner creates them at ratification.
2. **#232: rescope vs new docs-cut child epic** for C+D (zero overlap with #232's current
   accuracy/coverage scope). I will draft both options; owner picks.
3. **E #327 rescope** (WATCH→scheduled 4th tier) + #375 promotion — confirm the prioritization.

## Opus deep-dive fan-out (Stage D)

Four Opus 4.8 agents (one per hard topic; docs C+D combined since they share the cut, #232, IA, and
eis-chat backing): **Opus-A dev-dashboard**, **Opus-B telemetry-revamp**, **Opus-E desktop/
single-process**, **Opus-CD docs (tutorials + positioning)**. Each writes a concrete design proposal
to `design/<topic>/` and advances its delegated decision from these working positions with evidence.
