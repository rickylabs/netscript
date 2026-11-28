/** Refresh resident database consumers after their generated module graph changes. */
import { isAbsolute, join, relative, resolve } from '@std/path';
import { z } from 'zod';
import type { DiscoveredDatabase } from '../../../domain/db-engine.ts';
import type { FileSystemPort } from '../../../ports/file-system-port.ts';
import { outputText, outputWarning } from '../../../presentation/output/default-output.ts';
import type { AspireCommandExecutor } from './aspire-command-executor.ts';

const settingsSchema = z.object({
  NetScript: z.object({
    PrimaryDatabase: z.string().optional(),
    Databases: z.record(z.string(), z.unknown()).default({}),
    Services: z.record(
      z.string(),
      z.object({
        Enabled: z.boolean().optional(),
        Workdir: z.string().optional(),
      }),
    ).default({}),
    Apps: z.record(
      z.string(),
      z.object({
        Enabled: z.boolean().optional(),
        Type: z.string().optional(),
        Workdir: z.string().optional(),
        ServiceReferences: z.array(z.string()).default([]),
      }),
    ).default({}),
    Plugins: z.record(z.string(), z.object({ Enabled: z.boolean().optional() })).default({}),
    BackgroundProcessors: z.record(z.string(), z.object({ Enabled: z.boolean().optional() }))
      .default({}),
  }),
});
const importsSchema = z.object({ imports: z.record(z.string(), z.unknown()).default({}) });
const snapshotSchema = z.object({
  resources: z.array(z.object({
    displayName: z.string().optional(),
    resourceType: z.string().optional(),
    state: z.string().nullable().optional(),
  })),
});

const STARTABLE_STATES = new Set(['Stopped', 'Finished', 'Exited', 'FailedToStop']);
const TRANSITIONING_STOP_STATES = new Set(['Running', 'Stopping']);
const DEFAULT_RECOVERY_POLL_INTERVAL_MS = 250;

/** I/O already owned by the database operation's AppHost lifecycle lease. */
export interface RefreshGeneratedClientConsumersOptions {
  readonly projectRoot: string;
  readonly database: DiscoveredDatabase;
  readonly databases?: readonly DiscoveredDatabase[];
  readonly apphostPath: string;
  readonly aspireDir: string;
  readonly executor: AspireCommandExecutor;
  readonly fs: Pick<FileSystemPort, 'readFile'>;
  readonly realPath: (path: string) => Promise<string>;
  readonly timeoutMs: number;
  readonly signal: AbortSignal;
  readonly refreshed: Set<string>;
  readonly pollIntervalMs?: number;
  readonly sleep?: (ms: number, signal: AbortSignal) => Promise<void>;
}

/** Restart only declared database consumers that are running in this exact AppHost. */
export async function refreshGeneratedClientConsumers(
  options: RefreshGeneratedClientConsumersOptions,
): Promise<void> {
  const deadline = new AbortController();
  const timer = setTimeout(
    () => deadline.abort(new Error('Database consumer refresh timed out.')),
    options.timeoutMs,
  );
  try {
    await refreshConsumers({
      ...options,
      signal: AbortSignal.any([options.signal, deadline.signal]),
    });
  } finally {
    clearTimeout(timer);
  }
}

async function refreshConsumers(options: RefreshGeneratedClientConsumersOptions): Promise<void> {
  const names = await declaredConsumers(options);
  if (names.length === 0) return;
  const commandOptions = { cwd: options.aspireDir, signal: options.signal };
  const scope = ['--apphost', options.apphostPath, '--non-interactive', '--nologo'];
  options.signal.throwIfAborted();
  const snapshot = await options.executor.output(
    ['describe', '--format', 'Json', ...scope],
    commandOptions,
  );
  if (snapshot.code !== 0) {
    throw new Error('Could not inspect database consumers in the project AppHost.');
  }
  const resources = snapshotSchema.parse(JSON.parse(snapshot.stdout)).resources;
  const targets: string[] = [];
  // Validate the entire target set before any resource mutation.
  for (const name of names) {
    const matches = resources.filter((resource) => resource.displayName === name);
    if (matches.length > 1) throw new Error(`Ambiguous AppHost resource identity: ${name}`);
    if (matches[0]?.resourceType === 'Executable' && matches[0].state === 'Running') {
      targets.push(name);
    }
  }
  for (const name of targets) {
    const remedy = `aspire resource ${name} restart --apphost ${
      JSON.stringify(options.apphostPath)
    }`;
    options.signal.throwIfAborted();
    outputText(`Refreshing generated database client in ${name}...`);
    const restarted = await options.executor.output(
      ['resource', name, 'restart', ...scope],
      commandOptions,
    );
    if (restarted.code !== 0) {
      if (isStopFailureExit16(restarted)) {
        await recoverStopFailureExit16(name, restarted, scope, commandOptions, options, remedy);
      } else {
        throw restartFailureError(name, restarted, remedy);
      }
    }
    options.refreshed.add(name);
    const healthy = await options.executor.output([
      'wait',
      name,
      '--status',
      'healthy',
      '--timeout',
      String(Math.max(1, Math.ceil(options.timeoutMs / 1000))),
      ...scope,
    ], commandOptions);
    if (healthy.code !== 0) {
      throw new Error(
        `Database client generated, but ${name} did not become healthy. Inspect its logs, then run: ${remedy}`,
      );
    }
    outputText(`Refreshed generated database client in ${name}; resource is healthy.`);
  }
}

async function declaredConsumers(
  options: RefreshGeneratedClientConsumersOptions,
): Promise<string[]> {
  const targetDatabases = options.databases ?? [options.database];
  if (!targetDatabases.length) return [];
  const root = await options.realPath(options.projectRoot);
  const { NetScript: settings } = settingsSchema.parse(
    JSON.parse(await options.fs.readFile(join(root, 'appsettings.json'))),
  );
  const databases = Object.keys(settings.Databases);
  const primary = settings.PrimaryDatabase ?? (databases.length === 1 ? databases[0] : undefined);
  const facades = targetDatabases.map((db) => join(root, db.workspaceDir, 'mod.ts'));
  if (targetDatabases.some((db) => primary === db.configKey)) {
    facades.push(join(root, 'database', 'mod.ts'));
  }
  const canonicalFacades = new Set<string>();
  for (const path of facades) {
    try {
      const canonical = await options.realPath(path);
      if (within(root, canonical)) canonicalFacades.add(canonical);
    } catch { /* Missing facades cannot have live consumers. */ }
  }
  const verifiedDbServices = new Set<string>();
  for (const [name, service] of Object.entries(settings.Services)) {
    if (service.Enabled === false) continue;
    try {
      const workdir = await options.realPath(
        resolve(root, service.Workdir ?? join('services', name)),
      );
      if (!within(root, workdir)) continue;
      const configPath = await options.realPath(join(workdir, 'deno.json'));
      if (!within(root, configPath)) continue;
      const { imports } = importsSchema.parse(JSON.parse(await options.fs.readFile(configPath)));
      const databaseImport = imports['@database'];
      if (typeof databaseImport !== 'string' || !databaseImport.startsWith('.')) continue;
      const facade = await options.realPath(resolve(workdir, databaseImport));
      if (within(root, facade) && canonicalFacades.has(facade)) verifiedDbServices.add(name);
    } catch {
      outputWarning(`Skipping ${name}: could not verify its declared database client dependency.`);
    }
  }
  const apps: string[] = [];
  for (const [name, app] of Object.entries(settings.Apps)) {
    if (
      app.Enabled === false || (app.Type ?? 'app') !== 'app' || options.refreshed.has(name) ||
      !app.ServiceReferences.some((ref) => verifiedDbServices.has(ref))
    ) continue;
    try {
      const workdir = await options.realPath(resolve(root, app.Workdir ?? join('apps', name)));
      if (!within(root, workdir)) continue;
      const configPath = await options.realPath(join(workdir, 'deno.json'));
      if (!within(root, configPath)) continue;
      importsSchema.parse(JSON.parse(await options.fs.readFile(configPath)));
      apps.push(name);
    } catch {
      outputWarning(`Skipping ${name}: could not verify its declared application dependency.`);
    }
  }
  const enabledNames = [
    ...Object.entries(settings.Services).filter(([, entry]) => entry.Enabled !== false),
    ...Object.entries(settings.Apps).filter(([, entry]) =>
      entry.Type === 'desktop' ? entry.Enabled === true : entry.Enabled !== false
    ),
    ...Object.entries(settings.Plugins).filter(([, entry]) => entry.Enabled !== false),
    ...Object.entries(settings.BackgroundProcessors).filter(([, entry]) => entry.Enabled !== false),
  ].map(([name]) => name);
  for (const name of [...verifiedDbServices, ...apps]) {
    if (enabledNames.filter((declared) => declared === name).length > 1) {
      throw new Error(`Ambiguous AppHost resource identity: ${name}`);
    }
  }
  return [
    ...[...verifiedDbServices].filter((name) => !options.refreshed.has(name)).sort(),
    ...apps.sort(),
  ];
}

function within(root: string, path: string): boolean {
  const child = relative(root, path);
  return child === '' ||
    (!isAbsolute(child) && child !== '..' && !child.startsWith('../') && !child.startsWith('..\\'));
}

interface CommandResult {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

function isStopFailureExit16(result: CommandResult): boolean {
  return result.code === 16 &&
    /failed to stop resource/i.test(`${result.stderr}\n${result.stdout}`);
}

function diagnosticOf(result: CommandResult): string {
  return result.stderr.trim() || result.stdout.trim();
}

function restartFailureError(
  name: string,
  restarted: CommandResult,
  remedy: string,
  recoveryDetail?: string,
): Error {
  const diagnostic = diagnosticOf(restarted);
  const details = [diagnostic, recoveryDetail].filter(Boolean).join('\n');
  return new Error(
    `Database client generated, but ${name} restart failed (Aspire exit ${restarted.code}). ${
      details ? `${details}\n` : ''
    }Run: ${remedy}`,
  );
}

async function inspectUniqueExecutableState(
  name: string,
  scope: readonly string[],
  commandOptions: { readonly cwd: string; readonly signal: AbortSignal },
  executor: AspireCommandExecutor,
): Promise<string | null> {
  commandOptions.signal.throwIfAborted();
  const snapshot = await executor.output(
    ['describe', '--format', 'Json', ...scope],
    commandOptions,
  );
  if (snapshot.code !== 0) {
    throw new Error(`describe exited ${snapshot.code}`);
  }
  const resources = snapshotSchema.parse(JSON.parse(snapshot.stdout)).resources;
  const matches = resources.filter((resource) => resource.displayName === name);
  if (matches.length === 0) {
    throw new Error(`resource ${name} is missing from AppHost snapshot`);
  }
  if (matches.length > 1) {
    throw new Error(`Ambiguous AppHost resource identity: ${name}`);
  }
  if (matches[0].resourceType !== 'Executable') {
    throw new Error(
      `resource ${name} has type ${matches[0].resourceType ?? 'unknown'}, expected Executable`,
    );
  }
  return matches[0].state ?? null;
}

async function sleepWithSignal(
  ms: number,
  signal: AbortSignal,
  customSleep?: (ms: number, signal: AbortSignal) => Promise<void>,
): Promise<void> {
  signal.throwIfAborted();
  if (customSleep) {
    await customSleep(ms, signal);
    signal.throwIfAborted();
    return;
  }
  await new Promise<void>((resolvePromise, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolvePromise();
    }, ms);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

async function recoverStopFailureExit16(
  name: string,
  restarted: CommandResult,
  scope: readonly string[],
  commandOptions: { readonly cwd: string; readonly signal: AbortSignal },
  options: RefreshGeneratedClientConsumersOptions,
  remedy: string,
): Promise<void> {
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_RECOVERY_POLL_INTERVAL_MS;
  const inspect = async (): Promise<string | null> => {
    try {
      return await inspectUniqueExecutableState(name, scope, commandOptions, options.executor);
    } catch (error) {
      if (options.signal.aborted) throw options.signal.reason;
      const reason = error instanceof Error ? error.message : String(error);
      throw restartFailureError(name, restarted, remedy, `Recovery aborted: ${reason}.`);
    }
  };
  let state = await inspect();
  if (state !== null && TRANSITIONING_STOP_STATES.has(state)) {
    options.signal.throwIfAborted();
    const stopped = await options.executor.output(
      ['resource', name, 'stop', ...scope],
      commandOptions,
    );
    state = await inspect();
    if (stopped.code !== 0 && !(state !== null && STARTABLE_STATES.has(state))) {
      const stopDiag = diagnosticOf(stopped);
      throw restartFailureError(
        name,
        restarted,
        remedy,
        `Recovery stop exited ${stopped.code}${
          stopDiag ? ` (${stopDiag})` : ''
        } while resource remained ${JSON.stringify(state)}.`,
      );
    }
    while (state !== null && TRANSITIONING_STOP_STATES.has(state)) {
      await sleepWithSignal(pollIntervalMs, options.signal, options.sleep);
      state = await inspect();
    }
  }
  if (state === null || !STARTABLE_STATES.has(state)) {
    throw restartFailureError(
      name,
      restarted,
      remedy,
      `Recovery refused non-startable observed state ${JSON.stringify(state)}.`,
    );
  }
  options.signal.throwIfAborted();
  const started = await options.executor.output(
    ['resource', name, 'start', ...scope],
    commandOptions,
  );
  if (started.code !== 0) {
    const startDiag = diagnosticOf(started);
    throw restartFailureError(
      name,
      restarted,
      remedy,
      `Recovery start exited ${started.code}${startDiag ? ` (${startDiag})` : ''}.`,
    );
  }
}
