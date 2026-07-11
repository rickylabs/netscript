# Adversarial UX/DX verdict — Dev Dashboard design revamp

Date: 2026-07-12\
Scope: UX/DX only; prototype evidence, not implementation readiness.\
Primary evidence: [`screen-catalog.md`](../screen-catalog.md), the 17 captures under
[`screenshots/`](../screenshots/),
[`POC-ground-truth.md`](../design-project/feedback/POC-ground-truth.md), and
[`aspire-deck-research.md`](../reference/aspire-deck-research.md).

## Headline answers

### 1. How far ahead of the competition is it?

**Current prototype: 7.1/10 as a visual concept, 5.8/10 as a usable console. It is not broadly ahead
of the competition.** It leads by roughly one product generation in one narrow, valuable area:
explaining a NetScript-specific causal journey across webhook → trigger action → saga → worker →
stream while preserving correlation and showing the exact CLI behind a mutation. It merely matches
mature consoles in run timelines, filters, status tables, payload inspection, command palette, dark
mode, and operational summaries. It trails best-in-class consoles by one to two generations in
addressable navigation, list/detail scale, saved/shareable investigations, search, progressive
disclosure, write workflows, and embedded assistance.

The prototype's visual coherence can disguise the deficit. A screen can “hold the gates” and still
be mediocre UX: most screens are dense full-page tableaux with a selected mock entity held in
memory, rather than durable workspaces where a developer can deep-link, compare, backtrack, resume,
or hand an investigation to a teammate. The flat 15-route hash router is the single biggest drag on
the product score ([catalog, routing reality](../screen-catalog.md)).

**Where it genuinely leads**

- Live Flow's causal seam chain is more domain-legible than a generic trace waterfall and respects
  the complementary-satellite boundary. Its correlation spine is backed by real APIs, not just a
  design conceit ([POC §§1–2](../design-project/feedback/POC-ground-truth.md)).
- Runtime Config's declared-versus-running diff, version chain, and confirm-with-exact-CLI pattern
  are unusually strong DX.
- Trigger action chains, compensation semantics, and plugin contribution axes could make framework
  behavior more explainable than general-purpose infrastructure consoles.
- The dashboard-as-plugin proof points toward an extension story stronger than Aspire Deck's present
  local iframe canvases, whose nav and theming remain closed
  ([Deck research §4](../reference/aspire-deck-research.md)).

**Where it only matches**

- Runs, saga history, delivery attempts, DLQ payloads, registry tables, health KPIs, status chips,
  filters, JSON altitude, and out-links are expected in Temporal, Inngest, Trigger.dev, Encore,
  Supabase, Appwrite, Directus, Convex, and Aspire-class tools.
- Warm-cream styling, dark mode, reduced motion, and ⌘K are good execution, not durable advantage.

**Where it trails**

- No entity has an address. Refresh, Back, Open in new tab, copy link, and team handoff all fail
  conceptually.
- Lists are demo-sized and lack mature console mechanics: query in URL, column control, saved views,
  pagination/virtualization, bulk selection, comparison, and persistent density.
- Writes are isolated confirmations, not complete create → configure → validate → observe loops.
- AI is concentrated in a generic “Ask about your app” destination. It does not shorten the moment
  of failure where help is needed.
- Extension points are described, not experienced: no extension browser, contribution preview,
  permission/capability review, conflict handling, install/update/disable lifecycle, or
  contributed-action attribution.

### Competitive scale

`+2` clear lead · `+1` modest lead · `0` parity/mixed · `−1` trails · `−2` materially trails · `—`
competitor has no close analogue. Scores judge UX capability, not visual polish. Competitor columns
are families: **En** Encore/Flow, **Te** Temporal, **In** Inngest, **Tr** Trigger.dev, **Ap**
Appwrite, **Di** Directus, **Su** Supabase Studio, **Co** Convex, **De** Aspire Deck. Comparisons
are heuristic product judgments; the NetScript evidence is repository-grounded, while Deck specifics
are verified in the cited research.

| Prototype screen     | En | Te | In | Tr | Ap | Di | Su | Co | De | Verdict                                                                                                                        |
| -------------------- | -: | -: | -: | -: | -: | -: | -: | -: | -: | ------------------------------------------------------------------------------------------------------------------------------ |
| Home / wiring        | +1 | +1 |  0 |  0 | +1 | +1 |  0 |  0 | +1 | Leads in declared wiring + incident narrative; trails mature customizable/saved overview behavior.                             |
| Config Resolution    | +1 |  — | +1 | +1 |  0 |  0 |  0 | +1 | +1 | Capability graph is distinctive; selection is not linkable and graph affordances are thin.                                     |
| Runtime Config       | +2 |  — | +1 | +1 | +1 | +1 | +1 | +1 | +2 | Best screen: provenance/version/diff + CLI write transparency. Needs real rollback, compare, audit, and URL state.             |
| Live Flow            | +1 | +1 | +1 | +1 |  — |  — |  — | +1 | +2 | Product-defining seam narrative; loses ground through no journey URL, search, saved investigation, or boundary-event fidelity. |
| Catalog              |  0 |  — |  0 |  0 | −1 | −1 | −1 |  0 | +1 | Contract duality is novel, but table UX and object hierarchy trail mature schema/data consoles.                                |
| Plugins              | +1 |  — | +1 | +1 | −1 | −2 | −1 | +1 | +2 | Contribution-axis map leads runtime tools, but Directus-class extension lifecycle is absent.                                   |
| Run Inspector        |  0 | −2 | −1 | −1 |  — |  — |  — |  0 | +1 | Good cross-primitive ambition; far behind Temporal/Inngest/Trigger.dev investigation depth and URL durability.                 |
| Workers              | +1 | −1 | −1 | −1 |  — |  — |  — |  0 | +1 | Polyglot tasks could lead everyone; current generic rows hide that advantage.                                                  |
| Sagas                | +1 | −2 |  0 |  0 |  — |  — |  — |  0 | +1 | Compensation is legible; Temporal remains much stronger for history navigation, event detail, reset/replay, and scale.         |
| Triggers             | +1 |  — |  0 |  0 |  0 |  0 |  0 |  0 | +1 | Action chain and eight trigger types are differentiated; authoring/debug loop is incomplete.                                   |
| Streams              | +1 |  — |  0 |  0 |  0 |  0 |  0 |  0 | +1 | Subscriber fan-out is clear; topology management, replay, lag history, and entity routes are missing.                          |
| AI Agents            |  0 |  — | −1 | −1 |  0 |  0 |  0 |  0 | +1 | Tool transparency is useful, but destination-chat framing is generic and assistance is not embedded.                           |
| Migrations           |  0 |  — |  — |  — | −1 |  0 | −2 |  — | +1 | Honest drift and CLI confirmation; far behind Studio-grade schema diff/history/editor workflows.                               |
| DLQ                  |  0 |  — |  0 |  0 |  — |  — |  — |  — | +1 | Expected queue operations; preview framing and shallow batch/reprocess recovery trail mature event tools.                      |
| Auth Sessions        |  0 |  — |  — |  — | −2 | −1 | −2 | −1 | +1 | Durable projection is interesting; auth consoles offer much richer user/session/policy/provider workflows.                     |
| Global navigation    | −2 | −2 | −2 | −2 | −2 | −2 | −2 | −2 | −1 | Flat hashes and in-memory selection are below every serious console baseline.                                                  |
| Extension experience | +1 |  — |  0 |  0 | −1 | −2 | −1 | +1 | +2 | Architecture promise is strong; visible install/author/permission/update workflow is not there.                                |

**Overall relative position:** Live Flow and Runtime Config are credible category-leading concepts.
Config, Home, Triggers, and plugin contribution mapping are promising. Runs, Workers, Sagas,
Streams, Catalog, DLQ, and Migrations are mostly attractive parity screens. Navigation, AI
distribution, extension operations, Auth, and end-to-end writes trail. The honest overall claim is
**“two potentially category-leading workflows inside a prototype that is not yet a category-leading
console.”**

## 2. How much of NetScript's highlight feature set does it cover?

**Weighted coverage: 58/100.** Of the differentiators inventoried below, 10 are clearly covered, 14
are under-sold, and 9 are absent. Counting a chip or note as “covered” would inflate the score;
coverage requires a discoverable workflow that teaches why the feature matters.

| Highlight feature                                | Status         | Prototype evidence                                                         | Repository evidence / adversarial finding                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------ | -------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Correlation-ID cross-primitive spine             | **Covered**    | Home, Runs, Workers, Sagas, Streams, Flow, AI use one spine.               | The join is real and bidirectional via worker executions, saga instances, and trigger events ([POC §1](../design-project/feedback/POC-ground-truth.md)). Make `/journeys/:correlationId` canonical.                                                                                                                                                                                                                                |
| Causal Live Flow seam chain                      | **Covered**    | Flow shows webhook → trigger → saga → job → stream.                        | Strong differentiator, but selected flow has no URL and future-beta boundary prose breaks final-product framing.                                                                                                                                                                                                                                                                                                                   |
| Trigger action chains                            | **Covered**    | Trigger events show per-action outcomes/deep links.                        | Real `actionResults[]` includes enqueueJob/publishSaga/executeTask/executeBatch ([POC §2](../design-project/feedback/POC-ground-truth.md)). Needs event URLs and retry/fix actions.                                                                                                                                                                                                                                                |
| Eight trigger types                              | **Under-sold** | Schedule/webhook are prominent; full taxonomy is not.                      | Real types are file/webhook/schedule/cron/kv/polling/composite/manual ([POC §5](../design-project/feedback/POC-ground-truth.md)).                                                                                                                                                                                                                                                                                                  |
| Jobs vs polyglot tasks                           | **Absent**     | Workers reads as a generic job registry.                                   | Tasks resolve Deno, Python, Shell, PowerShell, and .NET runtimes ([POC §3](../design-project/feedback/POC-ground-truth.md)); this may be the most competitively unique invisible capability.                                                                                                                                                                                                                                       |
| Durable saga state machine + compensation        | **Covered**    | Saga and Run timelines distinguish compensation.                           | Ground truth is `getInstanceHistory` and active/completed/failed/pending/compensating ([POC §4](../design-project/feedback/POC-ground-truth.md)); labels should match.                                                                                                                                                                                                                                                             |
| Saga-to-worker execution join                    | **Under-sold** | Cross-links exist around the shared narrative.                             | It is a first-class query by correlation, not a lucky mock association ([POC §§1,4](../design-project/feedback/POC-ground-truth.md)).                                                                                                                                                                                                                                                                                              |
| Durable streams / subscriber fan-out             | **Covered**    | Streams exposes per-subscriber delivery and fan-out.                       | Durable stream construction exists in [`packages/plugin-streams-core/src/application/create-durable-stream.ts`](../../../packages/plugin-streams-core/src/application/create-durable-stream.ts). Authoring, replay, retention, schema evolution, and lag are absent.                                                                                                                                                               |
| StreamDB live hydration                          | **Under-sold** | Follow/live affordances appear.                                            | Cache-first SSR hydration and plugin StreamDB consumers are real ([POC §6](../design-project/feedback/POC-ground-truth.md)); no UI explains freshness, reconnect, or snapshot/live boundary.                                                                                                                                                                                                                                       |
| Runtime-config versioning                        | **Covered**    | Version chain and diffs are flagship UI.                                   | Runtime surface is documented in [`packages/runtime-config/README.md`](../../../packages/runtime-config/README.md). Rollback, compare arbitrary versions, author/reason, and conflict handling remain thin.                                                                                                                                                                                                                        |
| Declared intent vs running reality               | **Covered**    | Config graph + runtime overrides.                                          | This is a strong coherent pair, but navigation incorrectly separates the declaration and override workflows as flat peers.                                                                                                                                                                                                                                                                                                         |
| Layered config provenance                        | **Under-sold** | Config tree and override feed imply provenance.                            | Schema/merge roots live in [`packages/config/src/public/mod.ts`](../../../packages/config/src/public/mod.ts); the UI should explain source precedence and why a value won.                                                                                                                                                                                                                                                         |
| Contract duality: REST/RPC/SDK                   | **Under-sold** | Catalog shows duality chips.                                               | A chip is not a workflow. Show one procedure, shared schema, generated clients, route/RPC parity, drift, and “open consumer code.”                                                                                                                                                                                                                                                                                                 |
| Typed route contracts                            | **Absent**     | Catalog lists routes but does not sell compile-time path/search contracts. | Typed route inference is in [`packages/fresh/src/application/route/_internal/contract-types.ts`](../../../packages/fresh/src/application/route/_internal/contract-types.ts) and used by the POC ([POC §6](../design-project/feedback/POC-ground-truth.md)).                                                                                                                                                                        |
| Contract provenance and coverage                 | **Covered**    | Catalog shows plugin provenance and complete/thin coverage.                | Good diagnostic idea; needs addressable procedure details, coverage explanation, and repair path.                                                                                                                                                                                                                                                                                                                                  |
| Plugin contribution axes                         | **Under-sold** | Plugins has an axis map; Home has contributed panels.                      | The extension-axis doctrine is explicit ([doctrine 07](../../../docs/architecture/doctrine/07-composition-and-extension.md)); the prototype does not show actions, seams, connections, permissions, or conflicts as live contributions.                                                                                                                                                                                            |
| Plugin create / scaffold / add / update          | **Absent**     | Buttons are gated/future prose.                                            | CLI/scaffold surfaces exist across plugins, e.g. [`plugins/workers/scaffold.ts`](../../../plugins/workers/scaffold.ts), [`plugins/workers/cli.ts`](../../../plugins/workers/cli.ts). Axis 3 requires complete UI loops.                                                                                                                                                                                                            |
| Plugin doctor and drift                          | **Covered**    | Doctor rows, version drift, exact CLI.                                     | Strong diagnostic seed; should offer explain/fix/update/rollback and attribute every resulting file/config mutation.                                                                                                                                                                                                                                                                                                               |
| Aspire resource contributions                    | **Under-sold** | Aspire out-links and capability graph exist.                               | Contributions are composed in [`packages/aspire/src/runtime/contribution-registry.ts`](../../../packages/aspire/src/runtime/contribution-registry.ts). The UI does not reveal which plugin contributed which resource, env, endpoint, or health check.                                                                                                                                                                             |
| Scaffold contributions (`toScaffold`)            | **Absent**     | No first-class scaffold planner or generated-file preview.                 | Plugin scaffold support is core package UX ([`packages/plugin/README.md`](../../../packages/plugin/README.md)); the revamp needs diff/permission/CLI confirmation and post-write validation.                                                                                                                                                                                                                                       |
| AI tool registry                                 | **Under-sold** | AI notes 12 contract tools and shows tool-call cards.                      | The port exists at [`packages/ai/src/ports/tool-registry.ts`](../../../packages/ai/src/ports/tool-registry.ts). Needs searchable tool inventory, schema, provenance, permission, test-call, failure rate, and “used by” views.                                                                                                                                                                                                     |
| Durable agent runs on correlation spine          | **Covered**    | AI run rail, tool calls, model/tokens/latency and deep links.              | Useful foundation; current chat layout makes the run itself feel secondary.                                                                                                                                                                                                                                                                                                                                                        |
| Embedded/contextual AI actions                   | **Absent**     | Home summary is the lone good example; other screens link back to AI.      | Axis 5 requires explain/fix/suggest/create-trigger actions at the failure site. The reference app proves rich context assembly and tool surfaces in [`apps/dashboard/islands/ChatPane.tsx`](../../../../../refs/eis-chat/apps/dashboard/islands/ChatPane.tsx) and [`SessionScratch.tsx`](../../../../../refs/eis-chat/apps/dashboard/islands/SessionScratch.tsx), but the dashboard should adapt them into assists, not copy chat. |
| Dynamic AI-authored triggers/automations         | **Absent**     | No natural-language-to-reviewed-trigger workflow.                          | Trigger definitions/actions already have concrete types; AI should draft a typed diff, simulate next events, show tools/context used, then use the standard CLI confirmation.                                                                                                                                                                                                                                                      |
| Context augmentation from every panel            | **Absent**     | Generic prompt claims grounding; panels cannot visibly “add this state.”   | Reference app has addressable project/channel/session context and knowledge routes under [`apps/dashboard/routes/project/[project]/channel/[channel]/`](../../../../../refs/eis-chat/apps/dashboard/routes/project/[project]/channel/[channel]/). Adapt as explicit context chips/snapshots attached to durable agent runs.                                                                                                        |
| Auth event projection                            | **Under-sold** | Auth Sessions shows projection and `auth.*` rail.                          | Projection is backed by [`packages/plugin-auth-core/README.md`](../../../packages/plugin-auth-core/README.md) and [`plugins/auth/streams/schema.ts`](../../../plugins/auth/streams/schema.ts). The prototype looks like a small session table, not a novel “auth as durable stream” debugging model.                                                                                                                               |
| Auth provider/policy/user operations             | **Absent**     | Sessions are read-only.                                                    | [`plugins/auth/README.md`](../../../plugins/auth/README.md) exposes a broader plugin surface; provider setup, revocation, policy evaluation, projection lag, and event replay are not visible.                                                                                                                                                                                                                                     |
| DLQ backend portability                          | **Under-sold** | KV/Redis/Postgres depth cards and reprocess confirm.                       | Backend choice is shown as inventory, not as an extension/operational property; batch safety, poison-message loop prevention, replay result, and provenance are missing.                                                                                                                                                                                                                                                           |
| CLI/UI command duality                           | **Covered**    | Mutations print exact CLI.                                                 | Keep this signature everywhere; expand beyond single confirms into plan/diff/run/result/undo.                                                                                                                                                                                                                                                                                                                                      |
| UI/CLI/API contract parity                       | **Under-sold** | Catalog and CLI confirms imply parity.                                     | No “copy API request,” schema validation, or proof that UI invokes the same contract rather than a special endpoint.                                                                                                                                                                                                                                                                                                               |
| Derived, internally consistent operational stats | **Under-sold** | KPI/stat grids are plentiful.                                              | Workers/sagas/triggers compute real totals and success rates ([POC §§3–5](../design-project/feedback/POC-ground-truth.md)); prototype numbers look ornamental because derivation/filter scope is not exposed.                                                                                                                                                                                                                      |
| Complementary Aspire/Scalar satellites           | **Covered**    | Trace/log/try-it links consistently leave the console.                     | Correct product boundary. Deck itself is stronger at resource/log/trace/metric operations, so do not imitate it; make handoff preserve correlation, time range, and return path ([Deck research §§2–3](../reference/aspire-deck-research.md)).                                                                                                                                                                                     |
| Addressable typed entity hierarchy               | **Absent**     | Fifteen flat hashes; selection in memory.                                  | The POC already has nested definition/instance/execution routes; failing to use the product's own route-contract strength is a major credibility gap.                                                                                                                                                                                                                                                                              |
| Cache-first / smart revalidation DX              | **Absent**     | “Live” and Follow exist without freshness semantics.                       | The real loader model has cache, background prewarm, and a staleness probe ([POC §6](../design-project/feedback/POC-ground-truth.md)). Surface last update, snapshot/live state, reconnect, and stale data honestly.                                                                                                                                                                                                               |

## Six-axis verdict

| Owner axis                           | Current score | Hard verdict                                                                                                                                                                                                                                         |
| ------------------------------------ | ------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Zero future-beta prose            |          4/10 | Known milestone/footer/preview language makes the “final product” claim visibly false. Remove it; do not replace it with vague disabled controls.                                                                                                    |
| 2. Routing-hierarchy resort          |          1/10 | No entity routes, URL tabs/filters, journey route, or hierarchy-derived breadcrumbs. This is a rebuild, not a sidebar cleanup.                                                                                                                       |
| 3. Features implemented incl. writes |          4/10 | Confirm+CLI is excellent, but most writes are isolated or gated. Create/configure/validate/observe/undo loops are missing.                                                                                                                           |
| 4. Beta.10 cross-coverage            |          5/10 | Broad screen coverage exists, but this pass cannot claim issue-complete mapping from screenshots alone. The revamp must maintain an issue↔route acceptance ledger using [`reference/beta10-epic-issues.json`](../reference/beta10-epic-issues.json). |
| 5. Distributed AI capabilities       |          3/10 | Home summary is right; dedicated chat is the wrong center of gravity. Almost no contextual assists, dynamic automations, or explicit context capture.                                                                                                |
| 6. Dynamic plugin/extension system   |          4/10 | Axis map and contributed-panel table communicate architecture, not the author/install/review/run/update user journey.                                                                                                                                |

## Ranked 15 highest-leverage changes

1. **Replace the flat router with a canonical resource tree and entity URLs.** Why: fixes
   shareability, Back/Forward, refresh, tabs, investigation handoff, and sidebar comprehension in
   one move. **Axis 2. Screens: all.** Proposed roots: `/overview`, `/build/*`, `/automations/*`,
   `/data/*`, `/extensions/*`, `/journeys/:correlationId`.
2. **Make `/journeys/:correlationId` the product's investigation home.** Why: turns the best
   differentiator into an addressable workflow; preserve filter/time/selected seam in query state
   and link every primitive bidirectionally. **Axes 2,5. Screens: Flow, Runs, Triggers, Sagas,
   Workers, Streams, AI.**
3. **Split Workers into Jobs and Tasks and sell polyglot runtimes aggressively.** Why:
   Deno/Python/Shell/PowerShell/.NET tasks are more differentiated than another execution feed. Add
   definition → executions → execution URLs and runtime-aware inputs/log handoff. **Axis 2. Screens:
   Workers, Runs, Home.**
4. **Turn every mutation into plan → diff → exact CLI → execute → result → undo/next-step.** Why:
   preserves trust while making project writes first-class. Include plugin add/update/create,
   scaffold, migrate, overrides, trigger changes, reprocess, replay. **Axes 1,3. Screens: Runtime,
   Plugins, Triggers, Migrations, DLQ, Sagas.**
5. **Distribute AI into contextual assist slots; demote the generic prompt.** Why: “Explain this
   failed action,” “propose override,” “draft repair,” and “create trigger from this pattern” save
   time at the decision point. Every assist shows captured context, tools, proposed diff, and
   durable run/correlation. **Axis 5. Screens: all failure/detail screens.**
6. **Build the extension lifecycle, not just an axis diagram.** Why:
   author/install/permission/preview/conflict/update/disable is where the dynamic plugin claim
   becomes credible. Attribute every panel, seam, connection, action, route, and command to its
   contributor. **Axes 3,6. Screens: Plugins, Home, Config, command palette.**
7. **Create addressable procedure and route-contract detail pages.** Why: REST/RPC/SDK duality and
   typed path/search contracts are invisible as chips. Show shared schema, generated surfaces,
   consumers, coverage, provenance, drift, and Scalar handoff. **Axis 2. Screens: Catalog.**
8. **Make list state professional and URL-owned.** Why: saved filters, query, sort, columns,
   density, pagination/cursor, bulk selection, and comparison distinguish a tool from a demo.
   **Axis 2. Screens: Runs, Workers, Sagas, Triggers, Streams, Plugins, Migrations, DLQ, Auth.**
9. **Unify definition → instance/execution → correlated journey navigation.** Why: users think in
   both capability and incident dimensions. Persistent subnav and hierarchy-derived breadcrumbs
   should make both paths obvious. **Axis 2. Screens: Workers, Sagas, Triggers, Streams.**
10. **Expose real data provenance and freshness.** Why: derived KPI scopes, cache snapshot, live
    connection, last event, reconnect, and stale-state cues make dense data trustworthy. **Axes 1,3.
    Screens: Home, all live feeds.**
11. **Upgrade trigger authoring around all eight trigger types and action-chain simulation.** Why:
    definition builder + sample event + typed action results + next fires + AI draft is a complete
    differentiating loop. **Axes 3,5. Screens: Triggers, Flow.**
12. **Make runtime configuration a full audit/rollback workspace.** Why: the strongest screen should
    support arbitrary compare, author/reason, impacted capabilities, conflict detection,
    rollback/unset, and post-change observation. **Axis 3. Screens: Runtime, Config, Home.**
13. **Reframe Auth as a durable projection debugger.** Why: compete on NetScript's event model
    instead of imitating a weaker Supabase auth table. Show source events, projection
    checkpoint/lag, policy decision, revocation propagation, replay, and provider context. **Axes
    2,3. Screens: Auth, Streams, Journey.**
14. **Preserve context in Aspire/Scalar handoffs.** Why: satellite doctrine is only pleasant when
    links carry resource, correlation, trace, time range, procedure, and a return URL. **Axis 3.
    Screens: Config, Flow, Runs, AI, Catalog.**
15. **Purge every future-beta/preview artifact and replace it with finished states.** Why:
    final-product prompts cannot normalize disabled affordances or roadmap copy. Include empty,
    loading, degraded, permission-denied, conflict, offline, and success states instead. **Axis 1.
    Screens: global footer, Flow, DLQ, Plugins, Runtime, Triggers.**

## Bottom line

Do not market the current artifact as “far ahead.” Market the revamp opportunity: NetScript owns a
combination competitors do not—typed contracts, polyglot tasks, durable state machines/streams,
correlation-native journeys, runtime-config history, CLI/UI duality, and multi-axis plugin
contributions. The prototype currently visualizes fragments of that combination. A hierarchical,
addressable, write-capable, assistive console could be category-leading; this flat prototype is not
yet that console.
