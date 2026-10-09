/**
 * Pins the published cache-first loader contract (#1670) to the pages that teach it.
 *
 * Every page that shows a `getCachedEntry()` loader either runs the callable action first
 * (action-then-metadata) or states why a bare metadata read is right there. The SDK guide states the
 * warm-stale persistence-failure shape and carries a compiled example of both return shapes.
 */

import { extractFencedBlocks } from './snippet-extractor.ts';
import { TIER_1_PAGES } from './snippet-policy.ts';

/** A loader surface that composes the callable action before the metadata read. */
export interface ActionThenMetadataSurface {
  readonly shape: 'action-then-metadata';
  readonly path: string;
  readonly action: string;
  readonly metadata: string;
}

/** A loader surface that keeps a bare metadata read and states why. */
export interface BareReadSurface {
  readonly shape: 'bare-read';
  readonly path: string;
  readonly rationale: readonly string[];
  readonly forbidden: readonly string[];
}

/** One published cache-first loader surface and the decision it must keep. */
export type CacheFirstLoaderSurface = ActionThenMetadataSurface | BareReadSurface;

/** Site-relative source paths, matching the snippet gate's Tier-1 page names. */
export const CACHE_FIRST_LOADER_SURFACES: readonly CacheFirstLoaderSurface[] = [
  {
    shape: 'action-then-metadata',
    path: 'index.vto',
    action: 'await usersQueries.list(input, { preferFreshOnStale: true })',
    metadata: 'await usersQueries.list.getCachedEntry(input)',
  },
  {
    shape: 'bare-read',
    path: 'tutorials/live-dashboard/04-definePage-QueryIsland.md',
    rationale: [
      "`ordersData` is a bare `getCachedEntry()` read, not chapter 3's action-then-metadata loader",
      "it awaits the island's `dehydratedQuery` prefetch, which runs that action",
    ],
    forbidden: ['first paint never waits'],
  },
  {
    shape: 'bare-read',
    path: 'web-layer/layers.md',
    rationale: [
      'The loader is a bare metadata read, not the',
      'A layer with no `partial` has no such path; give it the action-then-metadata loader instead.',
    ],
    forbidden: [],
  },
];

/** The SDK guide section that states the warm-stale persistence-failure return shape. */
export const WARM_STALE_CAVEAT = {
  path: 'services-sdk/sdk.md',
  heading: '### When a stale refresh cannot persist',
  statements: [
    'the KV write fails, the action still returns the fetched `data`, and KV keeps the older entry.',
    'The returned `data` and `cachedAt` always describe the same persisted value',
    'needs the freshest value rather than a consistent pair returns `data` itself.',
  ],
  exampleExports: [
    'export async function loadPersistedOrders(',
    'export async function loadFreshestOrders(',
  ],
} as const;

/** Every site-relative page the check reads. */
export const CACHE_FIRST_LOADER_DOC_PATHS: readonly string[] = [
  ...CACHE_FIRST_LOADER_SURFACES.map((surface) => surface.path),
  WARM_STALE_CAVEAT.path,
];

/** Collapse whitespace so prose rewrapping does not break a marker match. */
function flatten(text: string): string {
  return text.replace(/\s+/g, ' ');
}

function checkSurface(surface: CacheFirstLoaderSurface, source: string): string[] {
  if (surface.shape === 'action-then-metadata') {
    const action = source.indexOf(surface.action);
    const metadata = source.indexOf(surface.metadata);
    if (action < 0) return [`${surface.path}: loader does not run ${surface.action}`];
    if (metadata < 0) return [`${surface.path}: loader does not read ${surface.metadata}`];
    return action < metadata
      ? []
      : [`${surface.path}: metadata read precedes the callable action; use action-then-metadata`];
  }
  const prose = flatten(source);
  return [
    ...surface.rationale
      .filter((needle) => !prose.includes(needle))
      .map((needle) =>
        `${surface.path}: bare read lacks its stated reason ${JSON.stringify(needle)}`
      ),
    ...surface.forbidden
      .filter((needle) => prose.includes(needle))
      .map((needle) => `${surface.path}: contains retracted claim ${JSON.stringify(needle)}`),
  ];
}

function checkWarmStaleCaveat(source: string): string[] {
  const { path, heading, statements, exampleExports } = WARM_STALE_CAVEAT;
  const start = source.indexOf(`\n${heading}\n`);
  if (start < 0) return [`${path}: missing warm-stale caveat section ${JSON.stringify(heading)}`];
  const next = source.slice(start + heading.length + 2).search(/^#{2,3} /m);
  const section = next < 0
    ? source.slice(start)
    : source.slice(start, start + heading.length + 2 + next);

  const prose = flatten(section);
  const problems = statements
    .filter((needle) => !prose.includes(needle))
    .map((needle) => `${path}: warm-stale caveat lacks ${JSON.stringify(needle)}`);
  const example = extractFencedBlocks(section, path).find((block) =>
    exampleExports.every((name) => block.body.includes(name))
  );
  if (!example) {
    problems.push(`${path}: warm-stale caveat lacks its persisted/freshest example fence`);
  } else if (example.checkedLanguage === undefined || example.exemptionReason !== undefined) {
    problems.push(`${path}: warm-stale example must be a compiled ts fence, not exempt`);
  }
  if (!(TIER_1_PAGES as readonly string[]).includes(path)) {
    problems.push(`${path}: not a Tier-1 snippet page, so docs:snippets would not compile it`);
  }
  return problems;
}

/**
 * Check the cache-first loader surfaces and the warm-stale caveat.
 *
 * @param sources Page source keyed by site-relative path; every registered path must be present.
 * @returns The number of pages checked.
 */
export function checkCacheFirstLoaderDocs(sources: Readonly<Record<string, string>>): number {
  const problems: string[] = [];
  for (const path of CACHE_FIRST_LOADER_DOC_PATHS) {
    if (sources[path] === undefined) problems.push(`${path}: page source missing`);
  }
  if (problems.length === 0) {
    for (const surface of CACHE_FIRST_LOADER_SURFACES) {
      problems.push(...checkSurface(surface, sources[surface.path]));
    }
    problems.push(...checkWarmStaleCaveat(sources[WARM_STALE_CAVEAT.path]));
  }
  if (problems.length > 0) {
    throw new Error(`cache-first loader docs (#1670):\n  ${problems.join('\n  ')}`);
  }
  return CACHE_FIRST_LOADER_DOC_PATHS.length;
}
