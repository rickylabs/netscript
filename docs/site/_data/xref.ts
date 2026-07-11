/**
 * docs/site/_data/xref.ts — auto-resolving cross-reference map (OD2/OD3).
 *
 * A dedicated link-data surface, isolated from `_data.ts` (which stays nav-only).
 * Pages reference stable KEYS instead of hardcoded hrefs; the build resolves them
 * and FAILS on an unknown key, so the build doubles as a link checker.
 *
 * Locked key namespaces (OD3):
 *   cap:        capability hub          (cap:services      -> /services-sdk/services/)
 *   howto:      how-to recipe           (howto:add-a-plugin)
 *   tut:        tutorial chapter/track  (tut:first-workspace)
 *   explain:    explanation essay       (explain:architecture)
 *   concept:    concept / mental-model page
 *   ref:        generated reference unit (ref:sagas -> /reference/sagas/)
 *               and sub-paths           (ref:sagas/presets -> /reference/sagas/presets/)
 *   cli:        CLI reference           (cli:reference)
 *   glossary:   glossary                (glossary: or glossary:<anchor>)
 *
 * Each value is `{ href, label }`. `href` is the SOURCE (non-base-prefixed) url;
 * the `url` Lume filter applies the `/netscript/` base at render time, exactly as
 * nav hrefs do. Seeded with every target that exists on the current site so hubs
 * can link without hardcoding paths. New pages add their key here as they land.
 *
 * Resolution + the build-failing `xref` filter / `comp.xref` component live in
 * `_config.ts` and `_components/xref.vto`; both import THIS map.
 */

export interface XrefTarget {
  /** Source (pre-base) url; the `url` filter prefixes `/netscript/` at render. */
  href: string;
  /** Default link text when a caller does not supply its own. */
  label: string;
}

/** The 31 generated reference units (mirrors `referenceUnits` in `_data.ts`). */
const REFERENCE_UNITS = [
  "ai",
  "auth",
  "auth-better-auth",
  "auth-kv-oauth",
  "auth-workos",
  "aspire",
  "cli",
  "config",
  "contracts",
  "cron",
  "database",
  "fresh",
  "fresh-ui",
  "kv",
  "logger",
  "plugin",
  "plugin-ai",
  "plugin-ai-core",
  "plugin-auth",
  "plugin-auth-core",
  "prisma-adapter-mysql",
  "queue",
  "runtime-config",
  "sagas",
  "sdk",
  "service",
  "streams",
  "telemetry",
  "triggers",
  "watchers",
  "workers",
] as const;

function refEntries(): Record<string, XrefTarget> {
  const out: Record<string, XrefTarget> = {};
  for (const unit of REFERENCE_UNITS) {
    out[`ref:${unit}`] = { href: `/reference/${unit}/`, label: unit };
  }
  return out;
}

export const xref: Record<string, XrefTarget> = {
  // ─── Capability hubs (cap:) ────────────────────────────────────────────────
  "cap:services": { href: "/services-sdk/services/", label: "Services & contracts" },
  "cap:background-jobs": { href: "/background-processing/workers/", label: "Background jobs" },
  "cap:durable-sagas": { href: "/durable-workflows/sagas/", label: "Durable sagas" },
  "cap:triggers": { href: "/durable-workflows/triggers/", label: "Triggers & ingress" },
  "cap:streams": { href: "/durable-workflows/streams/", label: "Durable streams" },
  "cap:database": { href: "/data-persistence/database/", label: "Database & Prisma" },
  "cap:kv-queues-cron": { href: "/data-persistence/kv-queues-cron/", label: "KV, queues & cron" },
  "cap:telemetry": { href: "/observability/telemetry/", label: "Telemetry & logging" },
  "cap:auth": { href: "/identity-access/auth/", label: "Authentication" },
  "cap:fresh-ui": { href: "/web-layer/fresh-ui/", label: "Fresh UI & design" },
  "cap:index": { href: "/", label: "NetScript" },
  // v3 NEW capability hubs
  "cap:fresh-framework": { href: "/web-layer/", label: "Fresh meta-framework" },
  "cap:sdk": { href: "/services-sdk/sdk/", label: "Typed SDK & client" },
  "cap:polyglot-tasks": { href: "/background-processing/polyglot-tasks/", label: "Polyglot tasks" },
  "cap:runtime-config": { href: "/orchestration-runtime/runtime-config/", label: "Runtime configuration" },

  // ─── How-to recipes (howto:) ───────────────────────────────────────────────
  "howto:index": { href: "/how-to/", label: "How-to guides" },
  "howto:add-a-plugin": { href: "/how-to/add-a-plugin/", label: "Add a plugin" },
  "howto:add-a-service": { href: "/how-to/add-a-service/", label: "Add a service" },
  "howto:add-authentication": { href: "/how-to/add-authentication/", label: "Add authentication" },
  "howto:database-migration": { href: "/how-to/database-migration/", label: "Database & migration" },
  "howto:queue-kv-cron": { href: "/how-to/queue-kv-cron/", label: "Queue / KV / cron" },
  "howto:add-opentelemetry": { href: "/how-to/add-opentelemetry/", label: "Add OpenTelemetry" },
  "howto:customize-fresh-ui": { href: "/how-to/customize-fresh-ui/", label: "Customize Fresh UI" },
  "howto:deploy": { href: "/how-to/deploy/", label: "Deploy" },
  "howto:author-a-plugin": { href: "/how-to/author-a-plugin/", label: "Author a plugin" },
  "howto:deno-lsp-code-intelligence": { href: "/how-to/deno-lsp-code-intelligence/", label: "Deno LSP code intelligence" },
  // v3 NEW how-to recipes
  "howto:run-a-polyglot-task": { href: "/how-to/run-a-polyglot-task/", label: "Run a polyglot task" },
  "howto:choose-a-queue-provider": { href: "/how-to/choose-a-queue-provider/", label: "Choose a queue provider" },
  "howto:use-a-second-database": { href: "/how-to/use-a-second-database/", label: "Use a second database" },
  "howto:discover-services": { href: "/how-to/discover-services/", label: "Discover services" },
  "howto:expose-openapi-scalar": { href: "/how-to/expose-openapi-scalar/", label: "Expose OpenAPI & Scalar" },
  "howto:graceful-shutdown": { href: "/how-to/graceful-shutdown/", label: "Graceful shutdown" },
  "howto:tune-worker-runtime": { href: "/how-to/tune-worker-runtime/", label: "Tune the worker runtime" },
  "howto:deploy-local-aspire": { href: "/how-to/deploy-local-aspire/", label: "Deploy locally with Aspire" },
  "howto:roll-out-runtime-overrides": { href: "/how-to/roll-out-runtime-overrides/", label: "Roll out runtime overrides" },
  "howto:add-a-task-runtime-adapter": { href: "/how-to/add-a-task-runtime-adapter/", label: "Add a task runtime adapter" },
  "howto:build-a-server-validated-form": { href: "/how-to/build-a-server-validated-form/", label: "Build a server-validated form" },
  "howto:build-a-validated-ingestion-queue": { href: "/how-to/build-a-validated-ingestion-queue/", label: "Build a validated ingestion queue" },
  "howto:publish-a-durable-stream": { href: "/how-to/publish-a-durable-stream/", label: "Publish a durable stream" },
  "howto:restrict-worker-task-permissions": { href: "/how-to/restrict-worker-task-permissions/", label: "Restrict worker task permissions" },

  // ─── Tutorials (tut:) ──────────────────────────────────────────────────────
  "tut:index": { href: "/tutorials/", label: "Tutorials" },
  "tut:first-workspace": { href: "/tutorials/storefront/", label: "Build the Storefront" },
  "tut:build-a-service": { href: "/tutorials/storefront/02-catalog-service/", label: "Build a service" },
  "tut:background-jobs": { href: "/tutorials/erp-sync/", label: "ERP Sync — background jobs" },
  "tut:durable-workflow": { href: "/tutorials/storefront/04-checkout-saga/", label: "A durable checkout saga" },
  "tut:ingest-webhook": { href: "/tutorials/storefront/05-shipping-webhook/", label: "Ingest a webhook" },
  // v3 tutorial tracks (D1/D2) + chapters
  "tut:storefront": { href: "/tutorials/storefront/", label: "Storefront" },
  "tut:storefront/01": { href: "/tutorials/storefront/01-scaffold/", label: "Storefront - Scaffold" },
  "tut:storefront/02": { href: "/tutorials/storefront/02-catalog-service/", label: "Storefront - Catalog Service" },
  "tut:storefront/03": { href: "/tutorials/storefront/03-cart-contracts/", label: "Storefront - Cart Contracts" },
  "tut:storefront/04": { href: "/tutorials/storefront/04-checkout-saga/", label: "Storefront - Checkout Saga" },
  "tut:storefront/05": { href: "/tutorials/storefront/05-shipping-webhook/", label: "Storefront - Shipping Webhook" },
  "tut:storefront/06": { href: "/tutorials/storefront/06-deploy/", label: "Storefront - Deploy" },
  "tut:workspace": { href: "/tutorials/workspace/", label: "Team Workspace" },
  "tut:workspace/01": { href: "/tutorials/workspace/01-scaffold/", label: "Team Workspace - Scaffold" },
  "tut:workspace/02": { href: "/tutorials/workspace/02-auth/", label: "Team Workspace - Auth" },
  "tut:workspace/03": { href: "/tutorials/workspace/03-workspace-data/", label: "Team Workspace - Workspace Data" },
  "tut:workspace/04": { href: "/tutorials/workspace/04-provision-job/", label: "Team Workspace - Provision Job" },
  "tut:workspace/05": { href: "/tutorials/workspace/05-route-authz/", label: "Team Workspace - Route Authz" },
  "tut:workspace/06": { href: "/tutorials/workspace/06-deploy/", label: "Team Workspace - Deploy" },
  "tut:erp-sync": { href: "/tutorials/erp-sync/", label: "ERP Sync" },
  "tut:erp-sync/01": { href: "/tutorials/erp-sync/01-scaffold/", label: "ERP Sync - Scaffold" },
  "tut:erp-sync/02": { href: "/tutorials/erp-sync/02-import-job/", label: "ERP Sync - Import Job" },
  "tut:erp-sync/03": { href: "/tutorials/erp-sync/03-polyglot-transform/", label: "ERP Sync - Polyglot Transform" },
  "tut:erp-sync/04": { href: "/tutorials/erp-sync/04-queue-and-cron/", label: "ERP Sync - Queue And Cron" },
  "tut:erp-sync/05": { href: "/tutorials/erp-sync/05-deploy/", label: "ERP Sync - Deploy" },
  "tut:live-dashboard": { href: "/tutorials/live-dashboard/", label: "Live Dashboard" },
  "tut:live-dashboard/01": { href: "/tutorials/live-dashboard/01-scaffold/", label: "Live Dashboard - Scaffold" },
  "tut:live-dashboard/02": { href: "/tutorials/live-dashboard/02-contract-to-service/", label: "Live Dashboard - Contract To Service" },
  "tut:live-dashboard/03": { href: "/tutorials/live-dashboard/03-sdk-cache-first-query/", label: "Live Dashboard - Sdk Cache First Query" },
  "tut:live-dashboard/04": { href: "/tutorials/live-dashboard/04-definePage-QueryIsland/", label: "Live Dashboard - Definepage Queryisland" },
  "tut:live-dashboard/05": { href: "/tutorials/live-dashboard/05-live-stream/", label: "Live Dashboard - Live Stream" },
  "tut:live-dashboard/06": { href: "/tutorials/live-dashboard/06-deploy/", label: "Live Dashboard - Deploy" },

  // ─── Explanation essays (explain:) ─────────────────────────────────────────
  "explain:index": { href: "/explanation/", label: "Explanation" },
  "explain:architecture": { href: "/explanation/architecture/", label: "Architecture" },
  "explain:contracts": { href: "/explanation/contracts/", label: "Contracts & type flow" },
  "explain:plugin-model": { href: "/explanation/plugin-system/", label: "The plugin system" },
  "explain:auth-model": { href: "/explanation/auth-model/", label: "Auth model" },
  "explain:durable-workflows": { href: "/explanation/durability-model/", label: "The durability model" },
  "explain:observability": { href: "/explanation/observability/", label: "Observability" },
  "explain:aspire": { href: "/explanation/aspire/", label: "Orchestration with Aspire" },
  // v3 NEW / renamed explanation essays
  "explain:plugin-system": { href: "/explanation/plugin-system/", label: "The plugin system" },
  "explain:durability-model": { href: "/explanation/durability-model/", label: "The durability model" },

  // ─── Concept / mental-model pages (concept:) ───────────────────────────────
  "concept:contracts": { href: "/explanation/contracts/", label: "Contracts-first" },

  // ─── Front door (start-here surfaces, reachable as concepts) ───────────────
  "concept:quickstart": { href: "/quickstart/", label: "Quickstart" },
  "concept:why": { href: "/why/", label: "Why NetScript" },
  "concept:home": { href: "/", label: "Home" },
  "concept:concepts": { href: "/concepts/", label: "Core concepts" },

  // ─── CLI + glossary (cli: / glossary:) ─────────────────────────────────────
  "cli:reference": { href: "/cli-reference/", label: "CLI reference" },
  "glossary:": { href: "/glossary/", label: "Glossary" },

  // ─── Reference index + the 28 generated units (ref:) ───────────────────────
  "ref:index": { href: "/reference/", label: "Reference index" },
  ...refEntries(),
};

/**
 * Resolve an xref key to its target. Throws on an unknown key so the Lume build
 * exits non-zero — the build is the link checker (OD2). Used by both the `xref`
 * Vento filter and the `comp.xref` component.
 */
export function resolveXref(key: string): XrefTarget {
  const target = xref[key];
  if (!target) {
    const known = Object.keys(xref).length;
    throw new Error(
      `xref: unknown key "${key}". No target registered in docs/site/_data/xref.ts ` +
        `(${known} keys known). Add the key or fix the reference — the build is the link checker.`,
    );
  }
  return target;
}

export default xref;
