# Draft Competitor Rows — Topic A Dashboard Matrix

Distilled candidate resources for the NetScript dev dashboard, derived from the competitor
dev-console teardown. Each row is a **candidate dashboard resource/panel**, its **kind** (category),
**why it matters** for NetScript, and **where it was distilled** (link to the teardown section or the
in-repo competitor doc).

`kind` legend: `map` = code-derived architecture graph · `catalog` = contract/API explorer ·
`run-inspector` = run-list→detail→timeline · `trace` = OTel span/log surface · `data` = data-CRUD
browser · `introspection` = machine-readable dev endpoint.

| resource | kind | why it matters (NetScript) | where distilled |
| --- | --- | --- | --- |
| Resource/architecture graph (plugin + Aspire contribution map) | map | Encore Flow proves the code-derived live infra map is *the* signature spark; maps onto NetScript's Aspire-resource + plugin-contribution graph | [03#1-encore](../../research/A-dashboard/03-competitor-dev-console-teardown.md#1-encore--local-development-dashboard) |
| Route/plugin scan → introspection list | map | Nitro scans conventional dirs and lists routes/tasks; NetScript scaffold output can be scanned the same way | [03#6-nitro](../../research/A-dashboard/03-competitor-dev-console-teardown.md#6-nitro--dev-server-devtools) |
| Service/contract catalog (auto-generated API docs) | catalog | Encore Service Catalog compiles endpoint docs from source AST; NetScript analog = oRPC-contract catalog from scaffolded contracts | [03#1-encore](../../research/A-dashboard/03-competitor-dev-console-teardown.md#1-encore--local-development-dashboard) |
| Live API Explorer (call endpoint, params pre-filled from types) | catalog | Highest-value Encore interaction — turns read-only catalog into a live typed client; oRPC contracts make params pre-fillable | [03#1-encore](../../research/A-dashboard/03-competitor-dev-console-teardown.md#1-encore--local-development-dashboard) |
| Run list (filter by type/status/time, live-updating) | run-inspector | Temporal/Trigger.dev run list is the primary "what ran" entry point for sagas/workers/triggers/streams | [03#2-temporal](../../research/A-dashboard/03-competitor-dev-console-teardown.md#2-temporal--web-ui), [03#4-trigger](../../research/A-dashboard/03-competitor-dev-console-teardown.md#4-triggerdev--dashboard--run-inspector) |
| Run detail (summary + inputs + results) | run-inspector | Temporal execution-detail view; per-run inputs/outputs are essential for saga debugging | [03#2-temporal](../../research/A-dashboard/03-competitor-dev-console-teardown.md#2-temporal--web-ui) |
| Event/step history with All / Compact / JSON toggle | run-inspector | Temporal's multi-altitude history view; ideal for showing saga step history at readable vs raw levels | [03#2-temporal](../../research/A-dashboard/03-competitor-dev-console-teardown.md#2-temporal--web-ui) |
| Step timeline waterfall (two-panel: timeline left / details right) | run-inspector | Inngest's resizable two-panel waterfall is the ergonomic standard for step-function inspection | [03#3-inngest](../../research/A-dashboard/03-competitor-dev-console-teardown.md#3-inngest--dev-server-ui) |
| Rerun / Rerun-from-step + Attempt badges | run-inspector | Inngest replay actions + retry-attempt badges; concrete interactions for saga compensation/retry debugging | [03#3-inngest](../../research/A-dashboard/03-competitor-dev-console-teardown.md#3-inngest--dev-server-ui) |
| Worker/task-queue health (pollers + live count, error-if-none) | run-inspector | Temporal task-queue view maps directly onto NetScript worker health/liveness | [03#2-temporal](../../research/A-dashboard/03-competitor-dev-console-teardown.md#2-temporal--web-ui) |
| Trace waterfall + inline live logs (OTel hierarchical) | trace | Encore tracing + Trigger.dev/Inngest OTel traces set the bar; substrate for NetScript telemetry (Topic B) | [03#1-encore](../../research/A-dashboard/03-competitor-dev-console-teardown.md#1-encore--local-development-dashboard), [03#4-trigger](../../research/A-dashboard/03-competitor-dev-console-teardown.md#4-triggerdev--dashboard--run-inspector) |
| Detail / Context tabs on a run | run-inspector | Trigger.dev separates "platform-recorded data" from "userland run context"; clean tab split | [03#4-trigger](../../research/A-dashboard/03-competitor-dev-console-teardown.md#4-triggerdev--dashboard--run-inspector) |
| Browser/console-log capture into the dashboard | trace | Aligns with NetScript issue #218 (browser-logs devtools); client errors invisible to server/OTEL today | [03#4-trigger](../../research/A-dashboard/03-competitor-dev-console-teardown.md#4-triggerdev--dashboard--run-inspector) |
| Data browser (model sidebar + table + record editor) | data | *Different category* (data-CRUD). Prisma Studio pattern IF a data tab is wanted; NetScript DB layer already owns this — likely out-of-core for v1 | [03#5-prisma](../../research/A-dashboard/03-competitor-dev-console-teardown.md#5-prisma-studio--data-browser-different-category--data-crud-not-infraobservability) |
| Machine-readable dev introspection endpoint (`/_netscript/*`) | introspection | Nitro `/_nitro/tasks` pattern — a JSON API the Fresh dashboard consumes to render plugins/routes/jobs | [03#6-nitro](../../research/A-dashboard/03-competitor-dev-console-teardown.md#6-nitro--dev-server-devtools) |
| Auto-launch on dev-run + fixed local port + real-time updates | (convention) | Universal across Encore (:9400), Prisma Studio (:5555), Temporal, Inngest — zero-config auto-open is the expected UX | [03 synthesis](../../research/A-dashboard/03-competitor-dev-console-teardown.md#cross-tool-synthesis--the-recurring-ia-vocabulary) |

## Notes for matrix consolidation
- **Core v1 candidates** (highest precedent + closest NetScript fit): resource/architecture graph,
  service/contract catalog + API explorer, run list→detail→step-timeline, OTel trace+logs,
  worker/task-queue health, introspection endpoint.
- **Deferred / out-of-core**: data browser (Prisma Studio category — DB layer already owns it),
  browser-log capture (ties to #218; nice-to-have, not IA-defining).
- **Conventions (not resources, but binding)**: auto-launch, fixed port, real-time, everything
  code/scaffold-derived. These constrain *how* every panel behaves, not *what* panels exist.
- The in-repo `competitors/*.md` files are documentation-IA teardowns, not dashboard-UI teardowns —
  they contributed value-prop/audience framing and the "signature spark" framing (Encore Flow,
  Temporal replay simulator), but panel-level detail came from fresh web research cited in file 03.
