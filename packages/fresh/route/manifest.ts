import { dirname, extname, relative, resolve } from '@std/path';

const ROUTE_FILE_EXTENSIONS = new Set(['.ts', '.tsx']);
const IGNORED_DIRECTORIES = new Set(['.git', '_fresh', 'coverage', 'dist', 'node_modules']);

/** Options controlling the NetScript route manifest generator. */
export interface NetScriptRouteManifestOptions {
  /** Whether manifest generation is enabled. */
  enabled?: boolean;
  /** Directory containing Fresh route files. */
  routesDir?: string;
  /** Write destination for the generated routes module. */
  outputPath?: string;
  /** Verbosity of generator logging. */
  logLevel?: 'silent' | 'changes' | 'verbose';
}

/** Fully resolved options used by the manifest generator. */
export interface ResolvedNetScriptRouteManifestOptions {
  /** Absolute path to the application root. */
  appRoot: string;
  /** Absolute path to the routes directory. */
  routesDir: string;
  /** Absolute path to the generated manifest module. */
  manifestOutputPath: string;
  /** Absolute path to the generated routes module. */
  routesOutputPath: string;
  /** Resolved generator log level. */
  logLevel: 'silent' | 'changes' | 'verbose';
}

/** A route discovered by walking the routes directory. */
export interface DiscoveredNetScriptRoute {
  /** Absolute file path of the route module. */
  routeFilePath: string;
  /** Route file path relative to the routes directory. */
  relativeRouteFilePath: string;
  /** Fresh route pattern inferred from the file path. */
  routePattern: string;
  /** Nested property path used in the generated manifest tree. */
  routeKeyPath: string[];
  /** Relative import path to the route contract sidecar, if present. */
  routeContractImportPath?: string;
}

/** Result returned after writing the generated route manifest files. */
export interface WriteNetScriptRouteManifestResult {
  /** Whether either generated file changed. */
  changed: boolean;
  /** Whether the manifest file changed. */
  manifestChanged: boolean;
  /** Whether the routes module changed. */
  routesChanged: boolean;
  /** Absolute path to the generated manifest file. */
  manifestOutputPath: string;
  /** Absolute path to the generated routes file. */
  routesOutputPath: string;
  /** Number of routes discovered. */
  routeCount: number;
  /** Number of routes bound to a route contract sidecar. */
  boundRouteCount: number;
}

interface RawManifestExpression {
  __raw: string;
}

interface ManifestTreeNode {
  [key: string]: ManifestTreeValue;
}

type ManifestTreeValue = string | RawManifestExpression | ManifestTreeNode;

function normalizeFsPath(path: string): string {
  return toPosixPath(resolve(path));
}

function toPosixPath(path: string): string {
  return path.replace(/\\/g, '/');
}

function isRawManifestExpression(value: ManifestTreeValue): value is RawManifestExpression {
  return typeof value === 'object' && value !== null && '__raw' in value;
}

function isRouteContractSidecar(path: string): boolean {
  return path.endsWith('.route.ts') || path.endsWith('.route.tsx');
}

function isDynamicRouteSegment(segment: string): boolean {
  return /^\[\[\.\.\.[^\]]+\]\]$/.test(segment) || /^\[\.\.\.[^\]]+\]$/.test(segment) ||
    /^\[[^\]]+\]$/.test(segment);
}

function isRouteHelperDirectoryName(name: string): boolean {
  return name.startsWith('_') || /^\(_.*\)$/.test(name);
}

function isRouteHelperFileStem(stem: string): boolean {
  if (stem === '_app' || stem === '_layout') {
    return false;
  }

  if (stem.startsWith('_')) {
    return true;
  }

  const dotIndex = stem.indexOf('.');
  if (dotIndex === -1) {
    return false;
  }

  return isDynamicRouteSegment(stem.slice(0, dotIndex));
}

function isRouteHelperPath(path: string, routesDir: string): boolean {
  const relativePath = toPosixRelativePath(routesDir, path);
  const segments = relativePath.split('/');
  const fileName = segments[segments.length - 1] ?? '';
  const fileStem = fileName.replace(/\.(ts|tsx)$/, '');

  return segments.slice(0, -1).some(isRouteHelperDirectoryName) || isRouteHelperFileStem(fileStem);
}

function isRouteModulePath(path: string, routesDir: string): boolean {
  return ROUTE_FILE_EXTENSIONS.has(extname(path)) && !isRouteContractSidecar(path) &&
    !isRouteHelperPath(path, routesDir);
}

function toPosixRelativePath(root: string, path: string): string {
  return toPosixPath(relative(root, path));
}

function tryReadTextFileSync(path: string): string | undefined {
  try {
    return Deno.readTextFileSync(path);
  } catch (error: unknown) {
    if (error instanceof Deno.errors.NotFound) {
      return undefined;
    }

    throw error;
  }
}

function toRelativeImportPath(fromPath: string, importPath: string): string {
  const relativeImportPath = toPosixPath(relative(dirname(fromPath), importPath));
  return relativeImportPath.startsWith('.') ? relativeImportPath : `./${relativeImportPath}`;
}

function resolveRouteSidecarPath(routeFilePath: string): string | undefined {
  const candidatePaths = [
    routeFilePath.replace(/\.(ts|tsx)$/, '.route.ts'),
    routeFilePath.replace(/\.(ts|tsx)$/, '.route.tsx'),
  ];

  for (const candidatePath of candidatePaths) {
    if (tryReadTextFileSync(candidatePath) !== undefined) {
      return candidatePath;
    }
  }

  return undefined;
}

function toCamelCase(segment: string): string {
  const parts = segment
    .split(/[^A-Za-z0-9]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (parts.length === 0) {
    return '_';
  }

  const [first, ...rest] = parts;
  const value = [
    first.toLowerCase(),
    ...rest.map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`),
  ].join('');

  return /^[A-Za-z_$]/.test(value) ? value : `_${value}`;
}

function toRouteKeySegment(segment: string): string {
  const optionalCatchAll = segment.match(/^\[\[\.\.\.([^\]]+)\]\]$/);
  if (optionalCatchAll) {
    return `$${toCamelCase(optionalCatchAll[1])}Optional`;
  }

  const catchAll = segment.match(/^\[\.\.\.([^\]]+)\]$/);
  if (catchAll) {
    return `$${toCamelCase(catchAll[1])}All`;
  }

  const dynamic = segment.match(/^\[([^\]]+)\]$/);
  if (dynamic) {
    return `$${toCamelCase(dynamic[1])}`;
  }

  return toCamelCase(segment);
}

function shouldSkipRouteSegment(segment: string): boolean {
  return segment === 'index' || segment === '_app' || segment === '_layout' ||
    /^\(.*\)$/.test(segment);
}

function inferRoutePattern(relativeRouteFilePath: string): string | null {
  const noExtension = relativeRouteFilePath.replace(/\.(ts|tsx)$/, '');
  const rawSegments = noExtension.split('/');
  const segments = rawSegments.filter((segment) => !shouldSkipRouteSegment(segment));

  if (
    rawSegments[rawSegments.length - 1] === '_layout' ||
    rawSegments[rawSegments.length - 1] === '_app'
  ) {
    return null;
  }

  return segments.length === 0 ? '/' : `/${segments.join('/')}`;
}

function inferRouteKeyPath(relativeRouteFilePath: string): string[] | null {
  const noExtension = relativeRouteFilePath.replace(/\.(ts|tsx)$/, '');
  const rawSegments = noExtension.split('/');

  if (
    rawSegments[rawSegments.length - 1] === '_layout' ||
    rawSegments[rawSegments.length - 1] === '_app'
  ) {
    return null;
  }

  const segments = rawSegments
    .filter((segment) => !shouldSkipRouteSegment(segment))
    .map((segment) => toRouteKeySegment(segment));

  segments.push('$route');
  return segments;
}

function toPropertyKey(key: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
}

function renderManifestTree(value: ManifestTreeValue, indent = 0): string {
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  if (isRawManifestExpression(value)) {
    return value.__raw;
  }

  const entries = Object.entries(value);
  if (entries.length === 0) {
    return '{}';
  }

  const padding = '  '.repeat(indent);
  const childPadding = '  '.repeat(indent + 1);
  const renderedEntries = entries
    .map(([key, child]) =>
      `${childPadding}${toPropertyKey(key)}: ${renderManifestTree(child, indent + 1)}`
    )
    .join(',\n');

  return `{
${renderedEntries}
${padding}}`;
}

function insertManifestTreeValue(
  root: Record<string, ManifestTreeValue>,
  keyPath: string[],
  value: ManifestTreeValue,
): void {
  let current: Record<string, ManifestTreeValue> = root;

  for (let index = 0; index < keyPath.length - 1; index += 1) {
    const key = keyPath[index];
    const next = current[key];
    if (!next || typeof next === 'string' || isRawManifestExpression(next)) {
      current[key] = {};
    }

    current = current[key] as Record<string, ManifestTreeValue>;
  }

  current[keyPath[keyPath.length - 1]] = value;
}

function inferRouteReferenceKind(route: DiscoveredNetScriptRoute): 'page' | 'partial' {
  return route.relativeRouteFilePath.startsWith('partials/') ? 'partial' : 'page';
}

function renderRouteReferenceExpression(
  route: DiscoveredNetScriptRoute,
  routePatternAccessor: string,
  importName?: string,
): string {
  const metadata = `{ id: ${JSON.stringify(route.routeKeyPath.slice(0, -1).join('.'))}, kind: ${
    JSON.stringify(inferRouteReferenceKind(route))
  } }`;

  if (importName) {
    return `bindRoutePattern(${importName}, ${routePatternAccessor}, ${metadata})`;
  }

  return `createRouteReference(${routePatternAccessor}, ${metadata})`;
}

/**
 * Resolve user-facing manifest options into fully normalized paths.
 *
 * @param appRoot - Absolute application root.
 * @param options - Optional manifest generator configuration.
 * @returns Resolved manifest options.
 */
export function resolveNetScriptRouteManifestOptions(
  appRoot: string,
  options: NetScriptRouteManifestOptions = {},
): ResolvedNetScriptRouteManifestOptions {
  const routesOutputPath = normalizeFsPath(
    options.outputPath ?? resolve(appRoot, '.generated/routes.ts'),
  );

  return {
    appRoot: normalizeFsPath(appRoot),
    routesDir: normalizeFsPath(options.routesDir ?? resolve(appRoot, 'routes')),
    manifestOutputPath: normalizeFsPath(resolve(dirname(routesOutputPath), 'manifest.ts')),
    routesOutputPath,
    logLevel: options.logLevel ?? 'silent',
  };
}

/**
 * Determine whether a file change should trigger a manifest rebuild.
 *
 * @param filePath - Absolute path of the changed file.
 * @param options - Resolved manifest options.
 * @returns True when the file is inside the routes tree and is a route module or sidecar.
 */
export function isRouteManifestRelevantPath(
  filePath: string,
  options: ResolvedNetScriptRouteManifestOptions,
): boolean {
  const normalizedPath = normalizeFsPath(filePath);
  if (!normalizedPath.startsWith(options.routesDir)) {
    return false;
  }

  return isRouteModulePath(normalizedPath, options.routesDir) ||
    isRouteContractSidecar(normalizedPath);
}

/**
 * Determine whether a file path should be watched for route changes.
 *
 * @param filePath - Absolute path of the changed file.
 * @param options - Resolved manifest options.
 * @returns True when the file is a TypeScript route file inside the routes tree.
 */
export function isRouteManifestWatchPath(
  filePath: string,
  options: ResolvedNetScriptRouteManifestOptions,
): boolean {
  const normalizedPath = normalizeFsPath(filePath);
  if (!normalizedPath.startsWith(options.routesDir)) {
    return false;
  }

  return ROUTE_FILE_EXTENSIONS.has(extname(normalizedPath));
}

/**
 * Walk the routes directory and discover all routable modules.
 *
 * @param options - Resolved manifest options.
 * @returns Sorted list of discovered routes.
 */
export function discoverNetScriptRoutes(
  options: ResolvedNetScriptRouteManifestOptions,
): DiscoveredNetScriptRoute[] {
  const routes: DiscoveredNetScriptRoute[] = [];

  function walk(path: string): void {
    for (const entry of Deno.readDirSync(path)) {
      const entryPath = resolve(path, entry.name);

      if (entry.isDirectory) {
        if (!IGNORED_DIRECTORIES.has(entry.name) && !isRouteHelperDirectoryName(entry.name)) {
          walk(entryPath);
        }
        continue;
      }

      if (!isRouteModulePath(entryPath, options.routesDir)) {
        continue;
      }

      const relativeRouteFilePath = toPosixRelativePath(options.routesDir, entryPath);
      const routePattern = inferRoutePattern(relativeRouteFilePath);
      const routeKeyPath = inferRouteKeyPath(relativeRouteFilePath);
      if (!routePattern || !routeKeyPath) {
        continue;
      }

      const sidecarFilePath = resolveRouteSidecarPath(entryPath);
      const routeContractImportPath = sidecarFilePath
        ? toRelativeImportPath(options.routesOutputPath, sidecarFilePath)
        : undefined;

      routes.push({
        routeFilePath: normalizeFsPath(entryPath),
        relativeRouteFilePath,
        routePattern,
        routeKeyPath,
        routeContractImportPath,
      });
    }
  }

  walk(options.routesDir);
  routes.sort((left, right) =>
    left.relativeRouteFilePath.localeCompare(right.relativeRouteFilePath)
  );
  return routes;
}

/**
 * Render the generated `manifest.ts` source that exports the route pattern tree.
 *
 * @param routes - Discovered routes.
 * @returns TypeScript source string.
 */
export function renderNetScriptRouteManifest(
  routes: DiscoveredNetScriptRoute[],
): string {
  const routePatternsTree: Record<string, ManifestTreeValue> = {};

  routes.forEach((route) => {
    insertManifestTreeValue(routePatternsTree, route.routeKeyPath, route.routePattern);
  });

  return [
    '// This file is auto-generated by @netscript/fresh/vite.',
    '// Do not edit manually; route patterns are derived from the app routes tree.',
    '',
    `export const routePatterns = ${renderManifestTree(routePatternsTree)} as const;`,
    '',
  ].filter((line, index, lines) => !(line === '' && lines[index - 1] === '')).join('\n');
}

/**
 * Render the generated `routes.ts` source that exports bound route references.
 *
 * @param routes - Discovered routes.
 * @param manifestImportPath - Relative import path to the generated manifest.
 * @returns TypeScript source string.
 */
export function renderNetScriptRoutesModule(
  routes: DiscoveredNetScriptRoute[],
  manifestImportPath = './manifest.ts',
): string {
  const routesTree: Record<string, ManifestTreeValue> = {};
  const routeContractImports: string[] = [];

  routes.forEach((route, index) => {
    let importName: string | undefined;

    if (route.routeContractImportPath) {
      importName = `routeContract${index}`;
      routeContractImports.push(`import ${importName} from '${route.routeContractImportPath}';`);
    }

    insertManifestTreeValue(routesTree, route.routeKeyPath, {
      __raw: renderRouteReferenceExpression(
        route,
        `routePatterns.${route.routeKeyPath.join('.')}`,
        importName,
      ),
    });
  });

  return [
    '// This file is auto-generated by @netscript/fresh/vite.',
    '// Do not edit manually; update route files or route sidecars instead.',
    `import { createRouteReference${
      routeContractImports.length > 0 ? ', bindRoutePattern' : ''
    } } from '@netscript/fresh/route';`,
    `import { routePatterns } from '${manifestImportPath}';`,
    ...routeContractImports,
    '',
    `export const routes = ${renderManifestTree(routesTree)} as const;`,
    '',
  ].filter((line, index, lines) => !(line === '' && lines[index - 1] === '')).join('\n');
}

/**
 * Discover routes and write the generated manifest and routes modules to disk.
 *
 * @param options - Resolved manifest options.
 * @returns Summary of what was discovered and whether files changed.
 */
export function writeNetScriptRouteManifestSync(
  options: ResolvedNetScriptRouteManifestOptions,
): WriteNetScriptRouteManifestResult {
  const routes = discoverNetScriptRoutes(options);
  const manifestSource = renderNetScriptRouteManifest(routes);
  const routesSource = renderNetScriptRoutesModule(
    routes,
    toRelativeImportPath(options.routesOutputPath, options.manifestOutputPath),
  );
  const previousManifest = tryReadTextFileSync(options.manifestOutputPath);
  const previousRoutes = tryReadTextFileSync(options.routesOutputPath);
  const manifestChanged = previousManifest !== manifestSource;
  const routesChanged = previousRoutes !== routesSource;

  if (manifestChanged) {
    Deno.mkdirSync(dirname(options.manifestOutputPath), { recursive: true });
    Deno.writeTextFileSync(options.manifestOutputPath, manifestSource);
  }

  if (routesChanged) {
    Deno.mkdirSync(dirname(options.routesOutputPath), { recursive: true });
    Deno.writeTextFileSync(options.routesOutputPath, routesSource);
  }

  return {
    changed: manifestChanged || routesChanged,
    manifestChanged,
    routesChanged,
    manifestOutputPath: options.manifestOutputPath,
    routesOutputPath: options.routesOutputPath,
    routeCount: routes.length,
    boundRouteCount: routes.filter((route) => route.routeContractImportPath).length,
  };
}
