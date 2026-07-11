# P4 — Control Plane: Runtime Config · Topology · Catalog · Data Group

**Revamp the configuration/data surfaces of the NetScript Dev Dashboard using the published
"NS One" design system**, inside the P1 shell and locked routes. FINAL product: every write
operable (no read-only gating, no preview banners); the DLQ renders as a fully shipped
surface; the standard confirm dialog (plan → diff → exact CLI → Execute → result) gates every
mutation.

## Runtime Config `/runtime` → `/runtime/overrides/:key` · `/runtime/versions/:version`

The flagship becomes a full **audit + control workspace**:
- **Root:** live override feed (follow toggle + catch-up pill; `?scope=flags|jobs|sagas|
  triggers|tasks` chips), current-state stat grid per scope, and the **version chain**
  `v41 → v42 → v43 (current)` where any two versions can be selected and compared
  (side-by-side diff), each version step showing author/source ("set via dashboard · confirm
  #…" / "set via CLI") and impacted capabilities ("disabled job nightly-reconcile → Workers").
- **Override detail `/overrides/:key`:** current value, full history of that key across
  versions, impacted-entity links, and controls: set/adjust (typed editor per value kind:
  switch, rollout slider, enum), **Clear override**, **Rollback to version…** — all
  confirm+CLI (`netscript config override set flags.checkout-v2 --rollout 30`). After
  Execute, the feed, stat grid, and version chain all visibly update as one causal state (the
  demo IS the coherence).
- **Version detail `/versions/:version`:** snapshot + diff vs previous, "Restore this
  version" write.

## Config Topology `/config` → `/config/nodes/:nodeId`

- The capability wiring graph (`ns-stackmap`) with **labeled edges** (queue/topic/payload on
  every edge; pub/sub dashed), coverage overlay toggle (tints unwired nodes), freshness line
  ("resolved 14:02:31 · re-resolves on dev reload") + "Re-resolve" action. Selecting a node
  updates `?node=` (shareable selection); "Open node detail" → `/config/nodes/:nodeId` with
  wiring + telemetry tabs, declaring-file link, "Open in Aspire" per node.
- **Zero contradictions:** the streams-telemetry maturity story is ONE sentence reused
  wherever it appears (here, on `/streams`, on Home).

## Catalog `/catalog` (?tab=procedures|routes) → `/catalog/procedures/:procedureId`

- **Root:** coverage summary headline ("4 of 17 procedures thin · 2 routes unbound"),
  procedure table (provenance plugin badge, method, coverage, duality chips REST/RPC/SDK —
  VARIED per row: design an RPC-only internal proc, an SDK-excluded admin op, a REST-only
  webhook receiver), routes tab with bound/unbound rows where UNBOUND carries the inline fix
  hint (sidecar vs inline authoring) and a "Bind route…" scaffold write (confirm+CLI).
- **Procedure detail `/procedures/:procedureId`:** the duality made visible — one shared
  schema block, generated surfaces list (REST path, RPC name, SDK method with generated-code
  snippets), consumers ("called by web app · chat app"), coverage explanation ("thin: missing
  `.describe()` on 2 fields" with an "Add descriptions…" scaffold write), provenance
  (contributing plugin + contract version), "Open in Scalar ↗" out-link (never a try-it here).

## Migrations `/migrations` → `/migrations/:migrationId`

- Migration table (pending count = Home's number), drift alert + introspect diff describing
  the SAME drift, **"Apply migrations" write** (confirm shows the plan: which migrations, the
  diff, `netscript db migrate`, then a success state with the applied rows flipping). Detail
  page per migration: full SQL/diff, applied-at, origin. Keep the operator-empathy note for
  the transient engine flake in the error state.

## Dead-Letter Queues `/dlq` → `/dlq/:queueId` → `/messages/:messageId`

Fully shipped surface (no "pending contract routes" banner):
- **Root (`?tab=queue|trigger`):** the two DLQ families with genuinely different data shapes
  (queue side: per-backend depth grid KV/Redis/Postgres; trigger side: per-trigger dead
  events). Depth numbers and table row counts always consistent; drained state = friendly
  empty state.
- **Queue detail:** message table (multi-select in the URL `?selected=`), reason + error-code
  badges, expandable payloads. **Reprocess selected** is the showcase destructive write: the
  confirm names backend + count ("Reprocess 3 messages from redis?") + CLI
  (`netscript queue dlq reprocess --backend redis`), then a result state with per-message
  outcomes and links to the new runs. "Open original run" per message → `/runs/:correlationId`.
- **Message leaf:** payload, death history (attempts), "Reprocess this message" +
  "Delete permanently" (double-confirm destructive).

## Auth Sessions `/auth` → `/auth/sessions/:sessionId`

Reframe as a **durable projection debugger**, not a user table: sessions list
(provider/state filters in URL) + live `auth.*` event stream; session detail = the projection
story (source events that built this session, checkpoint/lag indicator, policy decisions,
revocation propagation timeline) + writes: "Revoke session", "Revoke all for user" —
confirm+CLI, destructive styling.

**States everywhere:** loading / empty / live / degraded / error / post-write success; design
write in-flight (button spinner + optimistic row) and failure (inline error + retry) states
explicitly.

**Reach for:** `ns-stackmap`, `ns-verchain`, `ns-diff`, `ns-activity-feed`, `stats-grid`,
`data-table`, `ns-confirm`, `code-block`, `connector`/`ns-kv`, `badge`, `ns-tabs`, `ns-seg`,
`switch`, `empty-state`, `alert`, `inline-notice`, `ns-toaster`.

**Market bar:** Appwrite's create→configure→monitor loop and Supabase Studio's polish set the
management bar; neither shows config *version causality*, contract *coverage/provenance*,
migration *drift*, or DLQ *replay with CLI transparency*. Encore's Flow is the topology bar —
beat it with labeled edges + coverage overlay. Every write here must feel safer than a CLI
because it shows the CLI.

**Non-goals:** no query console/data browser; no owned telemetry; no free-form JSON config
editing (typed domain controls only).

**Theme:** NS One tokens; light+dark; `STATUS_VARIANT`; mono ids/versions; reduced-motion.
