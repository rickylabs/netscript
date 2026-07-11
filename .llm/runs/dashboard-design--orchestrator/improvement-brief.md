# Dev Dashboard Revamp — Improvement Brief (owner axes, binding for all passes)

Mission context: the current Claude Design prototype (see `screen-catalog.md` + `screenshots/`)
is good but must be revamped to an EXTREMELY high bar before beta.10 implementation. The final
deliverable of this run is a set of Claude-Design-ready prompts; every analysis pass must speak
to these six axes.

## Axis 1 — Zero future-beta prose

The prototype showcases the FINAL product. No "coming soon", no "lands in beta.7", no gated
"preview — contract routes pending", no beta version footer. Every planned capability is
visibly implemented in the design (DLQ full, runtime-config writes live, plugin create from
template live, boundary-event-grade Live Flow fidelity). Honesty about build reality moves to
the issue tracker, not the design.

## Axis 2 — Complete routing-hierarchy resort

Today: one flat hash router, 15 sibling routes, no nesting, no entity URLs (a selected
run/saga/flow/plugin has no address — nothing is linkable/shareable). Required: an
enterprise-standard routing hierarchy with:
- capability groups → list → entity detail (`/workers/jobs/:jobId/executions/:execId` shape),
- addressable selection everywhere (deep-linkable entity URLs, tab state in URL),
- breadcrumbs derived from the hierarchy, sidebar reflecting the tree,
- cross-primitive correlation routes (one correlation id resolves to a journey URL).
Grounding: the two internal reference apps (playground dashboard covers jobs, polyglot tasks,
sagas, streams with a much better routing experience; the chat app has strong frontend routing
patterns). Steal AND adapt to today's NetScript. (Internal names must NOT appear in
owner-facing design-prompt text.)

## Axis 3 — All features implemented, including project WRITES

The dashboard mirrors CLI capability, not read-only panes: scaffold/add/generate actions from
the UI (plugin add, resource scaffold via `createPluginAdapter(...).toScaffold()`, db migrate,
config override set/unset, trigger enable/disable, DLQ reprocess, saga replay via Aspire
command seam, plugin update). Keep the NetScript signature: every mutation confirm-gated and
printing its exact CLI equivalent. Writes are first-class flows (create → configure → monitor
loop), not buried buttons.

## Axis 4 — Beta.10 cross-coverage

Both directions: every beta.10/DDX issue (#400 epic; #410–#432, #507, #509, #551–#557 — see
`reference/beta10-epic-issues.json`) covered by the prototype, and every prototype screen
mapped to an issue. Flag gaps on both sides. Augment existing issues with findings (comments),
do not mass-file new issues.

## Axis 5 — AI surface: capabilities in diverse forms, NOT a generic chat

The current `ai` screen is underwhelming vs the state of the art. We do not want one chat pane;
we want AI capability distributed across the product: contextual actions (fix-this, explain
this failure), dynamic triggers (AI-authored automations), context augmentation (every panel
can feed its state to the assistant), embedded assists (inline diagnosis on failed runs,
override suggestions, migration explanations), durable agent runs joined to the correlation
spine, tool-call transparency (contract procedures as tools). The AI summary block on home is
the right instinct — generalize it.

## Axis 6 — Dynamic plugin/extension system

The long-awaited frontend-contribution story: a contributor writes a NetScript plugin and
wires it into the dashboard — panels, seams, connections, ACTIONS — and more broadly a plugin
can contribute to any existing frontend app (generate files, wire config, add deps) AND
contribute/extend the dev dashboard. References: TanStack Devtools, Nuxt DevTools, Directus
extensions (panel/module/layout taxonomy), Medusa admin-extension model (already cited in
DDX-17 #427). The dashboard visibly demonstrates this: third-party contributed panels,
extension management surface, contribution-axis map as live navigation.

## Standing constraints (do not relitigate)

- Complementary-satellite doctrine holds: no owned trace waterfall / span gantt / log tail /
  metrics charts / resource start-stop / API try-it — those out-link to Aspire and Scalar.
  Live Flow stays a causal seam chain, never a waterfall.
- NS One design system (`ns-*` tokens/components), light warm-cream default + dark,
  `prefers-reduced-motion`, confirm-with-CLI transparency pattern.
- The correlation-ID spine (webhook → saga → job → stream fan-out, one id everywhere) is
  landed and must remain the narrative backbone.
- Real data model per `design-project/feedback/POC-ground-truth.md` (8 trigger types, action
  chains, polyglot job/task runtimes, saga history API, derived stats).
