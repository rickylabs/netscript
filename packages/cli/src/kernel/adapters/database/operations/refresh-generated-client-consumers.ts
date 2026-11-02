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

/** I/O already owned by the database operation's AppHost lifecycle lease. */
export interface RefreshGeneratedClientConsumersOptions {
  readonly projectRoot: string;
  readonly database: DiscoveredDatabase;
  readonly apphostPath: string;
  readonly aspireDir: string;
  readonly executor: AspireCommandExecutor;
  readonly fs: Pick<FileSystemPort, 'readFile'>;
  readonly realPath: (path: string) => Promise<string>;
  readonly timeoutMs: number;
  readonly signal: AbortSignal;
  readonly refreshed: Set<string>;
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
      throw new Error(`Database client generated, but ${name} restart failed. Run: ${remedy}`);
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
  const root = await options.realPath(options.projectRoot);
  const { NetScript: settings } = settingsSchema.parse(
    JSON.parse(await options.fs.readFile(join(root, 'appsettings.json'))),
  );
  const databases = Object.keys(settings.Databases);
  const primary = settings.PrimaryDatabase ?? (databases.length === 1 ? databases[0] : undefined);
  const facades = [join(root, options.database.workspaceDir, 'mod.ts')];
  if (primary === options.database.configKey) facades.push(join(root, 'database', 'mod.ts'));
  const canonicalFacades: string[] = [];
  for (const path of facades) {
    try {
      const canonical = await options.realPath(path);
      if (within(root, canonical)) canonicalFacades.push(canonical);
    } catch { /* Missing facades cannot have live consumers. */ }
  }
  const names: string[] = [];
  for (const [name, service] of Object.entries(settings.Services)) {
    if (service.Enabled === false || options.refreshed.has(name)) continue;
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
      if (within(root, facade) && canonicalFacades.includes(facade)) names.push(name);
    } catch {
      outputWarning(`Skipping ${name}: could not verify its declared database client dependency.`);
    }
  }
  return names.sort();
}

function within(root: string, path: string): boolean {
  const child = relative(root, path);
  return child === '' ||
    (!isAbsolute(child) && child !== '..' && !child.startsWith('../') && !child.startsWith('..\\'));
}
