/**
 * Wave-0 Empirical Probe C:
 *   1. Manifest evolution (.passthrough() forward-compat #1474) & path containment (#1473)
 *   2. Deny-by-default procedure gateway + RFC 0009 authorizing stream-proxy composition (P5)
 *   3. Server-side secret-redaction boundary + write-only secret handles (B3, M4, #2670)
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
import { getEventIteratorSchemaDetails, oc } from 'npm:@orpc/contract@^1.15.5';
import { eventIterator } from 'npm:@orpc/server@^1.15.5';
import { DurableStreamTestServer } from 'npm:@durable-streams/server@0.3.9';
import { App, page, type PageProps } from 'jsr:@fresh/core@^2.3.3';
import { Partial } from 'jsr:@fresh/core@^2.3.3/runtime';
import { ProdBuildCache, setBuildCache } from 'jsr:@fresh/core@^2.3.3/internal';
import { h } from 'npm:preact@^10.29.2';

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
import { workersContract } from '../../../../packages/plugin-workers-core/src/contracts/v1/workers.contract-definition.ts';
import {
  compileProcedures,
  type IndexedProcedure,
} from '../../../../packages/service/src/auth/contract/contract-procedure-index.ts';
import {
  createContractAuthorizer,
  createScopeAuthorizer,
} from '../../../../packages/service/src/auth/mod.ts';
import { authorizeProcedurePolicy } from '../../../../packages/service/src/auth/contract/procedure-policy-decision.ts';
import { isInternalServicePrincipal } from '../../../../packages/service/src/auth/internal-credential/internal-credential-authenticator.ts';
import type { AuthzDecision, Principal } from '../../../../packages/service/src/auth/types.ts';
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
  let existsAsLstat = false;
  try {
    await Deno.lstat(normalized);
    existsAsLstat = true;
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw new Error(
        `PATH_CONTAINMENT_REJECTED: unable to stat "${normalized}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
  if (existsAsLstat) {
    try {
      return await Deno.realPath(normalized);
    } catch (error) {
      // Fail closed on dangling/broken symlinks or realPath errors on existing entries.
      throw new Error(
        `PATH_CONTAINMENT_REJECTED: unresolved physical path for "${normalized}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
  const parent = resolve(normalized, '..');
  if (parent === normalized) {
    throw new Error(`PATH_CONTAINMENT_REJECTED: no resolvable ancestor for "${normalized}"`);
  }
  const base = normalized.slice(parent.length).replace(/^[/\\]+/, '');
  return join(await physicalPath(parent), base);
}

async function trustedRealRoot(root: string, label: string): Promise<string> {
  try {
    return await Deno.realPath(resolve(root));
  } catch (error) {
    throw new Error(
      `PATH_CONTAINMENT_REJECTED: ${label} "${root}" cannot be resolved: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

async function assertPhysicalContainment(realRoot: string, target: string): Promise<string> {
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
      `PATH_CONTAINMENT_REJECTED: symlink or physical path "${target}" escapes trusted root "${realRoot}"`,
    );
  }
  return realTarget;
}

async function deriveGeneratedArtifactPath(
  projectRoot: string,
  familyDir: string,
  mountId: string,
  fileName: string,
  options?: { readonly stagingTxId?: string },
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
  const trustedProjectRoot = await trustedRealRoot(projectRoot, 'projectRoot');
  const netscriptDir = resolve(projectRoot, '.netscript');
  const generatedRoot = resolve(netscriptDir, 'generated');
  await assertPhysicalContainment(trustedProjectRoot, netscriptDir);
  await assertPhysicalContainment(trustedProjectRoot, generatedRoot);

  let target: string;
  if (options?.stagingTxId !== undefined) {
    assertCleanPathToken(options.stagingTxId, 'stagingTxId');
    if (
      options.stagingTxId.includes('/') ||
      options.stagingTxId === '.' ||
      options.stagingTxId === '..' ||
      !/^[a-z0-9-]+$/.test(options.stagingTxId)
    ) {
      throw new Error(`PATH_CONTAINMENT_REJECTED: invalid stagingTxId "${options.stagingTxId}"`);
    }
    const stagingDir = resolve(generatedRoot, '.staging', `${familyDir}-${options.stagingTxId}`);
    await assertPhysicalContainment(trustedProjectRoot, stagingDir);
    target = resolve(stagingDir, safeMountId, fileName);
  } else {
    const familyRoot = resolve(generatedRoot, familyDir);
    await assertPhysicalContainment(trustedProjectRoot, familyRoot);
    target = resolve(familyRoot, safeMountId, fileName);
  }
  assertLexicallyContained(generatedRoot, target);
  await assertPhysicalContainment(trustedProjectRoot, target);
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
  const trustedPkgRoot = await trustedRealRoot(packageRoot, 'packageRoot');
  const target = resolve(packageRoot, subPath);
  assertLexicallyContained(packageRoot, target);
  await assertPhysicalContainment(trustedPkgRoot, target);
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
  //    Also verify the unamended draft RFC guide manifest (omitting framework + adding extra keys) is rejected!
  const malformedPointerFixtures = [
    { export: '../escape', framework: 'fresh' },
    { export: './frontend', framework: 'react' },
    { export: './frontend', framework: 'fresh', unknownFlag: true },
    {
      export: './frontend',
      mountPrefix: '/plugins/workers',
      mountId: 'workers',
      defaultOnInvalid: 'fail-install',
      budgets: { maxInitialClientJsBytes: 12288, maxRouteCssBytes: 8192 },
    },
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

    // Physical symlink escape check 1: symlink below .netscript/generated/frontend -> outsideRoot.
    const symlinkDir = join(projectRoot, '.netscript', 'generated', 'frontend');
    await Deno.symlink(outsideRoot, symlinkDir);
    await assertRejects(
      () => deriveGeneratedArtifactPath(projectRoot, 'frontend', 'crons', 'frontend.registry.ts'),
      Error,
      'PATH_CONTAINMENT_REJECTED',
    );
    await Deno.remove(symlinkDir);

    // Physical symlink escape check 2 (B6): symlink ABOVE .netscript/generated (.netscript/generated -> outsideRoot)
    // AND .netscript -> outsideRoot MUST both fail anchored against trusted Deno.realPath(projectRoot).
    const generatedDir = join(projectRoot, '.netscript', 'generated');
    await Deno.remove(generatedDir);
    await Deno.symlink(outsideRoot, generatedDir);
    await assertRejects(
      () => deriveGeneratedArtifactPath(projectRoot, 'frontend', 'crons', 'frontend.registry.ts'),
      Error,
      'PATH_CONTAINMENT_REJECTED',
    );
    await assertRejects(
      () =>
        deriveGeneratedArtifactPath(projectRoot, 'frontend', 'crons', 'frontend.registry.ts', {
          stagingTxId: 'tx-1',
        }),
      Error,
      'PATH_CONTAINMENT_REJECTED',
    );
    await Deno.remove(generatedDir);

    // Broken/dangling symlink at .netscript/generated MUST fail closed (never treated as missing path).
    const brokenTarget = join(tempDir, 'nonexistent-outside-target');
    await Deno.symlink(brokenTarget, generatedDir);
    await assertRejects(
      () => deriveGeneratedArtifactPath(projectRoot, 'frontend', 'crons', 'frontend.registry.ts'),
      Error,
      'PATH_CONTAINMENT_REJECTED',
    );
    await Deno.remove(generatedDir);

    // Symlink at .netscript itself -> outsideRoot MUST also fail against trusted projectRoot.
    const dotNetscriptDir = join(projectRoot, '.netscript');
    await Deno.remove(dotNetscriptDir);
    await Deno.symlink(outsideRoot, dotNetscriptDir);
    await assertRejects(
      () => deriveGeneratedArtifactPath(projectRoot, 'frontend', 'crons', 'frontend.registry.ts'),
      Error,
      'PATH_CONTAINMENT_REJECTED',
    );
    await Deno.remove(dotNetscriptDir);
    await Deno.mkdir(generatedDir, { recursive: true });

    // Valid staged destination resolves cleanly inside trusted projectRoot.
    const validStaged = await deriveGeneratedArtifactPath(
      projectRoot,
      'frontend',
      'acme-crons',
      'frontend.registry.ts',
      { stagingTxId: 'tx-42' },
    );
    assertEquals(
      validStaged,
      resolve(
        projectRoot,
        '.netscript',
        'generated',
        '.staging',
        'frontend-tx-42',
        'acme-crons',
        'frontend.registry.ts',
      ),
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

// RFC 0005 canonical spine contracts + matching/ordering/failure policy (#1471 / B1 / B2)
const FamilyRefSchema = z.object({
  family: z.string().min(1),
  major: z.number().int().positive(),
}).strict();

const ContributionEnvelopeSchema = z.object({
  contract: FamilyRefSchema,
  pluginKind: z.string().min(1),
  base: z.string().min(1).optional(),
  contributions: z.array(z.unknown()),
  requires: z.object({
    procedures: z.array(z.string().min(1)).optional(),
  }).strict().optional(),
  budgets: z.object({
    initialJsKb: z.number().positive().optional(),
    islands: z.number().int().nonnegative().optional(),
    panelRenderMs: z.number().positive().optional(),
  }).strict().optional(),
}).strict();

interface CanonicalContributionIdentity {
  readonly packageName: string;
  readonly pluginKind: string;
  readonly installationId: string;
  readonly mountId: string;
}

interface CanonicalZoneDescriptor {
  readonly id: string; // `<zoneName>/v<major>`
  readonly capacity?: number;
  readonly anchors?: readonly string[]; // `<mountId>/<id>/v<apiMajor>`
}

interface CanonicalResolvedContribution {
  readonly family: string;
  readonly id: string;
  readonly apiMajor: number;
  readonly zone: string;
  readonly order?: number;
  readonly identity: CanonicalContributionIdentity;
  readonly fullyQualifiedId: string; // `${identity.mountId}/${id}/v${apiMajor}`
}

function toFullyQualifiedContributionId(
  identity: CanonicalContributionIdentity,
  id: string,
  apiMajor: number,
): string {
  return `${identity.mountId}/${id}/v${apiMajor}`;
}

function orderRfc0005Contributions(
  zone: CanonicalZoneDescriptor,
  items: readonly CanonicalResolvedContribution[],
): { readonly ordered: readonly CanonicalResolvedContribution[]; readonly warnings: readonly string[] } {
  for (const item of items) {
    if (item.order !== undefined && (!Number.isInteger(item.order) || item.order < -100 || item.order > 100)) {
      throw new Error(
        `ORDER_OUT_OF_RANGE: contribution "${item.fullyQualifiedId}" order=${item.order} must be an integer in [-100, 100]`,
      );
    }
  }
  const presentIds = new Set(items.map((item) => item.fullyQualifiedId));
  const warnings: string[] = [];
  for (const anchor of zone.anchors ?? []) {
    if (!presentIds.has(anchor)) {
      warnings.push(`UNMATCHED_ANCHOR: zone "${zone.id}" anchor "${anchor}" matched no contribution`);
    }
  }
  const rank = new Map((zone.anchors ?? []).map((fq, i) => [fq, i]));
  const anchored: CanonicalResolvedContribution[] = [];
  const rest: CanonicalResolvedContribution[] = [];
  for (const item of items) {
    (rank.has(item.fullyQualifiedId) ? anchored : rest).push(item);
  }
  anchored.sort((a, b) => rank.get(a.fullyQualifiedId)! - rank.get(b.fullyQualifiedId)!);
  rest.sort((a, b) =>
    (a.order ?? 0) - (b.order ?? 0) ||
    (a.identity.mountId < b.identity.mountId ? -1 : a.identity.mountId > b.identity.mountId ? 1 : 0) ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
  return { ordered: [...anchored, ...rest], warnings };
}

type CanonicalDiagnosisState =
  | 'unknown-zone'
  | 'known-but-unmounted'
  | 'capacity-rejected'
  | 'window-mismatch'
  | 'load-failure'
  | 'zone-contract-mismatch';

function diagnoseZoneTarget(options: {
  readonly contract: { readonly family: string; readonly major: number };
  readonly supportedFamilyMajors: ReadonlyMap<string, readonly number[]>;
  readonly familyVocabulary: ReadonlySet<string>;
  readonly hostZones: ReadonlyMap<string, CanonicalZoneDescriptor>;
  readonly targetZone: string;
}): 'matched' | CanonicalDiagnosisState {
  const majors = options.supportedFamilyMajors.get(options.contract.family) ?? [];
  if (!majors.includes(options.contract.major)) {
    return 'window-mismatch';
  }
  if (options.hostZones.has(options.targetZone)) {
    return 'matched';
  }
  if (options.familyVocabulary.has(options.targetZone)) {
    return 'known-but-unmounted';
  }
  const match = /^(.+)\/v(\d+)$/.exec(options.targetZone);
  if (match) {
    const [, zoneBase] = match;
    const knownBase = [...options.familyVocabulary, ...options.hostZones.keys()].some((id) =>
      id.startsWith(`${zoneBase}/v`)
    );
    if (knownBase) {
      return 'zone-contract-mismatch';
    }
  }
  return 'unknown-zone';
}

probeTest('1.4 [#928/#1471 RFC 0005 spine]: canonical ContributionEnvelope, mixed-family [app + devtools] export, and 2 installations of 1 package without collision', () => {
  // 1) Verbatim guide manifest uses single parse-only `{ export: './frontend', framework: 'fresh' }`.
  const pointerResult = validateFrontendPointerAtGenerateTime(
    { frontend: { export: './frontend', framework: 'fresh' } },
    '@netscript/plugin-workers',
  );
  assertEquals(pointerResult, {
    ok: true,
    pointer: { export: './frontend', framework: 'fresh' },
  });

  // 2) Mixed-family ContributionEnvelope[] (`app` + `devtools`) exported behind that single pointer.
  const mixedExport: unknown[] = [
    {
      contract: { family: 'app', major: 1 },
      pluginKind: 'workers',
      base: '/plugins/workers',
      contributions: [{ kind: 'zone', id: 'jobs-panel', apiMajor: 1, zone: 'app.dashboard.panels/v1' }],
      requires: { procedures: ['getJob', 'triggerJob'] },
    },
    {
      contract: { family: 'devtools', major: 1 },
      pluginKind: 'workers',
      contributions: [{ kind: 'panel', id: 'jobs-panel', apiMajor: 1, zone: 'workers.console/v1' }],
    },
  ];
  const parsedEnvelopes = mixedExport.map((env) => ContributionEnvelopeSchema.parse(env));
  assertEquals(parsedEnvelopes[0].contract, { family: 'app', major: 1 });
  assertEquals(parsedEnvelopes[1].contract, { family: 'devtools', major: 1 });

  // 3) Reject non-RFC-0005 `{ id, version }` envelope shape.
  assertEquals(
    ContributionEnvelopeSchema.safeParse({
      family: { id: 'frontend', version: 1 },
      contributions: [],
    }).success,
    false,
  );

  // 4) Two installations of the SAME package (@netscript/plugin-workers) receive distinct host-assigned
  //    installationId / mountId values, yielding non-colliding fully-qualified keys, routes, and gateways.
  const installA: CanonicalContributionIdentity = {
    packageName: '@netscript/plugin-workers',
    pluginKind: 'workers',
    installationId: 'workers-east',
    mountId: 'workers-east',
  };
  const installB: CanonicalContributionIdentity = {
    packageName: '@netscript/plugin-workers',
    pluginKind: 'workers',
    installationId: 'workers-west',
    mountId: 'workers-west',
  };
  const keyA = toFullyQualifiedContributionId(installA, 'jobs-panel', 1);
  const keyB = toFullyQualifiedContributionId(installB, 'jobs-panel', 1);
  assertEquals(keyA, 'workers-east/jobs-panel/v1');
  assertEquals(keyB, 'workers-west/jobs-panel/v1');
  assertNotEquals(keyA, keyB);
});

probeTest('1.5 [#1471 ordering, zone matching, diagnosis, & host-owned failure policy]', () => {
  const workersIdentity: CanonicalContributionIdentity = {
    packageName: '@netscript/plugin-workers',
    pluginKind: 'workers',
    installationId: 'workers',
    mountId: 'workers',
  };
  const sagasIdentity: CanonicalContributionIdentity = {
    packageName: '@netscript/plugin-sagas',
    pluginKind: 'sagas',
    installationId: 'sagas',
    mountId: 'sagas',
  };

  // 1) Pinned anchors render first, remainder sorted by (order ?? 0, mountId, id); capacity winners deterministic.
  const zone: CanonicalZoneDescriptor = {
    id: 'app.dashboard.panels/v1',
    capacity: 2,
    anchors: ['workers/pinned-late/v1', 'missing/phantom-anchor/v1'],
  };
  const items: CanonicalResolvedContribution[] = [
    {
      family: 'app',
      id: 'alpha',
      apiMajor: 1,
      zone: 'app.dashboard.panels/v1',
      order: -50,
      identity: sagasIdentity,
      fullyQualifiedId: toFullyQualifiedContributionId(sagasIdentity, 'alpha', 1),
    },
    {
      family: 'app',
      id: 'pinned-late',
      apiMajor: 1,
      zone: 'app.dashboard.panels/v1',
      order: 90,
      identity: workersIdentity,
      fullyQualifiedId: toFullyQualifiedContributionId(workersIdentity, 'pinned-late', 1),
    },
    {
      family: 'app',
      id: 'beta',
      apiMajor: 1,
      zone: 'app.dashboard.panels/v1',
      order: -50,
      identity: workersIdentity,
      fullyQualifiedId: toFullyQualifiedContributionId(workersIdentity, 'beta', 1),
    },
  ];
  const { ordered, warnings } = orderRfc0005Contributions(zone, items);
  assertEquals(ordered.map((i) => i.fullyQualifiedId), [
    'workers/pinned-late/v1',
    'sagas/alpha/v1',
    'workers/beta/v1',
  ]);
  assertEquals(warnings.length, 1);
  assertStringIncludes(warnings[0], 'UNMATCHED_ANCHOR');
  const winners = ordered.slice(0, zone.capacity);
  const losers = ordered.slice(zone.capacity);
  assertEquals(winners.map((i) => i.fullyQualifiedId), ['workers/pinned-late/v1', 'sagas/alpha/v1']);
  assertEquals(losers.map((i) => i.fullyQualifiedId), ['workers/beta/v1']);

  // 2) Out-of-range order throws generate-time error (never silently clamped).
  assertThrows(
    () =>
      orderRfc0005Contributions(zone, [{ ...items[0], order: 101 }]),
    Error,
    'ORDER_OUT_OF_RANGE',
  );

  // 3) Distinct 6-state diagnosis for family major vs absent known zone vs unserved zone major vs unknown zone.
  const supportedFamilyMajors = new Map<string, readonly number[]>([
    ['app', [1]],
    ['devtools', [1]],
  ]);
  const familyVocabulary = new Set([
    'app.dashboard.panels/v1',
    'pipeline.inspector.sections/v1',
  ]);
  const hostZones = new Map<string, CanonicalZoneDescriptor>([
    ['app.dashboard.panels/v1', zone],
  ]);

  assertEquals(
    diagnoseZoneTarget({
      contract: { family: 'app', major: 2 },
      supportedFamilyMajors,
      familyVocabulary,
      hostZones,
      targetZone: 'app.dashboard.panels/v1',
    }),
    'window-mismatch',
  );
  assertEquals(
    diagnoseZoneTarget({
      contract: { family: 'app', major: 1 },
      supportedFamilyMajors,
      familyVocabulary,
      hostZones,
      targetZone: 'pipeline.inspector.sections/v1',
    }),
    'known-but-unmounted',
  );
  assertEquals(
    diagnoseZoneTarget({
      contract: { family: 'app', major: 1 },
      supportedFamilyMajors,
      familyVocabulary,
      hostZones,
      targetZone: 'app.dashboard.panels/v2',
    }),
    'zone-contract-mismatch',
  );
  assertEquals(
    diagnoseZoneTarget({
      contract: { family: 'app', major: 1 },
      supportedFamilyMajors,
      familyVocabulary,
      hostZones,
      targetZone: 'plugin.invented/v1',
    }),
    'unknown-zone',
  );

  // 4) Host-owned failure policy: invalid devtools item alongside valid app item excludes & diagnoses
  //    without failing install, whereas invalid app item fails install (no per-contributor override).
  const evaluateInstall = (
    envelopes: readonly { readonly family: 'app' | 'devtools'; readonly valid: boolean }[],
  ) => {
    const diagnostics: { readonly family: string; readonly outcome: string }[] = [];
    for (const env of envelopes) {
      if (env.valid) continue;
      if (env.family === 'app') {
        throw new Error('APP_INSTALL_FAILED: broken app contribution fails install');
      }
      diagnostics.push({ family: env.family, outcome: 'exclude-and-diagnose' });
    }
    return { installed: true, diagnostics };
  };
  const mixedInstallResult = evaluateInstall([
    { family: 'app', valid: true },
    { family: 'devtools', valid: false },
  ]);
  assertEquals(mixedInstallResult.installed, true);
  assertEquals(mixedInstallResult.diagnostics, [{ family: 'devtools', outcome: 'exclude-and-diagnose' }]);
  assertThrows(() => evaluateInstall([{ family: 'app', valid: false }]), Error, 'APP_INSTALL_FAILED');
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

export interface GatewayProcedureGrant {
  readonly procedureId: string;
  readonly owningService: string;
  readonly allowedQueryParams?: readonly string[];
  readonly pathParamsSchema?: z.ZodObject<Record<string, z.ZodType<string>>>;
  readonly authorizeService?: (request: {
    readonly principal: Principal;
    readonly method: string;
    readonly path: string;
    readonly rawPath: string;
  }) => Promise<AuthzDecision> | AuthzDecision;
  readonly authorizeResource?: (
    principal: Principal,
    resource: Readonly<Record<string, string>>,
  ) => AuthzDecision;
}

interface GeneratedGatewayRoute {
  readonly procedureId: string;
  readonly owningService: string;
  readonly method: string;
  readonly restPattern: string;
  readonly pathParamNames: readonly string[];
  readonly allowedQueryParams: readonly string[];
  readonly pathParamsSchema?: z.ZodObject<Record<string, z.ZodType<string>>>;
  readonly indexed: IndexedProcedure;
  readonly authorizeService?: GatewayProcedureGrant['authorizeService'];
  readonly authorizeResource?: GatewayProcedureGrant['authorizeResource'];
  readonly cachePolicy: 'no-store' | 'default' | 'force-cache';
}

function extractRestPatternParamNames(restPattern: string): readonly string[] {
  const names: string[] = [];
  for (const segment of restPattern.split('/')) {
    if (segment.startsWith(':') && segment.length > 1) {
      names.push(segment.slice(1));
    }
  }
  return names;
}

function bindTypedUpstreamPath(
  restPattern: string,
  paramNames: readonly string[],
  params: Readonly<Record<string, string>>,
): string {
  if (paramNames.length === 0) return restPattern;
  return restPattern.split('/').map((segment) => {
    if (!segment.startsWith(':')) return segment;
    const key = segment.slice(1);
    const val = params[key];
    if (typeof val !== 'string' || val.length === 0 || /[/?#\\]|\.\./.test(val)) {
      throw new Error(`GATEWAY_INVALID_PATH_PARAM: invalid parameter "${key}"`);
    }
    return encodeURIComponent(val);
  }).join('/');
}

function generateGatewayRouteTable(options: {
  readonly mountId: string;
  readonly owningService?: string;
  readonly contract: Record<string, unknown>;
  readonly requiresProcedures: readonly (string | GatewayProcedureGrant)[];
  readonly allowEventIterator?: boolean;
}): ReadonlyMap<string, GeneratedGatewayRoute> {
  const safeMountId = validateMountId(options.mountId);
  const compiled = compileProcedures(options.contract as Parameters<typeof compileProcedures>[0]);
  const byId = new Map<string, IndexedProcedure>();
  for (const proc of compiled) {
    byId.set(proc.routerPath.join('.'), proc);
  }

  const routes = new Map<string, GeneratedGatewayRoute>();
  for (const entry of options.requiresProcedures) {
    const grant: GatewayProcedureGrant = typeof entry === 'string'
      ? { procedureId: entry, owningService: options.owningService ?? safeMountId }
      : entry;
    const procId = grant.procedureId;
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
    let node: unknown = options.contract;
    for (const seg of proc.routerPath) {
      node = typeof node === 'object' && node !== null ? Reflect.get(node, seg) : undefined;
    }
    const orpcMetaNode = (typeof node === 'object' && node !== null && '~orpc' in node)
      ? (Reflect.get(node, '~orpc') as Record<string, unknown>)
      : undefined;
    if (!options.allowEventIterator && orpcMetaNode?.outputSchema) {
      const iterDetails = getEventIteratorSchemaDetails(orpcMetaNode.outputSchema as never);
      if (iterDetails !== undefined) {
        throw new Error(
          `GATEWAY_EVENT_ITERATOR_DEFERRED_W2: eventIterator procedure "${procId}" is excluded from HTTP-only W2 gateway`,
        );
      }
    }
    const meta = orpcMetaNode?.meta as NetScriptProcedureMeta | undefined;
    const pathParamNames = extractRestPatternParamNames(proc.restPattern);
    if (pathParamNames.length > 0 && !grant.pathParamsSchema) {
      throw new Error(
        `GATEWAY_PARAMETER_BINDING_REQUIRED: parameterized procedure "${procId}" (${proc.restPattern}) requires typed pathParamsSchema`,
      );
    }

    routes.set(procId, {
      procedureId: procId,
      owningService: grant.owningService,
      method: proc.restMethod.toUpperCase(),
      restPattern: proc.restPattern,
      pathParamNames,
      allowedQueryParams: [...(grant.allowedQueryParams ?? [])],
      pathParamsSchema: grant.pathParamsSchema,
      indexed: proc,
      authorizeService: grant.authorizeService,
      authorizeResource: grant.authorizeResource,
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
  readonly serviceApiMount?: string;
  readonly principalPort: PrincipalPort;
  readonly getServerUpstreamAuth: (ctx: {
    readonly principal: Principal | null;
    readonly procedureId: string;
    readonly owningService: string;
    readonly resource: Readonly<Record<string, string>>;
  }) => Record<string, string>;
  readonly maxRequestBytes?: number;
  readonly maxResponseBytes?: number;
  readonly timeoutMs?: number;
  readonly auditLog?: (entry: GatewayAuditEntry) => void;
  readonly fetchImpl?: typeof fetch;
}): (request: Request) => Promise<Response> {
  const safeMountId = validateMountId(options.mountId);
  const gatewayPrefix = `/api/plugins/${safeMountId}/`;
  const serviceApiMount = (options.serviceApiMount ?? '').replace(/\/$/, '');
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

    // Read bounded request body early so typed parameter binding & authz never exceed payload caps.
    const contentLengthHeader = request.headers.get('content-length');
    if (contentLengthHeader !== null) {
      const parsedLen = Number(contentLengthHeader);
      if (!Number.isFinite(parsedLen) || parsedLen < 0 || parsedLen > maxReqBytes) {
        emitAudit({
          procedure: procedureId,
          subject: null,
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
        subject: null,
        status: 413,
        outcome: 'deny',
        reason: 'request_body_too_large',
        correlationId,
      });
      return Response.json({ error: 'PAYLOAD_TOO_LARGE', reason: 'request_body_too_large' }, { status: 413 });
    }

    // Typed parameter binding BEFORE authz/upstream so raw router patterns like `/jobs/:id` never reach upstream.
    const incomingUrl = new URL(request.url);
    let boundParams: Record<string, string> = {};
    let resolvedUpstreamRelativePath = route.restPattern;
    if (route.pathParamNames.length > 0 && route.pathParamsSchema) {
      let bodyParams: Record<string, unknown> = {};
      if (reqBody.bytes.byteLength > 0) {
        try {
          const decoded = JSON.parse(new TextDecoder().decode(reqBody.bytes));
          if (decoded && typeof decoded === 'object' && !Array.isArray(decoded)) {
            bodyParams = decoded as Record<string, unknown>;
          }
        } catch {
          return Response.json({ error: 'BAD_REQUEST', reason: 'invalid_json_body' }, { status: 400 });
        }
      }
      const rawCandidateParams: Record<string, unknown> = {};
      for (const name of route.pathParamNames) {
        rawCandidateParams[name] = incomingUrl.searchParams.get(name) ?? bodyParams[name];
      }
      const parsedParams = route.pathParamsSchema.safeParse(rawCandidateParams);
      if (!parsedParams.success) {
        emitAudit({
          procedure: procedureId,
          subject: null,
          status: 400,
          outcome: 'deny',
          reason: 'invalid_typed_path_params',
          correlationId,
        });
        return Response.json({ error: 'BAD_REQUEST', reason: 'invalid_typed_path_params' }, { status: 400 });
      }
      boundParams = parsedParams.data;
      try {
        resolvedUpstreamRelativePath = bindTypedUpstreamPath(
          route.restPattern,
          route.pathParamNames,
          boundParams,
        );
      } catch {
        return Response.json({ error: 'BAD_REQUEST', reason: 'invalid_typed_path_params' }, { status: 400 });
      }
    }
    const upstreamPathname = `${serviceApiMount}${resolvedUpstreamRelativePath}`;

    // Server-side PrincipalPort authentication + contract policy / published service authorizer + resource policy.
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
      let decision: AuthzDecision;
      if (route.indexed.policy) {
        decision = authorizeProcedurePolicy(
          { principal, method, path: upstreamPathname, rawPath: upstreamPathname },
          route.indexed.policy,
          isInternalServicePrincipal,
        );
      } else if (route.authorizeService) {
        decision = await route.authorizeService({
          principal,
          method,
          path: upstreamPathname,
          rawPath: upstreamPathname,
        });
      } else {
        decision = { allow: false, reason: 'authz.missing_policy' };
      }

      if (decision.allow && route.authorizeResource) {
        decision = route.authorizeResource(principal, boundParams);
      }

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

    // Build allowlisted upstream request headers (NEVER forward browser Cookie / Authorization).
    const upstreamHeaders = new Headers();
    upstreamHeaders.set('accept', 'application/json');
    const reqContentType = request.headers.get('content-type');
    if (reqContentType) upstreamHeaders.set('content-type', reqContentType);
    const traceparent = request.headers.get('traceparent');
    if (traceparent) upstreamHeaders.set('traceparent', traceparent);
    upstreamHeaders.set('x-correlation-id', correlationId);
    upstreamHeaders.set('x-netscript-subject', principal?.subject ?? 'anonymous');
    for (
      const [k, v] of Object.entries(
        options.getServerUpstreamAuth({
          principal,
          procedureId,
          owningService: route.owningService,
          resource: boundParams,
        }),
      )
    ) {
      upstreamHeaders.set(k, v);
    }

    // Strict allowlisted query-parameter binding (NEVER blind-copy arbitrary incoming query parameters).
    const upstreamUrl = new URL(upstreamPathname, options.serviceOrigin);
    for (const allowedKey of route.allowedQueryParams) {
      for (const val of incomingUrl.searchParams.getAll(allowedKey)) {
        upstreamUrl.searchParams.append(allowedKey, val);
      }
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

// Synthetic contract fixture (explicitly labeled synthetic!) built with real `baseContract` + `NetScriptProcedureMeta`
// to test explicit metadata policy enforcement, internal-audience rejection, and SDK metadata stripping.
const SYNTHETIC_CRON_READ_META = {
  access: {
    authentication: 'required',
    authorization: { scopes: ['crons:read'] },
  },
  policy: { cache: 'no-store' },
} as const satisfies NetScriptProcedureMeta;

const SYNTHETIC_CRON_WRITE_META = {
  access: {
    authentication: 'required',
    authorization: { scopes: ['crons:write'], roles: ['operator'] },
  },
} as const satisfies NetScriptProcedureMeta;

const SYNTHETIC_CRON_ADMIN_META = {
  access: {
    authentication: 'required',
    authorization: { scopes: ['crons:admin'] },
  },
} as const satisfies NetScriptProcedureMeta;

const SYNTHETIC_CRON_INTERNAL_META = {
  access: {
    authentication: 'required',
    audience: 'internal',
  },
} as const satisfies NetScriptProcedureMeta;

const SYNTHETIC_CRONS_CONTRACT = {
  list: baseContract
    .route({ method: 'GET', path: '/crons' })
    .meta(SYNTHETIC_CRON_READ_META)
    .output(z.object({ jobs: z.array(z.string()) })),
  pause: baseContract
    .route({ method: 'POST', path: '/crons/pause' })
    .meta(SYNTHETIC_CRON_WRITE_META)
    .input(z.object({ jobId: z.string().min(1) }))
    .output(z.object({ paused: z.boolean() })),
  deleteAll: baseContract
    .route({ method: 'POST', path: '/crons/delete-all' })
    .meta(SYNTHETIC_CRON_ADMIN_META)
    .output(z.object({ deleted: z.number() })),
  internalSync: baseContract
    .route({ method: 'POST', path: '/crons/internal-sync' })
    .meta(SYNTHETIC_CRON_INTERNAL_META)
    .output(z.object({ synced: z.boolean() })),
  tailEvents: oc
    .$meta<NetScriptProcedureMeta>(SYNTHETIC_CRON_READ_META)
    .route({ method: 'GET', path: '/crons/tail' })
    .output(eventIterator(z.object({ tick: z.number() }))),
};

probeTest('2.1 [P5 gateway]: real authContract + real workersContract + synthetic cronsContract compilation and internal-audience rejection', () => {
  // 1) Real repo authContract compiles cleanly via compileProcedures.
  const compiledAuth = compileProcedures(authContract);
  const revokeProc = compiledAuth.find((p) => p.routerPath.join('.') === 'revokeSession');
  assertExists(revokeProc);
  assertEquals(revokeProc.restMethod, 'POST');
  assertEquals(revokeProc.policy?.authentication, 'required');
  assertEquals(revokeProc.policy?.requiredScopes, ['auth:sessions:revoke']);

  // 2) Real repo workersContract declares getJob & triggerJob WITHOUT meta.access (`policy === undefined`).
  const compiledWorkers = compileProcedures(workersContract as never);
  const getJobProc = compiledWorkers.find((p) => p.routerPath.join('.') === 'getJob');
  const triggerJobProc = compiledWorkers.find((p) => p.routerPath.join('.') === 'triggerJob');
  assertExists(getJobProc);
  assertExists(triggerJobProc);
  assertEquals(getJobProc.restPattern, '/jobs/:id');
  assertEquals(getJobProc.policy, undefined);
  assertEquals(triggerJobProc.restPattern, '/jobs/:id/trigger');
  assertEquals(triggerJobProc.policy, undefined);

  // 3) Synthetic cronsContract compiles only granted procedures (HTTP-only W2 mode excludes eventIterator).
  const routes = generateGatewayRouteTable({
    mountId: 'crons',
    owningService: 'crons-synthetic',
    contract: SYNTHETIC_CRONS_CONTRACT,
    requiresProcedures: ['list', 'pause'],
  });
  assertEquals([...routes.keys()], ['list', 'pause']);
  assertEquals(routes.get('list')?.method, 'GET');
  assertEquals(routes.get('pause')?.method, 'POST');

  // 4) Verify SDK stable-v1 adapter's normalizeProcedureMeta strips authorization/audience in client
  //    transport metadata (distinct from server compileProcedures / createContractAuthorizer).
  const sdkMetaPort = createStableV1ProcedureMetadataPort();
  const sdkDesc = sdkMetaPort.describe(SYNTHETIC_CRONS_CONTRACT.pause, ['pause']);
  assertEquals(sdkDesc.meta.access?.authentication, 'required');
  assertEquals(sdkDesc.meta.access?.authorization, undefined);

  // 5) Internal-audience procedure MUST be rejected at generation time.
  assertThrows(
    () =>
      generateGatewayRouteTable({
        mountId: 'crons',
        owningService: 'crons-synthetic',
        contract: SYNTHETIC_CRONS_CONTRACT,
        requiresProcedures: ['internalSync'],
      }),
    Error,
    'GATEWAY_INTERNAL_AUDIENCE_FORBIDDEN',
  );
});

probeTest('2.2 [P5 gateway]: synthetic crons HTTP controls (CSRF, method, redirect manual, response headers, audit log)', async () => {
  const routes = generateGatewayRouteTable({
    mountId: 'crons',
    owningService: 'crons-synthetic',
    contract: SYNTHETIC_CRONS_CONTRACT,
    requiresProcedures: [
      { procedureId: 'list', owningService: 'crons-synthetic', allowedQueryParams: ['triggerRedirect'] },
      { procedureId: 'pause', owningService: 'crons-synthetic' },
    ],
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

probeTest('2.2b [P5 + real workersContract]: host-approved procedure x owning service x (principal, resource) policy + typed param binding', async () => {
  const workersAuthorizer = createContractAuthorizer(workersContract as never, {
    fallback: createScopeAuthorizer({
      rules: [
        {
          match: (req) => req.method === 'GET' && req.path.startsWith('/api/workers/jobs/'),
          requireScopes: ['workers:jobs:read'],
        },
        {
          match: (req) => req.method === 'POST' && req.path.endsWith('/trigger'),
          requireScopes: ['workers:jobs:trigger'],
          requireRoles: ['operator'],
        },
      ],
    }),
  });
  workersAuthorizer.bind({ apiPath: '/api/workers', rpcPath: '/rpc/workers' });

  const jobIdParamsSchema = z.object({
    id: z.string().regex(/^[a-z0-9-]+$/),
  });

  const authorizeJobResource = (
    principal: Principal,
    resource: Readonly<Record<string, string>>,
  ): AuthzDecision => {
    const allowed = principal.claims?.allowedJobIds;
    if (!Array.isArray(allowed) || !allowed.includes(resource.id)) {
      return { allow: false, reason: `authz.resource_denied:${resource.id ?? '<none>'}` };
    }
    return { allow: true };
  };

  const routes = generateGatewayRouteTable({
    mountId: 'workers',
    owningService: 'workers',
    contract: workersContract as unknown as Record<string, unknown>,
    requiresProcedures: [
      {
        procedureId: 'getJob',
        owningService: 'workers',
        pathParamsSchema: jobIdParamsSchema,
        allowedQueryParams: [], // strictly no blind query forwarding
        authorizeService: (req) => workersAuthorizer.authorize(req),
        authorizeResource: authorizeJobResource,
      },
      {
        procedureId: 'triggerJob',
        owningService: 'workers',
        pathParamsSchema: jobIdParamsSchema,
        allowedQueryParams: [],
        authorizeService: (req) => workersAuthorizer.authorize(req),
        authorizeResource: authorizeJobResource,
      },
    ],
  });

  const upstreamRequests: { path: string; search: string; service: string | null; resource: string | null; auth: string | null }[] = [];
  const gateway = createPluginGatewayHandler({
    mountId: 'workers',
    routes,
    hostOrigin: 'https://app.example.test',
    serviceOrigin: 'http://workers.internal.test',
    serviceApiMount: '/api/workers',
    principalPort: {
      resolve: () =>
        Promise.resolve({
          subject: 'user:alice',
          scopes: ['workers:jobs:read', 'workers:jobs:trigger'],
          roles: ['operator'],
          scheme: 'custom',
          claims: { allowedJobIds: ['job-alpha'] },
        }),
    },
    getServerUpstreamAuth: ({ owningService, resource }) => ({
      authorization: `Bearer svc:${owningService}:${resource.id ?? 'none'}`,
      'x-netscript-service': owningService,
      'x-netscript-resource': `job:${resource.id ?? 'none'}`,
    }),
    fetchImpl: (input) => {
      const req = input as Request;
      const url = new URL(req.url);
      upstreamRequests.push({
        path: url.pathname,
        search: url.search,
        service: req.headers.get('x-netscript-service'),
        resource: req.headers.get('x-netscript-resource'),
        auth: req.headers.get('authorization'),
      });
      if (url.pathname === '/api/workers/jobs/job-alpha') {
        return Promise.resolve(Response.json({ id: 'job-alpha', enabled: true }));
      }
      if (url.pathname === '/api/workers/jobs/job-alpha/trigger') {
        return Promise.resolve(Response.json({ jobId: 'job-alpha', triggered: true }));
      }
      return Promise.resolve(new Response('unexpected path', { status: 500 }));
    },
  });

  // 1) Authorized resource succeeds with exact bound path & stripped unallowlisted query params
  const rGetAlpha = await gateway(
    new Request('https://app.example.test/api/plugins/workers/getJob?id=job-alpha&extraEvil=1', {
      method: 'GET',
      headers: { 'sec-fetch-site': 'same-origin' },
    }),
  );
  assertEquals(rGetAlpha.status, 200);
  assertEquals(await rGetAlpha.json(), { id: 'job-alpha', enabled: true });

  const rTriggerAlpha = await gateway(
    new Request('https://app.example.test/api/plugins/workers/triggerJob', {
      method: 'POST',
      headers: {
        origin: 'https://app.example.test',
        'sec-fetch-site': 'same-origin',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ id: 'job-alpha', payload: { dryRun: true } }),
    }),
  );
  assertEquals(rTriggerAlpha.status, 200);
  assertEquals(await rTriggerAlpha.json(), { jobId: 'job-alpha', triggered: true });
  assertEquals(upstreamRequests, [
    {
      path: '/api/workers/jobs/job-alpha',
      search: '',
      service: 'workers',
      resource: 'job:job-alpha',
      auth: 'Bearer svc:workers:job-alpha',
    },
    {
      path: '/api/workers/jobs/job-alpha/trigger',
      search: '',
      service: 'workers',
      resource: 'job:job-alpha',
      auth: 'Bearer svc:workers:job-alpha',
    },
  ]);

  // 2) Same authenticated principal targeting unauthorized resource `job-beta` fails 403 with 0 upstream hits
  const hitsBeforeDenied = upstreamRequests.length;
  const rGetBeta = await gateway(
    new Request('https://app.example.test/api/plugins/workers/getJob?id=job-beta', {
      method: 'GET',
      headers: { 'sec-fetch-site': 'same-origin' },
    }),
  );
  assertEquals(rGetBeta.status, 403);
  const rTriggerBeta = await gateway(
    new Request('https://app.example.test/api/plugins/workers/triggerJob', {
      method: 'POST',
      headers: {
        origin: 'https://app.example.test',
        'sec-fetch-site': 'same-origin',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ id: 'job-beta' }),
    }),
  );
  assertEquals(rTriggerBeta.status, 403);
  assertEquals(upstreamRequests.length, hitsBeforeDenied);

  // 3) Ungranted real Workers procedure (`deleteJob`) -> 404, 0 upstream hits
  const rDelete = await gateway(
    new Request('https://app.example.test/api/plugins/workers/deleteJob?id=job-alpha', {
      method: 'DELETE',
      headers: { origin: 'https://app.example.test', 'sec-fetch-site': 'same-origin' },
    }),
  );
  assertEquals(rDelete.status, 404);
  assertEquals(upstreamRequests.length, hitsBeforeDenied);

  // 4) Unsafe path param (`../admin`) rejected by typed binding -> 400, 0 upstream hits
  const rBadParam = await gateway(
    new Request('https://app.example.test/api/plugins/workers/getJob?id=../admin', {
      method: 'GET',
      headers: { 'sec-fetch-site': 'same-origin' },
    }),
  );
  assertEquals(rBadParam.status, 400);
  assertEquals(upstreamRequests.length, hitsBeforeDenied);
});

probeTest('2.3 [P5 gateway]: request/response body limits, timeout (504), and AbortSignal propagation', async () => {
  const routes = generateGatewayRouteTable({
    mountId: 'crons',
    owningService: 'crons-synthetic',
    contract: SYNTHETIC_CRONS_CONTRACT,
    requiresProcedures: [
      { procedureId: 'list', owningService: 'crons-synthetic', allowedQueryParams: ['mode'] },
      { procedureId: 'pause', owningService: 'crons-synthetic' },
    ],
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

// Probe-local SSE proxy prototype for offset resume & pre-batch withholding on DurableStreamTestServer.
// NOTE (B5): `packages/plugin-streams-core/deno.json` does not yet export `./proxy`; this prototype does NOT
// prove RFC 0009 runtime exports, `invalidationEpoch` stale-allow race fencing, idle expiry, or pre-drain shutdown.
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

function createProbeLocalSseProxyPrototype(options: {
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
  '2.4 [Streams boundary prototype — NOT RFC 0009 runtime export]: probe-local SSE proxy demonstrates offset resume & pre-batch withholding on DurableStreamTestServer',
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

    const proxyHandler = createProbeLocalSseProxyPrototype({
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
      const missingStreamProxy = createProbeLocalSseProxyPrototype({
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

probeTest('2.5 [Transport separation boundary]: compileProcedures excludes non-oRPC stream contracts; W2 HTTP gateway excludes eventIterator procedures', () => {
  // 1. oRPC compileProcedures indexes ordinary & eventIterator procedures at the metadata level, while a
  //    non-oRPC StreamEndpointContract throws in oRPC traversal if placed inside an oRPC router.
  const compiled = compileProcedures(SYNTHETIC_CRONS_CONTRACT);
  const tailProc = compiled.find((p) => p.routerPath.join('.') === 'tailEvents');
  assertExists(tailProc);
  assertEquals(tailProc.restMethod, 'GET');
  assertEquals(tailProc.restPattern, '/crons/tail');

  // 2. W2 HTTP-only gateway generation (F-4 Option B) rejects eventIterator procedures (`subscribe`, `tailEvents`)
  //    because incremental first-frame delivery & abort/reconnect under real auth policy remain deferred beyond W2.
  assertThrows(
    () =>
      generateGatewayRouteTable({
        mountId: 'crons',
        owningService: 'crons-synthetic',
        contract: SYNTHETIC_CRONS_CONTRACT,
        requiresProcedures: ['tailEvents'],
      }),
    Error,
    'GATEWAY_EVENT_ITERATOR_DEFERRED_W2',
  );
  assertThrows(
    () =>
      generateGatewayRouteTable({
        mountId: 'workers',
        owningService: 'workers',
        contract: workersContract as unknown as Record<string, unknown>,
        requiresProcedures: ['subscribe'],
      }),
    Error,
    'GATEWAY_EVENT_ITERATOR_DEFERRED_W2',
  );

  const syntheticBrokenRouterWithStreamEndpoint = {
    ...SYNTHETIC_CRONS_CONTRACT,
    badNestedStreamEndpoint: { protocol: { family: 'netscript.durable-stream-sse', major: 1 }, id: 'crons.feed' },
  };
  assertThrows(() => compileProcedures(syntheticBrokenRouterWithStreamEndpoint as never));

  // 3. @netscript/fresh/ai createNetScriptChatStreamProxy stays specialized in Lane 3.
  assertEquals(typeof createNetScriptChatStreamProxy, 'function');
  assertEquals(STREAM_SSE_CONTRACT_V1.wireEventNames, ['data', 'control']);
});

// ============================================================================
// PART 3: SECRET-REDACTION BOUNDARY (B3, M4) & #2670 WRITE PROTOCOL
// ============================================================================

const REDACTED_SECRET_SENTINEL = '__NS_REDACTED_SECRET__' as const;

// Presence-only browser handle: ZERO digest or fingerprint exposed to client/HTML (B3).
export interface RedactedSecretHandle {
  readonly __nsSecretHandle: true;
  readonly sentinel: typeof REDACTED_SECRET_SENTINEL;
  readonly isSet: boolean;
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

function makeSecretHandle(value: unknown): RedactedSecretHandle {
  const isSet = typeof value === 'string' && value.length > 0;
  return Object.freeze({
    __nsSecretHandle: true,
    sentinel: REDACTED_SECRET_SENTINEL,
    isSet,
  });
}

function readUiMetaFromRecord(meta: unknown): Record<string, unknown> | undefined {
  if (!meta || typeof meta !== 'object') return undefined;
  // Strict canonical `x-ns-ui` only (F-3 Option B): no framework-level vendor overlay key.
  const nsUi = Reflect.get(meta, 'x-ns-ui');
  if (!nsUi || typeof nsUi !== 'object') return undefined;
  return { ...(nsUi as Record<string, unknown>) };
}

function unwrapSchemaLayers(schema: unknown): readonly unknown[] {
  const layers: unknown[] = [];
  let current: unknown = schema;
  const seen = new Set<unknown>();
  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current);
    layers.push(current);
    const candidate = current as {
      unwrap?: () => unknown;
      def?: { innerType?: unknown };
    };
    if (typeof candidate.unwrap === 'function') {
      current = candidate.unwrap();
    } else if (candidate.def && typeof candidate.def === 'object' && candidate.def.innerType) {
      current = candidate.def.innerType;
    } else {
      break;
    }
  }
  return layers;
}

function isSecretMarkedSchema(schema: unknown): boolean {
  for (const layer of unwrapSchemaLayers(schema)) {
    if (!layer || typeof layer !== 'object') continue;
    // Zod v4 `.meta()`
    const maybeMetaFn = Reflect.get(layer, 'meta');
    if (typeof maybeMetaFn === 'function') {
      const ui = readUiMetaFromRecord((maybeMetaFn as () => unknown).call(layer));
      if (ui?.secret === true) return true;
    }
    // JSON Schema object produced by `z.toJSONSchema(...)`
    const jsonUi = readUiMetaFromRecord(layer);
    if (jsonUi?.secret === true) return true;
  }
  return false;
}

function getObjectSchemaProperties(schema: unknown): Record<string, unknown> | undefined {
  for (const layer of unwrapSchemaLayers(schema)) {
    if (!layer || typeof layer !== 'object') continue;
    const shape = Reflect.get(layer, 'shape');
    if (shape && typeof shape === 'object') return shape as Record<string, unknown>;
    const props = Reflect.get(layer, 'properties');
    if (props && typeof props === 'object') return props as Record<string, unknown>;
  }
  return undefined;
}

function getArrayElementSchema(schema: unknown): unknown {
  for (const layer of unwrapSchemaLayers(schema)) {
    if (!layer || typeof layer !== 'object') continue;
    // Zod v4 array
    const element = Reflect.get(layer, 'element');
    if (element && typeof element === 'object') return element;
    const def = Reflect.get(layer, 'def');
    if (def && typeof def === 'object' && Reflect.get(def, 'type') === 'array') {
      return Reflect.get(def, 'element');
    }
    // JSON Schema array
    if (Reflect.get(layer, 'type') === 'array') {
      const items = Reflect.get(layer, 'items');
      if (items && typeof items === 'object' && !Array.isArray(items)) return items;
    }
  }
  return undefined;
}

function getRecordValueSchema(schema: unknown): unknown {
  for (const layer of unwrapSchemaLayers(schema)) {
    if (!layer || typeof layer !== 'object') continue;
    // Zod v4 record
    const def = Reflect.get(layer, 'def');
    if (def && typeof def === 'object' && Reflect.get(def, 'type') === 'record') {
      return Reflect.get(def, 'valueType');
    }
    // JSON Schema object with additionalProperties schema
    const addProps = Reflect.get(layer, 'additionalProperties');
    if (addProps && typeof addProps === 'object') return addProps;
  }
  return undefined;
}

function redactUrlStringIfNeeded(input: string): unknown {
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

  if (parsed.username) parsed.username = REDACTED_SECRET_SENTINEL;
  if (parsed.password) parsed.password = REDACTED_SECRET_SENTINEL;
  for (const key of [...parsed.searchParams.keys()]) {
    if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
      parsed.searchParams.set(key, REDACTED_SECRET_SENTINEL);
    }
  }
  return {
    redactedUrl: parsed.href,
    credential: Object.freeze({
      __nsSecretHandle: true,
      sentinel: REDACTED_SECRET_SENTINEL,
      isSet: true,
    }) satisfies RedactedSecretHandle,
  };
}

function redactValueForClient(
  value: unknown,
  schema?: unknown,
  seen = new WeakSet<object>(),
): unknown {
  if (typeof value === 'function') {
    throw new TypeError('NON_SERIALIZABLE_PORT_BLOCKED: functions/ports cannot cross into client context');
  }
  if (isSecretMarkedSchema(schema)) {
    return makeSecretHandle(value);
  }
  if (value === null || value === undefined || typeof value === 'boolean' || typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    return redactUrlStringIfNeeded(value);
  }
  if (value instanceof Headers) {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of value.entries()) {
      clean[k] = SENSITIVE_HEADER_NAMES.has(k.toLowerCase()) ? makeSecretHandle(v) : v;
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
    const elemSchema = getArrayElementSchema(schema);
    return value.map((item) => redactValueForClient(item, elemSchema, seen));
  }

  const properties = getObjectSchemaProperties(schema);
  const recordValueSchema = getRecordValueSchema(schema);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    const lower = k.toLowerCase();
    if (SENSITIVE_HEADER_NAMES.has(lower)) {
      out[k] = makeSecretHandle(typeof v === 'string' ? v : JSON.stringify(v));
      continue;
    }
    const fieldSchema = properties?.[k] ?? recordValueSchema;
    out[k] = redactValueForClient(v, fieldSchema, seen);
  }
  return out;
}

function isStrictAllowlistedSecretHandle(value: unknown): value is RedactedSecretHandle {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  if (keys.length !== 3) return false;
  if (!keys.every((k) => k === '__nsSecretHandle' || k === 'sentinel' || k === 'isSet')) {
    return false;
  }
  return (
    Reflect.get(value, '__nsSecretHandle') === true &&
    Reflect.get(value, 'sentinel') === REDACTED_SECRET_SENTINEL &&
    typeof Reflect.get(value, 'isSet') === 'boolean'
  );
}

function assertNoUnredactedSecrets(
  value: unknown,
  schema?: unknown,
  path = '$',
): void {
  if (typeof value === 'function') {
    throw new Error(`UNREDACTED_SECRET_SERIALIZATION_BLOCKED: function/port at ${path}`);
  }
  if (isSecretMarkedSchema(schema)) {
    if (!isStrictAllowlistedSecretHandle(value)) {
      throw new Error(
        `UNREDACTED_SECRET_SERIALIZATION_BLOCKED: secret-marked schema field at ${path} is not a strict presence-only RedactedSecretHandle`,
      );
    }
    return;
  }
  if (typeof value === 'string') {
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
    if (/^sha256:[0-9a-f]{8,}$/i.test(value)) {
      throw new Error(`UNREDACTED_SECRET_SERIALIZATION_BLOCKED: secret digest/fingerprint at ${path}`);
    }
    return;
  }
  if (!value || typeof value !== 'object') return;
  if (value instanceof Headers) {
    throw new Error(`UNREDACTED_SECRET_SERIALIZATION_BLOCKED: raw Headers instance at ${path}`);
  }
  if (Array.isArray(value)) {
    const elemSchema = getArrayElementSchema(schema);
    value.forEach((item, idx) => assertNoUnredactedSecrets(item, elemSchema, `${path}[${idx}]`));
    return;
  }
  if (isStrictAllowlistedSecretHandle(value)) {
    return;
  }
  if (Reflect.get(value, '__nsSecretHandle') === true) {
    // Reject handle-shaped objects carrying extra keys (e.g. `digest`, `fingerprint`, or `leakedRaw`).
    throw new Error(
      `UNREDACTED_SECRET_SERIALIZATION_BLOCKED: non-allowlisted secret handle shape at ${path}`,
    );
  }
  const properties = getObjectSchemaProperties(schema);
  const recordValueSchema = getRecordValueSchema(schema);
  for (const [k, v] of Object.entries(value)) {
    if (k === 'digest' || k === 'fingerprint') {
      throw new Error(`UNREDACTED_SECRET_SERIALIZATION_BLOCKED: forbidden "${k}" field at ${path}.${k}`);
    }
    if (SENSITIVE_HEADER_NAMES.has(k.toLowerCase()) && !isStrictAllowlistedSecretHandle(v)) {
      throw new Error(`UNREDACTED_SECRET_SERIALIZATION_BLOCKED: unredacted header "${k}" at ${path}.${k}`);
    }
    const fieldSchema = properties?.[k] ?? recordValueSchema;
    assertNoUnredactedSecrets(v, fieldSchema, `${path}.${k}`);
  }
}

// Verbatim merged `#2670` write-only secret submission types & resolver
// (`origin/main:packages/fresh-ui/src/runtime/secret-field/secret-field.{types,utils}.ts`).
// Self-contained copy of `origin/main:packages/fresh-ui/src/runtime/secret-field/secret-field.{types,utils}.ts` (merged PR `#2670`).
const SECRET_FIELD_UNCHANGED_TOKEN = '__ns_secret_unchanged__';
const SECRET_FIELD_CLEAR_TOKEN = '__ns_secret_clear__';

type SecretFieldSubmission =
  | { readonly mode: 'keep' }
  | { readonly mode: 'replace'; readonly value: string }
  | { readonly mode: 'clear' }
  | { readonly mode: 'unset' }
  | { readonly mode: 'invalid'; readonly reason: string };

interface ResolveSecretFieldOptions {
  readonly hadStoredSecret?: boolean;
  readonly unchangedToken?: string;
  readonly clearToken?: string;
  readonly action?: FormDataEntryValue | string | null | undefined;
}

function resolveSecretFieldSubmission(
  rawValue: FormDataEntryValue | string | null | undefined,
  options: ResolveSecretFieldOptions = {},
): SecretFieldSubmission {
  const unchangedToken = options.unchangedToken ?? SECRET_FIELD_UNCHANGED_TOKEN;
  const clearToken = options.clearToken ?? SECRET_FIELD_CLEAR_TOKEN;
  const hadStoredSecret = options.hadStoredSecret ?? false;

  if (rawValue !== null && rawValue !== undefined && typeof rawValue !== 'string') {
    return { mode: 'invalid', reason: 'Secret field value must be text.' };
  }
  if (
    options.action !== null &&
    options.action !== undefined &&
    typeof options.action !== 'string'
  ) {
    return { mode: 'invalid', reason: 'Secret action must be text.' };
  }

  const value = typeof rawValue === 'string' ? rawValue : undefined;
  const action = typeof options.action === 'string' && options.action.length > 0
    ? options.action
    : undefined;

  if (action !== undefined) {
    switch (action) {
      case 'replace':
        if (value === undefined || value === '') {
          return { mode: 'invalid', reason: 'Replacement secret value is required.' };
        }
        if (value === clearToken || value === unchangedToken) {
          return {
            mode: 'invalid',
            reason: 'Replacement secret value conflicts with a reserved sentinel token.',
          };
        }
        return { mode: 'replace', value };
      case 'clear':
        if (value !== undefined && value !== '' && value !== clearToken) {
          return {
            mode: 'invalid',
            reason: 'Clear action cannot carry a replacement secret value.',
          };
        }
        return { mode: 'clear' };
      case 'keep':
        if (value !== undefined && value !== '' && value !== unchangedToken) {
          return {
            mode: 'invalid',
            reason: 'Keep action cannot carry a replacement or clear value.',
          };
        }
        return hadStoredSecret ? { mode: 'keep' } : { mode: 'unset' };
      case 'unset':
        if (value !== undefined && value !== '') {
          return { mode: 'invalid', reason: 'Unset action cannot carry a secret value.' };
        }
        if (hadStoredSecret) {
          return {
            mode: 'invalid',
            reason: 'Unset action conflicts with an existing stored secret.',
          };
        }
        return { mode: 'unset' };
      default:
        return { mode: 'invalid', reason: `Unknown secret action "${action}".` };
    }
  }

  if (value === clearToken) {
    return { mode: 'clear' };
  }
  if (value === unchangedToken || value === undefined || value === '') {
    return hadStoredSecret ? { mode: 'keep' } : { mode: 'unset' };
  }
  return { mode: 'replace', value };
}

function applySecretFieldSubmission(
  existingValue: string | null,
  submission: SecretFieldSubmission,
  fieldPath: string,
): string | null {
  switch (submission.mode) {
    case 'keep':
      return existingValue;
    case 'unset':
      return null;
    case 'clear':
      return null;
    case 'replace': {
      if (submission.value.includes(REDACTED_SECRET_SENTINEL)) {
        throw new Error(
          `SECRET_SENTINEL_ECHO_REJECTED: write to "${fieldPath}" attempted to echo redaction sentinel`,
        );
      }
      if (submission.value.trim().length === 0) {
        throw new Error(
          `SECRET_VALUE_EMPTY: write to "${fieldPath}" requires non-empty secret`,
        );
      }
      return submission.value;
    }
    case 'invalid':
      throw new Error(`SECRET_SUBMISSION_INVALID (${fieldPath}): ${submission.reason}`);
  }
}

function assertStrictJsonSecretWritePayload(
  existingValue: string | null,
  incoming: unknown,
  fieldPath: string,
): string | null {
  // Explicitly reject raw strings and raw `null` shortcuts (M4): deletion or rotation must be intentional.
  if (incoming === null || typeof incoming === 'string') {
    throw new Error(
      `SECRET_WRITE_PROTOCOL_REQUIRED: "${fieldPath}" rejects raw ${
        incoming === null ? 'null' : 'string'
      } shortcuts; submit structured #2670 SecretFieldSubmission`,
    );
  }
  if (
    incoming &&
    typeof incoming === 'object' &&
    Reflect.get(incoming, 'sentinel') === REDACTED_SECRET_SENTINEL
  ) {
    throw new Error(
      `SECRET_SENTINEL_ECHO_REJECTED: write to "${fieldPath}" attempted to echo redaction sentinel`,
    );
  }
  if (!incoming || typeof incoming !== 'object' || !('mode' in incoming)) {
    throw new Error(`SECRET_WRITE_PROTOCOL_REQUIRED: invalid write payload for "${fieldPath}"`);
  }
  const mode = Reflect.get(incoming, 'mode');
  if (mode === 'keep' || mode === 'clear' || mode === 'unset' || mode === 'replace') {
    return applySecretFieldSubmission(
      existingValue,
      incoming as SecretFieldSubmission,
      fieldPath,
    );
  }
  throw new Error(`SECRET_SUBMISSION_INVALID (${fieldPath}): unsupported mode "${String(mode)}"`);
}

async function sha256HexPrefix(secret: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  return Array.from(new Uint8Array(hash))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

probeTest('3.1 [acme / #2670 redaction]: presence-only handles (0 digests), recursive arrays/records/JSON-Schema + non-sensitive field "notes", and real Fresh island SSR/partial serialization', async () => {
  const ConnectorSchema = z.object({
    name: z.string(),
    endpointUrl: z.string(),
    dsnUrl: z.string(),
    headers: z.record(z.string(), z.string()),
    webhookSecret: z.string().meta({ 'x-ns-ui': { secret: true } }),
    optionalToken: z.string().optional().meta({ 'x-ns-ui': { secret: true } }),
    preOptionalSecret: z.string().meta({ 'x-ns-ui': { secret: true } }).optional(),
    endpoints: z.array(z.object({
      label: z.string(),
      notes: z.string().meta({ 'x-ns-ui': { secret: true } }),
    })),
    envConfigs: z.record(
      z.string(),
      z.object({
        region: z.string(),
        notes: z.string().optional().meta({ 'x-ns-ui': { secret: true } }),
      }),
    ),
  });
  const ConnectorJsonSchema = z.toJSONSchema(ConnectorSchema);

  const RAW_USER = 'etl_svc';
  const RAW_PASS = 'super_secret_db_pw_999';
  const RAW_DSN_PASS = 'pg_secret_pw_321';
  const RAW_QUERY_TOKEN = 'query_secret_token_888';
  const RAW_BEARER = 'Bearer raw_oauth_access_token_777';
  const RAW_COOKIE = 'session=raw_session_cookie_666';
  const RAW_API_KEY = 'sk_live_raw_api_key_555';
  const RAW_WEBHOOK_SECRET = 'whsec_raw_signing_secret_444';
  const RAW_PRE_OPT_SECRET = 'tok_pre_optional_secret_333';
  const RAW_NOTES_ARRAY_SECRET = 'nested_array_secret_under_notes_222';
  const RAW_NOTES_RECORD_SECRET = 'nested_record_secret_under_notes_111';

  const allSecrets = [
    RAW_USER,
    RAW_PASS,
    RAW_DSN_PASS,
    RAW_QUERY_TOKEN,
    RAW_BEARER,
    RAW_COOKIE,
    RAW_API_KEY,
    RAW_WEBHOOK_SECRET,
    RAW_PRE_OPT_SECRET,
    RAW_NOTES_ARRAY_SECRET,
    RAW_NOTES_RECORD_SECRET,
  ];
  const forbiddenDigestPrefixes = await Promise.all(allSecrets.map(sha256HexPrefix));

  const serverRecord = {
    name: 'warehouse-sync',
    endpointUrl: `https://${RAW_USER}:${RAW_PASS}@db.internal.example:8443/ingest?token=${RAW_QUERY_TOKEN}`,
    dsnUrl: `postgres://${RAW_USER}:${RAW_DSN_PASS}@pg.internal.example:5432/acme`,
    headers: {
      Authorization: RAW_BEARER,
      Cookie: RAW_COOKIE,
      'X-Api-Key': RAW_API_KEY,
      'X-Trace-Source': 'acme-connector',
    },
    webhookSecret: RAW_WEBHOOK_SECRET,
    optionalToken: undefined,
    preOptionalSecret: RAW_PRE_OPT_SECRET,
    endpoints: [
      { label: 'primary', notes: RAW_NOTES_ARRAY_SECRET },
    ],
    envConfigs: {
      prod: { region: 'us-east-1', notes: RAW_NOTES_RECORD_SECRET },
    },
  };

  // 1. PluginClientContext boundary (serializable, presence-only redacted, zero digest).
  const rawPluginClientContext = {
    mountId: 'acme',
    base: '/acme',
    locale: 'en-US',
    direction: 'ltr',
    timeZone: 'UTC',
    subject: { signedIn: true, display: serverRecord.endpointUrl },
    capabilities: ['etl:read'],
  };
  const safeClientContext = redactValueForClient(rawPluginClientContext) as Record<string, unknown>;
  assertNoUnredactedSecrets(safeClientContext);

  // 2. Redact via Zod schema AND JSON Schema conversion, checking objects, arrays, records, & `notes`.
  const redactedConnector = redactValueForClient(serverRecord, ConnectorSchema) as Record<string, unknown>;
  const redactedViaJsonSchema = redactValueForClient(serverRecord, ConnectorJsonSchema) as Record<string, unknown>;
  assertEquals(redactedConnector, redactedViaJsonSchema);
  assertNoUnredactedSecrets(redactedConnector, ConnectorSchema);
  assertNoUnredactedSecrets(redactedViaJsonSchema, ConnectorJsonSchema);

  const webhookHandle = redactedConnector.webhookSecret as RedactedSecretHandle;
  assertEquals(webhookHandle, {
    __nsSecretHandle: true,
    sentinel: REDACTED_SECRET_SENTINEL,
    isSet: true,
  });
  assertEquals('digest' in webhookHandle, false);
  assertEquals('fingerprint' in webhookHandle, false);

  const optionalHandle = redactedConnector.optionalToken as RedactedSecretHandle;
  assertEquals(optionalHandle, {
    __nsSecretHandle: true,
    sentinel: REDACTED_SECRET_SENTINEL,
    isSet: false,
  });

  const redactedEndpoints = redactedConnector.endpoints as { label: string; notes: RedactedSecretHandle }[];
  assertEquals(redactedEndpoints[0].notes, {
    __nsSecretHandle: true,
    sentinel: REDACTED_SECRET_SENTINEL,
    isSet: true,
  });

  const redactedEnvConfigs = redactedConnector.envConfigs as Record<string, { region: string; notes: RedactedSecretHandle }>;
  assertEquals(redactedEnvConfigs.prod.notes, {
    __nsSecretHandle: true,
    sentinel: REDACTED_SECRET_SENTINEL,
    isSet: true,
  });

  // 3. Real Fresh 2.3.3 App SSR + Island Serialization (`boot(...)`) + `?fresh-partial=true` (`__FRSH_STATE_`).
  function ConnectorSettingsIsland(props: { readonly connector: unknown; readonly client: unknown }) {
    const c = props.connector as Record<string, unknown>;
    return h(
      'div',
      { 'data-ns-plugin': 'acme', 'data-connector-island': 'true' },
      h('h2', null, String(c.name)),
      h('span', { class: 'secret-status' }, `isSet=${String((c.webhookSecret as RedactedSecretHandle).isSet)}`),
    );
  }

  const app = new App();
  const islands = new Map();
  islands.set(ConnectorSettingsIsland, {
    name: 'ConnectorSettingsIsland',
    fn: ConnectorSettingsIsland,
    file: '/islands/ConnectorSettingsIsland.tsx',
    chunk: '/_fresh/js/ConnectorSettingsIsland.js',
    exportName: 'default',
    css: [],
  });
  type FsRouteEntry = ConstructorParameters<typeof ProdBuildCache>[1]['fsRoutes'][number];
  setBuildCache(app, new ProdBuildCache('.', {
    version: 'probe-c-redaction',
    clientEntry: '/_fresh/js/client.js',
    fsRoutes: [
      {
        id: '/_layout',
        filePath: 'routes/_layout.tsx',
        mod: {
          default: ({ Component, isPartial }: PageProps<unknown>) =>
            isPartial
              ? h(Partial, { name: 'main' }, h(Component, null))
              : h('div', { 'data-shell': 'true' }, h(Partial, { name: 'main' }, h(Component, null))),
        },
        pattern: '*',
        type: 'layout' as FsRouteEntry['type'],
        routePattern: '*',
        overrideConfig: undefined,
        css: [],
      },
      {
        id: '/connectors/[id]',
        filePath: 'routes/connectors/[id].tsx',
        mod: {
          handler: () => {
            // Gateway/service boundary validation before SSR render
            assertNoUnredactedSecrets(redactedConnector, ConnectorSchema);
            assertNoUnredactedSecrets(safeClientContext);
            return page({ connector: redactedConnector, client: safeClientContext });
          },
          default: ({ data }: PageProps<unknown>) => {
            const typed = data as { connector: unknown; client: unknown };
            return h(ConnectorSettingsIsland, { connector: typed.connector, client: typed.client });
          },
        },
        pattern: '/connectors/:id',
        type: 'route' as FsRouteEntry['type'],
        routePattern: '/connectors/:id',
        overrideConfig: undefined,
        css: [],
      },
    ],
    staticFiles: new Map(),
    islands,
    entryAssets: [],
  }), 'production');
  app.fsRoutes();
  const handler = app.handler();

  const fullRes = await handler(new Request('http://localhost/connectors/wh-1'));
  const fullHtml = await fullRes.text();
  assertEquals(fullRes.status, 200);
  assertStringIncludes(fullHtml, '<!--frsh:island:ConnectorSettingsIsland:');
  assertStringIncludes(fullHtml, 'boot({ConnectorSettingsIsland}');
  assertStringIncludes(fullHtml, REDACTED_SECRET_SENTINEL);

  const partialRes = await handler(new Request('http://localhost/connectors/wh-1?fresh-partial=true'));
  const partialHtml = await partialRes.text();
  assertEquals(partialRes.status, 200);
  assertStringIncludes(partialHtml, '__FRSH_STATE_');
  assertStringIncludes(partialHtml, REDACTED_SECRET_SENTINEL);

  for (const payload of [fullHtml, partialHtml]) {
    assertEquals(payload.includes('sha256:'), false, 'HTML/partial payload must NEVER include sha256 fingerprint');
    for (const secret of allSecrets) {
      assertEquals(payload.includes(secret), false, `Payload leaked raw secret: ${secret}`);
    }
    for (const digestHex of forbiddenDigestPrefixes) {
      assertEquals(payload.includes(digestHex), false, `Payload leaked secret SHA-256 hex digest: ${digestHex}`);
    }
  }
});

probeTest('3.2 [acme / #2670 negative assertions & write protocol]: blocks unredacted notes/spoofed handles, enforces replace|keep|clear|unset|invalid', async () => {
  const ItemWithNotesSchema = z.object({
    items: z.array(z.object({
      notes: z.string().meta({ 'x-ns-ui': { secret: true } }),
    })),
    envConfigs: z.record(
      z.string(),
      z.object({
        notes: z.string().meta({ 'x-ns-ui': { secret: true } }),
      }),
    ),
  });

  // 1. Outbound serialization guard catches unredacted secrets under non-sensitive field names (`notes`)
  //    in arrays & records when schema is checked, AND rejects handle-shaped objects with extra/digest keys!
  assertThrows(
    () =>
      assertNoUnredactedSecrets(
        { items: [{ notes: 'plain-secret-under-notes' }], envConfigs: {} },
        ItemWithNotesSchema,
      ),
    Error,
    'UNREDACTED_SECRET_SERIALIZATION_BLOCKED',
  );
  assertThrows(
    () =>
      assertNoUnredactedSecrets(
        { items: [], envConfigs: { prod: { notes: 'plain-record-secret' } } },
        ItemWithNotesSchema,
      ),
    Error,
    'UNREDACTED_SECRET_SERIALIZATION_BLOCKED',
  );
  assertThrows(
    () =>
      assertNoUnredactedSecrets({
        webhookSecret: {
          __nsSecretHandle: true,
          sentinel: REDACTED_SECRET_SENTINEL,
          isSet: true,
          digest: 'sha256:0123456789abcdef',
          leakedRaw: 'secret-smuggled-inside-handle',
        },
      }),
    Error,
    'UNREDACTED_SECRET_SERIALIZATION_BLOCKED',
  );
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
  assertThrows(
    () =>
      redactValueForClient({
        principal: { resolve: () => Promise.resolve(null) },
      }),
    TypeError,
    'NON_SERIALIZABLE_PORT_BLOCKED',
  );

  // 2. Merged #2670 resolveSecretFieldSubmission protocol: replace | keep | clear | unset | invalid
  const storedSecret = 'whsec_original_secret_value';

  assertEquals(
    resolveSecretFieldSubmission(SECRET_FIELD_UNCHANGED_TOKEN, { hadStoredSecret: true, action: 'keep' }),
    { mode: 'keep' },
  );
  assertEquals(
    resolveSecretFieldSubmission('', { hadStoredSecret: false, action: 'unset' }),
    { mode: 'unset' },
  );
  assertEquals(
    resolveSecretFieldSubmission(SECRET_FIELD_CLEAR_TOKEN, { hadStoredSecret: true, action: 'clear' }),
    { mode: 'clear' },
  );
  assertEquals(
    resolveSecretFieldSubmission('whsec_rotated_999', { hadStoredSecret: true, action: 'replace' }),
    { mode: 'replace', value: 'whsec_rotated_999' },
  );

  // Conflicting action/value pairs and non-text entries fail closed with `invalid`
  assertEquals(
    resolveSecretFieldSubmission('', { hadStoredSecret: true, action: 'unset' }).mode,
    'invalid',
  );
  assertEquals(
    resolveSecretFieldSubmission('whsec_rotated_999', { hadStoredSecret: true, action: 'clear' }).mode,
    'invalid',
  );
  assertEquals(
    resolveSecretFieldSubmission(SECRET_FIELD_UNCHANGED_TOKEN, { hadStoredSecret: true, action: 'replace' }).mode,
    'invalid',
  );
  assertEquals(
    resolveSecretFieldSubmission(new File(['x'], 'secret.txt'), { hadStoredSecret: true }).mode,
    'invalid',
  );

  // Applying all 5 modes + sentinel echo rejection
  assertEquals(
    applySecretFieldSubmission(
      storedSecret,
      resolveSecretFieldSubmission(SECRET_FIELD_UNCHANGED_TOKEN, { hadStoredSecret: true, action: 'keep' }),
      'webhookSecret',
    ),
    storedSecret,
  );
  assertEquals(
    applySecretFieldSubmission(
      storedSecret,
      resolveSecretFieldSubmission('whsec_rotated_999', { hadStoredSecret: true, action: 'replace' }),
      'webhookSecret',
    ),
    'whsec_rotated_999',
  );
  assertEquals(
    applySecretFieldSubmission(
      storedSecret,
      resolveSecretFieldSubmission(SECRET_FIELD_CLEAR_TOKEN, { hadStoredSecret: true, action: 'clear' }),
      'webhookSecret',
    ),
    null,
  );
  assertEquals(
    applySecretFieldSubmission(
      null,
      resolveSecretFieldSubmission('', { hadStoredSecret: false, action: 'unset' }),
      'optionalToken',
    ),
    null,
  );
  assertThrows(
    () =>
      applySecretFieldSubmission(
        storedSecret,
        resolveSecretFieldSubmission(REDACTED_SECRET_SENTINEL, { hadStoredSecret: true, action: 'replace' }),
        'webhookSecret',
      ),
    Error,
    'SECRET_SENTINEL_ECHO_REJECTED',
  );
  assertThrows(
    () =>
      applySecretFieldSubmission(
        storedSecret,
        resolveSecretFieldSubmission('', { hadStoredSecret: true, action: 'unset' }),
        'webhookSecret',
      ),
    Error,
    'SECRET_SUBMISSION_INVALID',
  );

  // Strict JSON write adapter rejects raw string & raw null shortcuts (requires explicit protocol).
  assertThrows(
    () => assertStrictJsonSecretWritePayload(storedSecret, null, 'webhookSecret'),
    Error,
    'SECRET_WRITE_PROTOCOL_REQUIRED',
  );
  assertThrows(
    () => assertStrictJsonSecretWritePayload(storedSecret, 'raw-unstructured-secret', 'webhookSecret'),
    Error,
    'SECRET_WRITE_PROTOCOL_REQUIRED',
  );
  assertThrows(
    () =>
      assertStrictJsonSecretWritePayload(
        storedSecret,
        { sentinel: REDACTED_SECRET_SENTINEL, isSet: true },
        'webhookSecret',
      ),
    Error,
    'SECRET_SENTINEL_ECHO_REJECTED',
  );
  assertEquals(
    assertStrictJsonSecretWritePayload(storedSecret, { mode: 'clear' }, 'webhookSecret'),
    null,
  );
  assertEquals(
    assertStrictJsonSecretWritePayload(storedSecret, { mode: 'replace', value: 'whsec_new_1' }, 'webhookSecret'),
    'whsec_new_1',
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
