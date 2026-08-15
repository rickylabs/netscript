/** Executable proof for generated two-service clients and live list invalidation. */

import { walk } from '@std/fs';
import { join, relative } from '@std/path';
import { partialMatchKey } from 'npm:@tanstack/query-core@^5.101.0';
import {
  collectBrowserRefetchEvidence,
  type SettledRefetchEvidence,
} from './service-client-browser-probe.ts';
import { generatedAppHomeUrlsFromAppHost, readPinnedAppPort } from './generated-app-endpoint.ts';

const EVIDENCE_MARKER = '__NETSCRIPT_SERVICE_CLIENT_EVIDENCE__';
const PROBE_FILE = '__service_client_e2e_probe.ts';
const LIST_INPUT = { limit: 3, page: 1, sortBy: 'id', sortOrder: 'asc' } as const;

export interface FileFingerprint {
  readonly size: number;
  readonly sha256: string;
}

export type FileSnapshot = Readonly<Record<string, FileFingerprint>>;

export interface ServiceKeyEvidence {
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

/** Require generated server/client keys to isolate resources under real TanStack prefix rules. */
export function assertServiceKeyIsolation(evidence: ServiceKeyEvidence): void {
  const expectedKeys = {
    usersServerKey: ['users', 'list', JSON.stringify(LIST_INPUT)],
    paymentsServerKey: ['payments', 'list', JSON.stringify(LIST_INPUT)],
    usersClientKey: ['users', 'list', { input: LIST_INPUT }],
    paymentsClientKey: ['payments', 'list', { input: LIST_INPUT }],
  } as const;
  for (const [name, expected] of Object.entries(expectedKeys)) {
    const observed = evidence[name as keyof typeof expectedKeys];
    if (JSON.stringify(observed) !== JSON.stringify(expected)) {
      throw new Error(`${name} did not equal ${JSON.stringify(expected)}`);
    }
  }
  assertIndexZeroOnly(evidence.usersServerKey, evidence.paymentsServerKey, 'server');
  assertIndexZeroOnly(evidence.usersClientKey, evidence.paymentsClientKey, 'client');

  const ownMatches = [
    partialMatchKey(evidence.usersServerKey, evidence.usersServerFilter),
    partialMatchKey(evidence.paymentsServerKey, evidence.paymentsServerFilter),
    partialMatchKey(evidence.usersClientKey, evidence.usersClientFilter),
    partialMatchKey(evidence.paymentsClientKey, evidence.paymentsClientFilter),
  ];
  if (ownMatches.some((matches) => !matches)) {
    throw new Error('a generated list filter did not prefix-match its own factory key');
  }
  if (
    partialMatchKey(evidence.paymentsServerKey, evidence.usersServerFilter) ||
    partialMatchKey(evidence.paymentsClientKey, evidence.usersClientFilter)
  ) {
    throw new Error('the users list filter matched a payments factory key');
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
export function serviceClientConsumerSource(): string {
  return `import { usersQueries } from './users.ts';
import { paymentsQueries } from './payments.ts';

const input = { limit: 3, page: 1, sortBy: 'id', sortOrder: 'asc' } as const;
const usersServerKey = usersQueries.list.key(input);
const paymentsServerKey = paymentsQueries.list.key(input);
const usersClientKey = usersQueries.list.clientKey(input);
const paymentsClientKey = paymentsQueries.list.clientKey(input);

console.log('${EVIDENCE_MARKER}' + JSON.stringify({
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

/** Execute the second-generation, byte, type, and key contract against a generated project. */
export async function probeGeneratedServiceClients(
  projectRoot: string,
  appName: string,
  cliPrefix: readonly string[],
): Promise<void> {
  const before = await snapshotOwnedOutput(projectRoot, appName);
  const generation = await runCommand(
    [...cliPrefix, 'service', 'generate', '--project-root', projectRoot],
    projectRoot,
  );
  requireSuccess(generation, 'second service generate');
  for (const marker of ['Wrote 0 service client modules.', 'Wrote 0 Aspire helper files.']) {
    if (!generation.stdout.includes(marker)) {
      throw new Error(`second service generate did not report ${marker}\n${generation.stdout}`);
    }
  }
  assertByteIdentical(before, await snapshotOwnedOutput(projectRoot, appName));

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
      const url = new URL('/examples/users?preview=success', baseUrl).toString();
      assertSettledRefetch(await collectBrowserRefetchEvidence(url));
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('no generated app URL was probeable');
}

function assertIndexZeroOnly(
  usersKey: readonly unknown[],
  paymentsKey: readonly unknown[],
  tier: string,
): void {
  if (usersKey[0] !== 'users' || paymentsKey[0] !== 'payments') {
    throw new Error(`${tier} keys do not carry users/payments resource identities`);
  }
  if (usersKey.length !== paymentsKey.length) {
    throw new Error(`${tier} key lengths differ`);
  }
  for (let index = 1; index < usersKey.length; index++) {
    if (JSON.stringify(usersKey[index]) !== JSON.stringify(paymentsKey[index])) {
      throw new Error(`${tier} keys differ beyond resource index 0 at index ${index}`);
    }
  }
}

async function snapshotOwnedOutput(projectRoot: string, appName: string): Promise<FileSnapshot> {
  const paths = [
    join(projectRoot, 'apps', appName, 'lib', 'users.ts'),
    join(projectRoot, 'apps', appName, 'lib', 'payments.ts'),
  ];
  const aspireRoot = join(projectRoot, 'aspire');
  for await (const entry of walk(aspireRoot, { includeDirs: false, exts: ['.mts'] })) {
    paths.push(entry.path);
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
