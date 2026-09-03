import { toCamelCase, toKebabCase, toPascalCase } from '@std/text';

export const RESOURCE_SLICE_VARIANTS = [
  'core',
  'form',
  'partial',
  'stream',
] as const;
export type ResourceSliceVariant = typeof RESOURCE_SLICE_VARIANTS[number];
export type ResourceSliceOptionalVariant = Exclude<ResourceSliceVariant, 'core'>;

export const RESOURCE_SLICE_LEAF_ROLES = [
  'route-contract',
  'page',
  'layout',
  'view',
  'island',
  'loaders',
  'form-component',
  'form-contract',
  'summary-component',
  'partial-route',
  'stream-island',
] as const;
export type ResourceSliceLeafRole = typeof RESOURCE_SLICE_LEAF_ROLES[number];

export const RESOURCE_SLICE_MARKER_PREFIX = '// @netscript/resource-slice ';
export const RESOURCE_SLICE_MARKER_SCHEMA = 1 as const;

export interface SelectedResourceClient {
  readonly serviceName: string;
  readonly moduleSpecifier: string;
  readonly queryFactoryName: string;
}

export interface SelectedResourceProcedure {
  readonly path: readonly [string, ...string[]];
  readonly kind: 'query';
}

export interface RequiredResourceState {
  readonly property: string;
  readonly type: string;
}

export interface ResourceSliceInput {
  readonly resource: string;
  readonly app: string;
  readonly route?: string;
  readonly variants?: readonly ResourceSliceOptionalVariant[];
  readonly client: SelectedResourceClient;
  readonly procedure: SelectedResourceProcedure;
  readonly requiredState?: RequiredResourceState;
}

export interface NormalizedResourceSliceInput {
  readonly resource: string;
  readonly resourcePascalCase: string;
  readonly resourceCamelCase: string;
  readonly app: string;
  readonly route: string;
  readonly routeSegments: readonly string[];
  readonly routeDirectory: string;
  readonly partialRouteFile: string;
  readonly routeAlias: string;
  readonly variants: readonly ResourceSliceVariant[];
  readonly client: SelectedResourceClient;
  readonly procedure: SelectedResourceProcedure;
  readonly requiredState?: RequiredResourceState;
}

export interface OwnedResourceSliceLeafMetadata {
  readonly schema: typeof RESOURCE_SLICE_MARKER_SCHEMA;
  readonly resource: string;
  readonly role: ResourceSliceLeafRole;
  readonly options: readonly ResourceSliceVariant[];
  readonly bodySha256: string;
}

export interface ResourceSlicePlannedLeaf {
  readonly path: string;
  readonly role: ResourceSliceLeafRole;
  readonly template: string;
  readonly options: readonly ResourceSliceVariant[];
}

export interface ResourceSlicePlan {
  readonly input: NormalizedResourceSliceInput;
  readonly leaves: readonly ResourceSlicePlannedLeaf[];
  readonly query: {
    readonly factory: string;
    readonly queryOptions: string;
    readonly clientKey: string;
  };
  readonly appRoutes: {
    readonly path: 'router.ts';
    readonly alias: string;
    readonly route: string;
  };
  readonly state?: {
    readonly path: 'utils.ts';
    readonly requirement: RequiredResourceState;
  };
}

export interface ResourceSliceCandidateLeaf {
  readonly path: string;
  readonly resource: string;
  readonly role: ResourceSliceLeafRole;
  readonly options: readonly ResourceSliceVariant[];
  readonly content: string;
  readonly previousCanonicalContents?: readonly string[];
}

export interface ResourceSliceSharedCandidate {
  readonly path: string;
  readonly content: string;
  readonly role: 'app-routes' | 'state' | 'fresh-derived';
}

export type ResourceSlicePreflightPhase =
  | 'input-validation'
  | 'client-selection'
  | 'procedure-validation'
  | 'candidate-validation'
  | 'fresh-staging'
  | 'shared-source-transform';

export type ResourceSliceStagingResult =
  | Readonly<{
    ok: true;
    leaves: readonly ResourceSliceCandidateLeaf[];
    shared: readonly ResourceSliceSharedCandidate[];
  }>
  | Readonly<{
    ok: false;
    phase: ResourceSlicePreflightPhase;
    message: string;
  }>;

export type ResourceSliceLeafClassification =
  | Readonly<{ kind: 'absent' }>
  | Readonly<{ kind: 'exact' }>
  | Readonly<{ kind: 'owned'; metadata: OwnedResourceSliceLeafMetadata }>
  | Readonly<{ kind: 'owned-edited'; metadata: OwnedResourceSliceLeafMetadata }>
  | Readonly<{ kind: 'unowned' }>;

export interface ResourceSliceReportEntry {
  readonly path: string;
  readonly action: 'write' | 'skip' | 'conflict';
  readonly classification: ResourceSliceLeafClassification['kind'] | 'shared';
  readonly remedy?: string;
}

export interface ResourceSliceApplyPlan {
  readonly files: readonly Readonly<{ path: string; content: string }>[];
}

type Report = Readonly<{
  report: readonly ResourceSliceReportEntry[];
  skipped: readonly string[];
  conflicts: readonly string[];
}>;

export type ResourceSliceReconcileResult =
  | (
    & Report
    & Readonly<{
      status: 'ready';
      exitCode: 0;
      applyPlan: ResourceSliceApplyPlan;
    }>
  )
  | (
    & Report
    & Readonly<{
      status: 'dry-run';
      exitCode: 0 | 1;
    }>
  )
  | (
    & Report
    & Readonly<{
      status: 'conflict';
      exitCode: 1;
    }>
  )
  | Readonly<{
    status: 'preflight-failed';
    exitCode: 1;
    phase: ResourceSlicePreflightPhase;
    message: string;
    report: readonly [];
    skipped: readonly [];
    conflicts: readonly [];
  }>;

/** Normalize and validate one resource-slice request before planning. */
export function normalizeResourceSliceInput(
  input: ResourceSliceInput,
): NormalizedResourceSliceInput {
  const resource = toKebabCase(input.resource.trim());
  if (!resource || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(resource)) {
    throw new Error(`Resource '${input.resource}' cannot be normalized to kebab-case.`);
  }
  const resourcePascalCase = toPascalCase(resource);
  const resourceCamelCase = toCamelCase(resource);
  if (!isIdentifier(resourcePascalCase) || !isIdentifier(resourceCamelCase)) {
    throw new Error(`Resource '${input.resource}' cannot produce safe TypeScript identifiers.`);
  }
  if (!input.app.trim()) throw new Error('Resource slice requires a selected app.');

  const route = input.route ?? `/${resource}`;
  const routeSegments = normalizeStaticRoute(route);
  const variants = normalizeVariants(input.variants ?? []);
  validateClient(input.client);
  validateProcedure(input.procedure);
  if (input.requiredState) validateState(input.requiredState);

  return {
    resource,
    resourcePascalCase,
    resourceCamelCase,
    app: input.app,
    route: `/${routeSegments.join('/')}`,
    routeSegments,
    routeDirectory: `routes/${routeSegments.join('/')}`,
    partialRouteFile: `routes/partials/${routeSegments.join('/')}/summary.tsx`,
    routeAlias: resourceCamelCase,
    variants,
    client: input.client,
    procedure: input.procedure,
    requiredState: input.requiredState,
  };
}

/** Create the exact first-line ownership marker and append it to a generated body. */
export async function markOwnedResourceSliceLeaf(
  metadata: Omit<OwnedResourceSliceLeafMetadata, 'schema' | 'bodySha256'>,
  body: string,
): Promise<string> {
  if (!body.endsWith('\n')) throw new Error('Owned resource-slice bodies must end with LF.');
  const options = normalizeMarkerOptions(metadata.options);
  const marker: OwnedResourceSliceLeafMetadata = {
    schema: RESOURCE_SLICE_MARKER_SCHEMA,
    resource: metadata.resource,
    role: metadata.role,
    options,
    bodySha256: await sha256ResourceSliceBody(body),
  };
  return `${RESOURCE_SLICE_MARKER_PREFIX}${JSON.stringify(marker)}\n${body}`;
}

/** Parse only canonical schema-1 resource-slice marker lines. */
export function parseOwnedResourceSliceLeaf(
  content: string,
): OwnedResourceSliceLeafMetadata | undefined {
  const newline = content.indexOf('\n');
  if (newline < 0) return undefined;
  const line = content.slice(0, newline);
  if (!line.startsWith(RESOURCE_SLICE_MARKER_PREFIX)) return undefined;

  let value: unknown;
  try {
    value = JSON.parse(line.slice(RESOURCE_SLICE_MARKER_PREFIX.length));
  } catch {
    return undefined;
  }
  if (!isRecord(value)) return undefined;
  const { schema, resource, role, options, bodySha256 } = value;
  if (
    schema !== RESOURCE_SLICE_MARKER_SCHEMA || typeof resource !== 'string' ||
    typeof role !== 'string' || !isLeafRole(role) || !Array.isArray(options) ||
    !options.every((option) => typeof option === 'string' && isVariant(option)) ||
    typeof bodySha256 !== 'string' || !/^[a-f0-9]{64}$/.test(bodySha256)
  ) return undefined;

  let normalized: readonly ResourceSliceVariant[];
  try {
    normalized = normalizeMarkerOptions(options);
  } catch {
    return undefined;
  }
  const metadata: OwnedResourceSliceLeafMetadata = {
    schema,
    resource,
    role,
    options: normalized,
    bodySha256,
  };
  return line === `${RESOURCE_SLICE_MARKER_PREFIX}${JSON.stringify(metadata)}`
    ? metadata
    : undefined;
}

/** Hash generated body bytes exactly as stored after the ownership marker. */
export async function sha256ResourceSliceBody(body: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body));
  return new Uint8Array(digest).toHex();
}

function normalizeStaticRoute(route: string): readonly string[] {
  if (
    !route.startsWith('/') || route === '/' || route.endsWith('/') ||
    route.includes('//') || route.includes('\\') || /[?#:[\]*]/.test(route)
  ) throw new Error(`Route '${route}' must be a normalized static absolute route.`);
  const segments = route.slice(1).split('/');
  if (segments.some((segment) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(segment))) {
    throw new Error(`Route '${route}' must contain only static kebab-case segments.`);
  }
  return segments;
}

function normalizeVariants(
  variants: readonly ResourceSliceOptionalVariant[],
): readonly ResourceSliceVariant[] {
  for (const variant of variants) {
    if (!isVariant(variant)) {
      throw new Error(`Unsupported resource-slice variant '${variant}'.`);
    }
  }
  return ['core', ...new Set(variants)].sort() as ResourceSliceVariant[];
}

function normalizeMarkerOptions(
  options: readonly ResourceSliceVariant[],
): readonly ResourceSliceVariant[] {
  if (!options.includes('core') || options.some((option) => !isVariant(option))) {
    throw new Error('Owned resource-slice marker options must include core.');
  }
  const normalized = [...new Set(options)].sort();
  if (normalized.length !== options.length) {
    throw new Error('Owned resource-slice marker options must be unique.');
  }
  return normalized;
}

function validateClient(client: SelectedResourceClient): void {
  if (!client.serviceName || !client.moduleSpecifier || !isIdentifier(client.queryFactoryName)) {
    throw new Error('Selected resource client is incomplete or invalid.');
  }
}

function validateProcedure(procedure: SelectedResourceProcedure): void {
  if (
    procedure.kind !== 'query' || procedure.path.length === 0 || !procedure.path.every(isIdentifier)
  ) {
    throw new Error('Selected resource procedure must be a query with an identifier path.');
  }
}

function validateState(state: RequiredResourceState): void {
  if (!isIdentifier(state.property) || !state.type.trim()) {
    throw new Error('Required resource state must name a property and type.');
  }
}

function isIdentifier(value: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isVariant(value: string): value is ResourceSliceVariant {
  return RESOURCE_SLICE_VARIANTS.some((variant) => variant === value);
}

function isLeafRole(value: string): value is ResourceSliceLeafRole {
  return RESOURCE_SLICE_LEAF_ROLES.some((role) => role === value);
}
