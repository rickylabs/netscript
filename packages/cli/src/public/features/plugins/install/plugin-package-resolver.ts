/** Known bare plugin aliases that resolve only to verified NetScript JSR packages. */
export const BARE_PLUGIN_PACKAGE_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  ai: '@netscript/plugin-ai',
  auth: '@netscript/plugin-auth',
  saga: '@netscript/plugin-sagas',
  sagas: '@netscript/plugin-sagas',
  stream: '@netscript/plugin-streams',
  streams: '@netscript/plugin-streams',
  trigger: '@netscript/plugin-triggers',
  triggers: '@netscript/plugin-triggers',
  worker: '@netscript/plugin-workers',
  workers: '@netscript/plugin-workers',
});

/** Source branch used to resolve a plugin install package spec. */
export type PluginPackageSpecSource = 'bare-alias' | 'scoped-name' | 'explicit-jsr';

/** JSR package identity resolved before plugin kind registry lookup. */
export interface ResolvedPluginPackageSpec {
  /** Original value supplied to `plugin install`. */
  readonly requestedSpec: string;
  /** Resolution branch used by the resolver. */
  readonly source: PluginPackageSpecSource;
  /** Scope without the leading `@`. */
  readonly scope: string;
  /** JSR package name without the scope. */
  readonly packageName: string;
  /** Scoped package name without the `jsr:` prefix. */
  readonly packageSpecifier: string;
  /** Fully-qualified Deno JSR specifier. */
  readonly jsrSpecifier: string;
  /** Matched bare alias, when the verified NetScript alias map was used. */
  readonly alias?: string;
}

/** Resolve a plugin install spec to a JSR package before any kind-registry lookup. */
export function resolvePluginPackageSpec(spec: string): ResolvedPluginPackageSpec {
  const requestedSpec = spec.trim();
  if (requestedSpec.length === 0) {
    throw new Error('Plugin package spec cannot be empty.');
  }

  const aliasPackage = BARE_PLUGIN_PACKAGE_ALIASES[requestedSpec.toLowerCase()];
  if (aliasPackage !== undefined) {
    return toResolvedPackageSpec(requestedSpec, aliasPackage, 'bare-alias', requestedSpec);
  }

  if (requestedSpec.startsWith('jsr:')) {
    return toResolvedPackageSpec(
      requestedSpec,
      requestedSpec.slice('jsr:'.length),
      'explicit-jsr',
    );
  }

  return toResolvedPackageSpec(requestedSpec, requestedSpec, 'scoped-name');
}

function toResolvedPackageSpec(
  requestedSpec: string,
  packageSpecifier: string,
  source: PluginPackageSpecSource,
  alias?: string,
): ResolvedPluginPackageSpec {
  const match = /^@([^/]+)\/([^/@]+)$/.exec(packageSpecifier);
  if (match === null) {
    throw new Error(`Invalid JSR plugin package spec "${requestedSpec}". Expected @scope/package.`);
  }

  const scope = match[1];
  const packageName = match[2];
  const scopedPackage = `@${scope}/${packageName}`;
  return {
    requestedSpec,
    source,
    scope,
    packageName,
    packageSpecifier: scopedPackage,
    jsrSpecifier: `jsr:${scopedPackage}`,
    alias,
  };
}
