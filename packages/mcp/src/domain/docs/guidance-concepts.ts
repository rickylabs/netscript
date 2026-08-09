/** Finite vocabulary bridge between task language and NetScript documentation terms. */
export interface GuidanceConcept {
  /** Stable concept identifier. */
  readonly name: string;
  /** Natural-language phrases that activate the concept. */
  readonly aliases: readonly string[];
  /** Documentation terms contributed to section retrieval. */
  readonly terms: readonly string[];
  /** At least one corpus term required before this concept can seed a section. */
  readonly requiredAnyTerms: readonly string[];
  /** Ordered semantic heading routes preferred before ordinary ranked matches. */
  readonly routeHints: readonly GuidanceRouteHint[];
}

/** Corpus-neutral heading/title signature for one ordered intent step. */
export interface GuidanceRouteHint {
  readonly heading: string;
  readonly title?: string;
}

/** Curated general concepts used by the deterministic offline guidance index. */
export const GUIDANCE_CONCEPTS: readonly GuidanceConcept[] = Object.freeze([
  {
    name: 'validated-form',
    aliases: [
      'validated form',
      'validated route-bound form',
      'form validation',
      'route bound form',
      'server validated',
    ],
    terms: [
      'form',
      'validated',
      'define',
      'building',
      'page',
      'authoring',
      'generated',
      'binding',
    ],
    requiredAnyTerms: ['form'],
    routeHints: [
      { heading: 'define the form' },
      { heading: 'building a page' },
      { heading: 'three authoring forms, one generated binding' },
    ],
  },
  {
    name: 'cache-freshness',
    aliases: [
      'without polling',
      'keep data fresh',
      'cache first',
      'live data',
      'server data fresh',
      'every render',
      'every request',
      'request on each render',
      'refetch on render',
    ],
    terms: [
      'cache',
      'first',
      'load',
      'pattern',
      'factory',
      'pipeline',
      'revalidate',
      'background',
      'resource',
    ],
    requiredAnyTerms: ['cache'],
    routeHints: [
      { heading: 'a cache-first load pattern' },
      { heading: 'step 2 — add the cache-first query factory' },
      { heading: 'step 2 — define the page and cache-first resource pipeline' },
    ],
  },
  {
    name: 'getting-started',
    aliases: [
      'new netscript project',
      'create a new project',
      'from scratch',
      'start a netscript project',
    ],
    terms: [
      'getting',
      'started',
      'quickstart',
      'scaffold',
      'create',
      'project',
      'netscript',
      'init',
    ],
    requiredAnyTerms: ['quickstart', 'scaffold'],
    routeHints: [{ heading: 'getting started' }],
  },
  {
    name: 'extension-plugin',
    aliases: ['does not ship', 'add a capability', 'custom capability', 'author a plugin'],
    terms: ['plugin', 'before', 'start', 'thin', 'layer', 'core', 'step', 'scaffold', 'skeleton'],
    requiredAnyTerms: ['plugin'],
    routeHints: [
      { heading: 'before you start' },
      { heading: 'a plugin is a thin layer over a core package' },
      { heading: 'step 1 — scaffold the two-tier skeleton' },
    ],
  },
  {
    name: 'application-database',
    aliases: [
      'prisma supported database',
      'database netscript does not wrap',
      'second database',
      'unsupported driver',
    ],
    terms: [
      'prisma',
      'unsupported',
      'libsql',
      'turso',
      'application',
      'owned',
      'responsibilities',
      'decision',
      'direct',
      'reusable',
      'databaseadapter',
      'wrapper',
    ],
    requiredAnyTerms: ['prisma'],
    routeHints: [
      { heading: 'unsupported by netscript, supported by prisma (libsql / turso example)' },
      { heading: '3. application-owned responsibilities' },
      { heading: '4. decision rule: direct use vs. reusable databaseadapter wrapper' },
    ],
  },
  {
    name: 'service-backed-ui',
    aliases: [
      'service backed ui',
      'build a real service-backed ui',
      'real service ui',
      'build a real ui',
      'full stack ui',
    ],
    terms: ['task', 'router', 'what', 'will', 'build', 'service', 'backed', 'ui', 'dashboard'],
    requiredAnyTerms: ['dashboard'],
    routeHints: [
      { heading: 'task router' },
      { heading: 'what you will build', title: 'the page builder and the query island' },
      { heading: 'what you will build', title: 'sdk client and cache-first query' },
    ],
  },
]);
