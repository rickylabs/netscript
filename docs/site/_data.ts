/**
 * Site-wide data shared by every page (Lume merges `_data.*` into page data).
 *
 * `navSections` drives the SidebarShell navigation rendered in
 * `_includes/layouts/base.vto`. Docs-v4 uses the locked Capability-Hub IA:
 * shallow START entries, eight product-area pillars with uniform
 * Overview/Quickstart/How-To/Reference leaves, then Tutorials, Explanation,
 * and a thin global Reference index.
 *
 * Reference URLs stay stable. The four `*-core` internal packages remain folded
 * inside reference prose unless they already have generated reference units.
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
 * Reference units (28). The href is the section-root URL; `url` Lume filter
 * applies the /netscript/ base path at render time.
 */
const referenceUnits: NavItem[] = [
  { href: "/reference/auth/", label: "auth", icon: "A" },
  { href: "/reference/auth-better-auth/", label: "auth-better-auth", icon: "A" },
  { href: "/reference/auth-kv-oauth/", label: "auth-kv-oauth", icon: "A" },
  { href: "/reference/auth-workos/", label: "auth-workos", icon: "A" },
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
  { href: "/reference/plugin-auth/", label: "plugin-auth", icon: "P" },
  { href: "/reference/plugin-auth-core/", label: "plugin-auth-core", icon: "P" },
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
    label: "Start",
    items: [
      { href: "/why/", label: "Why NetScript", icon: "?" },
      { href: "/quickstart/", label: "Quickstart", icon: ">" },
      { href: "/concepts/", label: "Architecture overview", icon: "A" },
      { href: "/glossary/", label: "Glossary", icon: "G" },
    ],
  },
  {
    label: "Web Layer",
    items: [
      { href: "/web-layer/", label: "Overview & Concepts", icon: "O" },
      { href: "/tutorials/live-dashboard/", label: "Quickstart: live dashboard", icon: "Q" },
      { href: "/how-to/customize-fresh-ui/", label: "How-To: customize Fresh UI", icon: "H" },
      { href: "/how-to/build-a-server-validated-form/", label: "How-To: server-validated form", icon: "H" },
      { href: "/web-layer/server/", label: "API: server & islands", icon: "R" },
      { href: "/web-layer/builders/", label: "API: pages & builders", icon: "R" },
      { href: "/web-layer/route/", label: "API: route contracts", icon: "R" },
      { href: "/web-layer/query/", label: "API: data loading & cache", icon: "R" },
      { href: "/web-layer/form/", label: "API: forms & validation", icon: "R" },
      { href: "/web-layer/defer-streaming-ui/", label: "API: defer & streaming UI", icon: "R" },
      { href: "/web-layer/interactive/", label: "API: interactive islands", icon: "R" },
      { href: "/web-layer/vite/", label: "API: build & Vite", icon: "R" },
      { href: "/web-layer/error/", label: "API: errors & diagnostics", icon: "R" },
      { href: "/web-layer/testing/", label: "API: testing pages & islands", icon: "R" },
      { href: "/web-layer/examples/", label: "Examples / sandbox", icon: "E" },
      { href: "/reference/fresh/", label: "Reference: fresh", icon: "R" },
      { href: "/reference/fresh-ui/", label: "Reference: fresh-ui", icon: "R" },
    ],
  },
  {
    label: "Services & SDK",
    items: [
      { href: "/services-sdk/", label: "Overview & Concepts", icon: "O" },
      { href: "/tutorials/storefront/02-catalog-service/", label: "Quickstart: define a service", icon: "Q" },
      { href: "/how-to/add-a-service/", label: "How-To: add a service", icon: "H" },
      { href: "/how-to/discover-services/", label: "How-To: discover services", icon: "H" },
      { href: "/how-to/expose-openapi-scalar/", label: "How-To: OpenAPI & Scalar", icon: "H" },
      { href: "/reference/service/", label: "Reference: service", icon: "R" },
      { href: "/reference/sdk/", label: "Reference: sdk", icon: "R" },
      { href: "/reference/contracts/", label: "Reference: contracts", icon: "R" },
    ],
  },
  {
    label: "Background Processing",
    items: [
      { href: "/background-processing/", label: "Overview & Concepts", icon: "O" },
      { href: "/tutorials/erp-sync/03-polyglot-transform/", label: "Quickstart: polyglot task", icon: "Q" },
      { href: "/how-to/queue-kv-cron/", label: "How-To: queue / KV / cron", icon: "H" },
      { href: "/how-to/choose-a-queue-provider/", label: "How-To: choose a queue provider", icon: "H" },
      { href: "/how-to/tune-worker-runtime/", label: "How-To: tune worker runtime", icon: "H" },
      { href: "/how-to/run-a-polyglot-task/", label: "How-To: run a polyglot task", icon: "H" },
      { href: "/how-to/add-a-task-runtime-adapter/", label: "How-To: add a task adapter", icon: "H" },
      { href: "/how-to/restrict-worker-task-permissions/", label: "How-To: restrict task permissions", icon: "H" },
      { href: "/reference/workers/", label: "Reference: workers", icon: "R" },
      { href: "/reference/queue/", label: "Reference: queue", icon: "R" },
      { href: "/reference/cron/", label: "Reference: cron", icon: "R" },
      { href: "/reference/watchers/", label: "Reference: watchers", icon: "R" },
    ],
  },
  {
    label: "Durable Workflows",
    items: [
      { href: "/durable-workflows/", label: "Overview & Concepts", icon: "O" },
      { href: "/tutorials/storefront/04-checkout-saga/", label: "Quickstart: checkout saga", icon: "Q" },
      { href: "/how-to/build-a-validated-ingestion-queue/", label: "How-To: validated ingestion queue", icon: "H" },
      { href: "/how-to/publish-a-durable-stream/", label: "How-To: publish a durable stream", icon: "H" },
      { href: "/reference/sagas/", label: "Reference: sagas", icon: "R" },
      { href: "/reference/triggers/", label: "Reference: triggers", icon: "R" },
      { href: "/reference/streams/", label: "Reference: streams", icon: "R" },
    ],
  },
  {
    label: "Data & Persistence",
    items: [
      { href: "/data-persistence/", label: "Overview & Concepts", icon: "O" },
      { href: "/tutorials/storefront/03-cart-contracts/", label: "Quickstart: data contracts", icon: "Q" },
      { href: "/how-to/database-migration/", label: "How-To: database & migration", icon: "H" },
      { href: "/how-to/use-a-second-database/", label: "How-To: second database", icon: "H" },
      { href: "/reference/database/", label: "Reference: database", icon: "R" },
      { href: "/reference/kv/", label: "Reference: kv", icon: "R" },
      { href: "/reference/prisma-adapter-mysql/", label: "Reference: prisma-adapter-mysql", icon: "R" },
    ],
  },
  {
    label: "Identity & Access",
    items: [
      { href: "/identity-access/", label: "Overview & Concepts", icon: "O" },
      { href: "/tutorials/workspace/02-auth/", label: "Quickstart: workspace auth", icon: "Q" },
      { href: "/how-to/add-authentication/", label: "How-To: add authentication", icon: "H" },
      { href: "/identity-access/better-auth-plugins/", label: "How-To: better-auth plugins", icon: "H" },
      { href: "/reference/auth/", label: "Reference: auth", icon: "R" },
      { href: "/reference/auth-better-auth/", label: "Reference: auth-better-auth", icon: "R" },
      { href: "/reference/auth-kv-oauth/", label: "Reference: auth-kv-oauth", icon: "R" },
      { href: "/reference/auth-workos/", label: "Reference: auth-workos", icon: "R" },
      { href: "/reference/plugin-auth/", label: "Reference: plugin-auth", icon: "R" },
      { href: "/reference/plugin-auth-core/", label: "Reference: plugin-auth-core", icon: "R" },
    ],
  },
  {
    label: "Orchestration & Runtime",
    items: [
      { href: "/orchestration-runtime/", label: "Overview & Concepts", icon: "O" },
      { href: "/quickstart/", label: "Quickstart: run the workspace", icon: "Q" },
      { href: "/how-to/deploy-local-aspire/", label: "How-To: deploy locally with Aspire", icon: "H" },
      { href: "/how-to/deploy/", label: "How-To: deploy", icon: "H" },
      { href: "/how-to/roll-out-runtime-overrides/", label: "How-To: runtime overrides", icon: "H" },
      { href: "/how-to/graceful-shutdown/", label: "How-To: graceful shutdown", icon: "H" },
      { href: "/how-to/add-a-plugin/", label: "How-To: add a plugin", icon: "H" },
      { href: "/how-to/author-a-plugin/", label: "How-To: author a plugin", icon: "H" },
      { href: "/reference/aspire/", label: "Reference: aspire", icon: "R" },
      { href: "/reference/config/", label: "Reference: config", icon: "R" },
      { href: "/reference/runtime-config/", label: "Reference: runtime-config", icon: "R" },
      { href: "/reference/plugin/", label: "Reference: plugin", icon: "R" },
      { href: "/reference/cli/", label: "Reference: cli", icon: "R" },
    ],
  },
  {
    label: "Observability",
    items: [
      { href: "/observability/", label: "Overview & Concepts", icon: "O" },
      { href: "/concepts/", label: "Quickstart: trace the model", icon: "Q" },
      { href: "/how-to/add-opentelemetry/", label: "How-To: add OpenTelemetry", icon: "H" },
      { href: "/reference/telemetry/", label: "Reference: telemetry", icon: "R" },
      { href: "/reference/logger/", label: "Reference: logger", icon: "R" },
    ],
  },
  {
    label: "Tutorials",
    items: [
      { href: "/tutorials/", label: "Tutorials index", icon: "T" },
      { href: "/tutorials/live-dashboard/", label: "Live dashboard", icon: "T" },
      { href: "/tutorials/workspace/", label: "Workspace", icon: "T" },
      { href: "/tutorials/storefront/", label: "Storefront", icon: "T" },
      { href: "/tutorials/erp-sync/", label: "ERP sync", icon: "T" },
    ],
  },
  {
    label: "Explanation",
    items: [
      { href: "/explanation/", label: "Explanation index", icon: "E" },
      { href: "/explanation/architecture/", label: "Architecture", icon: "E" },
      { href: "/explanation/contracts/", label: "Contracts & type flow", icon: "E" },
      { href: "/explanation/plugin-system/", label: "The plugin system", icon: "E" },
      { href: "/explanation/auth-model/", label: "Auth model", icon: "E" },
      { href: "/explanation/durability-model/", label: "Durability model", icon: "E" },
      { href: "/explanation/observability/", label: "Observability", icon: "E" },
      { href: "/explanation/aspire/", label: "Orchestration with Aspire", icon: "E" },
    ],
  },
  {
    label: "Reference",
    items: [
      { href: "/reference/", label: "Reference index", icon: "R" },
      ...referenceUnits,
    ],
  },
];
