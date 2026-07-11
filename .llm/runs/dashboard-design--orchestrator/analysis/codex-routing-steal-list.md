# Routing and UX steal list — internal grounding

> Naming note: `playground-ref` and `chat-ref` are aliases for the two internal reference
> apps (mapping known to the owner). Aliased here so this analysis can live on a public repo;
> never expand these aliases in owner-facing design-prompt text.

Purpose: concrete patterns to adapt into the NetScript Dev Dashboard. These source names are
internal research references only and must not become required public naming in owner-facing design
prompts.

## Route architecture to adopt

### 1. File-system hierarchy that mirrors the domain

The playground already models the right depth:

- worker definitions:
  [`plugin/workers/jobs/[jobId]/index.tsx`](/home/codex/repos/refs/playground-ref/apps/playground/routes/(dashboard)/dashboard/plugin/workers/jobs/[jobId]/index.tsx)
- job executions:
  [`plugin/workers/jobs/[jobId]/executions/[executionId]/index.tsx`](/home/codex/repos/refs/playground-ref/apps/playground/routes/(dashboard)/dashboard/plugin/workers/jobs/[jobId]/executions/[executionId]/index.tsx)
- parallel task hierarchy:
  [`plugin/workers/tasks/[taskId]/executions/[executionId]/index.tsx`](/home/codex/repos/refs/playground-ref/apps/playground/routes/(dashboard)/dashboard/plugin/workers/tasks/[taskId]/executions/[executionId]/index.tsx)
- saga definition then correlated instance:
  [`plugin/sagas/[sagaName]/[correlationId]/index.tsx`](/home/codex/repos/refs/playground-ref/apps/playground/routes/(dashboard)/dashboard/plugin/sagas/[sagaName]/[correlationId]/index.tsx)
- trigger definition then event:
  [`plugin/triggers/[id]/events/[eventId]/index.tsx`](/home/codex/repos/refs/playground-ref/apps/playground/routes/(dashboard)/dashboard/plugin/triggers/[id]/events/[eventId]/index.tsx)

Adapt it as:

```text
/overview
/build/catalog/procedures/:procedureId
/build/config/declarations/:nodeId
/build/runtime-config/versions/:version
/automations/workers/jobs/:jobId/executions/:executionId
/automations/workers/tasks/:taskId/executions/:executionId
/automations/sagas/:sagaName/instances/:correlationId
/automations/triggers/:triggerId/events/:eventId
/automations/streams/:streamId/deliveries/:messageId
/journeys/:correlationId
/data/migrations/:migrationId
/data/dead-letters/:backend/:messageId
/security/auth/sessions/:sessionId
/extensions/plugins/:pluginId
/extensions/contributions/:contributionId
/ai/runs/:agentRunId
```

Use stable domain ids in path segments. Put filters, sort, time range, selected tab, altitude, and
comparison target in validated query parameters. Never keep the only selected entity in component
memory.

### 2. Definition → instance/execution is the default drill-down

The worker route tree separates jobs from tasks and definition pages from execution pages; saga and
trigger trees do the same. That is materially better than the prototype's one Workers page, one
Sagas page, and one Triggers page.

Adaptation:

- List rows navigate to a definition page, not an in-memory rail.
- Definition pages have stable tabs: `overview`, `configuration`, `executions/events/instances`,
  `connections`, `activity`.
- Execution/instance/event pages keep the definition breadcrumb and add `Open journey` whenever a
  correlation id exists.
- Right-side quick views may remain drawers, but “Open full details” must change the URL; drawers
  themselves use a query key such as `?inspect=execution:ex_123` so reload and copy-link work.

### 3. Typed route contracts as a dashboard product feature

The playground route contract files validate path/search input, e.g.
[`workers/jobs/[jobId]/index.route.ts`](/home/codex/repos/refs/playground-ref/apps/playground/routes/(dashboard)/dashboard/plugin/workers/jobs/[jobId]/index.route.ts),
[`sagas/[sagaName]/[correlationId]/index.route.ts`](/home/codex/repos/refs/playground-ref/apps/playground/routes/(dashboard)/dashboard/plugin/sagas/[sagaName]/[correlationId]/index.route.ts),
and
[`triggers/[id]/events/[eventId]/index.route.ts`](/home/codex/repos/refs/playground-ref/apps/playground/routes/(dashboard)/dashboard/plugin/triggers/[id]/events/[eventId]/index.route.ts).
The POC ground truth explicitly identifies `InferRouteContractPath/Search` as the basis
([POC §6](../design-project/feedback/POC-ground-truth.md)).

Adaptation:

- Define every dashboard route as a typed contract; derive links, breadcrumbs, and command-palette
  targets from one registry.
- Reject malformed entity ids/search values into an explicit recoverable state.
- Make the Catalog screen expose these same contracts: path params, search schema, procedure
  duality, consumers, and generated links. The dashboard should dogfood the differentiator it sells.

### 4. Correlation back-links, not just forward drill-down

The playground joins saga/trigger detail to worker executions through
[`plugin/(_shared)/linked-worker-executions.ts`](/home/codex/repos/refs/playground-ref/apps/playground/routes/(dashboard)/dashboard/plugin/(_shared)/linked-worker-executions.ts)
and resolves domain cross-references in
[`plugin/(_shared)/cross-references.ts`](/home/codex/repos/refs/playground-ref/apps/playground/routes/(dashboard)/dashboard/plugin/(_shared)/cross-references.ts).
Worker execution can back-link to its originating trigger event; saga and trigger loaders share the
correlation query ([POC §1](../design-project/feedback/POC-ground-truth.md)).

Adaptation:

- Every detail header gets a correlation chip linked to `/journeys/:correlationId`.
- The journey page is an index of all known primitives, not a renamed run page.
- Each seam links both to its owning definition and exact occurrence.
- Preserve `from=<encoded current URL>` so satellite and primitive detail pages can return to the
  investigation.

### 5. Shared layouts for persistent local navigation

Nested `.layout.tsx` files wrap list, definition, and occurrence levels throughout the playground,
for example
[`plugin/workers/index.layout.tsx`](/home/codex/repos/refs/playground-ref/apps/playground/routes/(dashboard)/dashboard/plugin/workers/index.layout.tsx),
[`plugin/workers/jobs/[jobId]/index.layout.tsx`](/home/codex/repos/refs/playground-ref/apps/playground/routes/(dashboard)/dashboard/plugin/workers/jobs/[jobId]/index.layout.tsx),
and
[`plugin/sagas/[sagaName]/index.layout.tsx`](/home/codex/repos/refs/playground-ref/apps/playground/routes/(dashboard)/dashboard/plugin/sagas/[sagaName]/index.layout.tsx).

Adaptation:

- Global shell: project/environment, capability tree, command palette.
- Capability layout: local tabs, health/count summary, create action.
- Definition layout: identity/status/runtime, configuration tabs, related actions.
- Occurrence layout: status, correlation, time, previous/next, payload/JSON/activity.
- Breadcrumbs derive from matched route data; never concatenate the current title onto `Console /`.

### 6. Server-seeded live data with explicit freshness

The loaders use plugin-specific query utilities and stream factories:
[`workers/(_shared)/query-loaders.ts`](/home/codex/repos/refs/playground-ref/apps/playground/routes/(dashboard)/dashboard/plugin/workers/(_shared)/query-loaders.ts),
[`sagas/(_shared)/query-loaders.ts`](/home/codex/repos/refs/playground-ref/apps/playground/routes/(dashboard)/dashboard/plugin/sagas/(_shared)/query-loaders.ts),
[`triggers/(_shared)/query-loaders.ts`](/home/codex/repos/refs/playground-ref/apps/playground/routes/(dashboard)/dashboard/plugin/triggers/(_shared)/query-loaders.ts),
and
[`plugin/(_shared)/stream-loaders.ts`](/home/codex/repos/refs/playground-ref/apps/playground/routes/(dashboard)/dashboard/plugin/(_shared)/stream-loaders.ts).

Adaptation:

- Render a fast snapshot, then label transition to Live.
- Show `Snapshot at`, connection state, last event, paused/following, reconnect, and stale-data
  reason.
- Keep the snapshot usable during reconnect. Do not replace a dense page with a spinner.
- Scope counts to the URL's filters and expose the derivation on hover/details.

## Navigation patterns from the production AI reference

### 7. Addressable project → channel → session context

The reference app makes context structural rather than implicit:

- project:
  [`project/[project]/index.tsx`](/home/codex/repos/refs/chat-ref/apps/dashboard/routes/project/[project]/index.tsx)
- channel:
  [`project/[project]/channel/[channel]/index.tsx`](/home/codex/repos/refs/chat-ref/apps/dashboard/routes/project/[project]/channel/[channel]/index.tsx)
- session:
  [`project/[project]/channel/[channel]/session/[session]/index.tsx`](/home/codex/repos/refs/chat-ref/apps/dashboard/routes/project/[project]/channel/[channel]/session/[session]/index.tsx)
- route-level context/guards:
  [`project/[project]/_middleware.ts`](/home/codex/repos/refs/chat-ref/apps/dashboard/routes/project/[project]/_middleware.ts)
  and
  [`channel/[channel]/_middleware.ts`](/home/codex/repos/refs/chat-ref/apps/dashboard/routes/project/[project]/channel/[channel]/_middleware.ts)

Adaptation:

- Project/environment is route context, not merely a topbar pill; invalid or changed environment
  gets an explicit redirect/recovery page.
- Durable AI investigations get `/ai/runs/:runId`, with the originating journey/entity encoded in
  run metadata and visible context chips.
- A panel's “Ask/Explain” action starts a durable run with a frozen context manifest (entity URL,
  selected tab, filters, payload fields, relevant config version), then navigates or opens a
  URL-owned drawer.

### 8. Context is composed from visible, removable pieces

The reference app separates session context, scratch context, knowledge, instructions, and MCP/tool
surfaces in
[`session-context.tsx`](/home/codex/repos/refs/chat-ref/apps/dashboard/routes/project/[project]/channel/[channel]/session/[session]/(_components)/session-context.tsx),
[`SessionScratch.tsx`](/home/codex/repos/refs/chat-ref/apps/dashboard/islands/SessionScratch.tsx),
[`KnowledgePanel.tsx`](/home/codex/repos/refs/chat-ref/apps/dashboard/islands/KnowledgePanel.tsx),
and [`McpPanel.tsx`](/home/codex/repos/refs/chat-ref/apps/dashboard/islands/McpPanel.tsx).

Adaptation—not generic chat:

- Each embedded assist shows a compact “Using” manifest: failed step, payload excerpt, config v43,
  plugin doctor result, related trace link, tool schemas.
- Users can remove/redact context before execution.
- The result is an action card: explanation, evidence, proposed typed change, risk, exact CLI,
  simulate/apply buttons—not primarily prose bubbles.
- Store the manifest with the durable agent run so another developer can audit or resume it.

### 9. Tool-call and generative UI transparency

The reference has the central conversational surface in
[`ChatPane.tsx`](/home/codex/repos/refs/chat-ref/apps/dashboard/islands/ChatPane.tsx), streaming
endpoints in
[`api/chat-stream.ts`](/home/codex/repos/refs/chat-ref/apps/dashboard/routes/api/chat-stream.ts),
MCP application calls in
[`api/mcp-apps/call.ts`](/home/codex/repos/refs/chat-ref/apps/dashboard/routes/api/mcp-apps/call.ts),
and a generative UI design specimen in
[`design/generative.tsx`](/home/codex/repos/refs/chat-ref/apps/dashboard/routes/(design)/design/generative.tsx).

Adaptation:

- Retain tool-call cards, input/output schemas, duration, status, and linked entities.
- Render domain-native result cards (override diff, trigger draft, migration explanation, replay
  plan) inside the originating panel.
- Stream intermediate evidence without letting a partial suggestion look executable.
- Require the ordinary NetScript confirm-with-CLI gate before any AI-proposed write. AI never gets a
  separate mutation bypass.

### 10. Rail + full-page duality

The reference app uses durable session routes plus rails/islands such as
[`SessionRail.tsx`](/home/codex/repos/refs/chat-ref/apps/dashboard/islands/SessionRail.tsx). The
prototype uses rails, but without durable destination URLs.

Adaptation:

- Use a rail for quick inspection while retaining list context.
- Give every rail a canonical full-page URL and Copy link/Open full details action.
- Encode rail selection in query state; closing it restores the exact list URL.
- On narrow screens, promote the rail route to a full page rather than compressing three columns.

## Screen-specific steal map

| Prototype area | Pattern to steal and adapt                                                                        | Target URL / behavior                                         |
| -------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Workers        | Separate job/task trees; definition and execution levels; runtime badge.                          | `/automations/workers/{jobs                                   |
| Sagas          | Definition → correlation-keyed instance; linked worker executions.                                | `/automations/sagas/:name/instances/:correlationId`           |
| Triggers       | Definition → event; action results deep-link to created entities.                                 | `/automations/triggers/:id/events/:eventId`                   |
| Streams        | Apply the same definition → message/delivery hierarchy, missing from current reference route set. | `/automations/streams/:id/messages/:messageId?subscriber=...` |
| Runs/Flow      | Replace overlapping flat destinations with a canonical journey plus primitive occurrence URLs.    | `/journeys/:correlationId?seam=...&view=causal`               |
| Catalog        | Dogfood typed route contracts and add addressable procedure details.                              | `/build/catalog/procedures/:procedureId?surface=rest`         |
| Runtime config | Address versions, comparisons, and override details.                                              | `/build/runtime-config/versions/:version?compare=:other`      |
| Plugins        | Definition page plus contribution child routes; install/update wizard state in URL.               | `/extensions/plugins/:pluginId/contributions/:axis/:id`       |
| AI             | Durable run URL with explicit context manifest; contextual entry points everywhere.               | `/ai/runs/:runId`; panel action retains `from` URL            |
| Auth           | Treat session and source event as addressable projection occurrences.                             | `/security/auth/sessions/:id?event=:eventId`                  |

## Patterns not to copy

- Do not copy a chat product's conversation-first IA. NetScript's unit of work is an incident,
  definition, change, or automation; AI is an assist attached to it.
- Do not preserve the playground's `plugin/` path segment in public URLs. Users navigate
  capabilities, not repository packaging.
- Do not expose framework route-group syntax such as `(dashboard)` or `(_shared)`.
- Do not make every quick inspection a route transition. Drawers are useful when URL-owned and
  backed by a canonical page.
- Do not reproduce Aspire-style traces/logs/metrics/resources inside NetScript. Preserve the
  satellite boundary and improve contextual deep links instead.

## Acceptance checks for the revamp prompts

- Every selectable entity in every screenshot has a canonical URL.
- Refresh, Back/Forward, open-in-new-tab, and copy-link preserve entity, tab, filters, and time
  range.
- Every correlation id links to one journey route; every journey seam links to an exact primitive
  occurrence and back.
- Jobs and tasks are distinct routes; every task shows its runtime.
- Breadcrumbs and sidebar state are derived from the same typed route registry.
- Every AI assist discloses captured context and tools, produces a durable run URL, and uses the
  standard CLI-confirmed write gate.
- Every contributed panel/seam/connection/action identifies its plugin and links to its contribution
  detail.
