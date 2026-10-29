/**
 * Site-wide data shared by every page (Lume merges `_data.*` into page data).
 *
 * `navLanes` is the sidebar spine: six curated lanes (Start, Learn, Build,
 * Reference, Concepts, Design system), rendered in `_includes/layouts/base.vto`.
 * Lane order, the Start links, the curated Reference extras, and the Build
 * sequence (the `/how-to/` landing, then nine areas) are the ONLY hand-maintained
 * nav data; everything below a lane is folder-derived via the Lume nav plugin
 * (`nav.menu()`), sorted by `order` front matter with the url as the tiebreak and
 * filtered by `nav_hide!=true isRedirect!=true`.
 *
 * Reference URLs stay stable and are folder-derived from `reference/` — there
 * is no hand-maintained unit list anymore (the xref `ref:` keys live in
 * `_data/xref.ts`).
 */

import cliPackageJson from '../../packages/cli/deno.json' with { type: 'json' };

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
  id: 'start' | 'learn' | 'build' | 'reference' | 'concepts' | 'design-system';
  label: string;
  /** Lane landing: top-bar target and the breadcrumb lane crumb's link. */
  href: string;
  /** One-line intent gloss rendered under the lane header. */
  subtitle: string;
  kind: 'flat' | 'menu';
  /** Curated links: the whole lane when flat; rendered after the landing link when menu. */
  items?: NavLaneLink[];
  /** kind "menu": nav.menu() roots rendered as subtrees, in curated order. */
  roots?: string[];
  /**
   * kind "menu" only: the FIRST root renders as the landing link followed by its
   * children at lane level; later roots render as one collapsible branch each.
   */
  expandRoot?: boolean;
  /** nav.menu() sort for this lane; defaults to `navSort`. */
  sort?: string;
}

export const navLanes: NavLane[] = [
  {
    id: 'start',
    label: 'Start',
    href: '/quickstart/',
    subtitle: 'Get running in minutes',
    kind: 'flat',
    items: [
      { href: '/why/', label: 'Why NetScript' },
      { href: '/quickstart/', label: 'Quickstart' },
    ],
  },
  {
    id: 'learn',
    label: 'Learn',
    href: '/tutorials/',
    subtitle: 'Build one thing end to end',
    kind: 'menu',
    roots: ['/tutorials/'],
    expandRoot: true,
  },
  {
    id: 'build',
    label: 'Build',
    href: '/how-to/',
    subtitle: 'Add a capability to your app',
    kind: 'menu',
    roots: [
      '/how-to/',
      '/web-layer/',
      '/services-sdk/',
      '/background-processing/',
      '/durable-workflows/',
      '/ai/',
      '/data-persistence/',
      '/identity-access/',
      '/orchestration-runtime/',
      '/observability/',
    ],
  },
  {
    id: 'reference',
    label: 'Reference',
    href: '/reference/',
    subtitle: 'Every published symbol',
    kind: 'menu',
    roots: ['/reference/'],
    expandRoot: true,
    sort: 'order title',
    items: [
      { href: '/cli-reference/', label: 'CLI cheat sheet' },
      { href: '/glossary/', label: 'Glossary' },
    ],
  },
  {
    id: 'concepts',
    label: 'Concepts',
    href: '/explanation/',
    subtitle: 'How and why it works',
    kind: 'menu',
    roots: ['/explanation/', '/comparisons/'],
    expandRoot: true,
  },
  {
    id: 'design-system',
    label: 'Design system',
    href: '/design-system/',
    subtitle: 'One design grammar, every surface',
    kind: 'menu',
    roots: ['/design-system/'],
    expandRoot: true,
  },
];

/** Choose one lane from the source URL, before the base-path plugin rewrites links. */
export function getDocsLane(url: string): NavLane {
  return navLanes.find((lane) => lane.roots?.some((root) => url.startsWith(root))) ??
    navLanes.find((lane) => lane.items?.some((item) => url.startsWith(item.href))) ??
    navLanes.find((lane) => lane.id === 'start')!;
}

/** Sections whose pager is derived from the sidebar order, scoped to the root. */
export const pagerRoots: string[] = ['/reference/', '/explanation/', '/comparisons/'];

/** nav.menu()/nav.breadcrumb() query — one definition so templates agree. */
export const navQuery = 'nav_hide!=true isRedirect!=true';

/** nav.menu() sort — `order` front matter first, url as tiebreak. */
export const navSort = 'order url';
