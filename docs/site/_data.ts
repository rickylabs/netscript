/**
 * Site-wide data shared by every page (Lume merges `_data.*` into page data).
 *
 * `navSections` drives the SidebarShell navigation rendered in
 * `_includes/layouts/base.vto`. It mirrors the playground SidebarShell grouped
 * nav: the four Diátaxis sections, with Reference expanded to the 22 primary
 * units. The four `*-core` internal packages stay folded inside the reference
 * prose (US-8) and are intentionally NOT sidebar entries.
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
      { href: "/", label: "Home", icon: "◫" },
    ],
  },
  {
    label: "Diátaxis",
    items: [
      { href: "/tutorials/", label: "Tutorials", icon: "T" },
      { href: "/how-to/", label: "How-to guides", icon: "H" },
      { href: "/reference/", label: "Reference", icon: "R" },
      { href: "/explanation/", label: "Explanation", icon: "E" },
    ],
  },
  {
    label: "Reference units",
    items: referenceUnits,
  },
];
