/**
 * Wave-0 Empirical Probe C:
 *   1. Manifest evolution (.passthrough() forward-compat #1474) & path containment (#1473)
 *   2. Deny-by-default procedure gateway + RFC 0009 authorizing stream-proxy composition (P5)
 *   3. Server-side secret-redaction boundary + write-only secret handles (eis-etl#450, #453)
 *
 * Executed against real repository modules on origin/main (`af5107b8d`) without modifying any
 * tracked package, plugin, app, example, or lock files.
 */

import {
  assert,
  assertEquals,
  assertExists,
  assertMatch,
  assertNotEquals,
  assertRejects,
  assertStringIncludes,
  assertThrows,
} from '@std/assert';
import { isAbsolute, join, relative, resolve } from '@std/path';
import { z } from 'zod';
import { oc } from 'npm:@orpc/contract@^1.15.5';
import { eventIterator } from 'npm:@orpc/server@^1.15.5';
import { DurableStreamTestServer } from 'npm:@durable-streams/server@0.3.9';
import { h } from 'npm:preact@^10.29.2';
import { render as renderToString } from 'npm:preact-render-to-string@^6.8.0';

import {
  parsePluginManifest,
  PLUGIN_MANIFEST_SCHEMA_VERSION,
  type PluginInstallerManifest,
  type PluginManifestParseResult,
} from '../../../../packages/plugin/src/protocol/manifest.ts';
import {
  baseContract,
  type NetScriptProcedureMeta,
} from '../../../../packages/contracts/mod.ts';
import { authContract } from '../../../../packages/plugin-auth-core/src/contracts/v1/mod.ts';
import {
  compileProcedures,
  type IndexedProcedure,
} from '../../../../packages/service/src/auth/contract/contract-procedure-index.ts';
import { authorizeProcedurePolicy } from '../../../../packages/service/src/auth/contract/procedure-policy-decision.ts';
import { isInternalServicePrincipal } from '../../../../packages/service/src/auth/internal-credential/internal-credential-authenticator.ts';
import type { Principal } from '../../../../packages/service/src/auth/types.ts';
import { createStableV1ProcedureMetadataPort } from '../../../../packages/sdk/src/internal/client-contributions/stable-v1-adapter.ts';
import { buildStreamUrl, createDurableStream } from '../../../../packages/plugin-streams-core/mod.ts';
import {
  bindStreamEventSourceV1,
  createStreamSseReplayStateV1,
  parseStreamSseEventV1,
  reduceStreamSseReplayStateV1,
  STREAM_SSE_CONTRACT_V1,
  type StreamEventSourceV1,
  type StreamSseConsumerEventV1,
} from '../../../../packages/plugin-streams-core/src/sse/mod.ts';
import { createStreamTopicFixture } from '../../../../packages/plugin-streams-core/src/testing/mod.ts';
import { createFetchStreamEventSourceV1 } from '../../../../packages/sdk/src/client/stream-source/mod.ts';
import { createNetScriptStreamEventSourceV1 } from '../../../../packages/fresh/src/runtime/streams/mod.ts';
import { createNetScriptChatStreamProxy } from '../../../../packages/fresh/src/runtime/ai/mod.ts';

const REPO_ROOT = resolve(new URL('../../../../', import.meta.url).pathname);

interface ProbeCase {
  readonly name: string;
  readonly fn: () => void | Promise<void>;
}

const probeCases: ProbeCase[] = [];

function probeTest(
  name: string,
  fn: () => void | Promise<void>,
): void {
  if (import.meta.main) {
    probeCases.push({ name, fn });
  } else {
    Deno.test({ name, sanitizeOps: false, sanitizeResources: false, fn });
  }
}

function getFreePort(): number {
  const listener = Deno.listen({ hostname: '127.0.0.1', port: 0 });
  const { port } = listener.addr as Deno.NetAddr;
  listener.close();
  return port;
}

// ============================================================================
// PART 1: MANIFEST EVOLUTION (#1474) & PATH CONTAINMENT (#1473)
// ============================================================================

function isSafeExportPath(value: string): boolean {
  if (!value.startsWith('./') || value.includes('\\') || value.includes('\0')) {
    return false;
  }
  const segments = value.slice(2).split('/');
  if (segments.length === 0) {
    return false;
  }
  return segments.every((segment) => segment.length > 0 && segment !== '.' && segment !== '..');
}

const exportPathSchema = z.string().min(1).refine(isSafeExportPath, {
  message: 'Expected a relative package export path such as "./scaffold" without traversal.',
});

// Exact mirror of `packages/plugin/src/protocol/manifest.ts` with top-level `.strict()`
// relaxed to `.passthrough()` while keeping `schemaVersion: 1` and strict inner schemas.
const passthroughManifestObjectSchema = z.object({
  schemaVersion: z.literal(PLUGIN_MANIFEST_SCHEMA_VERSION),
  name: z.string().min(1),
  version: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().min(1),
  peerDependencies: z.record(z.string().min(1), z.string().min(1)),
  capabilities: z.object({
    hasDatabaseMigrations: z.boolean(),
    hasRoutes: z.boolean(),
    hasBackgroundWorkers: z.boolean(),
    supportsMcpScaffold: z.boolean().optional(),
  }).strict(),
  scaffolder: z.object({
    export: exportPathSchema,
    requiredPermissions: z.object({
      net: z.array(z.string().min(1)).readonly(),
      read: z.array(z.string().min(1)).readonly(),
      write: z.array(z.string().min(1)).readonly(),
    }).strict(),
  }).strict(),
  postScripts: z.array(z.object({
    export: exportPathSchema,
    args: z.array(z.string()).readonly().optional(),
  }).strict()).readonly().optional(),
  provider: z.object({
    kind: z.string().min(1),
    displayName: z.string().min(1),
    category: z.enum(['plugin', 'background-processor']),
    portRangeKey: z.string().min(1),
    defaultPermissions: z.array(z.string().min(1)).readonly(),
    watchFlag: z.string().min(1).optional(),
    defaultEntrypoint: z.string().min(1),
    defaultServiceEntrypoint: z.string().min(1).optional(),
    defaultRequiresDb: z.boolean(),
    defaultRequiresKv: z.boolean(),
    pluginType: z.enum(['background-processor', 'api', 'frontend', 'utility']),
    supportsConcurrency: z.boolean(),
    concurrencyEnvVar: z.string().min(1).nullable(),
    defaultConcurrency: z.number().int().positive().nullable(),
    defaultTelemetry: z.boolean(),
    infrastructureRequires: z.array(z.string().min(1)).readonly(),
    infrastructureOptionalDeps: z.array(z.string().min(1)).readonly(),
  }).strict().optional(),
  officialSource: z.object({
    canonicalName: z.string().min(1),
    pluginDir: z.string().min(1).optional(),
    backgroundDir: z.string().min(1).optional(),
    serviceEntrypoint: z.string().min(1).optional(),
    backgroundEntrypoint: z.string().min(1).optional(),
    doctorEntrypoint: z.string().min(1).optional(),
    serviceConfigKey: z.string().min(1).optional(),
    servicePort: z.number().int().nonnegative().optional(),
    backgroundPort: z.number().int().nonnegative().default(0),
    requiresDb: z.boolean().optional(),
    requiresKv: z.boolean().optional(),
    permissions: z.array(z.string().min(1)).readonly().optional(),
    dependencies: z.array(z.string().min(1)).readonly().optional(),
    pluginReferences: z.array(z.string().min(1)).readonly().optional(),
  }).strict().optional(),
  linking: z.object({
    canonicalName: z.string().min(1),
    resourceConfigKey: z.string().min(1),
    backgroundConfigKey: z.string().min(1).optional(),
    dependencies: z.array(z.string().min(1)).readonly().optional(),
    pluginReferences: z.array(z.string().min(1)).readonly().optional(),
    consumers: z.object({
      services: z.array(z.string().min(1)).readonly().optional(),
      apps: z.array(z.string().min(1)).readonly().optional(),
    }).strict(),
  }).strict().optional(),
  databaseRequirement: z.object({
    environmentVariable: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/),
    defaultValue: z.string().min(1),
    appsettingsPaths: z.array(z.array(z.string().min(1)).min(1).readonly()).readonly(),
    values: z.record(z.string().min(1), z.boolean()),
  }).strict().refine((value) => Object.hasOwn(value.values, value.defaultValue), {
    message: 'The default database selector must be declared in values.',
  }).optional(),
}).passthrough().superRefine((manifest, context) => {
  const serviceIdentityFields = [
    manifest.officialSource?.serviceEntrypoint,
    manifest.officialSource?.serviceConfigKey,
  ];
  const presentFields = serviceIdentityFields.filter((value) => value !== undefined).length;
  const portWithoutService = manifest.officialSource?.servicePort !== undefined &&
    presentFields === 0;
  if (
    (presentFields !== 0 && presentFields !== serviceIdentityFields.length) ||
    portWithoutService
  ) {
    context.addIssue({
      code: 'custom',
      path: ['officialSource'],
      message: 'PLUGIN_OFFICIAL_SOURCE_SERVICE_SHAPE_INCOMPLETE',
    });
  }
});

function parsePluginManifestPassthrough(json: unknown): PluginManifestParseResult {
  const schemaVersion = typeof json === 'object' && json !== null && 'schemaVersion' in json
    ? (json as { readonly schemaVersion?: unknown }).schemaVersion
    : undefined;
  if (schemaVersion !== undefined && schemaVersion !== PLUGIN_MANIFEST_SCHEMA_VERSION) {
    return {
      ok: false,
      error: {
        message:
          `Unsupported plugin manifest schemaVersion ${String(schemaVersion)}; expected ${PLUGIN_MANIFEST_SCHEMA_VERSION}.`,
        issues: [{ path: 'schemaVersion', message: 'Unsupported schema version.' }],
      },
    };
  }
  const result = passthroughManifestObjectSchema.safeParse(json);
  if (result.success) {
    return { ok: true, manifest: result.data as PluginInstallerManifest };
  }
  return {
    ok: false,
    error: {
      message: 'Plugin manifest validation failed.',
      issues: result.error.issues.map((issue) => ({
        path: issue.path.map(String).join('.') || '<root>',
        message: issue.message,
      })),
    },
  };
}

const FrontendPointerSchema = z.object({
  export: exportPathSchema,
  framework: z.literal('fresh'),
}).strict();

type FrontendPointerValidationResult =
  | { readonly ok: true; readonly pointer: { readonly export: string; readonly framework: 'fresh' } | null }
  | {
    readonly ok: false;
    readonly error: {
      readonly code: 'FRONTEND_POINTER_INVALID';
      readonly pluginName: string;
      readonly issues: readonly { readonly path: string; readonly message: string }[];
    };
  };

function validateFrontendPointerAtGenerateTime(
  rawManifest: unknown,
  pluginName: string,
): FrontendPointerValidationResult {
  if (typeof rawManifest !== 'object' || rawManifest === null || !('frontend' in rawManifest)) {
    return { ok: true, pointer: null };
  }
  const rawFrontend = Reflect.get(rawManifest, 'frontend');
  if (rawFrontend === undefined) {
    return { ok: true, pointer: null };
  }
  const parsed = FrontendPointerSchema.safeParse(rawFrontend);
  if (parsed.success) {
    return { ok: true, pointer: parsed.data };
  }
  return {
    ok: false,
    error: {
      code: 'FRONTEND_POINTER_INVALID',
      pluginName,
      issues: parsed.error.issues.map((issue) => ({
        path: ['frontend', ...issue.path.map(String)].join('.'),
        message: issue.message,
      })),
    },
  };
}

// #1473 Path containment helpers
const MOUNT_ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

function assertCleanPathToken(value: string, label: string): void {
  if (value.length === 0) {
    throw new Error(`PATH_CONTAINMENT_REJECTED: ${label} cannot be empty`);
  }
  if (value.includes('\0')) {
    throw new Error(`PATH_CONTAINMENT_REJECTED: ${label} contains null byte`);
  }
  if (value.includes('\\')) {
    throw new Error(`PATH_CONTAINMENT_REJECTED: ${label} contains backslash`);
  }
  if (/^[A-Za-z]:/.test(value) || value.startsWith('/')) {
    throw new Error(`PATH_CONTAINMENT_REJECTED: ${label} must not be an absolute or drive-prefixed path`);
  }
  if (/%2e|%2f|%5c/i.test(value)) {
    throw new Error(`PATH_CONTAINMENT_REJECTED: ${label} contains percent-encoded path delimiter`);
  }
}

function validateMountId(mountId: string): string {
  assertCleanPathToken(mountId, 'mountId');
  if (!MOUNT_ID_PATTERN.test(mountId)) {
    throw new Error(
      `PATH_CONTAINMENT_REJECTED: invalid mountId "${mountId}" (expected lowercase slug)`,
    );
  }
  return mountId;
}

function assertLexicallyContained(root: string, candidate: string): string {
  const resolvedRoot = resolve(root);
  const resolvedCandidate = resolve(candidate);
  const rel = relative(resolvedRoot, resolvedCandidate);
  if (
    rel === '' ||
    isAbsolute(rel) ||
    rel === '..' ||
    rel.startsWith('../') ||
    rel.startsWith('..\\')
  ) {
    throw new Error(`PATH_CONTAINMENT_REJECTED: "${candidate}" escapes root "${root}"`);
  }
  return resolvedCandidate;
}

async function physicalPath(path: string): Promise<string> {
  const normalized = resolve(path);
  try {
    await Deno.lstat(normalized);
    return await Deno.realPath(normalized);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
    const parent = resolve(normalized, '..');
    if (parent === normalized) throw error;
    const base = normalized.slice(parent.length).replace(/^[/\\]+/, '');
    return join(await physicalPath(parent), base);
  }
}

async function assertPhysicalContainment(root: string, target: string): Promise<string> {
  const realRoot = await physicalPath(root);
  const realTarget = await physicalPath(target);
  const rel = relative(realRoot, realTarget);
  if (
    rel === '' ||
    isAbsolute(rel) ||
    rel === '..' ||
    rel.startsWith('../') ||
    rel.startsWith('..\\')
  ) {
    throw new Error(
      `PATH_CONTAINMENT_REJECTED: symlink or physical path "${target}" escapes root "${root}"`,
    );
  }
  return realTarget;
}

async function deriveGeneratedArtifactPath(
  projectRoot: string,
  familyDir: string,
  mountId: string,
  fileName: string,
): Promise<string> {
  assertCleanPathToken(familyDir, 'familyDir');
  if (familyDir.includes('/') || familyDir === '.' || familyDir === '..') {
    throw new Error(`PATH_CONTAINMENT_REJECTED: invalid familyDir "${familyDir}"`);
  }
  const safeMountId = validateMountId(mountId);
  assertCleanPathToken(fileName, 'fileName');
  if (fileName.includes('/') || fileName === '.' || fileName === '..') {
    throw new Error(`PATH_CONTAINMENT_REJECTED: invalid generated fileName "${fileName}"`);
  }
  const generatedBase = resolve(projectRoot, '.netscript', 'generated', familyDir);
  const target = resolve(generatedBase, safeMountId, fileName);
  assertLexicallyContained(generatedBase, target);
  await assertPhysicalContainment(resolve(projectRoot, '.netscript', 'generated'), target);
  return target;
}

async function resolveContainedModuleRef(packageRoot: string, moduleRef: string): Promise<string> {
  if (typeof moduleRef !== 'string' || !moduleRef.startsWith('./')) {
    throw new Error(`PATH_CONTAINMENT_REJECTED: ModuleRef must start with "./": ${String(moduleRef)}`);
  }
  if (moduleRef.includes('\0') || moduleRef.includes('\\') || /[?#]/.test(moduleRef)) {
    throw new Error(`PATH_CONTAINMENT_REJECTED: unsafe character in ModuleRef: ${moduleRef}`);
  }
  if (/%2e|%2f|%5c/i.test(moduleRef)) {
    throw new Error(`PATH_CONTAINMENT_REJECTED: percent-encoded traversal in ModuleRef: ${moduleRef}`);
  }
  const subPath = moduleRef.slice(2);
  if (subPath.length === 0) {
    throw new Error('PATH_CONTAINMENT_REJECTED: empty ModuleRef');
  }
  const segments = subPath.split('/');
  if (segments.some((s) => s.length === 0 || s === '.' || s === '..')) {
    throw new Error(`PATH_CONTAINMENT_REJECTED: invalid segment in ModuleRef: ${moduleRef}`);
  }
  const target = resolve(packageRoot, subPath);
  assertLexicallyContained(packageRoot, target);
  await assertPhysicalContainment(packageRoot, target);
  return target;
}

probeTest('1.1 [#1474 baseline]: real parsePluginManifest (.strict()) rejects unknown top-level "frontend" block', async () => {
  const shippedAuth = JSON.parse(
    await Deno.readTextFile(join(REPO_ROOT, 'plugins/auth/scaffold.plugin.json')),
  );
  const shippedWorkers = JSON.parse(
    await Deno.readTextFile(join(REPO_ROOT, 'plugins/workers/scaffold.plugin.json')),
  );

  // Baseline manifests parse cleanly without frontend block.
  assertEquals(parsePluginManifest(shippedAuth).ok, true);
  assertEquals(parsePluginManifest(shippedWorkers).ok, true);

  // Adding a valid #890/#1474 frontend pointer block hard-fails under shipped .strict().
  const withFrontend = {
    ...shippedAuth,
    frontend: { export: './frontend', framework: 'fresh' },
  };
  const strictResult = parsePluginManifest(withFrontend);
  assertEquals(strictResult.ok, false);
  if (strictResult.ok) return;
  assertStringIncludes(strictResult.error.message, 'validation failed');
  assert(
    strictResult.error.issues.some((issue) =>
      issue.path === '<root>' && issue.message.toLowerCase().includes('unrecognized key')
    ),
    `Expected unrecognized key issue for "frontend", got: ${JSON.stringify(strictResult.error.issues)}`,
  );
});

probeTest('1.2 [#1474 evolution]: .passthrough() (schemaVersion: 1) parses cleanly while generate-time validator catches malformed frontend block', async () => {
  const shippedAuth = JSON.parse(
    await Deno.readTextFile(join(REPO_ROOT, 'plugins/auth/scaffold.plugin.json')),
  );

  // 1) Valid frontend pointer passes manifest parse under .passthrough() keeping schemaVersion: 1.
  const validWithFrontend = {
    ...shippedAuth,
    frontend: { export: './frontend', framework: 'fresh' },
  };
  const parsedValid = parsePluginManifestPassthrough(validWithFrontend);
  assertEquals(parsedValid.ok, true);
  if (!parsedValid.ok) return;
  assertEquals(parsedValid.manifest.schemaVersion, 1);
  assertEquals(parsedValid.manifest.name, '@netscript/plugin-auth');
  const genValid = validateFrontendPointerAtGenerateTime(validWithFrontend, parsedValid.manifest.name);
  assertEquals(genValid.ok, true);
  if (genValid.ok) {
    assertEquals(genValid.pointer, { export: './frontend', framework: 'fresh' });
  }

  // 2) Old manifest without frontend pointer passes both parse and generate-time (absence !== error).
  const parsedLegacy = parsePluginManifestPassthrough(shippedAuth);
  assertEquals(parsedLegacy.ok, true);
  const genLegacy = validateFrontendPointerAtGenerateTime(shippedAuth, shippedAuth.name);
  assertEquals(genLegacy, { ok: true, pointer: null });

  // 3) Malformed frontend pointer DOES NOT fail installer manifest parse, but fails strictly at generate time!
  const malformedPointerFixtures = [
    { export: '../escape', framework: 'fresh' },
    { export: './frontend', framework: 'react' },
    { export: './frontend', framework: 'fresh', unknownFlag: true },
    'not-an-object',
  ];
  for (const badFrontend of malformedPointerFixtures) {
    const manifestWithBadFrontend = { ...shippedAuth, frontend: badFrontend };
    const manifestResult = parsePluginManifestPassthrough(manifestWithBadFrontend);
    assertEquals(manifestResult.ok, true, 'passthrough must not crash whole plugin parse');

    const genResult = validateFrontendPointerAtGenerateTime(
      manifestWithBadFrontend,
      shippedAuth.name,
    );
    assertEquals(genResult.ok, false, `expected generate-time rejection for ${JSON.stringify(badFrontend)}`);
    if (!genResult.ok) {
      assertEquals(genResult.error.code, 'FRONTEND_POINTER_INVALID');
      assertEquals(genResult.error.pluginName, '@netscript/plugin-auth');
      assert(genResult.error.issues.every((i) => i.path.startsWith('frontend')));
    }
  }

  // 4) Unsupported schemaVersion or malformed core fields still fail manifest parse.
  assertEquals(parsePluginManifestPassthrough({ ...shippedAuth, schemaVersion: 2 }).ok, false);
  assertEquals(
    parsePluginManifestPassthrough({
      ...shippedAuth,
      scaffolder: { ...shippedAuth.scaffolder, export: '../escape' },
    }).ok,
    false,
  );
});

probeTest('1.3 [#1473 containment]: rejects ../ traversal, backslashes, null bytes, absolute paths, smuggling, and symlink escapes', async () => {
  const tempDir = await Deno.makeTempDir({ prefix: 'probe-c-contain-' });
  const projectRoot = join(tempDir, 'project');
  const outsideRoot = join(tempDir, 'outside');
  const packageRoot = join(tempDir, 'plugin-pkg');
  await Deno.mkdir(join(projectRoot, '.netscript', 'generated'), { recursive: true });
  await Deno.mkdir(outsideRoot, { recursive: true });
  await Deno.mkdir(join(packageRoot, 'routes'), { recursive: true });

  try {
    // Baseline verification: naive resolveTarget-style join/isAbsolute (packages/cli/.../ui/registry.ts:310-317)
    // permits absolute paths and escaping relative paths.
    const naiveResolveTarget = (root: string, target: string): string =>
      isAbsolute(target) ? target : resolve(root, target);
    assertEquals(naiveResolveTarget(projectRoot, '/etc/passwd'), '/etc/passwd');
    assertEquals(
      relative(projectRoot, naiveResolveTarget(projectRoot, '../../outside/pwn.ts')).startsWith('..'),
      true,
    );

    // Contained generated artifact path succeeds for valid inputs.
    const validGen = await deriveGeneratedArtifactPath(
      projectRoot,
      'frontend',
      'acme-crons',
      'frontend.registry.ts',
    );
    assertEquals(
      validGen,
      resolve(projectRoot, '.netscript', 'generated', 'frontend', 'acme-crons', 'frontend.registry.ts'),
    );

    // Reject escaping mountId / fileName / familyDir attacks.
    const badMountIds = [
      '../escape',
      'a/../../escape',
      '..',
      '.',
      'crons\\evil',
      '..\\escape',
      'crons\0null',
      '/etc/passwd',
      'C:\\Windows\\System32',
      'C:/evil',
      '//unc/share',
      '%2e%2e',
      'crons/nested',
      'BadUpperCase',
    ];
    for (const badId of badMountIds) {
      await assertRejects(
        () => deriveGeneratedArtifactPath(projectRoot, 'frontend', badId, 'frontend.registry.ts'),
        Error,
        'PATH_CONTAINMENT_REJECTED',
      );
    }

    const badFileNames = [
      '../evil.ts',
      'sub/nested.ts',
      'evil\\file.ts',
      'file\0.ts',
      '/etc/shadow',
      'C:\\evil.ts',
    ];
    for (const badFile of badFileNames) {
      await assertRejects(
        () => deriveGeneratedArtifactPath(projectRoot, 'frontend', 'crons', badFile),
        Error,
        'PATH_CONTAINMENT_REJECTED',
      );
    }

    // Reject unsafe ModuleRefs.
    const validMod = await resolveContainedModuleRef(packageRoot, './routes/calendar.tsx');
    assertEquals(validMod, resolve(packageRoot, 'routes', 'calendar.tsx'));

    const badModuleRefs = [
      '../outside.ts',
      './routes/../../outside.ts',
      './routes\\calendar.tsx',
      '.\\routes\\calendar.tsx',
      './routes/cal\0.tsx',
      '/etc/passwd',
      'C:/Windows/win.ini',
      'C:\\Windows\\win.ini',
      'routes/missing-dot-slash.tsx',
      './routes/calendar.tsx?evil=1',
      './routes/calendar.tsx#hash',
      './%2e%2e/outside.ts',
      './',
      './.',
    ];
    for (const badRef of badModuleRefs) {
      await assertRejects(
        () => resolveContainedModuleRef(packageRoot, badRef),
        Error,
        'PATH_CONTAINMENT_REJECTED',
      );
    }

    // Physical symlink escape check: symlink inside .netscript/generated/frontend -> outsideRoot.
    const symlinkDir = join(projectRoot, '.netscript', 'generated', 'frontend');
    await Deno.symlink(outsideRoot, symlinkDir);
    await assertRejects(
      () => deriveGeneratedArtifactPath(projectRoot, 'frontend', 'crons', 'frontend.registry.ts'),
      Error,
      'PATH_CONTAINMENT_REJECTED',
    );
    const outsideEntries = [];
    for await (const entry of Deno.readDir(outsideRoot)) {
      outsideEntries.push(entry.name);
    }
    assertEquals(outsideEntries, []);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

// ============================================================================
// PART 2: DENY-BY-DEFAULT PROCEDURE GATEWAY + RFC 0009 STREAM COMPOSITION (P5)
// ============================================================================

export interface PrincipalPort {
  resolve(request: Request, signal: AbortSignal): Promise<Principal | null>;
}

export interface GatewayAuditEntry {
  readonly mountId: string;
  readonly procedure: string;
  readonly subject: string | null;
  readonly status: number;
  readonly outcome: 'allow' | 'deny' | 'error';
  readonly reason?: string;
  readonly correlationId: string;
}

interface GeneratedGatewayRoute {
  readonly procedureId: string;
  readonly method: string;
  readonly upstreamPath: string;
  readonly indexed: IndexedProcedure;
  readonly cachePolicy: 'no-store' | 'default' | 'force-cache';
}

function generateGatewayRouteTable(options: {
  readonly mountId: string;
  readonly contract: Record<string, unknown>;
  readonly requiresProcedures: readonly string[];
}): ReadonlyMap<string, GeneratedGatewayRoute> {
  const safeMountId = validateMountId(options.mountId);
  const compiled = compileProcedures(options.contract as Parameters<typeof compileProcedures>[0]);
  const byId = new Map<string, IndexedProcedure>();
  for (const proc of compiled) {
    byId.set(proc.routerPath.join('.'), proc);
  }

  const routes = new Map<string, GeneratedGatewayRoute>();
  for (const procId of options.requiresProcedures) {
    const proc = byId.get(procId);
    if (!proc) {
      throw new Error(
        `GATEWAY_GENERATION_ERROR: requires.procedures references unknown procedure "${procId}" for mount "${safeMountId}"`,
      );
    }
    if (proc.policy?.audience === 'internal') {
      throw new Error(
        `GATEWAY_INTERNAL_AUDIENCE_FORBIDDEN: internal-audience procedure "${procId}" cannot be exposed on browser gateway "${safeMountId}"`,
      );
    }
    if (routes.has(procId)) {
      throw new Error(`GATEWAY_GENERATION_ERROR: duplicate procedure "${procId}"`);
    }
    // Extract optional policy.cache directly from the contract procedure node (since
    // compileProcedures normalizes access policy).
    let node: unknown = options.contract;
    for (const seg of proc.routerPath) {
      node = typeof node === 'object' && node !== null ? Reflect.get(node, seg) : undefined;
    }
    const meta = (typeof node === 'object' && node !== null && '~orpc' in node)
      ? (Reflect.get(Reflect.get(node, '~orpc') as object, 'meta') as NetScriptProcedureMeta | undefined)
      : undefined;

    routes.set(procId, {
      procedureId: procId,
      method: proc.restMethod.toUpperCase(),
      upstreamPath: proc.restPattern,
      indexed: proc,
      cachePolicy: meta?.policy?.cache ?? 'no-store',
    });
  }
  return routes;
}

const STATIC_HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'content-encoding',
  'content-length',
]);

const GATEWAY_RESPONSE_HEADER_ALLOWLIST = new Set([
  'content-type',
  'etag',
  'x-request-id',
  'traceparent',
  'tracestate',
]);

function parseDynamicConnectionHeaders(headers: Headers): Set<string> {
  const hop = new Set(STATIC_HOP_BY_HOP_HEADERS);
  for (const [name, value] of headers.entries()) {
    if (name.toLowerCase() === 'connection') {
      for (const token of value.split(',')) {
        const trimmed = token.trim().toLowerCase();
        if (trimmed) hop.add(trimmed);
      }
    }
  }
  return hop;
}

function buildSanitizedGatewayResponseHeaders(
  upstreamHeaders: Headers,
  cachePolicy: 'no-store' | 'default' | 'force-cache',
): Headers {
  const dynamicHop = parseDynamicConnectionHeaders(upstreamHeaders);
  const out = new Headers();
  for (const [name, value] of upstreamHeaders.entries()) {
    const lower = name.toLowerCase();
    if (dynamicHop.has(lower)) continue;
    if (GATEWAY_RESPONSE_HEADER_ALLOWLIST.has(lower)) {
      out.set(lower, value);
    }
  }
  out.set('x-content-type-options', 'nosniff');
  out.set('cache-control', cachePolicy === 'force-cache' ? 'private, max-age=60' : 'no-store');
  out.set('vary', 'Origin, Cookie, Authorization, Sec-Fetch-Site');
  return out;
}

function isMutatingMethod(method: string): boolean {
  return method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
}

function checkCsrfAndOrigin(
  request: Request,
  hostOrigin: string,
  requireOriginOnMutation = true,
): { readonly ok: true } | { readonly ok: false; readonly reason: string } {
  const origin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');
  const fetchDest = request.headers.get('sec-fetch-dest');

  if (origin === 'null') {
    return { ok: false, reason: 'opaque_origin_denied' };
  }
  if (origin !== null && origin !== hostOrigin) {
    return { ok: false, reason: 'cross_origin_denied' };
  }
  if (fetchSite !== null) {
    if (fetchSite === 'cross-site' || fetchSite === 'same-site' || fetchSite === 'none') {
      return { ok: false, reason: `fetch_site_${fetchSite}_denied` };
    }
    if (fetchSite !== 'same-origin') {
      return { ok: false, reason: 'unrecognized_fetch_site_denied' };
    }
  }
  if (fetchDest !== null && ['document', 'iframe', 'frame', 'script'].includes(fetchDest)) {
    return { ok: false, reason: `fetch_dest_${fetchDest}_denied` };
  }
  if (requireOriginOnMutation && isMutatingMethod(request.method.toUpperCase()) && origin === null) {
    return { ok: false, reason: 'missing_origin_on_mutation' };
  }
  return { ok: true };
}

async function readBoundedBody(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number,
): Promise<{ readonly ok: true; readonly bytes: Uint8Array<ArrayBuffer> } | { readonly ok: false }> {
  if (!body) return { ok: true, bytes: new Uint8Array(new ArrayBuffer(0)) };
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel('size-limit-exceeded').catch(() => {});
        return { ok: false };
      }
      chunks.push(value);
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // ignore if already released
    }
  }
  const merged = new Uint8Array(new ArrayBuffer(total));
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, bytes: merged };
}

function rawUrlPathname(requestUrl: string): string {
  const start = requestUrl.indexOf('/', requestUrl.indexOf('//') + 2);
  if (start < 0) return '/';
  const end = requestUrl.slice(start).search(/[?#]/);
  return end < 0 ? requestUrl.slice(start) : requestUrl.slice(start, start + end);
}

function createPluginGatewayHandler(options: {
  readonly mountId: string;
  readonly routes: ReadonlyMap<string, GeneratedGatewayRoute>;
  readonly hostOrigin: string;
  readonly serviceOrigin: string;
  readonly principalPort: PrincipalPort;
  readonly getServerUpstreamAuth: () => Record<string, string>;
  readonly maxRequestBytes?: number;
  readonly maxResponseBytes?: number;
  readonly timeoutMs?: number;
  readonly auditLog?: (entry: GatewayAuditEntry) => void;
  readonly fetchImpl?: typeof fetch;
}): (request: Request) => Promise<Response> {
  const safeMountId = validateMountId(options.mountId);
  const gatewayPrefix = `/api/plugins/${safeMountId}/`;
  const maxReqBytes = options.maxRequestBytes ?? 64 * 1024;
  const maxResBytes = options.maxResponseBytes ?? 512 * 1024;
  const timeoutMs = options.timeoutMs ?? 5_000;
  const doFetch = options.fetchImpl ?? fetch;

  const emitAudit = (entry: Omit<GatewayAuditEntry, 'mountId'>) => {
    options.auditLog?.({ mountId: safeMountId, ...entry });
  };

  return async (request: Request): Promise<Response> => {
    const correlationId = request.headers.get('x-correlation-id') ?? crypto.randomUUID();
    const rawPath = rawUrlPathname(request.url);

    // Reject encoded traversal / slash smuggling before matching.
    if (/%2e|%2f|%5c|\.\.|\\/i.test(rawPath)) {
      emitAudit({
        procedure: '<invalid>',
        subject: null,
        status: 400,
        outcome: 'deny',
        reason: 'invalid_path_encoding',
        correlationId,
      });
      return Response.json({ error: 'BAD_REQUEST', reason: 'invalid_path_encoding' }, { status: 400 });
    }

    if (!rawPath.startsWith(gatewayPrefix)) {
      emitAudit({
        procedure: '<unmatched>',
        subject: null,
        status: 404,
        outcome: 'deny',
        reason: 'procedure_not_found',
        correlationId,
      });
      return Response.json({ error: 'NOT_FOUND', reason: 'procedure_not_found' }, { status: 404 });
    }

    const procedureId = rawPath.slice(gatewayPrefix.length);
    const route = options.routes.get(procedureId);
    if (!route) {
      // Zero wildcard forwarding: non-granted or unknown procedures 404 immediately.
      emitAudit({
        procedure: procedureId || '<empty>',
        subject: null,
        status: 404,
        outcome: 'deny',
        reason: 'procedure_not_granted',
        correlationId,
      });
      return Response.json({ error: 'NOT_FOUND', reason: 'procedure_not_granted' }, { status: 404 });
    }

    const method = request.method.toUpperCase();
    if (method !== route.method) {
      emitAudit({
        procedure: procedureId,
        subject: null,
        status: 405,
        outcome: 'deny',
        reason: 'method_not_allowed',
        correlationId,
      });
      return Response.json(
        { error: 'METHOD_NOT_ALLOWED', reason: 'method_not_allowed' },
        { status: 405, headers: { Allow: route.method } },
      );
    }

    // CSRF / Origin check on mutating requests (and Fetch Metadata check).
    const csrf = checkCsrfAndOrigin(request, options.hostOrigin);
    if (!csrf.ok) {
      emitAudit({
        procedure: procedureId,
        subject: null,
        status: 403,
        outcome: 'deny',
        reason: csrf.reason,
        correlationId,
      });
      return Response.json({ error: 'FORBIDDEN', reason: csrf.reason }, { status: 403 });
    }

    // Server-side PrincipalPort authentication + NetScriptProcedureMeta authorization.
    let principal: Principal | null = null;
    if (route.indexed.policy?.authentication !== 'none') {
      principal = await options.principalPort.resolve(request, request.signal);
      if (!principal) {
        emitAudit({
          procedure: procedureId,
          subject: null,
          status: 401,
          outcome: 'deny',
          reason: 'unauthenticated',
          correlationId,
        });
        return Response.json({ error: 'UNAUTHORIZED', reason: 'unauthenticated' }, { status: 401 });
      }
      const decision = route.indexed.policy
        ? authorizeProcedurePolicy(
          { principal, method, path: rawPath, rawPath },
          route.indexed.policy,
          isInternalServicePrincipal,
        )
        : { allow: false as const, reason: 'authz.missing_policy' };
      if (!decision.allow) {
        emitAudit({
          procedure: procedureId,
          subject: principal.subject,
          status: 403,
          outcome: 'deny',
          reason: decision.reason,
          correlationId,
        });
        return Response.json({ error: 'FORBIDDEN', reason: decision.reason }, { status: 403 });
      }
    }

    // Request body size limit (both declared Content-Length and streaming body check).
    const contentLengthHeader = request.headers.get('content-length');
    if (contentLengthHeader !== null) {
      const parsedLen = Number(contentLengthHeader);
      if (!Number.isFinite(parsedLen) || parsedLen < 0 || parsedLen > maxReqBytes) {
        emitAudit({
          procedure: procedureId,
          subject: principal?.subject ?? null,
          status: 413,
          outcome: 'deny',
          reason: 'request_body_too_large',
          correlationId,
        });
        return Response.json({ error: 'PAYLOAD_TOO_LARGE', reason: 'request_body_too_large' }, { status: 413 });
      }
    }

    const reqBody = method === 'GET' || method === 'HEAD'
      ? { ok: true as const, bytes: new Uint8Array(new ArrayBuffer(0)) }
      : await readBoundedBody(request.body, maxReqBytes);
    if (!reqBody.ok) {
      emitAudit({
        procedure: procedureId,
        subject: principal?.subject ?? null,
        status: 413,
        outcome: 'deny',
        reason: 'request_body_too_large',
        correlationId,
      });
      return Response.json({ error: 'PAYLOAD_TOO_LARGE', reason: 'request_body_too_large' }, { status: 413 });
    }

    // Build allowlisted upstream request headers (NEVER forward browser Cookie / Authorization).
    const upstreamHeaders = new Headers();
    upstreamHeaders.set('accept', 'application/json');
    const reqContentType = request.headers.get('content-type');
    if (reqContentType) upstreamHeaders.set('content-type', reqContentType);
    const traceparent = request.headers.get('traceparent');
    if (traceparent) upstreamHeaders.set('traceparent', traceparent);
    upstreamHeaders.set('x-correlation-id', correlationId);
    upstreamHeaders.set('x-netscript-subject', principal?.subject ?? 'anonymous');
    for (const [k, v] of Object.entries(options.getServerUpstreamAuth())) {
      upstreamHeaders.set(k, v);
    }

    const upstreamUrl = new URL(route.upstreamPath, options.serviceOrigin);
    // Preserve non-url query params? Only if safe; never read upstream URL from input.
    const incomingUrl = new URL(request.url);
    for (const [k, v] of incomingUrl.searchParams) {
      upstreamUrl.searchParams.append(k, v);
    }

    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort(new DOMException('Gateway upstream timeout', 'TimeoutError'));
    }, timeoutMs);
    const onClientAbort = () => controller.abort(request.signal.reason);
    if (request.signal.aborted) {
      onClientAbort();
    } else {
      request.signal.addEventListener('abort', onClientAbort, { once: true });
    }

    try {
      const upstreamReq = new Request(upstreamUrl.href, {
        method,
        headers: upstreamHeaders,
        body: reqBody.bytes.byteLength > 0 ? reqBody.bytes : undefined,
        redirect: 'manual',
        signal: controller.signal,
      });
      const upstreamRes = await doFetch(upstreamReq);

      // Manual redirect enforcement: never follow 3xx or leak Location.
      if (upstreamRes.status >= 300 && upstreamRes.status < 400) {
        await upstreamRes.body?.cancel('redirect-disallowed').catch(() => {});
        emitAudit({
          procedure: procedureId,
          subject: principal?.subject ?? null,
          status: 502,
          outcome: 'error',
          reason: 'upstream_redirect_rejected',
          correlationId,
        });
        return Response.json(
          { error: 'BAD_GATEWAY', reason: 'upstream_redirect_rejected' },
          { status: 502 },
        );
      }

      const resBody = await readBoundedBody(upstreamRes.body, maxResBytes);
      if (!resBody.ok) {
        emitAudit({
          procedure: procedureId,
          subject: principal?.subject ?? null,
          status: 502,
          outcome: 'error',
          reason: 'response_body_too_large',
          correlationId,
        });
        return Response.json(
          { error: 'BAD_GATEWAY', reason: 'response_body_too_large' },
          { status: 502 },
        );
      }

      const headers = buildSanitizedGatewayResponseHeaders(upstreamRes.headers, route.cachePolicy);
      emitAudit({
        procedure: procedureId,
        subject: principal?.subject ?? null,
        status: upstreamRes.status,
        outcome: upstreamRes.ok ? 'allow' : 'error',
        correlationId,
      });
      return new Response(resBody.bytes, {
        status: upstreamRes.status,
        headers,
      });
    } catch {
      if (timedOut) {
        emitAudit({
          procedure: procedureId,
          subject: principal?.subject ?? null,
          status: 504,
          outcome: 'error',
          reason: 'upstream_timeout',
          correlationId,
        });
        return Response.json({ error: 'GATEWAY_TIMEOUT', reason: 'upstream_timeout' }, { status: 504 });
      }
      emitAudit({
        procedure: procedureId,
        subject: principal?.subject ?? null,
        status: 502,
        outcome: 'error',
        reason: request.signal.aborted ? 'client_aborted' : 'upstream_error',
        correlationId,
      });
      return Response.json(
        { error: 'BAD_GATEWAY', reason: request.signal.aborted ? 'client_aborted' : 'upstream_error' },
        { status: 502 },
      );
    } finally {
      clearTimeout(timer);
      request.signal.removeEventListener('abort', onClientAbort);
    }
  };
}

// Contract fixture built with real `baseContract` + `NetScriptProcedureMeta`.
const CRON_READ_META = {
  access: {
    authentication: 'required',
    authorization: { scopes: ['crons:read'] },
  },
  policy: { cache: 'no-store' },
} as const satisfies NetScriptProcedureMeta;

const CRON_WRITE_META = {
  access: {
    authentication: 'required',
    authorization: { scopes: ['crons:write'], roles: ['operator'] },
  },
} as const satisfies NetScriptProcedureMeta;

const CRON_ADMIN_META = {
  access: {
    authentication: 'required',
    authorization: { scopes: ['crons:admin'] },
  },
} as const satisfies NetScriptProcedureMeta;

const CRON_INTERNAL_META = {
  access: {
    authentication: 'required',
    audience: 'internal',
  },
} as const satisfies NetScriptProcedureMeta;

const cronsContract = {
  list: baseContract
    .route({ method: 'GET', path: '/crons' })
    .meta(CRON_READ_META)
    .output(z.object({ jobs: z.array(z.string()) })),
  pause: baseContract
    .route({ method: 'POST', path: '/crons/pause' })
    .meta(CRON_WRITE_META)
    .input(z.object({ jobId: z.string().min(1) }))
    .output(z.object({ paused: z.boolean() })),
  deleteAll: baseContract
    .route({ method: 'POST', path: '/crons/delete-all' })
    .meta(CRON_ADMIN_META)
    .output(z.object({ deleted: z.number() })),
  internalSync: baseContract
    .route({ method: 'POST', path: '/crons/internal-sync' })
    .meta(CRON_INTERNAL_META)
    .output(z.object({ synced: z.boolean() })),
  tailEvents: oc
    .$meta<NetScriptProcedureMeta>(CRON_READ_META)
    .route({ method: 'GET', path: '/crons/tail' })
    .output(eventIterator(z.object({ tick: z.number() }))),
};

probeTest('2.1 [P5 gateway]: real authContract + cronsContract compilation and internal-audience rejection', () => {
  // Real repo authContract compiles cleanly via compileProcedures.
  const compiledAuth = compileProcedures(authContract);
  const revokeProc = compiledAuth.find((p) => p.routerPath.join('.') === 'revokeSession');
  assertExists(revokeProc);
  assertEquals(revokeProc.restMethod, 'POST');
  assertEquals(revokeProc.policy?.authentication, 'required');
  assertEquals(revokeProc.policy?.requiredScopes, ['auth:sessions:revoke']);

  // Gateway generator compiles only granted procedures.
  const routes = generateGatewayRouteTable({
    mountId: 'crons',
    contract: cronsContract,
    requiresProcedures: ['list', 'pause'],
  });
  assertEquals([...routes.keys()], ['list', 'pause']);
  assertEquals(routes.get('list')?.method, 'GET');
  assertEquals(routes.get('pause')?.method, 'POST');

  // Verify SDK stable-v1 adapter's normalizeProcedureMeta currently drops scopes/roles/audience
  // compared to compileProcedures — proving the gateway generator must consume full NetScriptProcedureMeta.
  const sdkMetaPort = createStableV1ProcedureMetadataPort();
  const sdkDesc = sdkMetaPort.describe(cronsContract.pause, ['pause']);
  assertEquals(sdkDesc.meta.access?.authentication, 'required');
  assertEquals(sdkDesc.meta.access?.authorization, undefined);

  // Internal-audience procedure MUST be rejected at generation time.
  assertThrows(
    () =>
      generateGatewayRouteTable({
        mountId: 'crons',
        contract: cronsContract,
        requiresProcedures: ['internalSync'],
      }),
    Error,
    'GATEWAY_INTERNAL_AUDIENCE_FORBIDDEN',
  );
});

probeTest('2.2 [P5 gateway]: deny-by-default, PrincipalPort auth (no browser Cookie/Auth leak), CSRF, redirect manual, response-header allowlist, audit log', async () => {
  const routes = generateGatewayRouteTable({
    mountId: 'crons',
    contract: cronsContract,
    requiresProcedures: ['list', 'pause'],
  });

  let upstreamHitCount = 0;
  let lastUpstreamHeaders: Headers | undefined;
  let lastUpstreamPath = '';

  const upstreamAc = new AbortController();
  const upstreamPort = getFreePort();
  const upstreamServer = Deno.serve(
    { port: upstreamPort, hostname: '127.0.0.1', signal: upstreamAc.signal, onListen() {} },
    async (req) => {
      upstreamHitCount += 1;
      lastUpstreamHeaders = new Headers(req.headers);
      const url = new URL(req.url);
      lastUpstreamPath = url.pathname;
      if (url.searchParams.get('triggerRedirect') === '1') {
        return new Response(null, {
          status: 302,
          headers: { location: 'https://evil.example/steal-token' },
        });
      }
      if (url.pathname === '/crons') {
        return Response.json(
          { jobs: ['nightly-rollup'] },
          {
            headers: {
              'content-type': 'application/json',
              'x-request-id': 'req-42',
              'etag': '"v1"',
              'connection': 'keep-alive, etag',
              'set-cookie': 'upstream_session=leaked',
              'www-authenticate': 'Bearer realm="internal"',
              'access-control-allow-origin': '*',
              'x-internal-secret': 'should-never-leak',
            },
          },
        );
      }
      if (url.pathname === '/crons/pause') {
        await req.text();
        return Response.json({ paused: true }, { headers: { 'x-request-id': 'req-pause' } });
      }
      return new Response('unexpected', { status: 500 });
    },
  );

  const audits: GatewayAuditEntry[] = [];
  const BROWSER_COOKIE = 'ns_sess=browser-cookie-secret-999';
  const BROWSER_BEARER = 'Bearer browser-token-secret-888';
  const SERVER_SVC_SECRET = 'Bearer internal-gateway-secret-777';

  const principalPort: PrincipalPort = {
    resolve(req) {
      const cookie = req.headers.get('cookie') ?? '';
      if (cookie.includes('operator=1')) {
        return Promise.resolve({
          subject: 'user:op-1',
          scopes: ['crons:read', 'crons:write'],
          roles: ['operator'],
          scheme: 'custom',
          claims: {},
        });
      }
      if (cookie.includes('viewer=1')) {
        return Promise.resolve({
          subject: 'user:view-2',
          scopes: ['crons:read'],
          roles: ['viewer'],
          scheme: 'custom',
          claims: {},
        });
      }
      return Promise.resolve(null);
    },
  };

  const gateway = createPluginGatewayHandler({
    mountId: 'crons',
    routes,
    hostOrigin: 'https://app.example.test',
    serviceOrigin: `http://127.0.0.1:${upstreamPort}`,
    principalPort,
    getServerUpstreamAuth: () => ({ authorization: SERVER_SVC_SECRET }),
    auditLog: (entry) => audits.push(entry),
  });

  try {
    // 1. Non-granted procedure (deleteAll exists on backend, not in requires.procedures) -> 404, zero upstream hits.
    const rUnGranted = await gateway(
      new Request('https://app.example.test/api/plugins/crons/deleteAll', {
        method: 'POST',
        headers: {
          cookie: `operator=1; ${BROWSER_COOKIE}`,
          origin: 'https://app.example.test',
          'sec-fetch-site': 'same-origin',
        },
        body: '{}',
      }),
    );
    assertEquals(rUnGranted.status, 404);
    assertEquals(upstreamHitCount, 0);

    // 2. Wildcard/traversal attempts -> 404 (WHATWG URL-normalized outside prefix) / 400 (encoded slash/backslash), zero upstream hits.
    const rNormalizedTraversal = await gateway(
      new Request('https://app.example.test/api/plugins/crons/../admin/dump', {
        method: 'GET',
        headers: { cookie: `operator=1; ${BROWSER_COOKIE}` },
      }),
    );
    assertEquals(rNormalizedTraversal.status, 404);
    const rNormalizedDotEncoded = await gateway(
      new Request('https://app.example.test/api/plugins/crons/%2e%2e/admin/dump', {
        method: 'GET',
        headers: { cookie: `operator=1; ${BROWSER_COOKIE}` },
      }),
    );
    assertEquals(rNormalizedDotEncoded.status, 404);
    const rEncodedSlash = await gateway(
      new Request('https://app.example.test/api/plugins/crons/list%2fextra', {
        method: 'GET',
        headers: { cookie: `operator=1; ${BROWSER_COOKIE}` },
      }),
    );
    assertEquals(rEncodedSlash.status, 400);
    const rEncodedBackslash = await gateway(
      new Request('https://app.example.test/api/plugins/crons/list%5cextra', {
        method: 'GET',
        headers: { cookie: `operator=1; ${BROWSER_COOKIE}` },
      }),
    );
    assertEquals(rEncodedBackslash.status, 400);
    assertEquals(upstreamHitCount, 0);

    // 2b. Wrong HTTP method on a granted procedure -> 405 Method Not Allowed, zero upstream hits.
    const rWrongMethod = await gateway(
      new Request('https://app.example.test/api/plugins/crons/pause', {
        method: 'GET',
        headers: { cookie: `operator=1; ${BROWSER_COOKIE}` },
      }),
    );
    assertEquals(rWrongMethod.status, 405);
    assertEquals(rWrongMethod.headers.get('allow'), 'POST');
    assertEquals(upstreamHitCount, 0);

    // 3. Unauthenticated -> 401, zero upstream hits.
    const rNoAuth = await gateway(
      new Request('https://app.example.test/api/plugins/crons/list', { method: 'GET' }),
    );
    assertEquals(rNoAuth.status, 401);
    assertEquals(upstreamHitCount, 0);

    // 4. Insufficient scope/role (viewer cannot POST pause) -> 403, zero upstream hits.
    const rForbiddenScope = await gateway(
      new Request('https://app.example.test/api/plugins/crons/pause', {
        method: 'POST',
        headers: {
          cookie: 'viewer=1',
          origin: 'https://app.example.test',
          'sec-fetch-site': 'same-origin',
        },
        body: JSON.stringify({ jobId: 'j1' }),
      }),
    );
    assertEquals(rForbiddenScope.status, 403);
    assertEquals(upstreamHitCount, 0);

    // 5. CSRF / Origin checks on mutating POST: cross-site Origin, Origin: null, missing Origin, Sec-Fetch-Site: cross-site -> 403.
    const csrfBadCases: readonly Record<string, string>[] = [
      { cookie: 'operator=1', origin: 'https://evil.example', 'sec-fetch-site': 'cross-site' },
      { cookie: 'operator=1', origin: 'null' },
      { cookie: 'operator=1' }, // missing Origin on mutating browser POST
      { cookie: 'operator=1', origin: 'https://app.example.test', 'sec-fetch-site': 'cross-site' },
      { cookie: 'operator=1', origin: 'https://app.example.test', 'sec-fetch-dest': 'document' },
    ];
    for (const badHeaders of csrfBadCases) {
      const rCsrf = await gateway(
        new Request('https://app.example.test/api/plugins/crons/pause', {
          method: 'POST',
          headers: badHeaders,
          body: JSON.stringify({ jobId: 'j1' }),
        }),
      );
      assertEquals(rCsrf.status, 403);
    }
    assertEquals(upstreamHitCount, 0);

    // 6. Authorized GET: verifies PrincipalPort auth, browser Cookie/Authorization NOT forwarded,
    //    server auth attached, response-header allowlist + dynamic Connection stripping.
    const rOkGet = await gateway(
      new Request('https://app.example.test/api/plugins/crons/list', {
        method: 'GET',
        headers: {
          cookie: `operator=1; ${BROWSER_COOKIE}`,
          authorization: BROWSER_BEARER,
          'x-forwarded-host': 'spoofed.example',
          'sec-fetch-site': 'same-origin',
        },
      }),
    );
    assertEquals(rOkGet.status, 200);
    assertEquals(upstreamHitCount, 1);
    assertEquals(lastUpstreamPath, '/crons');
    assertEquals(lastUpstreamHeaders?.get('cookie'), null);
    assertEquals(lastUpstreamHeaders?.get('x-forwarded-host'), null);
    assertEquals(lastUpstreamHeaders?.get('authorization'), SERVER_SVC_SECRET);
    assertEquals(await rOkGet.json(), { jobs: ['nightly-rollup'] });
    // Response-header allowlist + dynamic Connection (`etag`) stripped.
    assertEquals(rOkGet.headers.get('x-request-id'), 'req-42');
    assertEquals(rOkGet.headers.get('etag'), null);
    assertEquals(rOkGet.headers.get('set-cookie'), null);
    assertEquals(rOkGet.headers.get('www-authenticate'), null);
    assertEquals(rOkGet.headers.get('access-control-allow-origin'), null);
    assertEquals(rOkGet.headers.get('x-internal-secret'), null);
    assertEquals(rOkGet.headers.get('x-content-type-options'), 'nosniff');
    assertEquals(rOkGet.headers.get('cache-control'), 'no-store');

    // 7. Authorized mutating POST with same-origin Origin + Sec-Fetch-Site -> 200.
    const rOkPost = await gateway(
      new Request('https://app.example.test/api/plugins/crons/pause', {
        method: 'POST',
        headers: {
          cookie: 'operator=1',
          origin: 'https://app.example.test',
          'sec-fetch-site': 'same-origin',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ jobId: 'nightly-rollup' }),
      }),
    );
    assertEquals(rOkPost.status, 200);
    assertEquals(await rOkPost.json(), { paused: true });

    // 8. redirect: 'manual' -> 302 from upstream is NOT followed and returns redacted 502 with no Location header.
    const rRedirect = await gateway(
      new Request('https://app.example.test/api/plugins/crons/list?triggerRedirect=1', {
        method: 'GET',
        headers: { cookie: 'operator=1', 'sec-fetch-site': 'same-origin' },
      }),
    );
    assertEquals(rRedirect.status, 502);
    assertEquals(rRedirect.headers.get('location'), null);
    assertEquals(await rRedirect.json(), { error: 'BAD_GATEWAY', reason: 'upstream_redirect_rejected' });

    // 9. Structured audit logs emitted with mountId, procedure, subject, and ZERO secrets.
    assert(audits.some((a) => a.mountId === 'crons' && a.procedure === 'list' && a.subject === 'user:op-1' && a.status === 200));
    assert(audits.some((a) => a.mountId === 'crons' && a.procedure === 'pause' && a.subject === 'user:view-2' && a.status === 403));
    assert(audits.some((a) => a.mountId === 'crons' && a.procedure === 'deleteAll' && a.status === 404));
    const serializedAudits = JSON.stringify(audits);
    assertEquals(serializedAudits.includes(BROWSER_COOKIE), false);
    assertEquals(serializedAudits.includes(BROWSER_BEARER), false);
    assertEquals(serializedAudits.includes(SERVER_SVC_SECRET), false);
  } finally {
    upstreamAc.abort();
    await upstreamServer.finished.catch(() => {});
  }
});

probeTest('2.3 [P5 gateway]: request/response body limits, timeout (504), and AbortSignal propagation', async () => {
  const routes = generateGatewayRouteTable({
    mountId: 'crons',
    contract: cronsContract,
    requiresProcedures: ['list', 'pause'],
  });

  let upstreamHits = 0;
  let upstreamAborted = false;

  const gateway = createPluginGatewayHandler({
    mountId: 'crons',
    routes,
    hostOrigin: 'https://app.example.test',
    serviceOrigin: 'http://upstream.test',
    principalPort: {
      resolve: () =>
        Promise.resolve({
          subject: 'user:op-1',
          scopes: ['crons:read', 'crons:write'],
          roles: ['operator'],
          scheme: 'custom',
          claims: {},
        }),
    },
    getServerUpstreamAuth: () => ({ authorization: 'Bearer svc-secret' }),
    maxRequestBytes: 32,
    maxResponseBytes: 64,
    timeoutMs: 80,
    fetchImpl: (input) => {
      const req = input as Request;
      assertEquals(req.redirect, 'manual');
      upstreamHits += 1;
      const url = new URL(req.url);
      if (url.searchParams.get('mode') === 'oversize-res') {
        return Promise.resolve(new Response('x'.repeat(200), { status: 200 }));
      }
      if (url.searchParams.get('mode') === 'slow') {
        return new Promise((_resolve, reject) => {
          req.signal.addEventListener('abort', () => {
            upstreamAborted = true;
            reject(req.signal.reason);
          }, { once: true });
        });
      }
      return Promise.resolve(Response.json({ ok: true }));
    },
  });

  // 1. Oversized Content-Length -> 413, zero upstream hits.
  const rOversizeHeader = await gateway(
    new Request('https://app.example.test/api/plugins/crons/pause', {
      method: 'POST',
      headers: {
        origin: 'https://app.example.test',
        'content-length': '128',
      },
      body: 'x'.repeat(128),
    }),
  );
  assertEquals(rOversizeHeader.status, 413);
  assertEquals(upstreamHits, 0);

  // 2. Oversized chunked stream without Content-Length -> 413, zero upstream hits.
  const streamedLarge = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('a'.repeat(20)));
      controller.enqueue(new TextEncoder().encode('b'.repeat(25)));
      controller.close();
    },
  });
  const rOversizeStream = await gateway(
    new Request('https://app.example.test/api/plugins/crons/pause', {
      method: 'POST',
      headers: { origin: 'https://app.example.test' },
      body: streamedLarge,
    }),
  );
  assertEquals(rOversizeStream.status, 413);
  assertEquals(upstreamHits, 0);

  // 3. Oversized upstream response -> 502 without unbounded buffering.
  const rOversizeRes = await gateway(
    new Request('https://app.example.test/api/plugins/crons/list?mode=oversize-res', {
      method: 'GET',
    }),
  );
  assertEquals(rOversizeRes.status, 502);
  assertEquals(await rOversizeRes.json(), { error: 'BAD_GATEWAY', reason: 'response_body_too_large' });

  // 4. Upstream timeout -> 504 + upstream fetch aborted.
  upstreamAborted = false;
  const rTimeout = await gateway(
    new Request('https://app.example.test/api/plugins/crons/list?mode=slow', {
      method: 'GET',
    }),
  );
  assertEquals(rTimeout.status, 504);
  assertEquals(upstreamAborted, true);

  // 5. Client AbortSignal propagation -> upstream fetch aborted promptly.
  upstreamAborted = false;
  const clientAc = new AbortController();
  const pending = gateway(
    new Request('https://app.example.test/api/plugins/crons/list?mode=slow', {
      method: 'GET',
      signal: clientAc.signal,
    }),
  );
  setTimeout(() => clientAc.abort(), 15);
  const rAborted = await pending;
  assertEquals(rAborted.status, 502);
  assertEquals(upstreamAborted, true);
});

// RFC 0009 canonical stream offset & delivery-unit-fenced authorizing SSE proxy prototype
const STREAM_OFFSET_MAX_BYTES = 512;

function isValidStreamOffset(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length >= 1 &&
    value.length <= STREAM_OFFSET_MAX_BYTES &&
    /^[\x21-\x7E]+$/.test(value) &&
    !/[?#&]/.test(value)
  );
}

interface ParsedSseBlock {
  readonly event: string;
  readonly data: string | undefined;
  readonly rawBytes: Uint8Array;
}

function createRfc0009AuthorizingSseProxy(options: {
  readonly hostOrigin: string;
  readonly streamsBaseUrl: string;
  readonly upstreamAuth: () => Record<string, string>;
  readonly authorize: (req: Request) => Promise<{
    readonly allow: true;
    readonly grant: { readonly sessionId: string; readonly streamPath: string };
  } | {
    readonly allow: false;
    readonly status: 401 | 403;
    readonly reason: string;
  }>;
  readonly recheck: (grant: { readonly sessionId: string; readonly streamPath: string }) => Promise<boolean>;
  readonly onUpstreamCancel?: () => void;
  readonly onUpstreamRequestHeaders?: (headers: Headers) => void;
}): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } });
    }
    const csrf = checkCsrfAndOrigin(request, options.hostOrigin, false);
    if (!csrf.ok) {
      return Response.json({ error: 'FORBIDDEN', reason: csrf.reason }, { status: 403 });
    }

    const reqUrl = new URL(request.url);
    const liveValues = reqUrl.searchParams.getAll('live');
    if (liveValues.length > 1 || (liveValues.length === 1 && liveValues[0] !== 'sse')) {
      return Response.json({ error: 'BAD_REQUEST', reason: 'unsupported_live_mode' }, { status: 400 });
    }
    const offsetValues = reqUrl.searchParams.getAll('offset');
    if (offsetValues.length > 1) {
      return Response.json({ error: 'BAD_REQUEST', reason: 'duplicate_offset' }, { status: 400 });
    }
    const offset = offsetValues[0] ?? '-1';
    if (!isValidStreamOffset(offset)) {
      return Response.json({ error: 'BAD_REQUEST', reason: 'invalid_offset' }, { status: 400 });
    }

    const decision = await options.authorize(request);
    if (!decision.allow) {
      return Response.json(
        { error: decision.status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN', reason: decision.reason },
        { status: decision.status, headers: { 'cache-control': 'no-store' } },
      );
    }

    // Post-subscribe / pre-upstream catch-up recheck (RFC 0009 step 6).
    if (!(await options.recheck(decision.grant))) {
      return Response.json(
        { error: 'UNAUTHORIZED', reason: 'revoked_before_upstream' },
        { status: 401, headers: { 'cache-control': 'no-store' } },
      );
    }

    const upstreamUrl = new URL(buildStreamUrl(decision.grant.streamPath, options.streamsBaseUrl));
    upstreamUrl.searchParams.set('offset', offset);
    upstreamUrl.searchParams.set('live', 'sse');

    const upstreamHeaders = new Headers();
    upstreamHeaders.set('accept', 'text/event-stream');
    upstreamHeaders.set('accept-encoding', 'identity');
    for (const [k, v] of Object.entries(options.upstreamAuth())) {
      upstreamHeaders.set(k, v);
    }
    options.onUpstreamRequestHeaders?.(upstreamHeaders);

    const upstreamAc = new AbortController();
    const onClientAbort = () => upstreamAc.abort(request.signal.reason);
    if (request.signal.aborted) {
      return new Response(null, { status: 499 });
    }
    request.signal.addEventListener('abort', onClientAbort, { once: true });

    const upstreamRes = await fetch(upstreamUrl.href, {
      method: 'GET',
      headers: upstreamHeaders,
      redirect: 'manual',
      signal: upstreamAc.signal,
    });

    if (upstreamRes.status === 404 || upstreamRes.status === 410 || upstreamRes.status === 400) {
      await upstreamRes.body?.cancel().catch(() => {});
      request.signal.removeEventListener('abort', onClientAbort);
      return new Response(null, { status: upstreamRes.status });
    }
    if (
      upstreamRes.status !== 200 ||
      !upstreamRes.body ||
      !upstreamRes.headers.get('content-type')?.toLowerCase().startsWith('text/event-stream')
    ) {
      await upstreamRes.body?.cancel().catch(() => {});
      request.signal.removeEventListener('abort', onClientAbort);
      return new Response('Bad Gateway', { status: 502 });
    }

    // Tier 1 + Tier 3 response headers (strips wildcard ACAO, content-encoding, content-length, Connection-nominated headers).
    const outHeaders = new Headers();
    const dynamicHop = parseDynamicConnectionHeaders(upstreamRes.headers);
    for (const allowName of ['stream-next-offset', 'stream-cursor', 'stream-up-to-date', 'stream-closed', 'etag']) {
      if (!dynamicHop.has(allowName)) {
        const val = upstreamRes.headers.get(allowName);
        if (val !== null) outHeaders.set(allowName, val);
      }
    }
    outHeaders.set('content-type', 'text/event-stream; charset=utf-8');
    outHeaders.set('cache-control', 'no-store, no-cache, no-transform');
    outHeaders.set('x-content-type-options', 'nosniff');
    outHeaders.set('x-accel-buffering', 'no');
    outHeaders.set('vary', 'Authorization, Cookie, Origin, Sec-Fetch-Site, Sec-Fetch-Dest');

    // Streaming phase uses ReadableStream.cancel() on downstream disconnect; clear setup abort listener
    // before returning 200 so Deno.serve legacy request.signal abort-on-response does not warn.
    request.signal.removeEventListener('abort', onClientAbort);

    const upstreamReader = upstreamRes.body.getReader();
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const encoder = new TextEncoder();
    let closed = false;
    let textBuffer = '';
    const pendingDataBlocks: ParsedSseBlock[] = [];

    const stream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        const closeOnce = () => {
          if (closed) return;
          closed = true;
          try {
            controller.close();
          } catch {
            // already closed
          }
          upstreamAc.abort('proxy-closed');
          void upstreamReader.cancel().catch(() => {}).finally(() => {
            try {
              upstreamReader.releaseLock();
            } catch {
              // ignore
            }
            options.onUpstreamCancel?.();
          });
        };

        try {
          while (!closed) {
            const { value, done } = await upstreamReader.read();
            if (closed) return;
            if (done) {
              // EOF with uncommitted pending data discards all buffered bytes (RFC 0009).
              pendingDataBlocks.length = 0;
              closeOnce();
              return;
            }
            textBuffer += decoder.decode(value, { stream: true });
            while (true) {
              const match = /\r\n\r\n|\n\n|\r\r/.exec(textBuffer);
              if (!match) break;
              const rawBlock = textBuffer.slice(0, match.index);
              const delim = match[0];
              textBuffer = textBuffer.slice(match.index + delim.length);

              const lines = rawBlock.split(/\r\n|\n|\r/);
              if (lines.every((l) => l === '' || l.startsWith(':'))) {
                continue; // comment-only keepalive block
              }
              let eventName = 'message';
              const dataLines: string[] = [];
              for (const line of lines) {
                if (line.startsWith(':')) continue;
                const colon = line.indexOf(':');
                const field = colon < 0 ? line : line.slice(0, colon);
                let fieldVal = colon < 0 ? '' : line.slice(colon + 1);
                if (fieldVal.startsWith(' ')) fieldVal = fieldVal.slice(1);
                if (field === 'event') eventName = fieldVal;
                if (field === 'data') dataLines.push(fieldVal);
              }
              if (eventName !== 'data' && eventName !== 'control') {
                pendingDataBlocks.length = 0;
                closeOnce();
                return;
              }
              const blockData = dataLines.length > 0 ? dataLines.join('\n') : undefined;
              const parsedBlock: ParsedSseBlock = {
                event: eventName,
                data: blockData,
                rawBytes: encoder.encode(`${rawBlock}\n\n`),
              };

              if (eventName === 'data') {
                if (blockData === undefined) {
                  pendingDataBlocks.length = 0;
                  closeOnce();
                  return;
                }
                pendingDataBlocks.push(parsedBlock);
                continue;
              }

              // event === 'control': validate committing offset AND re-check authorization before releasing!
              if (blockData === undefined) {
                pendingDataBlocks.length = 0;
                closeOnce();
                return;
              }
              const validatedControl = parseStreamSseEventV1({ eventName: 'control', data: blockData });
              if (
                !validatedControl.ok ||
                validatedControl.frame.event !== 'control' ||
                !isValidStreamOffset(validatedControl.frame.payload.streamNextOffset)
              ) {
                pendingDataBlocks.length = 0;
                closeOnce();
                return;
              }

              // Fenced 'before-delivery' check (RFC 0009): revoked reader receives ZERO uncommitted bytes!
              const stillAllowed = await options.recheck(decision.grant);
              if (!stillAllowed || closed) {
                pendingDataBlocks.length = 0;
                closeOnce();
                return;
              }

              for (const dataBlock of pendingDataBlocks) {
                controller.enqueue(dataBlock.rawBytes);
              }
              pendingDataBlocks.length = 0;
              controller.enqueue(parsedBlock.rawBytes);
              return;
            }
          }
        } catch {
          pendingDataBlocks.length = 0;
          closeOnce();
        }
      },
      cancel() {
        if (closed) return;
        closed = true;
        upstreamAc.abort('downstream-cancelled');
        void upstreamReader.cancel().catch(() => {}).finally(() => {
          try {
            upstreamReader.releaseLock();
          } catch {
            // ignore
          }
          options.onUpstreamCancel?.();
        });
      },
    });

    return new Response(stream, { status: 200, headers: outHeaders });
  };
}

probeTest(
  '2.4 [P5 + RFC 0009]: real DurableStreamTestServer SSE delivery-unit fencing, mid-stream revocation, ?offset= resume, and abort propagation',
  async () => {
    const previousUrl = Deno.env.get('DURABLE_STREAMS_URL');
    const upstreamPort = getFreePort();
    const upstream = new DurableStreamTestServer({ port: upstreamPort, host: '127.0.0.1' });
    await upstream.start();
    const streamsBase = `http://127.0.0.1:${upstreamPort}`;
    Deno.env.set('DURABLE_STREAMS_URL', streamsBase);

    const streamPath = `/crons/${crypto.randomUUID()}/executions`;
    const producer = createDurableStream({
      streamPath,
      schema: createStreamTopicFixture(),
      producerId: 'probe-c-sse',
    });

    const activeSessions = new Set<string>(['sess-1']);
    let lastUpstreamSeenHeaders: Headers | undefined;
    let upstreamCancelledCount = 0;

    const proxyHandler = createRfc0009AuthorizingSseProxy({
      hostOrigin: 'https://app.example.test',
      streamsBaseUrl: streamsBase,
      upstreamAuth: () => ({ authorization: 'Bearer streams-server-secret' }),
      onUpstreamRequestHeaders: (h) => {
        lastUpstreamSeenHeaders = h;
      },
      onUpstreamCancel: () => {
        upstreamCancelledCount += 1;
      },
      authorize: (req) => {
        const sid = req.headers.get('cookie')?.match(/sid=([^;]+)/)?.[1] ?? '';
        if (!sid || !activeSessions.has(sid)) {
          return Promise.resolve({ allow: false, status: 401, reason: 'session_revoked' });
        }
        return Promise.resolve({
          allow: true,
          grant: { sessionId: sid, streamPath },
        });
      },
      recheck: (grant) => Promise.resolve(activeSessions.has(grant.sessionId)),
    });

    const gatewayPort = getFreePort();
    const gatewayAc = new AbortController();
    const gatewayServer = Deno.serve(
      { port: gatewayPort, hostname: '127.0.0.1', signal: gatewayAc.signal, onListen() {} },
      (req) => proxyHandler(req),
    );
    const gatewayOrigin = `http://127.0.0.1:${gatewayPort}`;

    try {
      // 1. Produce Batch 1 into real DurableStreamTestServer.
      producer.upsert('execution', { id: 'exec-1', status: 'succeeded' }, { correlationId: 'c-1' });
      await producer.flush();

      // 2. Reject invalid ?offset= and ?live=long-poll before authorize/upstream.
      const badOffsetRes = await fetch(
        `${gatewayOrigin}/api/plugins/crons/streams/executions?offset=${encodeURIComponent('bad offset with space')}`,
        { headers: { cookie: 'sid=sess-1' } },
      );
      assertEquals(badOffsetRes.status, 400);
      await badOffsetRes.body?.cancel();

      const badLiveRes = await fetch(
        `${gatewayOrigin}/api/plugins/crons/streams/executions?offset=-1&live=long-poll`,
        { headers: { cookie: 'sid=sess-1' } },
      );
      assertEquals(badLiveRes.status, 400);
      await badLiveRes.body?.cancel();

      // 3. Consume Batch 1 through createFetchStreamEventSourceV1 + bindStreamEventSourceV1.
      const events1: StreamSseConsumerEventV1[] = [];
      let committedOffset1 = '';
      const ac1 = new AbortController();
      const source1 = createFetchStreamEventSourceV1({
        url: `${gatewayOrigin}/api/plugins/crons/streams/executions?offset=-1`,
        fetch: (u, init) =>
          fetch(u, {
            ...init,
            headers: { ...Object.fromEntries(new Headers(init.headers)), cookie: 'sid=sess-1' },
          }),
        signal: ac1.signal,
      });

      const binding1 = bindStreamEventSourceV1({
        source: source1,
        onEvent: (ev) => {
          events1.push(ev);
          if (ev.event === 'control' && events1.some((e) => e.event === 'data')) {
            committedOffset1 = ev.payload.streamNextOffset;
            ac1.abort();
          }
        },
      });
      await source1.done;
      binding1.dispose();

      assert(isValidStreamOffset(committedOffset1), `expected valid offset, got ${committedOffset1}`);
      assertEquals(
        events1.filter((e) => e.event === 'data').flatMap((e) =>
          e.event === 'data' ? e.payload.map((c) => c.key) : []
        ),
        ['exec-1'],
      );
      // Verify server-side upstreamAuth was injected and browser cookie was never forwarded.
      assertEquals(lastUpstreamSeenHeaders?.get('authorization'), 'Bearer streams-server-secret');
      assertEquals(lastUpstreamSeenHeaders?.get('cookie'), null);
      assertEquals(lastUpstreamSeenHeaders?.get('accept-encoding'), 'identity');

      // 4. Mid-stream revocation BEFORE Batch 2 delivery: proxy must withhold Batch 2 and close cleanly.
      const acRevoke = new AbortController();
      const resRevoke = await fetch(
        `${gatewayOrigin}/api/plugins/crons/streams/executions?offset=${encodeURIComponent(committedOffset1)}`,
        { headers: { cookie: 'sid=sess-1' }, signal: acRevoke.signal },
      );
      assertEquals(resRevoke.status, 200);
      // Verify DurableStreamTestServer's wildcard ACAO: * was stripped by Tier 1/3 header ownership!
      assertEquals(resRevoke.headers.get('access-control-allow-origin'), null);
      assertEquals(resRevoke.headers.get('cache-control'), 'no-store, no-cache, no-transform');

      // Read initial caught-up control frame (upToDate: true, zero data) while sess-1 is active.
      const revokeReader = resRevoke.body!.getReader();
      const initialChunk = await revokeReader.read();
      assertEquals(initialChunk.done, false);
      const initialText = new TextDecoder().decode(initialChunk.value);
      assertStringIncludes(initialText, 'event: control');
      assertEquals(initialText.includes('exec-2'), false);

      // Now revoke sess-1 BEFORE producing Batch 2!
      activeSessions.delete('sess-1');
      producer.upsert('execution', { id: 'exec-2', status: 'running' }, { correlationId: 'c-2' });
      await producer.flush();

      // Reading after revocation yields ZERO Batch 2 bytes (exec-2 data + control withheld) and closes cleanly at EOF!
      let postRevokeText = '';
      while (true) {
        const next = await revokeReader.read();
        if (next.done) break;
        postRevokeText += new TextDecoder().decode(next.value);
      }
      assertEquals(postRevokeText.includes('exec-2'), false);
      assertEquals(postRevokeText, '');

      // Fresh admission with revoked session returns 401 before touching upstream.
      const r401 = await fetch(
        `${gatewayOrigin}/api/plugins/crons/streams/executions?offset=${encodeURIComponent(committedOffset1)}`,
        { headers: { cookie: 'sid=sess-1' } },
      );
      assertEquals(r401.status, 401);
      await r401.body?.cancel();

      // 5. Re-authenticate (sess-2) and resume from ?offset=<committedOffset1> -> receives exec-2 WITHOUT exec-1!
      activeSessions.add('sess-2');
      const events2: StreamSseConsumerEventV1[] = [];
      let committedOffset2 = '';
      const ac2 = new AbortController();
      const source2 = createFetchStreamEventSourceV1({
        url: `${gatewayOrigin}/api/plugins/crons/streams/executions?offset=${encodeURIComponent(committedOffset1)}`,
        fetch: (u, init) =>
          fetch(u, {
            ...init,
            headers: { ...Object.fromEntries(new Headers(init.headers)), cookie: 'sid=sess-2' },
          }),
        signal: ac2.signal,
      });
      const binding2 = bindStreamEventSourceV1({
        source: source2,
        onEvent: (ev) => {
          events2.push(ev);
          if (ev.event === 'control' && events2.some((e) => e.event === 'data')) {
            committedOffset2 = ev.payload.streamNextOffset;
            ac2.abort();
          }
        },
      });
      await source2.done;
      binding2.dispose();

      assertNotEquals(committedOffset2, committedOffset1);
      assertEquals(
        events2.filter((e) => e.event === 'data').flatMap((e) =>
          e.event === 'data' ? e.payload.map((c) => c.key) : []
        ),
        ['exec-2'],
      );

      // 6. Client AbortSignal propagation on idle live SSE stream tears down upstream reader cleanly.
      const prevCancels = upstreamCancelledCount;
      const acIdle = new AbortController();
      const idleRes = await fetch(
        `${gatewayOrigin}/api/plugins/crons/streams/executions?offset=${encodeURIComponent(committedOffset2)}`,
        { headers: { cookie: 'sid=sess-2' }, signal: acIdle.signal },
      );
      assertEquals(idleRes.status, 200);
      acIdle.abort();
      await idleRes.body?.cancel().catch(() => {});
      await new Promise((r) => setTimeout(r, 30));
      assert(upstreamCancelledCount > prevCancels, 'expected upstream reader cancellation on client abort');

      // 6b. Missing stream on DurableStreamTestServer returns 404 after admission (not 200/500).
      const missingStreamProxy = createRfc0009AuthorizingSseProxy({
        hostOrigin: 'https://app.example.test',
        streamsBaseUrl: streamsBase,
        upstreamAuth: () => ({ authorization: 'Bearer streams-server-secret' }),
        authorize: () =>
          Promise.resolve({ allow: true, grant: { sessionId: 'sess-2', streamPath: '/crons/does-not-exist' } }),
        recheck: () => Promise.resolve(true),
      });
      const rMissing404 = await missingStreamProxy(
        new Request('https://app.example.test/api/plugins/crons/streams/missing?offset=-1', {
          headers: { cookie: 'sid=sess-2' },
        }),
      );
      assertEquals(rMissing404.status, 404);
      await rMissing404.body?.cancel();

      // 7. Verify createNetScriptStreamEventSourceV1 single-offset behavior & bindStreamEventSourceV1 baseline on main.
      // Today on origin/main, createNetScriptStreamEventSourceV1 unconditionally calls buildStreamUrl(),
      // prepending `/v1/stream/netscript`, and bindStreamEventSourceV1 emits retryable: true even when readyState === 2
      // — proving RFC 0009's `proxyUrl` and `readyState !== 2` additions are required!
      class MockEventSource extends EventTarget implements StreamEventSourceV1 {
        readyState = 2; // CLOSED
        close() {}
      }
      const mockEs = new MockEventSource();
      const freshEvents: StreamSseConsumerEventV1[] = [];
      const freshBinding = createNetScriptStreamEventSourceV1({
        baseUrl: gatewayOrigin,
        streamPath: '/plugins/crons/executions',
        offset: committedOffset1,
        createEventSource: () => mockEs,
        onEvent: (ev) => freshEvents.push(ev),
      });
      assertStringIncludes(freshBinding.url, '/v1/stream/netscript/plugins/crons/executions');
      mockEs.dispatchEvent(new Event('error'));
      const lastFreshEvent = freshEvents.at(-1);
      assertEquals(lastFreshEvent?.event, 'error');
      if (lastFreshEvent?.event === 'error') {
        assertEquals(lastFreshEvent.payload.retryable, true);
      }
      freshBinding.dispose();

      // 8. Verify reduceStreamSseReplayStateV1 holds pendingBatches uncommitted until control arrives.
      let replayState = createStreamSseReplayStateV1({ lastCommittedOffset: committedOffset1 });
      const dataParsed = parseStreamSseEventV1({
        eventName: 'data',
        data: JSON.stringify([{
          type: 'execution',
          key: 'exec-3',
          headers: {
            operation: 'upsert',
            correlationId: 'c-3',
            traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
          },
          value: { id: 'exec-3', status: 'running' },
        }]),
      });
      assert(dataParsed.ok);
      replayState = reduceStreamSseReplayStateV1(replayState, dataParsed.frame).state;
      assertEquals(replayState.lastCommittedOffset, committedOffset1);
      assertEquals(replayState.pendingBatches.length, 1);
    } finally {
      await producer.close();
      gatewayAc.abort();
      await gatewayServer.finished.catch(() => {});
      // @durable-streams/server@0.3.9 stop() calls Node server.close() without closeAllConnections(),
      // so Deno fetch's pooled HTTP/1.1 keep-alive socket would otherwise wait ~180s to drain.
      const stopUpstream = upstream.stop();
      (
        upstream as unknown as { server?: { closeAllConnections?: () => void } }
      ).server?.closeAllConnections?.();
      await stopUpstream;
      if (previousUrl === undefined) Deno.env.delete('DURABLE_STREAMS_URL');
      else Deno.env.set('DURABLE_STREAMS_URL', previousUrl);
    }
  },
);

probeTest('2.5 [P5 + RFC 0009 boundary]: proves oRPC router traversal excludes stream contracts & AI proxy stays specialized', () => {
  // 1. oRPC compileProcedures handles ordinary + eventIterator procedures, while a non-oRPC StreamEndpointContract
  //    would crash oRPC contract traversal if placed inside an oRPC router (RFC 0009 §Why stream endpoints stay outside).
  const compiled = compileProcedures(cronsContract);
  const tailProc = compiled.find((p) => p.routerPath.join('.') === 'tailEvents');
  assertExists(tailProc);
  assertEquals(tailProc.restMethod, 'GET');
  assertEquals(tailProc.restPattern, '/crons/tail');

  const syntheticBrokenRouterWithStreamEndpoint = {
    ...cronsContract,
    badNestedStreamEndpoint: { protocol: { family: 'netscript.durable-stream-sse', major: 1 }, id: 'crons.feed' },
  };
  assertThrows(() => compileProcedures(syntheticBrokenRouterWithStreamEndpoint as never));

  // 2. Verify @netscript/fresh/ai createNetScriptChatStreamProxy preserves legacy specialized chat behavior
  //    (separate from generic gateway and RFC 0009 until opt-in authorize/recheck lands).
  assertEquals(typeof createNetScriptChatStreamProxy, 'function');
  assertEquals(STREAM_SSE_CONTRACT_V1.wireEventNames, ['data', 'control']);
});

// ============================================================================
// PART 3: SECRET-REDACTION BOUNDARY (eis-etl#450, #453)
// ============================================================================

const REDACTED_SECRET_SENTINEL = '__NS_REDACTED_SECRET__' as const;

interface RedactedSecretHandle {
  readonly __nsSecretHandle: true;
  readonly sentinel: typeof REDACTED_SECRET_SENTINEL;
  readonly isSet: boolean;
  readonly digest: string | null;
}

const SENSITIVE_HEADER_NAMES = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'proxy-authorization',
  'x-auth-token',
  'x-api-secret',
]);

const SENSITIVE_QUERY_KEYS = new Set([
  'token',
  'access_token',
  'refresh_token',
  'api_key',
  'apikey',
  'secret',
  'client_secret',
  'password',
  'passwd',
]);

async function computeSecretDigest(secret: string): Promise<string> {
  const bytes = new TextEncoder().encode(secret);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  const hex = Array.from(new Uint8Array(hash))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `sha256:${hex}`;
}

async function makeSecretHandle(value: unknown): Promise<RedactedSecretHandle> {
  if (typeof value === 'string' && value.length > 0) {
    return Object.freeze({
      __nsSecretHandle: true,
      sentinel: REDACTED_SECRET_SENTINEL,
      isSet: true,
      digest: await computeSecretDigest(value),
    });
  }
  return Object.freeze({
    __nsSecretHandle: true,
    sentinel: REDACTED_SECRET_SENTINEL,
    isSet: false,
    digest: null,
  });
}

function isSecretMarkedZodSchema(schema: unknown): boolean {
  if (!schema || typeof schema !== 'object') return false;
  const candidate = schema as { meta?: () => unknown; unwrap?: () => unknown };
  if (typeof candidate.meta === 'function') {
    const meta = candidate.meta();
    if (meta && typeof meta === 'object') {
      const ui = Reflect.get(meta, 'x-ns-ui');
      if (ui && typeof ui === 'object' && Reflect.get(ui, 'secret') === true) {
        return true;
      }
    }
  }
  if (typeof candidate.unwrap === 'function') {
    return isSecretMarkedZodSchema(candidate.unwrap());
  }
  return false;
}

function getObjectSchemaShape(schema: unknown): Record<string, unknown> | undefined {
  if (!schema || typeof schema !== 'object') return undefined;
  const shape = Reflect.get(schema, 'shape');
  return shape && typeof shape === 'object' ? (shape as Record<string, unknown>) : undefined;
}

async function redactUrlStringIfNeeded(input: string): Promise<unknown> {
  const urlMatch = /^(?:https?|postgres(?:ql)?|redis|rediss|amqps?):\/\/\S+$/i.test(input);
  if (!urlMatch) return input;
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return input;
  }
  const hasUserinfo = parsed.username !== '' || parsed.password !== '';
  let hasSensitiveQuery = false;
  for (const key of parsed.searchParams.keys()) {
    if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
      hasSensitiveQuery = true;
    }
  }
  if (!hasUserinfo && !hasSensitiveQuery) return input;

  const rawCredentialMaterial = `${parsed.username}:${parsed.password}`;
  const digest = await computeSecretDigest(rawCredentialMaterial);
  if (parsed.username) parsed.username = REDACTED_SECRET_SENTINEL;
  if (parsed.password) parsed.password = REDACTED_SECRET_SENTINEL;
  for (const key of [...parsed.searchParams.keys()]) {
    if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
      parsed.searchParams.set(key, REDACTED_SECRET_SENTINEL);
    }
  }
  return {
    redactedUrl: parsed.href,
    credential: {
      __nsSecretHandle: true,
      sentinel: REDACTED_SECRET_SENTINEL,
      isSet: true,
      digest,
    } satisfies RedactedSecretHandle,
  };
}

async function redactValueForClient(
  value: unknown,
  schema?: unknown,
  seen = new WeakSet<object>(),
): Promise<unknown> {
  if (typeof value === 'function') {
    throw new TypeError('NON_SERIALIZABLE_PORT_BLOCKED: functions/ports cannot cross into client context');
  }
  if (isSecretMarkedZodSchema(schema)) {
    return await makeSecretHandle(value);
  }
  if (value === null || value === undefined || typeof value === 'boolean' || typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    return await redactUrlStringIfNeeded(value);
  }
  if (value instanceof Headers) {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of value.entries()) {
      clean[k] = SENSITIVE_HEADER_NAMES.has(k.toLowerCase()) ? await makeSecretHandle(v) : v;
    }
    return clean;
  }
  if (typeof value !== 'object') {
    return value;
  }
  if (seen.has(value)) {
    throw new TypeError('CIRCULAR_SERIALIZATION_BLOCKED');
  }
  seen.add(value);

  if (Array.isArray(value)) {
    const out: unknown[] = [];
    for (const item of value) {
      out.push(await redactValueForClient(item, undefined, seen));
    }
    return out;
  }

  const shape = getObjectSchemaShape(schema);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    const lower = k.toLowerCase();
    if (SENSITIVE_HEADER_NAMES.has(lower)) {
      out[k] = await makeSecretHandle(typeof v === 'string' ? v : JSON.stringify(v));
      continue;
    }
    const fieldSchema = shape?.[k];
    out[k] = await redactValueForClient(v, fieldSchema, seen);
  }
  return out;
}

function assertNoUnredactedSecrets(value: unknown, path = '$'): void {
  if (typeof value === 'function') {
    throw new Error(`UNREDACTED_SECRET_SERIALIZATION_BLOCKED: function/port at ${path}`);
  }
  if (typeof value === 'string') {
    // Reject URLs still carrying plaintext userinfo (where username/password !== REDACTED_SECRET_SENTINEL).
    if (/^[a-z][a-z0-9+.-]*:\/\/[^/\s@]+:[^/\s@]+@/i.test(value)) {
      const parsed = URL.parse(value);
      if (
        parsed &&
        ((parsed.username && parsed.username !== REDACTED_SECRET_SENTINEL) ||
          (parsed.password && parsed.password !== REDACTED_SECRET_SENTINEL))
      ) {
        throw new Error(`UNREDACTED_SECRET_SERIALIZATION_BLOCKED: raw URL userinfo at ${path}`);
      }
    }
    return;
  }
  if (!value || typeof value !== 'object') return;
  if (value instanceof Headers) {
    throw new Error(`UNREDACTED_SECRET_SERIALIZATION_BLOCKED: raw Headers instance at ${path}`);
  }
  if (Array.isArray(value)) {
    value.forEach((item, idx) => assertNoUnredactedSecrets(item, `${path}[${idx}]`));
    return;
  }
  if (isRedactedSecretHandle(value)) {
    return;
  }
  for (const [k, v] of Object.entries(value)) {
    if (SENSITIVE_HEADER_NAMES.has(k.toLowerCase()) && !isRedactedSecretHandle(v)) {
      throw new Error(`UNREDACTED_SECRET_SERIALIZATION_BLOCKED: unredacted header "${k}" at ${path}.${k}`);
    }
    assertNoUnredactedSecrets(v, `${path}.${k}`);
  }
}

function isRedactedSecretHandle(value: unknown): value is RedactedSecretHandle {
  return (
    typeof value === 'object' &&
    value !== null &&
    Reflect.get(value, '__nsSecretHandle') === true &&
    Reflect.get(value, 'sentinel') === REDACTED_SECRET_SENTINEL
  );
}

type SecretWriteInput =
  | { readonly mode: 'keep' }
  | { readonly mode: 'clear' }
  | { readonly mode: 'set'; readonly value: string }
  | string
  | null
  | undefined;

function applySecretFieldWrite(
  existingValue: string | null,
  incoming: SecretWriteInput,
  fieldPath: string,
): string | null {
  if (incoming === undefined || (typeof incoming === 'object' && incoming !== null && 'mode' in incoming && incoming.mode === 'keep')) {
    return existingValue;
  }
  if (incoming === null || (typeof incoming === 'object' && incoming !== null && 'mode' in incoming && incoming.mode === 'clear')) {
    return null;
  }
  const candidate = typeof incoming === 'string'
    ? incoming
    : (typeof incoming === 'object' && incoming !== null && 'mode' in incoming && incoming.mode === 'set'
      ? incoming.value
      : JSON.stringify(incoming));

  if (
    typeof candidate !== 'string' ||
    candidate.includes(REDACTED_SECRET_SENTINEL) ||
    (typeof incoming === 'object' && incoming !== null && Reflect.get(incoming, 'sentinel') === REDACTED_SECRET_SENTINEL)
  ) {
    throw new Error(
      `SECRET_SENTINEL_ECHO_REJECTED: write to "${fieldPath}" attempted to echo redaction sentinel`,
    );
  }
  if (candidate.trim().length === 0) {
    throw new Error(`SECRET_VALUE_EMPTY: write to "${fieldPath}" requires non-empty secret or mode=clear`);
  }
  return candidate;
}

probeTest('3.1 [eis-etl#450/#453 redaction]: deep-redacts URL userinfo, sensitive headers, and x-ns-ui:{secret:true} across PluginClientContext, SSR HTML, and island hydration props', async () => {
  const ConnectorSchema = z.object({
    name: z.string(),
    endpointUrl: z.string(),
    dsnUrl: z.string(),
    headers: z.record(z.string(), z.string()),
    webhookSecret: z.string().meta({ 'x-ns-ui': { secret: true } }),
    optionalToken: z.string().optional().meta({ 'x-ns-ui': { secret: true } }),
    preOptionalSecret: z.string().meta({ 'x-ns-ui': { secret: true } }).optional(),
  });

  const RAW_USER = 'etl_svc';
  const RAW_PASS = 'super_secret_db_pw_999';
  const RAW_DSN_PASS = 'pg_secret_pw_321';
  const RAW_QUERY_TOKEN = 'query_secret_token_888';
  const RAW_BEARER = 'Bearer raw_oauth_access_token_777';
  const RAW_COOKIE = 'session=raw_session_cookie_666';
  const RAW_API_KEY = 'sk_live_raw_api_key_555';
  const RAW_WEBHOOK_SECRET = 'whsec_raw_signing_secret_444';
  const RAW_PRE_OPT_SECRET = 'tok_pre_optional_secret_333';

  const serverRecord = {
    name: 'warehouse-sync',
    endpointUrl: `https://${RAW_USER}:${RAW_PASS}@db.internal.example:8443/ingest?token=${RAW_QUERY_TOKEN}`,
    dsnUrl: `postgres://${RAW_USER}:${RAW_DSN_PASS}@pg.internal.example:5432/eis`,
    headers: {
      Authorization: RAW_BEARER,
      Cookie: RAW_COOKIE,
      'X-Api-Key': RAW_API_KEY,
      'X-Trace-Source': 'eis-etl',
    },
    webhookSecret: RAW_WEBHOOK_SECRET,
    optionalToken: undefined,
    preOptionalSecret: RAW_PRE_OPT_SECRET,
  };

  // 1. PluginClientContext boundary (serializable, redacted, no PrincipalPort).
  const rawPluginClientContext = {
    mountId: 'eis-etl',
    base: '/etl',
    locale: 'en-US',
    direction: 'ltr',
    timeZone: 'UTC',
    subject: { signedIn: true, display: serverRecord.endpointUrl },
    capabilities: ['etl:read'],
  };
  const safeClientContext = await redactValueForClient(rawPluginClientContext) as Record<string, unknown>;
  assertNoUnredactedSecrets(safeClientContext);
  const clientContextJson = JSON.stringify(safeClientContext);
  for (const rawSecret of [RAW_USER, RAW_PASS, RAW_QUERY_TOKEN]) {
    assertEquals(clientContextJson.includes(rawSecret), false);
  }

  // 2. Fresh island hydration props boundary.
  const redactedConnector = await redactValueForClient(serverRecord, ConnectorSchema) as Record<string, unknown>;
  assertNoUnredactedSecrets(redactedConnector);

  const webhookHandle = redactedConnector.webhookSecret as RedactedSecretHandle;
  assertEquals(webhookHandle.__nsSecretHandle, true);
  assertEquals(webhookHandle.sentinel, REDACTED_SECRET_SENTINEL);
  assertEquals(webhookHandle.isSet, true);
  assertMatch(webhookHandle.digest ?? '', /^sha256:[0-9a-f]{16}$/);

  const optionalHandle = redactedConnector.optionalToken as RedactedSecretHandle;
  assertEquals(optionalHandle.isSet, false);
  assertEquals(optionalHandle.digest, null);

  const preOptionalHandle = redactedConnector.preOptionalSecret as RedactedSecretHandle;
  assertEquals(preOptionalHandle.__nsSecretHandle, true);
  assertEquals(preOptionalHandle.isSet, true);
  assertMatch(preOptionalHandle.digest ?? '', /^sha256:[0-9a-f]{16}$/);

  const redactedHeaders = redactedConnector.headers as Record<string, unknown>;
  assertEquals((redactedHeaders.Authorization as RedactedSecretHandle).isSet, true);
  assertEquals((redactedHeaders.Cookie as RedactedSecretHandle).isSet, true);
  assertEquals((redactedHeaders['X-Api-Key'] as RedactedSecretHandle).isSet, true);
  assertEquals(redactedHeaders['X-Trace-Source'], 'eis-etl');

  // 3. SSR HTML + serialized island hydration script via real Preact + preact-render-to-string.
  const islandPropsJson = JSON.stringify({ connector: redactedConnector, client: safeClientContext });
  const ssrVnode = h(
    'div',
    { 'data-ns-plugin': 'eis-etl' },
    h('h2', null, String(redactedConnector.name)),
    h('span', { class: 'secret-status' }, `Webhook secret set=${String(webhookHandle.isSet)} (${webhookHandle.digest})`),
    h('script', {
      type: 'application/json',
      id: '__FRSH_ISLAND_PROPS',
      dangerouslySetInnerHTML: { __html: islandPropsJson },
    }),
  );
  const ssrHtml = renderToString(ssrVnode);

  assertStringIncludes(ssrHtml, REDACTED_SECRET_SENTINEL);
  assertStringIncludes(ssrHtml, webhookHandle.digest!);
  for (
    const secret of [
      RAW_USER,
      RAW_PASS,
      RAW_DSN_PASS,
      RAW_QUERY_TOKEN,
      RAW_BEARER,
      RAW_COOKIE,
      RAW_API_KEY,
      RAW_WEBHOOK_SECRET,
      RAW_PRE_OPT_SECRET,
    ]
  ) {
    assertEquals(ssrHtml.includes(secret), false, `SSR HTML leaked secret: ${secret}`);
    assertEquals(islandPropsJson.includes(secret), false, `Island JSON leaked secret: ${secret}`);
  }
});

probeTest('3.2 [eis-etl#450/#453 negative assertions]: rejects unredacted outbound leaks, PrincipalPort crossing, and sentinel echo on write', async () => {
  // 1. Outbound serialization guard catches unredacted secrets & server-only PrincipalPort functions.
  assertThrows(
    () =>
      assertNoUnredactedSecrets({
        headers: { Authorization: 'Bearer leaked-token' },
      }),
    Error,
    'UNREDACTED_SECRET_SERIALIZATION_BLOCKED',
  );
  assertThrows(
    () =>
      assertNoUnredactedSecrets({
        url: 'postgres://admin:plainpw@db.internal:5432/app',
      }),
    Error,
    'UNREDACTED_SECRET_SERIALIZATION_BLOCKED',
  );
  await assertRejects(
    () =>
      redactValueForClient({
        principal: { resolve: () => Promise.resolve(null) },
      }),
    TypeError,
    'NON_SERIALIZABLE_PORT_BLOCKED',
  );

  // 2. Write-only secret-handle convention rejects echoing back the redaction sentinel.
  const storedSecret = 'whsec_original_secret_value';
  assertThrows(
    () => applySecretFieldWrite(storedSecret, REDACTED_SECRET_SENTINEL, 'webhookSecret'),
    Error,
    'SECRET_SENTINEL_ECHO_REJECTED',
  );
  assertThrows(
    () =>
      applySecretFieldWrite(
        storedSecret,
        `https://${REDACTED_SECRET_SENTINEL}:${REDACTED_SECRET_SENTINEL}@db.internal/app`,
        'endpointUrl',
      ),
    Error,
    'SECRET_SENTINEL_ECHO_REJECTED',
  );
  assertThrows(
    () =>
      applySecretFieldWrite(
        storedSecret,
        { sentinel: REDACTED_SECRET_SENTINEL, isSet: true } as unknown as SecretWriteInput,
        'webhookSecret',
      ),
    Error,
    'SECRET_SENTINEL_ECHO_REJECTED',
  );

  // 3. Valid write-only handle transitions: keep, set (rotate), clear.
  assertEquals(applySecretFieldWrite(storedSecret, { mode: 'keep' }, 'webhookSecret'), storedSecret);
  assertEquals(
    applySecretFieldWrite(storedSecret, { mode: 'set', value: 'whsec_rotated_999' }, 'webhookSecret'),
    'whsec_rotated_999',
  );
  assertEquals(applySecretFieldWrite(storedSecret, { mode: 'clear' }, 'webhookSecret'), null);
  assertThrows(
    () => applySecretFieldWrite(storedSecret, '   ', 'webhookSecret'),
    Error,
    'SECRET_VALUE_EMPTY',
  );
});

if (import.meta.main) {
  let passed = 0;
  let failed = 0;
  console.log(`=== Wave-0 Empirical Probe C (${probeCases.length} tests) ===`);
  for (const testCase of probeCases) {
    const start = performance.now();
    try {
      await testCase.fn();
      const elapsed = Math.round(performance.now() - start);
      passed += 1;
      console.log(`PASS ${testCase.name} (${elapsed}ms)`);
    } catch (error) {
      const elapsed = Math.round(performance.now() - start);
      failed += 1;
      console.error(`FAIL ${testCase.name} (${elapsed}ms)`);
      console.error(error);
    }
  }
  console.log(`=== Summary: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    Deno.exit(1);
  }
}
