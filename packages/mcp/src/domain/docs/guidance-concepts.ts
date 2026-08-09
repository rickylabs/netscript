/** Finite vocabulary bridge between task language and NetScript documentation terms. */
export interface GuidanceConcept {
  /** Stable concept identifier. */
  readonly name: string;
  /** Natural-language phrases that activate the concept. */
  readonly aliases: readonly string[];
  /** Documentation terms contributed to section retrieval. */
  readonly terms: readonly string[];
}

/** Curated general concepts used by the deterministic offline guidance index. */
export const GUIDANCE_CONCEPTS: readonly GuidanceConcept[] = Object.freeze([
  {
    name: 'validated-form',
    aliases: ['validated form', 'form validation', 'route bound form', 'server validated'],
    terms: ['form', 'validated', 'validation', 'route', 'binding', 'action', 'schema'],
  },
  {
    name: 'cache-freshness',
    aliases: [
      'without polling',
      'keep data fresh',
      'cache first',
      'live data',
      'server data fresh',
    ],
    terms: ['cache', 'query', 'fresh', 'invalidate', 'signal', 'stream', 'resource'],
  },
  {
    name: 'extension-plugin',
    aliases: ['does not ship', 'add a capability', 'custom capability', 'author a plugin'],
    terms: ['plugin', 'author', 'scaffold', 'core', 'adapter', 'capability', 'package'],
  },
  {
    name: 'application-database',
    aliases: [
      'prisma supported database',
      'database netscript does not wrap',
      'second database',
      'unsupported driver',
    ],
    terms: ['prisma', 'database', 'unsupported', 'driver', 'libsql', 'turso', 'adapter'],
  },
  {
    name: 'service-backed-ui',
    aliases: ['service backed ui', 'real service ui', 'build a real ui', 'full stack ui'],
    terms: ['task', 'router', 'service', 'contract', 'page', 'query', 'island', 'ui'],
  },
]);
