# Topic A — NetScript Development Dashboard

**Kind:** NetScript **PLUGIN** · **Milestone:** beta.6 · **Epic:** NEW `dev-dashboard` · **Status:** new (the killer feature)

## §1 Owner's original brief (verbatim intent — PRESERVE, DO NOT DILUTE)

- The **killer feature**. An **Encore-dev equivalent** for NetScript: an **Aspire dashboard
  extension** that lets you **control the full stack, from infrastructure down to the UI**.
- The **UI is built from the eis-chat / `@netscript/fresh-ui` seams** — state-of-the-art NetScript
  frontend primitives.
- **MANDATORY Claude design-sync**, exactly like eis-chat had (Claude designs the UI + a prototype
  implementation leveraging state-of-the-art NetScript seams).
- **DX-first, state-of-the-art, interactive, UX-optimized** — this is the flagship showcase surface.
- Delivery idea from owner: **possibly one Fable agent per feature / per layer / per CLI option** —
  i.e. decompose the dashboard build across many focused agents.

## §2 Ratified decisions for this topic

- **Ships as a PLUGIN** (`plugin add dashboard`), at **beta.6**. It dogfoods the plugin system — the
  tool that controls your plugins is itself a plugin. Not a core package.
- Starts **in parallel now** on Aspire-sourced data (D1); converges on telemetry's query/export
  surface (Topic B) as it lands.
- Must meet the **flagship quality bar** (plugin-thinness law does not lower the quality bar).

## §3 eis-chat reference (see `specs/02`)

- Design language + component seams: `.design-sync/conventions.md` (the "NS One" system) +
  `.design-sync/previews/*` (~30 built components). This is the Claude design-sync output to reuse.
- Prior art: NetScript `#218` (CLOSED) — Aspire browser-logs captured in the dashboard.
- Competitor teardowns already in-repo: `docs/site/_plan/research/competitors/{encore,medusa,trpc,
  temporal}.md` (Encore dev-dash IA especially: Service Catalog, API Explorer, Encore Flow, trace
  waterfall).

## §4 Delegated to Fable — **D-NSONE** (resolve, record rationale)

Promote **NS One** into `@netscript/fresh-ui` as the canonical design system, then build the
dashboard on it — **vs** — build on existing fresh-ui and keep NS One a borrowed reference. Owner
lean (non-binding): promotion aligns with the core-centralization law + flagship bar. If promoted,
that promotion is a **WSL Codex framework slice**, not a docs workflow.

## §5 Dependencies / constraints

- **Aspire ≥ 9.4** for `WithCommand` (+ interaction-service). **Verify the repo's pinned Aspire SDK
  version** before committing the Aspire-extension slice.
- **Telemetry query/export surface** (Topic B) — the dashboard's live data. Co-land at beta.6.
- Reconcile the "two surfaces": the **Fresh build-console is the plugin's UI**; the **Aspire
  extension** (`WithCommand`) is the plugin's Aspire integration. **Extend, do not reinvent.**
- Resolve the plugin archetype (thin `plugins/dashboard` + likely a `plugin-dashboard-core`).

## §6 What B (Sonnet 5 workflow) must research for this topic

- Aspire 9.x dashboard-extension surface: `WithCommand`, interaction-service, custom resources,
  embedding a Fresh app as an Aspire resource. Distill to `research/A-dashboard/`.
- Encore dev-dash + competitor dev-consoles IA teardown (what panels, what interactions). `matrix/`.
- `@netscript/fresh-ui` current surface vs NS One (`deno doc` the package; inventory the gap). `analysis/A-dashboard/`.
- eis-chat `.design-sync` full extraction (tokens, layout objects, component set, prompts). `analysis/`.

## §7 What Fable must produce for this topic

- `dev-dashboard` epic + sub-issues (per panel/layer/CLI surface) with acceptance criteria, beta.6
  milestone, netscript-pr labels.
- D-NSONE resolution + rationale.
- A concrete design proposal (from the Opus 4.8 deep-dive agent): plugin archetype, panel IA, the
  Aspire-extension seam, the telemetry-data contract, and the "one-agent-per-surface" build plan the
  owner suggested.
