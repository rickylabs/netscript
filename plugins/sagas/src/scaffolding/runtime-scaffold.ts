/** Runtime registry generator metadata copied into `scaffold.runtime.json`. */
export interface SagasRuntimeRegistryGenerator {
  /** Plugin-relative generator script. */
  readonly command: string;
  /** Generator arguments passed by the scaffold host. */
  readonly args: readonly string[];
}

/** Runtime registry target metadata for saga-owned registry generation. */
export interface SagasRuntimeRegistryTarget {
  /** Registry generator kind. */
  readonly kind: 'map';
  /** Project-relative saga source directory. */
  readonly dir: string;
  /** File suffixes considered saga definition modules. */
  readonly fileSuffixes: readonly string[];
  /** File names excluded from registry generation. */
  readonly exclude: readonly string[];
  /** Property used as the registry key. */
  readonly registryKey: string;
  /** Prefix used by generated import variables. */
  readonly varPrefix: string;
  /** Type imported by generated registries. */
  readonly typeImport: Readonly<{
    readonly name: string;
    readonly from: string;
  }>;
}

/** Sagas runtime scaffold manifest shape. */
export interface SagasRuntimeScaffoldManifest {
  /** Manifest schema version. */
  readonly schemaVersion: 1;
  /** Generator script invoked by scaffold orchestration. */
  readonly runtimeRegistryGenerator: SagasRuntimeRegistryGenerator;
  /** Saga-owned runtime registry targets. */
  readonly runtimeRegistries: readonly SagasRuntimeRegistryTarget[];
  /** Background sample cleanup rules. */
  readonly backgroundSampleRules: readonly SagasBackgroundSampleRule[];
}

/** Background sample cleanup rule copied into the sagas runtime scaffold manifest. */
export interface SagasBackgroundSampleRule {
  /** Workspace cleaned by scaffold orchestration. */
  readonly workspace: 'sagas';
  /** Managed path matchers. */
  readonly managed: readonly SagasManagedSampleMatcher[];
  /** Sample files retained during cleanup. */
  readonly keep: readonly string[];
}

/** Managed path matcher for sagas background samples. */
export interface SagasManagedSampleMatcher {
  /** Managed file suffix. */
  readonly suffix: '-saga.ts';
}

/** Saga-owned runtime scaffold manifest used by `plugins/sagas/scaffold.runtime.json`. */
export const SAGAS_RUNTIME_SCAFFOLD_MANIFEST: SagasRuntimeScaffoldManifest = Object.freeze({
  schemaVersion: 1,
  runtimeRegistryGenerator: Object.freeze({
    command: 'src/cli/generate-runtime-registries.ts',
    args: Object.freeze(['--profile', 'scaffold']),
  }),
  runtimeRegistries: Object.freeze([
    Object.freeze({
      kind: 'map',
      dir: 'sagas',
      fileSuffixes: Object.freeze(['-saga.ts']),
      exclude: Object.freeze(['_registry.ts', 'mod.ts', 'types.ts']),
      registryKey: 'id',
      varPrefix: 'saga',
      typeImport: Object.freeze({
        name: 'SagaDefinition',
        from: '@netscript/plugin-sagas-core/domain',
      }),
    }),
  ]),
  backgroundSampleRules: Object.freeze([
    Object.freeze({
      workspace: 'sagas',
      managed: Object.freeze([Object.freeze({ suffix: '-saga.ts' })]),
      keep: Object.freeze(['user-registration-saga.ts']),
    }),
  ]),
});
