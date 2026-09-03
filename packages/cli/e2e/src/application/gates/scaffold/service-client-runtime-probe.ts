/** Executable proof for generated two-service clients and live list invalidation. */

import { join, relative } from '@std/path';
import { partialMatchKey } from 'npm:@tanstack/query-core@^5.101.0';
import {
  collectBrowserRefetchEvidence,
  type SettledRefetchEvidence,
} from './service-client-browser-probe.ts';
import { generatedAppHomeUrlsFromAppHost, readPinnedAppPort } from './generated-app-endpoint.ts';

const EVIDENCE_MARKER = '__NETSCRIPT_SERVICE_CLIENT_EVIDENCE__';
const PROBE_FILE = '__service_client_e2e_probe.ts';
const SERVICE_SHOWCASE_PATH = '/examples/users';
const GENERATED_ZOD_CRUD_SUFFIX = '/schema/.generated/zod/crud.ts';
const INPUT_DERIVATION_MODULE_URL =
  new URL('./service-client-input-probe.ts', import.meta.url).href;

export interface FileFingerprint {
  readonly size: number;
  readonly sha256: string;
}

export type FileSnapshot = Readonly<Record<string, FileFingerprint>>;

/** Injectable command and snapshot seam for the convergence/idempotency sequence. */
export interface ServiceGenerationSequenceDependencies {
  readonly generate: () => Promise<CommandResult>;
  readonly snapshot: () => Promise<FileSnapshot>;
}

export interface ServiceKeyEvidence {
  readonly usersInput: unknown;
  readonly paymentsInput: unknown;
  readonly usersServerKey: readonly unknown[];
  readonly paymentsServerKey: readonly unknown[];
  readonly usersServerFilter: readonly unknown[];
  readonly paymentsServerFilter: readonly unknown[];
  readonly usersClientKey: readonly unknown[];
  readonly paymentsClientKey: readonly unknown[];
  readonly usersClientFilter: readonly unknown[];
  readonly paymentsClientFilter: readonly unknown[];
}

/** Require the second generation to preserve the exact owned path set and bytes. */
export function assertByteIdentical(before: FileSnapshot, after: FileSnapshot): void {
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    throw new Error(
      `second service generate changed owned output\nbefore=${JSON.stringify(before)}\nafter=${
        JSON.stringify(after)
      }`,
    );
  }
}

/** Converge changed inputs, then prove an immediately repeated generation is byte-idempotent. */
export async function assertServiceGenerationSequence(
  dependencies: ServiceGenerationSequenceDependencies,
): Promise<void> {
  const convergence = await dependencies.generate();
  requireSuccess(convergence, 'post-plugin service generate');
  requireOutputMarkers(convergence, 'post-plugin service generate', [
    'Wrote 0 service client modules.',
    'Skipped 2 current service client modules.',
  ]);

  const converged = await dependencies.snapshot();
  const repeated = await dependencies.generate();
  requireSuccess(repeated, 'consecutive service generate');
  requireOutputMarkers(repeated, 'consecutive service generate', [
    'Wrote 0 service client modules.',
    'Skipped 2 current service client modules.',
    'Wrote 0 Aspire helper files.',
  ]);
  assertByteIdentical(converged, await dependencies.snapshot());
}

/** Require generated server/client keys to isolate resources under real TanStack prefix rules. */
export function assertServiceKeyIsolation(evidence: ServiceKeyEvidence): void {
  const expectedKeys: Readonly<Record<string, readonly unknown[]>> = {
    usersServerKey: ['users', 'list', JSON.stringify(evidence.usersInput)],
    paymentsServerKey: ['payments', 'list', JSON.stringify(evidence.paymentsInput)],
    usersClientKey: ['users', 'list', { input: evidence.usersInput }],
    paymentsClientKey: ['payments', 'list', { input: evidence.paymentsInput }],
  };
  for (const [name, expected] of Object.entries(expectedKeys)) {
    const observed = evidence[name as keyof ServiceKeyEvidence];
    if (JSON.stringify(observed) !== JSON.stringify(expected)) {
      throw new Error(`${name} did not equal ${JSON.stringify(expected)}`);
    }
  }

  const expectedFilters: Readonly<Record<string, readonly unknown[]>> = {
    usersServerFilter: ['users', 'list'],
    paymentsServerFilter: ['payments', 'list'],
    usersClientFilter: ['users', 'list'],
    paymentsClientFilter: ['payments', 'list'],
  };
  for (const [name, expected] of Object.entries(expectedFilters)) {
    const observed = evidence[name as keyof ServiceKeyEvidence];
    if (JSON.stringify(observed) !== JSON.stringify(expected)) {
      throw new Error(`${name} did not equal ${JSON.stringify(expected)}`);
    }
  }

  const ownMatches = [
    partialMatchKey(evidence.usersServerKey, evidence.usersServerFilter),
    partialMatchKey(evidence.paymentsServerKey, evidence.paymentsServerFilter),
    partialMatchKey(evidence.usersClientKey, evidence.usersClientFilter),
    partialMatchKey(evidence.paymentsClientKey, evidence.paymentsClientFilter),
  ];
  if (ownMatches.some((matches) => !matches)) {
    throw new Error('a generated list filter did not prefix-match its own factory key');
  }
  const crossMatches = [
    partialMatchKey(evidence.paymentsServerKey, evidence.usersServerFilter),
    partialMatchKey(evidence.usersServerKey, evidence.paymentsServerFilter),
    partialMatchKey(evidence.paymentsClientKey, evidence.usersClientFilter),
    partialMatchKey(evidence.usersClientKey, evidence.paymentsClientFilter),
  ];
  if (crossMatches.some(Boolean)) {
    throw new Error('a generated list filter matched the other service factory key');
  }
}

/** Require one post-settle list refetch and a server-persisted final row. */
export function assertSettledRefetch(evidence: SettledRefetchEvidence): void {
  if (!evidence.mutationSucceeded) {
    throw new Error('users.update did not return a success response');
  }
  if (!evidence.optimisticRowContainedRenamedName) {
    throw new Error(`optimistic row did not contain ${evidence.renamedName}`);
  }
  const expected = evidence.baselineListRequestCount + 1;
  if (evidence.finalListRequestCount !== expected) {
    throw new Error(
      `users.list request count was ${evidence.finalListRequestCount}; expected ${expected}`,
    );
  }
  if (!evidence.finalRowContainedRenamedName) {
    throw new Error(`persisted row did not contain ${evidence.renamedName}`);
  }
}

/** Source of the no-alias generated consumer executed by the static gate. */
export function serviceClientConsumerSource(
  derivationModuleUrl: string = INPUT_DERIVATION_MODULE_URL,
): string {
  return `import { deriveProcedureInput } from ${JSON.stringify(derivationModuleUrl)};
import { usersContract, usersQueries } from './users.ts';
import { paymentsContract, paymentsQueries } from './payments.ts';

type UsersListInput = Parameters<typeof usersQueries.list.key>[0];
type PaymentsListInput = Parameters<typeof paymentsQueries.list.key>[0];
const usersInput = deriveProcedureInput<UsersListInput>(
  usersContract.list['~orpc'].inputSchema,
  'users.list',
);
const paymentsInput = deriveProcedureInput<PaymentsListInput>(
  paymentsContract.list['~orpc'].inputSchema,
  'payments.list',
);
const usersServerKey = usersQueries.list.key(usersInput);
const paymentsServerKey = paymentsQueries.list.key(paymentsInput);
const usersClientKey = usersQueries.list.clientKey(usersInput);
const paymentsClientKey = paymentsQueries.list.clientKey(paymentsInput);

console.log('${EVIDENCE_MARKER}' + JSON.stringify({
  usersInput,
  paymentsInput,
  usersServerKey,
  paymentsServerKey,
  usersServerFilter: usersServerKey.slice(0, 2),
  paymentsServerFilter: paymentsServerKey.slice(0, 2),
  usersClientKey,
  paymentsClientKey,
  usersClientFilter: usersQueries.list.clientKey(),
  paymentsClientFilter: paymentsQueries.list.clientKey(),
}));
`;
}

/** Execute convergence, consecutive idempotency, type, and key contracts in a generated project. */
export async function probeGeneratedServiceClients(
  projectRoot: string,
  appName: string,
  cliPrefix: readonly string[],
): Promise<void> {
  await assertGeneratedServiceSchemaReady(projectRoot);
  await assertServiceGenerationSequence({
    generate: () =>
      runCommand(
        [...cliPrefix, 'service', 'generate', '--project-root', projectRoot],
        projectRoot,
      ),
    snapshot: () => snapshotOwnedOutput(projectRoot, appName),
  });

  const appRoot = join(projectRoot, 'apps', appName);
  const probePath = join(appRoot, 'lib', PROBE_FILE);
  await Deno.writeTextFile(probePath, serviceClientConsumerSource());
  try {
    const check = await runCommand(
      ['deno', 'check', '--unstable-kv', `lib/${PROBE_FILE}`],
      appRoot,
    );
    requireSuccess(check, 'two-service consumer type-check');
    const execution = await runCommand(['deno', 'run', '-A', `lib/${PROBE_FILE}`], appRoot);
    requireSuccess(execution, 'two-service key probe');
    const marked = execution.stdout.split('\n').find((line) => line.startsWith(EVIDENCE_MARKER));
    if (!marked) throw new Error(`two-service key probe emitted no evidence\n${execution.stdout}`);
    assertServiceKeyIsolation(
      JSON.parse(marked.slice(EVIDENCE_MARKER.length)) as ServiceKeyEvidence,
    );
  } finally {
    await Deno.remove(probePath).catch((error: unknown) => {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    });
  }
}

/** Require the real database-codegen output before importing a generated service contract. */
export async function assertGeneratedServiceSchemaReady(projectRoot: string): Promise<string> {
  const databaseRoot = join(projectRoot, 'database');
  try {
    for await (const path of walkFiles(databaseRoot)) {
      const normalized = path.replaceAll('\\', '/');
      if (normalized.endsWith(GENERATED_ZOD_CRUD_SUFFIX)) return path;
    }
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
  throw new Error(
    `generated service contracts require database codegen before the client probe; expected ${
      join(databaseRoot, '<engine>', 'schema', '.generated', 'zod', 'crud.ts')
    }`,
  );
}

/** Exercise the generated Rename control and observe the settled network/DOM contract. */
export async function probeLiveServiceRefetch(
  projectRoot: string,
  appName: string,
  appHost: string,
): Promise<void> {
  const pinned = readPinnedAppPort(projectRoot, appName);
  const baseUrls = pinned === undefined
    ? await generatedAppHomeUrlsFromAppHost(appHost, appName)
    : [`http://127.0.0.1:${pinned}/`];
  let lastError: unknown;
  for (const baseUrl of baseUrls) {
    try {
      const url = new URL(SERVICE_SHOWCASE_PATH, baseUrl).toString();
      await collectBrowserRefetchEvidence(url, {
        assertSettled: assertSettledRefetch,
      });
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('no generated app URL was probeable');
}

async function snapshotOwnedOutput(projectRoot: string, appName: string): Promise<FileSnapshot> {
  const paths = [
    join(projectRoot, 'apps', appName, 'lib', 'users.ts'),
    join(projectRoot, 'apps', appName, 'lib', 'payments.ts'),
  ];
  const aspireRoot = join(projectRoot, 'aspire');
  for await (const path of walkFiles(aspireRoot)) {
    if (path.endsWith('.mts')) paths.push(path);
  }
  const snapshot: Record<string, FileFingerprint> = {};
  for (const path of paths.sort()) {
    const bytes = await Deno.readFile(path);
    snapshot[relative(projectRoot, path).replaceAll('\\', '/')] = {
      size: bytes.byteLength,
      sha256: toHex(await crypto.subtle.digest('SHA-256', bytes)),
    };
  }
  return snapshot;
}

async function* walkFiles(root: string): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(root)) {
    const path = join(root, entry.name);
    if (entry.isDirectory) yield* walkFiles(path);
    else if (entry.isFile) yield path;
  }
}

interface CommandResult {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

async function runCommand(command: readonly string[], cwd: string): Promise<CommandResult> {
  const [executable, ...args] = command;
  if (!executable) throw new Error('command executable is required');
  const output = await new Deno.Command(executable, {
    args,
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const decoder = new TextDecoder();
  return {
    code: output.code,
    stdout: decoder.decode(output.stdout),
    stderr: decoder.decode(output.stderr),
  };
}

function requireSuccess(result: CommandResult, label: string): void {
  if (result.code !== 0) {
    throw new Error(
      `${label} failed (${result.code})\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );
  }
}

function requireOutputMarkers(
  result: CommandResult,
  label: string,
  markers: readonly string[],
): void {
  for (const marker of markers) {
    if (!result.stdout.includes(marker)) {
      throw new Error(`${label} did not report ${marker}\n${result.stdout}`);
    }
  }
}

function toHex(value: ArrayBuffer): string {
  return [...new Uint8Array(value)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

if (import.meta.main) {
  const [mode, projectRoot, appName, extra] = Deno.args;
  if (!projectRoot || !appName) throw new Error('mode, project root, and app name are required');
  if (mode === 'static') {
    const cliPrefix = JSON.parse(extra ?? 'null') as unknown;
    if (!Array.isArray(cliPrefix) || cliPrefix.some((value) => typeof value !== 'string')) {
      throw new Error('static probe requires a JSON CLI command prefix');
    }
    await probeGeneratedServiceClients(projectRoot, appName, cliPrefix);
  } else if (mode === 'browser') {
    if (!extra) throw new Error('browser probe requires an AppHost path');
    await probeLiveServiceRefetch(projectRoot, appName, extra);
  } else {
    throw new Error(`unknown service-client probe mode: ${mode}`);
  }
}
