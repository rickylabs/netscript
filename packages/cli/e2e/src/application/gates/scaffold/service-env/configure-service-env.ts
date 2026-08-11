/**
 * @module
 *
 * Pre-start fixture for #1447: declares environment on a scaffolded service and
 * regenerates the Aspire helpers through the real CLI.
 *
 * This runs on the **consumer path** — edit `appsettings.json`, run
 * `netscript generate aspire`, change nothing under `aspire/.helpers/**` by
 * hand. That is the path the acceptance criterion is about, and it is also
 * where the determinism claim is checked: generation runs twice and the whole
 * helpers directory must come out byte-identical.
 *
 * The entries are written under the deprecated `Env` spelling on purpose. It is
 * the spelling #1447 reported, it is the one that used to be silently stripped,
 * and a fixture that used the canonical `Environment` name would not exercise
 * the reported defect at all.
 */

import { join } from '@std/path';
import { SCAFFOLD_DIRS } from '../../../../../../src/kernel/constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../../../../../src/kernel/constants/scaffold/scaffold-files.ts';
import {
  DECLARED_SERVICE_ENV,
  DECLARED_STALE_DATABASE_URL,
  GENERATED_DATABASE_URL_KEY,
} from './service-env-contract.ts';

const [projectRoot, mode, cliEntrypoint, serviceName] = Deno.args;
if (!projectRoot || !cliEntrypoint || !serviceName) {
  throw new Error('project root, package mode, CLI entrypoint, and service name are required');
}
if (mode !== 'published' && mode !== 'local') {
  throw new Error(`package mode must be "published" or "local", received ${JSON.stringify(mode)}`);
}

const appsettingsPath = join(projectRoot, SCAFFOLD_FILES.APPSETTINGS);
const helpersDir = join(projectRoot, SCAFFOLD_DIRS.ASPIRE_TS, SCAFFOLD_DIRS.HELPERS);

const settings: unknown = JSON.parse(await Deno.readTextFile(appsettingsPath));
if (
  !isRecord(settings) || !isRecord(settings.NetScript) || !isRecord(settings.NetScript.Services)
) {
  throw new Error(`${appsettingsPath} declares no NetScript.Services section`);
}
const service = settings.NetScript.Services[serviceName];
if (!isRecord(service)) {
  throw new Error(`${appsettingsPath} declares no service named ${serviceName}`);
}

service.Env = {
  ...DECLARED_SERVICE_ENV,
  [GENERATED_DATABASE_URL_KEY]: DECLARED_STALE_DATABASE_URL,
};
await Deno.writeTextFile(appsettingsPath, `${JSON.stringify(settings, null, 2)}\n`);

await regenerate('first');
const firstPass = await snapshotHelpers();
await regenerate('second');
const secondPass = await snapshotHelpers();

assertDeterministic(firstPass, secondPass);
assertDeclaredEntriesGenerated(firstPass);

console.info(
  `declared environment wired for ${serviceName}: ${
    Object.keys(DECLARED_SERVICE_ENV).join(', ')
  } (+ a stale ${GENERATED_DATABASE_URL_KEY} the generated value must beat)`,
);

/** Runs `netscript generate aspire` the way a consumer would. */
async function regenerate(label: string): Promise<void> {
  const result = await new Deno.Command('deno', {
    args: [
      'run',
      '-A',
      ...(mode === 'published' ? ['--minimum-dependency-age=0'] : []),
      cliEntrypoint,
      'generate',
      'aspire',
      '--project-root',
      projectRoot,
    ],
    cwd: projectRoot,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (!result.success) {
    const stderr = new TextDecoder().decode(result.stderr);
    const stdout = new TextDecoder().decode(result.stdout);
    throw new Error(
      `netscript generate aspire (${label} pass) failed with code ${result.code}: ${
        stderr || stdout
      }`,
    );
  }
}

/** Reads every generated helper file, so determinism covers the directory. */
async function snapshotHelpers(): Promise<Map<string, string>> {
  const snapshot = new Map<string, string>();
  for await (const entry of Deno.readDir(helpersDir)) {
    if (!entry.isFile) continue;
    snapshot.set(entry.name, await Deno.readTextFile(join(helpersDir, entry.name)));
  }
  if (snapshot.size === 0) throw new Error(`${helpersDir} produced no generated helper files`);
  return snapshot;
}

/** Fails when a second `generate aspire` would leave a consumer with a diff. */
function assertDeterministic(first: Map<string, string>, second: Map<string, string>): void {
  const names = new Set([...first.keys(), ...second.keys()]);
  const drifted: string[] = [];
  for (const name of names) {
    if (first.get(name) !== second.get(name)) drifted.push(name);
  }
  if (drifted.length > 0) {
    throw new Error(
      `regeneration is not deterministic — these helpers differ between two identical runs: ${
        drifted.join(', ')
      }`,
    );
  }
}

/**
 * Fails when the declared entries never reached the generated registration.
 *
 * Matched per line rather than per file: `generate aspire` formats what it
 * writes, so a declared pair lands on one line — while a whole-file substring
 * search for a value as ordinary as `http` would pass on any generated helper.
 */
function assertDeclaredEntriesGenerated(snapshot: Map<string, string>): void {
  const lines = [...snapshot.values()].flatMap((content) => content.split('\n'));
  const missing = Object.entries(DECLARED_SERVICE_ENV)
    .filter(([key, value]) => !lines.some((line) => line.includes(key) && line.includes(value)))
    .map(([key]) => key);
  if (missing.length > 0) {
    throw new Error(
      `regenerated helpers do not apply declared Services.${serviceName}.Env entries: ${
        missing.join(', ')
      }`,
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
