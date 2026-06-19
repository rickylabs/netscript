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
    ],
  },
  {
    label: "Learn",
    items: [
      { href: "/tutorials/", label: "Tutorials", icon: "T" },
      { href: "/how-to/", label: "How-to guides", icon: "H" },
      { href: "/explanation/", label: "Explanation", icon: "E" },
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
];
