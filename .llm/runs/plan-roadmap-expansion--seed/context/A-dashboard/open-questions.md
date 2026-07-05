# Topic A — Dashboard: Open Questions & Drift Candidates (B4)

For the Fable synthesis + Opus deep-dive. Grouped: drift candidates (contradict the specs — flag
loudly), delegated-decision inputs, and genuine open forks.

## Drift candidates (contradict `specs/01` or `specs/topic-A` — surface to owner)

1. **[HIGH] The D-NSONE premise is materially weaker than the spec states.** `specs/01` frames NS One
   as "a complete design system that looks more finished than today's `@netscript/fresh-ui`." But
   fresh-ui's shared L0–L2 layer and NS One's are **byte-identical** (button.tsx, avatar.tsx,
   stats-grid.tsx, sidebar-shell.tsx, tokens.css all verified character-for-character; layouts.css
   near-identical). NS One's primitives ARE fresh-ui's own copy-source output
   (`copyOwnership: app-owned-after-copy`), not a separately-built, more-finished alternative. The
   real, substantive delta is narrow: **fresh-ui's registry has no L3 "blocks" layer** (eis-chat has
   9 real block compositions + 11 block CSS files). This reframes D-NSONE from "adopt a whole
   rival design system" to "promote the L3 blocks layer + reconcile a couple of build-approach
   splits." Evidence: `analysis/A-dashboard/03`. **This should change how the owner weighs the
   promote-vs-borrow cost.**

2. **[HIGH] Half of the Topic A §5 Aspire gate is unsatisfiable in TypeScript.** §5 requires
   "Aspire ≥ 9.4 for `WithCommand` (+ interaction-service)." The version pin (13.4.6) clears the
   version gate, and `withCommand` IS available in the TS AppHost SDK — but `IInteractionService`
   is **explicitly not available in the TS AppHost SDK regardless of version** (per Aspire's own
   `interaction-service-preview` doc). Command `arguments` (InteractionInput prompt dialog) is the
   only substitute. The design must not assume interaction-service. Evidence:
   `research/A-dashboard/01 §2`.

## Delegated-decision inputs (D-NSONE — facts for Fable, no verdict here)

3. **Promote-branch cost** is smaller than assumed (see drift #1): the L0–L2 layer already lives in
   fresh-ui, so "promotion" is mostly (a) adding the 9 L3 blocks (`activity-feed`, `breadcrumbs`,
   `channel-tree`, `connector`, `context-rail`, `data-grid`, `member-rail`, `plugin-gated-view`) +
   their CSS to the registry, (b) reconciling the `markdown` build-approach split (fresh-ui uses a
   template+codegen pipeline; eis-chat has a plain compiled file), (c) a scripted full-tree diff of
   the 32 not-yet-sampled shared pairs to confirm no divergence. `plugin-gated-view.tsx` is directly
   dashboard-relevant. If promoted → WSL Codex framework slice before beta.6.
4. **Borrow-branch cost**: keep fresh-ui as-is, copy the 9 blocks into the dashboard plugin as
   app-owned files (the copy-source model already supports this). Cheaper up front, but the blocks
   never become framework-canonical → contradicts core-centralization law for a flagship surface.
5. **Open item flagged by fork:** only 5 of 37 shared-name component pairs were byte-diffed (all 5
   matched). A cheap scripted full-tree diff should run before final costing to rule out hidden
   divergence in the other 32. Evidence: `analysis/A-dashboard/03`.

## Genuine open forks (for the Opus deep-dive to resolve)

6. **Aspire seam reconciliation** (see `context/…/02 §1`): extend `AspireResourceKind` with an
   `app`/`command` kind so a dashboard plugin can register its Fresh UI + `withCommand` actions
   through `contribute()` — vs — accept the raw-SDK `register-apps.mts` escape hatch for v1 and defer
   seam unification. Framework-slice-vs-scaffold tradeoff.
7. **Telemetry data sequencing**: OTLP-first at beta.6 (open, easy) then converge on Topic B's
   query/export surface as it lands — confirm the co-land timing with the Topic-B agent's output.
   The `aspire` MCP server tool set is the best structured-query surface available today but is a dev
   tool, not a production data contract. Evidence: `context/…/01`.
8. **Plugin archetype nesting divergence**: ARCHETYPE-5 doctrine text vs harness reality diverge on
   folder nesting (top-level siblings vs nested-in-`src/`), tracked under #305/#306, unsettled. The
   dashboard plugin will need a ruling. Evidence: `analysis/…/04`.
9. **"One agent per feature/layer/CLI option" build decomposition** (owner's §1 delivery idea): the
   panel set in `matrix/…/_draft-competitor-rows.md` (core-v1: resource graph, contract catalog + API
   explorer, run list→detail→step-timeline, OTel trace+logs, worker/task-queue health, introspection
   endpoint) is the natural per-agent slice boundary. Fable/Opus to confirm the slice DAG.
10. **`#218` browser-logs**: extend Aspire's native `withBrowserLogs` (the closed-issue's own
    resolution) rather than building a custom log viewer; note the HTTP/1.1 6-connection-per-origin
    ceiling if the dashboard itself becomes a durable-streams consumer. Evidence: `analysis/…/05`.
