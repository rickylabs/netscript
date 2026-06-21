/**
 * docs/site/_data/xref.ts — auto-resolving cross-reference map (OD2/OD3).
 *
 * A dedicated link-data surface, isolated from `_data.ts` (which stays nav-only).
 * Pages reference stable KEYS instead of hardcoded hrefs; the build resolves them
 * and FAILS on an unknown key, so the build doubles as a link checker.
 *
 * Locked key namespaces (OD3):
 *   cap:        capability hub          (cap:services      -> /capabilities/services/)
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

/** The 22 generated reference units (mirrors `referenceUnits` in `_data.ts`). */
const REFERENCE_UNITS = [
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
  "cap:services": { href: "/capabilities/services/", label: "Services & contracts" },
  "cap:background-jobs": { href: "/capabilities/background-jobs/", label: "Background jobs" },
  "cap:durable-sagas": { href: "/capabilities/durable-sagas/", label: "Durable sagas" },
  "cap:triggers": { href: "/capabilities/triggers/", label: "Triggers & ingress" },
  "cap:streams": { href: "/capabilities/streams/", label: "Durable streams" },
  "cap:database": { href: "/capabilities/database/", label: "Database & Prisma" },
  "cap:kv-queues-cron": { href: "/capabilities/kv-queues-cron/", label: "KV, queues & cron" },
  "cap:telemetry": { href: "/capabilities/telemetry/", label: "Telemetry & logging" },
  "cap:auth": { href: "/capabilities/auth/", label: "Authentication" },
  "cap:fresh-ui": { href: "/capabilities/fresh-ui/", label: "Fresh UI & design" },
  "cap:index": { href: "/capabilities/", label: "Capabilities" },

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

  // ─── Tutorials (tut:) ──────────────────────────────────────────────────────
  "tut:index": { href: "/tutorials/", label: "Tutorials" },
  "tut:first-workspace": { href: "/tutorials/first-workspace/", label: "Your first workspace" },
  "tut:build-a-service": { href: "/tutorials/build-a-service/", label: "Build a service" },
  "tut:background-jobs": { href: "/tutorials/background-jobs/", label: "Add background jobs" },
  "tut:durable-workflow": { href: "/tutorials/durable-workflow/", label: "A durable workflow" },
  "tut:ingest-webhook": { href: "/tutorials/ingest-webhook/", label: "Ingest a webhook" },

  // ─── Explanation essays (explain:) ─────────────────────────────────────────
  "explain:index": { href: "/explanation/", label: "Explanation" },
  "explain:architecture": { href: "/explanation/architecture/", label: "Architecture" },
  "explain:contracts": { href: "/explanation/contracts/", label: "Contracts & type flow" },
  "explain:plugin-model": { href: "/explanation/plugin-model/", label: "The plugin model" },
  "explain:auth-model": { href: "/explanation/auth-model/", label: "Auth model" },
  "explain:durable-workflows": { href: "/explanation/durable-workflows/", label: "Durable workflows" },
  "explain:observability": { href: "/explanation/observability/", label: "Observability" },
  "explain:aspire": { href: "/explanation/aspire/", label: "Orchestration with Aspire" },

  // ─── Concept / mental-model pages (concept:) ───────────────────────────────
  "concept:contracts": { href: "/explanation/contracts/", label: "Contracts-first" },

  // ─── Front door (start-here surfaces, reachable as concepts) ───────────────
  "concept:quickstart": { href: "/quickstart/", label: "Quickstart" },
  "concept:why": { href: "/why/", label: "Why NetScript" },
  "concept:home": { href: "/", label: "Home" },

  // ─── CLI + glossary (cli: / glossary:) ─────────────────────────────────────
  "cli:reference": { href: "/cli-reference/", label: "CLI reference" },
  "glossary:": { href: "/glossary/", label: "Glossary" },

  // ─── Reference index + the 22 generated units (ref:) ───────────────────────
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
