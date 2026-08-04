import type {
  ExportSurfaceCorpus,
  ExportSurfaceCorpusPort,
  ExportSurfaceEntry,
} from '../../../mod.ts';

const entries: readonly ExportSurfaceEntry[] = [
  {
    packageName: '@netscript/config',
    subpath: '.',
    symbol: 'defineConfig',
    kind: 'function',
    signature: 'function defineConfig(config: NetScriptConfigInput): NetScriptConfig',
    jsDoc: 'Type-safe configuration definition with validation.',
  },
  {
    packageName: '@netscript/fresh',
    subpath: './builders',
    symbol: 'definePage',
    kind: 'function',
    signature: 'function definePage<TState = EmptyRecord>(): PageRootBuilder<TState>',
    jsDoc: 'Start a new typed page builder chain.',
  },
  {
    packageName: '@netscript/fresh',
    subpath: './builders',
    symbol: 'definePartial',
    kind: 'function',
    signature:
      'function definePartial<TProps extends object, TContext, THandler = undefined>(options: DefinePartialOptions<TProps, TContext, THandler>): DefinedPartialRoute<TContext, THandler>',
    jsDoc: 'Define a framework-owned partial route backed by an async loader.',
  },
  {
    packageName: '@netscript/fresh',
    subpath: './builders',
    symbol: 'defineStatsPartial',
    kind: 'function',
    signature:
      'function defineStatsPartial<TProps extends object, TContext, THandler = undefined>(options: DefineStatsPartialOptions<TProps, TContext, THandler>): DefinedPartialRoute<TContext, THandler>',
    jsDoc: 'Define a stats-only partial route backed by a context-free query function.',
  },
  {
    packageName: '@netscript/fresh-ui',
    subpath: './builder',
    symbol: 'definePage',
    kind: 'function',
    signature: 'function definePage<TState = EmptyRecord>(): DefinePageRootBuilder<TState>',
    jsDoc: 'Start a Fresh UI page builder.',
  },
];

/** Real first-party declarations normalized from Deno 2.9 `deno doc --json` output. */
export const EXPORT_SURFACE_FIXTURE: ExportSurfaceCorpus = {
  schemaVersion: 1,
  frameworkVersion: '0.0.4',
  surfaces: [
    { packageName: '@netscript/config', subpath: '.' },
    { packageName: '@netscript/fresh', subpath: './builders' },
    { packageName: '@netscript/fresh-ui', subpath: './builder' },
  ],
  entries,
};

/** In-memory port for bounded application-flow fixtures. */
export class FixtureExportSurfaceCorpus implements ExportSurfaceCorpusPort {
  /** Return the immutable fixture corpus. */
  load(): Promise<ExportSurfaceCorpus> {
    return Promise.resolve(EXPORT_SURFACE_FIXTURE);
  }
}
