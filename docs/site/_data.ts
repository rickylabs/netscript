/**
 * Site-wide data shared by every page (Lume merges `_data.*` into page data).
 *
 * `navSections` drives the SidebarShell navigation rendered in
 * `_includes/layouts/base.vto`. The top groups use plain-English labels (the
 * approachable ladder) while Reference stays expanded to the 22 primary units.
 * The four `*-core` internal packages stay folded inside the reference prose
 * (US-8) and are intentionally NOT sidebar entries.
 *
 * Every href below resolves to a page that exists after the 0a authoring wave:
 * `/`, `/quickstart/`, `/why/`, `/tutorials/`, `/how-to/`, `/explanation/`,
 * `/reference/`, and the 22 reference-unit hrefs. Capability hubs, concept
 * pages, tutorial sub-pages, and a glossary land in later phases and are
 * deliberately omitted here so the 0a chrome preview never 404s.
 */

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

/**
 * Reference units (22). The href is the section-root URL; `url` Lume filter
 * applies the /netscript/ base path at render time.
 */
const referenceUnits: NavItem[] = [
  { href: "/reference/aspire/", label: "aspire", icon: "A" },
  { href: "/reference/cli/", label: "cli", icon: "C" },
  { href: "/reference/config/", label: "config", icon: "C" },
  { href: "/reference/contracts/", label: "contracts", icon: "C" },
  { href: "/reference/cron/", label: "cron", icon: "C" },
  { href: "/reference/database/", label: "database", icon: "D" },
  { href: "/reference/fresh/", label: "fresh", icon: "F" },
  { href: "/reference/fresh-ui/", label: "fresh-ui", icon: "F" },
  { href: "/reference/kv/", label: "kv", icon: "K" },
  { href: "/reference/logger/", label: "logger", icon: "L" },
  { href: "/reference/plugin/", label: "plugin", icon: "P" },
  { href: "/reference/prisma-adapter-mysql/", label: "prisma-adapter-mysql", icon: "P" },
  { href: "/reference/queue/", label: "queue", icon: "Q" },
  { href: "/reference/runtime-config/", label: "runtime-config", icon: "R" },
  { href: "/reference/sagas/", label: "sagas", icon: "S" },
  { href: "/reference/sdk/", label: "sdk", icon: "S" },
  { href: "/reference/service/", label: "service", icon: "S" },
  { href: "/reference/streams/", label: "streams", icon: "S" },
  { href: "/reference/telemetry/", label: "telemetry", icon: "T" },
  { href: "/reference/triggers/", label: "triggers", icon: "T" },
  { href: "/reference/watchers/", label: "watchers", icon: "W" },
  { href: "/reference/workers/", label: "workers", icon: "W" },
];

export const navSections: NavSection[] = [
  {
    label: "Start here",
    items: [
      { href: "/", label: "Home", icon: "\u25EB" },
      { href: "/quickstart/", label: "Quickstart", icon: "\u25B8" },
      { href: "/why/", label: "Why NetScript", icon: "\u25C8" },
      { href: "/concepts/", label: "Core concepts", icon: "\u25C7" },
    ],
  },
  {
    // Tutorials \u2014 learning-oriented ladder. Zone index first so deeper pages
    // win the breadcrumb's deepest-prefix match.
    label: "Learn",
    items: [
      { href: "/tutorials/", label: "Tutorials", icon: "T" },
      { href: "/tutorials/storefront/", label: "Storefront", icon: "\u00B7" },
      { href: "/tutorials/workspace/", label: "Team Workspace", icon: "\u00B7" },
      { href: "/tutorials/erp-sync/", label: "ERP Sync", icon: "\u00B7" },
      { href: "/tutorials/live-dashboard/", label: "Live Dashboard", icon: "\u00B7" },
    ],
  },
  {
    label: "How-to guides",
    items: [
      { href: "/how-to/", label: "How-to guides", icon: "H" },
      { href: "/how-to/add-a-plugin/", label: "Add a plugin", icon: "\u00B7" },
      { href: "/how-to/add-a-service/", label: "Add a service", icon: "\u00B7" },
      { href: "/how-to/add-authentication/", label: "Add authentication", icon: "\u00B7" },
      { href: "/how-to/database-migration/", label: "Database & migration", icon: "\u00B7" },
      { href: "/how-to/queue-kv-cron/", label: "Queue / KV / cron", icon: "\u00B7" },
      { href: "/how-to/add-opentelemetry/", label: "Add OpenTelemetry", icon: "\u00B7" },
      { href: "/how-to/customize-fresh-ui/", label: "Customize Fresh UI", icon: "\u00B7" },
      { href: "/how-to/deploy/", label: "Deploy", icon: "\u00B7" },
      { href: "/how-to/author-a-plugin/", label: "Author a plugin", icon: "\u00B7" },
      { href: "/how-to/discover-services/", label: "Discover services", icon: "\u00B7" },
      { href: "/how-to/expose-openapi-scalar/", label: "Expose OpenAPI & Scalar", icon: "\u00B7" },
      { href: "/how-to/use-a-second-database/", label: "Use a second database", icon: "\u00B7" },
      { href: "/how-to/choose-a-queue-provider/", label: "Choose a queue provider", icon: "\u00B7" },
      { href: "/how-to/tune-worker-runtime/", label: "Tune the worker runtime", icon: "\u00B7" },
      { href: "/how-to/run-a-polyglot-task/", label: "Run a polyglot task", icon: "\u00B7" },
      { href: "/how-to/graceful-shutdown/", label: "Graceful shutdown", icon: "\u00B7" },
      { href: "/how-to/deploy-local-aspire/", label: "Deploy locally with Aspire", icon: "\u00B7" },
    ],
  },
  {
    label: "Core concepts",
    items: [
      { href: "/explanation/", label: "Explanation", icon: "E" },
      { href: "/explanation/architecture/", label: "Architecture", icon: "\u00B7" },
      { href: "/explanation/contracts/", label: "Contracts & type flow", icon: "\u00B7" },
      { href: "/explanation/plugin-system/", label: "The plugin system", icon: "·" },
      { href: "/explanation/auth-model/", label: "Auth model", icon: "\u00B7" },
      { href: "/explanation/durability-model/", label: "Durability model", icon: "·" },
      { href: "/explanation/observability/", label: "Observability", icon: "\u00B7" },
      { href: "/explanation/aspire/", label: "Orchestration with Aspire", icon: "\u00B7" },
    ],
  },
  {
    label: "Capabilities",
    items: [
      { href: "/capabilities/", label: "Capabilities", icon: "\u25C9" },
      { href: "/capabilities/services/", label: "Services & contracts", icon: "\u00B7" },
      { href: "/capabilities/background-jobs/", label: "Background jobs", icon: "\u00B7" },
      { href: "/capabilities/durable-sagas/", label: "Durable sagas", icon: "\u00B7" },
      { href: "/capabilities/triggers/", label: "Triggers & ingress", icon: "\u00B7" },
      { href: "/capabilities/streams/", label: "Durable streams", icon: "\u00B7" },
      { href: "/capabilities/database/", label: "Database & Prisma", icon: "\u00B7" },
      { href: "/capabilities/kv-queues-cron/", label: "KV, queues & cron", icon: "\u00B7" },
      { href: "/capabilities/telemetry/", label: "Telemetry & logging", icon: "\u00B7" },
      { href: "/capabilities/auth/", label: "Authentication", icon: "\u00B7" },
      { href: "/capabilities/fresh-ui/", label: "Fresh UI & design", icon: "\u00B7" },
      { href: "/capabilities/fresh-framework/", label: "Fresh meta-framework", icon: "\u00B7" },
      { href: "/capabilities/sdk/", label: "Typed SDK & client", icon: "\u00B7" },
      { href: "/capabilities/polyglot-tasks/", label: "Polyglot tasks", icon: "\u00B7" },
      { href: "/capabilities/runtime-config/", label: "Runtime configuration", icon: "\u00B7" },
    ],
  },
  {
    label: "Reference",
    items: [
      { href: "/reference/", label: "Reference index", icon: "R" },
    ],
  },
  {
    label: "Reference units",
    items: referenceUnits,
  },
  {
    label: "Resources",
    items: [
      { href: "/glossary/", label: "Glossary", icon: "G" },
      { href: "/cli-reference/", label: "CLI reference", icon: "C" },
    ],
  },
];
