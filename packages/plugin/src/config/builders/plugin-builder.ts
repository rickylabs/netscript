import type { BackgroundProcessorContribution } from '../domain/background-processor-contribution.ts';
import type { ContractVersionContribution } from '../domain/contract-version-contribution.ts';
import type { DbSchemaContribution } from '../domain/db-schema-contribution.ts';
import type { E2eContribution } from '../domain/e2e-contribution.ts';
import type { MigrationContribution } from '../domain/migration-contribution.ts';
import type { PluginContributions } from '../domain/plugin-contributions.ts';
import type { PluginDependencies } from '../domain/plugin-dependencies.ts';
import type { PluginLifecycleHooks } from '../domain/plugin-lifecycle-hooks.ts';
import type { PluginType } from '../../domain/mod.ts';
import type { PluginManifest } from '../domain/plugin-manifest.ts';
import type { PluginMetadata } from '../domain/plugin-metadata.ts';
import type { RuntimeConfigTopicContribution } from '../domain/runtime-config-topic-contribution.ts';
import type { ServiceContribution } from '../domain/service-contribution.ts';
import type { StreamTopicContribution } from '../domain/stream-topic-contribution.ts';
import type { TelemetryContribution } from '../domain/telemetry-contribution.ts';
import { PluginManifestSchema } from '../validators/manifest-schema.ts';

/** Dependency context supplied to contribution callback inputs. */
export type DependencyContext<TDependencies extends PluginDependencies> = {
  readonly deps: TDependencies;
};

/** Contribution value or callback resolved by the plugin builder. */
export type ContributionInput<TValue, TDependencies extends PluginDependencies> =
  | TValue
  | ((ctx: DependencyContext<TDependencies>) => TValue);

/** Immutable state accumulated by the plugin builder chain. */
export interface PluginBuilderState<TDependencies extends PluginDependencies> {
  readonly name?: string;
  readonly version?: string;
  readonly description?: string;
  readonly displayName?: string;
  readonly type?: PluginType;
  readonly author?: string;
  readonly license?: string;
  readonly tags?: readonly string[];
  readonly permissions?: readonly string[];
  readonly metadata?: PluginMetadata;
  readonly contributions: PluginContributions;
  readonly hooks?: PluginLifecycleHooks;
  readonly dependencies?: TDependencies;
}

/** Fluent builder for assembling plugin manifests. */
export class PluginBuilder<
  TName extends string = never,
  TVersion extends string = never,
  TContributions extends PluginContributions = Record<PropertyKey, never>,
  TDependencies extends PluginDependencies = Record<PropertyKey, never>,
> {
  readonly #state: PluginBuilderState<TDependencies>;

  constructor(state: PluginBuilderState<TDependencies> = { contributions: {} }) {
    this.#state = state;
  }

  /** Set the plugin package name. */
  withName<T extends string>(
    name: T,
  ): PluginBuilder<T, TVersion, TContributions, TDependencies> {
    return this.#clone<T, TVersion, TContributions>({ name });
  }

  /** Set the plugin semantic version. */
  withVersion<T extends string>(
    version: T,
  ): PluginBuilder<TName, T, TContributions, TDependencies> {
    return this.#clone<TName, T, TContributions>({ version });
  }

  /** Set the plugin description. */
  withDescription(
    description: string,
  ): PluginBuilder<TName, TVersion, TContributions, TDependencies> {
    return this.#clone<TName, TVersion, TContributions>({ description });
  }

  /** Set the display name used by UI surfaces. */
  withDisplayName(
    displayName: string,
  ): PluginBuilder<TName, TVersion, TContributions, TDependencies> {
    return this.#clone<TName, TVersion, TContributions>({ displayName });
  }

  /** Set the plugin category. */
  withType(type: PluginType): PluginBuilder<TName, TVersion, TContributions, TDependencies> {
    return this.#clone<TName, TVersion, TContributions>({ type });
  }

  /** Set the plugin author. */
  withAuthor(author: string): PluginBuilder<TName, TVersion, TContributions, TDependencies> {
    return this.#clone<TName, TVersion, TContributions>({ author });
  }

  /** Set the plugin license identifier. */
  withLicense(license: string): PluginBuilder<TName, TVersion, TContributions, TDependencies> {
    return this.#clone<TName, TVersion, TContributions>({ license });
  }

  /** Set plugin discovery tags. */
  withTags(
    tags: readonly string[],
  ): PluginBuilder<TName, TVersion, TContributions, TDependencies> {
    return this.#clone<TName, TVersion, TContributions>({ tags });
  }

  /** Set permissions requested by the plugin. */
  withPermissions(
    permissions: readonly string[],
  ): PluginBuilder<TName, TVersion, TContributions, TDependencies> {
    return this.#clone<TName, TVersion, TContributions>({ permissions });
  }

  /** Set runtime-safe plugin metadata. */
  withMetadata(
    metadata: PluginMetadata,
  ): PluginBuilder<TName, TVersion, TContributions, TDependencies> {
    return this.#clone<TName, TVersion, TContributions>({ metadata });
  }

  /** Set plugin lifecycle hooks. */
  withHooks(
    hooks: PluginLifecycleHooks,
  ): PluginBuilder<TName, TVersion, TContributions, TDependencies> {
    return this.#clone<TName, TVersion, TContributions>({ hooks });
  }

  /** Set typed plugin dependencies available to contribution callbacks. */
  withDependencies<TDeps extends PluginDependencies>(
    dependencies: TDeps,
  ): PluginBuilder<TName, TVersion, TContributions, TDeps> {
    return new PluginBuilder<TName, TVersion, TContributions, TDeps>({
      ...this.#state,
      dependencies,
    });
  }

  /** Add a service contribution. */
  withService(
    service: ContributionInput<ServiceContribution, TDependencies>,
  ): PluginBuilder<
    TName,
    TVersion,
    TContributions & { readonly services: readonly ServiceContribution[] },
    TDependencies
  > {
    return this.#withArrayContribution('services', service);
  }

  /** Add a background processor contribution. */
  withBackgroundProcessor(
    processor: ContributionInput<BackgroundProcessorContribution, TDependencies>,
  ): PluginBuilder<
    TName,
    TVersion,
    TContributions & {
      readonly backgroundProcessors: readonly BackgroundProcessorContribution[];
    },
    TDependencies
  > {
    return this.#withArrayContribution('backgroundProcessors', processor);
  }

  /** Add stream topic contributions. */
  withStreamTopics(
    topics: ContributionInput<readonly StreamTopicContribution[], TDependencies>,
  ): PluginBuilder<
    TName,
    TVersion,
    TContributions & { readonly streamTopics: readonly StreamTopicContribution[] },
    TDependencies
  > {
    return this.#withArrayContributions('streamTopics', topics);
  }

  /** Add database schema contributions. */
  withDbSchemas(
    schemas: ContributionInput<readonly DbSchemaContribution[], TDependencies>,
  ): PluginBuilder<
    TName,
    TVersion,
    TContributions & { readonly databaseSchemas: readonly DbSchemaContribution[] },
    TDependencies
  > {
    return this.#withArrayContributions('databaseSchemas', schemas);
  }

  /** Add runtime config topic contributions. */
  withRuntimeConfigTopics(
    topics: ContributionInput<readonly RuntimeConfigTopicContribution[], TDependencies>,
  ): PluginBuilder<
    TName,
    TVersion,
    TContributions & {
      readonly runtimeConfigTopics: readonly RuntimeConfigTopicContribution[];
    },
    TDependencies
  > {
    return this.#withArrayContributions('runtimeConfigTopics', topics);
  }

  /** Add contract version contributions. */
  withContractVersions(
    versions: ContributionInput<readonly ContractVersionContribution[], TDependencies>,
  ): PluginBuilder<
    TName,
    TVersion,
    TContributions & { readonly contractVersions: readonly ContractVersionContribution[] },
    TDependencies
  > {
    return this.#withArrayContributions('contractVersions', versions);
  }

  /** Add end-to-end gate contributions. */
  withE2e(
    e2e: ContributionInput<readonly E2eContribution[], TDependencies>,
  ): PluginBuilder<
    TName,
    TVersion,
    TContributions & { readonly e2e: readonly E2eContribution[] },
    TDependencies
  > {
    return this.#withArrayContributions('e2e', e2e);
  }

  /** Add telemetry contributions. */
  withTelemetry(
    telemetry: ContributionInput<readonly TelemetryContribution[], TDependencies>,
  ): PluginBuilder<
    TName,
    TVersion,
    TContributions & { readonly telemetry: readonly TelemetryContribution[] },
    TDependencies
  > {
    return this.#withArrayContributions('telemetry', telemetry);
  }

  /** Add migration contributions. */
  withMigrations(
    migrations: ContributionInput<readonly MigrationContribution[], TDependencies>,
  ): PluginBuilder<
    TName,
    TVersion,
    TContributions & { readonly migrations: readonly MigrationContribution[] },
    TDependencies
  > {
    return this.#withArrayContributions('migrations', migrations);
  }

  /** Set the Aspire contribution module path. */
  withAspire(
    aspire: ContributionInput<string, TDependencies>,
  ): PluginBuilder<
    TName,
    TVersion,
    TContributions & { readonly aspire: string },
    TDependencies
  > {
    const value = this.#resolve(aspire);
    return this.#clone<TName, TVersion, TContributions & { readonly aspire: string }>({
      contributions: { ...this.#state.contributions, aspire: value },
    });
  }

  /** Build an immutable plugin manifest. */
  build(): TName extends never ? never : TVersion extends never ? never : PluginManifest {
    if (!this.#state.name) {
      throw new TypeError('Plugin manifest requires a name.');
    }
    if (!this.#state.version) {
      throw new TypeError('Plugin manifest requires a version.');
    }

    const manifest: PluginManifest = {
      name: this.#state.name,
      version: this.#state.version,
      description: this.#state.description,
      displayName: this.#state.displayName,
      type: this.#state.type,
      author: this.#state.author,
      license: this.#state.license,
      tags: this.#state.tags,
      permissions: this.#state.permissions,
      metadata: this.#state.metadata,
      contributions: Object.freeze({ ...this.#state.contributions }),
      hooks: this.#state.hooks,
      dependencies: this.#state.dependencies,
    };

    return Object.freeze(PluginManifestSchema.parse(manifest) as PluginManifest) as TName extends
      never ? never
      : TVersion extends never ? never
      : PluginManifest;
  }

  #withArrayContribution<
    TAxis extends keyof PluginContributions,
    TValue,
    TNextContributions extends PluginContributions,
  >(
    axis: TAxis,
    value: ContributionInput<TValue, TDependencies>,
  ): PluginBuilder<TName, TVersion, TNextContributions, TDependencies> {
    return this.#withArrayContributions(axis, [this.#resolve(value)]);
  }

  #withArrayContributions<
    TAxis extends keyof PluginContributions,
    TValue,
    TNextContributions extends PluginContributions,
  >(
    axis: TAxis,
    value: ContributionInput<readonly TValue[], TDependencies>,
  ): PluginBuilder<TName, TVersion, TNextContributions, TDependencies> {
    const existing = this.#state.contributions[axis];
    const current = Array.isArray(existing) ? existing : [];
    const next = [...current, ...this.#resolve(value)];
    return this.#clone<TName, TVersion, TNextContributions>({
      contributions: { ...this.#state.contributions, [axis]: next },
    });
  }

  #resolve<TValue>(value: ContributionInput<TValue, TDependencies>): TValue {
    if (typeof value === 'function') {
      const factory = value as (ctx: DependencyContext<TDependencies>) => TValue;
      return factory({ deps: this.#state.dependencies ?? ({} as TDependencies) });
    }
    return value;
  }

  #clone<
    TNextName extends string,
    TNextVersion extends string,
    TNextContributions extends PluginContributions,
  >(
    patch: Partial<PluginBuilderState<TDependencies>>,
  ): PluginBuilder<TNextName, TNextVersion, TNextContributions, TDependencies> {
    return new PluginBuilder<TNextName, TNextVersion, TNextContributions, TDependencies>({
      ...this.#state,
      ...patch,
      contributions: patch.contributions ?? this.#state.contributions,
    });
  }
}
