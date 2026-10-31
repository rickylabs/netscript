/** Prepare explicit file storage and a pristine ephemeral control before AppHost start. @module */
import { join } from '@std/path';

/** Exact logical streams resource and its default-storage control. */
export const STREAMS_STORAGE_RESOURCES = {
  FILE: 'streams',
  MEMORY: 'streams-ephemeral-control',
} as const;
/** Core-owned directory binding used by the streams plugin. */
export const STREAMS_STORAGE_ENV = 'STREAMS_DATA_DIR';

/** Add an explicit persistent opt-in without provisioning its directory in the fixture. */
export async function prepareStreamsStorageFixture(projectRoot: string): Promise<void> {
  const path = join(projectRoot, 'appsettings.json');
  const settings: unknown = JSON.parse(await Deno.readTextFile(path));
  if (
    !isRecord(settings) || !isRecord(settings.NetScript) || !isRecord(settings.NetScript.Plugins)
  ) {
    throw new Error('Generated appsettings must declare plugin resources.');
  }
  const plugins = settings.NetScript.Plugins;
  const original = plugins[STREAMS_STORAGE_RESOURCES.FILE];
  if (!isRecord(original)) throw new Error('Generated project must declare streams.');
  const control = plugins[STREAMS_STORAGE_RESOURCES.MEMORY] ?? { ...original };
  if (!isRecord(control)) throw new Error('Invalid streams ephemeral control.');
  if (
    control.DataDirectories !== undefined ||
    (isRecord(control.Environment) && STREAMS_STORAGE_ENV in control.Environment) ||
    (isRecord(control.Env) && STREAMS_STORAGE_ENV in control.Env)
  ) throw new Error('Pristine streams configuration must default to ephemeral storage.');
  // A copied host reservation would prevent the two resources from coexisting.
  delete control.HostPort;
  delete control.Port;
  plugins[STREAMS_STORAGE_RESOURCES.MEMORY] = control;
  plugins[STREAMS_STORAGE_RESOURCES.FILE] = {
    ...original,
    DataDirectories: { [STREAMS_STORAGE_ENV]: '.netscript/data/streams' },
  };
  await Deno.writeTextFile(path, `${JSON.stringify(settings, null, 2)}\n`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

if (import.meta.main) {
  const [projectRoot, cliEntrypoint] = Deno.args;
  if (!projectRoot || !cliEntrypoint) throw new Error('project root and CLI entrypoint required');
  await prepareStreamsStorageFixture(projectRoot);
  const result = await new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '--allow-all',
      cliEntrypoint,
      'generate',
      'aspire',
      '--project-root',
      projectRoot,
    ],
    stdin: 'null',
    stdout: 'inherit',
    stderr: 'inherit',
  }).spawn().status;
  if (!result.success) {
    throw new Error(`Streams storage fixture generation failed (${result.code})`);
  }
}
