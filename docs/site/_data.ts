/**
 * Site-wide data shared by every page (Lume merges `_data.*` into page data).
 *
 * `navLanes` is the docs-v5 sidebar spine (see `_plan/10-nav-ia-redesign.md`):
 * five curated lanes — Start · Learn · Build · Reference · Concepts — rendered
 * in `_includes/layouts/base.vto`. Lane order, the Start links, and the
 * nine-pillar Build sequence are the ONLY hand-maintained nav data; everything
 * below a lane is folder-derived via the Lume nav plugin (`nav.menu()`), sorted
 * by `order` front matter with `basename` as the tiebreak and filtered by
 * `nav_hide!=true isRedirect!=true`.
 *
 * Reference URLs stay stable and are folder-derived from `reference/` — there
 * is no hand-maintained unit list anymore (the xref `ref:` keys live in
 * `_data/xref.ts`).
 */

import cliPackageJson from "../../packages/cli/deno.json" with { type: "json" };

/**
 * Default nav sort weight, cascaded to every page (front matter overrides).
 * A defined numeric `order` everywhere keeps the `"order url"` nav sort
 * comparator consistent — with undefined values the multi-field sort is
 * unstable and lanes render in load order (observed on /reference/).
 * Pages without an explicit order (reference units, tutorial chapters) sort
 * by their url tiebreak alone (index pages share basename "index", so url is the reliable per-segment tiebreak).
 */
export const order = 0;

/** Current aligned NetScript release train version. */
export const releaseVersion: string = cliPackageJson.version;

/** Exact JSR suffix for current NetScript release train examples. */
export const releaseSpecifier: string = `@${releaseVersion}`;

export interface NavLaneLink {
  href: string;
  label: string;
}

export interface NavLane {
  label: string;
  /** One-line intent gloss rendered under the lane header. */
  subtitle: string;
  kind: "flat" | "menu";
  /** kind "flat": curated links rendered as-is (Start lane). */
  items?: NavLaneLink[];
  /** kind "menu": nav.menu() roots rendered as subtrees, in curated order. */
  roots?: string[];
  /**
   * kind "menu" only: render the root as a plain link followed by its children
   * at lane level (Learn/Reference/Concepts) instead of one collapsible branch
   * per root (Build, where each pillar root IS the branch).
   */
  expandRoot?: boolean;
}

export const navLanes: NavLane[] = [
  {
    label: "Start",
    subtitle: "Get running in minutes",
    kind: "flat",
    items: [
      { href: "/why/", label: "Why NetScript" },
      { href: "/quickstart/", label: "Quickstart" },
      { href: "/concepts/", label: "Core concepts" },
      { href: "/cli-reference/", label: "CLI reference" },
      { href: "/glossary/", label: "Glossary" },
      { href: "/how-to/", label: "All recipes" },
    ],
  },
  {
    label: "Learn",
    subtitle: "Build one thing end to end",
    kind: "menu",
    roots: ["/tutorials/"],
    expandRoot: true,
  },
  {
    label: "Build",
    subtitle: "Add a capability to your app",
    kind: "menu",
    roots: [
      "/web-layer/",
      "/services-sdk/",
      "/background-processing/",
      "/durable-workflows/",
      "/ai/",
      "/data-persistence/",
      "/identity-access/",
      "/orchestration-runtime/",
      "/observability/",
    ],
  },
  {
    label: "Reference",
    subtitle: "Every symbol, generated",
    kind: "menu",
    roots: ["/reference/"],
    expandRoot: true,
  },
  {
    label: "Concepts",
    subtitle: "How and why it works",
    kind: "menu",
    roots: ["/explanation/"],
    expandRoot: true,
  },
];

/** nav.menu()/nav.breadcrumb() query — one definition so templates agree. */
export const navQuery = "nav_hide!=true isRedirect!=true";

/** nav.menu() sort — `order` front matter first, url as tiebreak. */
export const navSort = "order url";
