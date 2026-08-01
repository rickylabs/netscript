/** Environment variable that overrides the generated saga registry module. */
export const SAGAS_REGISTRY_MODULE_ENV = 'SAGAS_REGISTRY_MODULE' as const;

/** Project-relative path of the generated saga registry module. */
export const DEFAULT_SAGAS_REGISTRY_PATH =
  './.netscript/generated/plugin-sagas/sagas.registry.ts' as const;

/** Inputs used to resolve the generated saga registry module. */
export type ProjectRegistryModuleOptions = Readonly<{
  registryModule?: string;
  readEnv?: (name: string) => string | undefined;
  cwd?: () => string;
  projectRoot?: string;
}>;

/** Resolve the saga registry through explicit, environment, then project-root precedence. */
export function resolveProjectRegistryModule(
  options: ProjectRegistryModuleOptions = {},
): string {
  const readEnv = options.readEnv ?? ((name: string): string | undefined => Deno.env.get(name));
  const specifier = options.registryModule ?? readEnv(SAGAS_REGISTRY_MODULE_ENV);

  if (specifier !== undefined && !isProjectRelativeSpecifier(specifier)) {
    return specifier;
  }

  return projectFileUrl(
    specifier ?? DEFAULT_SAGAS_REGISTRY_PATH,
    options.projectRoot ?? readEnv('NETSCRIPT_PROJECT_ROOT') ?? (options.cwd ?? Deno.cwd)(),
  ).href;
}

/** Build an absolute file URL for a path owned by a NetScript project root. */
export function projectFileUrl(relativePath: string, projectRoot: string): URL {
  const root = projectRoot.replaceAll('\\', '/');
  const normalizedRoot = root.endsWith('/') ? root : `${root}/`;
  const base = normalizedRoot.startsWith('/')
    ? `file://${normalizedRoot}`
    : `file:///${normalizedRoot}`;
  return new URL(relativePath.replaceAll('\\', '/'), base);
}

function isProjectRelativeSpecifier(specifier: string): boolean {
  return specifier === '.' || specifier.startsWith('./') || specifier.startsWith('../') ||
    specifier.startsWith('.\\');
}
