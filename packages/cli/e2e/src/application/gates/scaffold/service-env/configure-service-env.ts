/**
 * @module
 *
 * Pre-start fixture for #1447: declares environment on a **discovered** scaffolded
 * service and regenerates the Aspire helpers through the real CLI.
 *
 * This runs on the **consumer path** — edit `appsettings.json`, run
 * `netscript generate aspire`, change nothing under `aspire/.helpers/**` by hand.
 * That is the path the acceptance criterion is about, and it is also where the
 * determinism claim is checked: generation runs twice and the whole helpers
 * directory must come out byte-identical.
 *
 * The subject is not passed in. It is read out of the generated `appsettings.json`
 * (see `discover-service-subjects.ts`), so this fixture and the verification gate
 * cannot agree on a service that the scaffold no longer produces.
 *
 * The entries are written under the deprecated `Env` spelling on purpose. It is
 * the spelling #1447 reported, it is the one that used to be silently stripped,
 * and a fixture that used the canonical `Environment` name would not exercise the
 * reported defect at all.
 */

import { join } from '@std/path';
import { SCAFFOLD_DIRS } from '../../../../../../src/kernel/constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../../../../../src/kernel/constants/scaffold/scaffold-files.ts';
import {
  buildDeclaredEnvironmentCases,
  declaredEnvironment,
  type DeclaredEnvironmentCase,
} from './service-env-contract.ts';
import { readTopology, selectDeclarationSubject } from './discover-service-subjects.ts';

const [projectRoot, mode, cliEntrypoint] = Deno.args;
if (!projectRoot || !cliEntrypoint) {
  throw new Error('project root, package mode, and CLI entrypoint are required');
}
if (mode !== 'published' && mode !== 'local') {
  throw new Error(`package mode must be "published" or "local", received ${JSON.stringify(mode)}`);
}

const appsettingsPath = join(projectRoot, SCAFFOLD_FILES.APPSETTINGS);
const helpersDir = join(projectRoot, SCAFFOLD_DIRS.ASPIRE_TS, SCAFFOLD_DIRS.HELPERS);

const appsettingsText = await Deno.readTextFile(appsettingsPath);
const settings: unknown = JSON.parse(appsettingsText);
const topology = readTopology(appsettingsText);
const subject = selectDeclarationSubject(topology);

// The service-discovery category needs the subject to reference something. Plugin
// installation usually leaves a reference behind; when it has not, the fixture
// adds a self-reference rather than skipping the category — a resource
// referencing its own endpoint is odd but valid, and skipping would leave the
// documented rule untested on the live path.
const reference = subject.references[0] ?? subject.name;
const cases = buildDeclaredEnvironmentCases(subject, topology.primaryDatabase, reference);
const environment = declaredEnvironment(cases);

const service = readServiceSection(settings, subject.name);
service.Env = environment;
if (!subject.references.includes(reference)) {
  service.ServiceReferences = [...readReferences(service), reference];
}
await Deno.writeTextFile(appsettingsPath, `${JSON.stringify(settings, null, 2)}\n`);

await regenerate('first');
const firstPass = await snapshotHelpers();
await regenerate('second');
const secondPass = await snapshotHelpers();

assertDeterministic(firstPass, secondPass);
assertDeclaredEntriesGenerated(firstPass);
assertRefusedEntriesNotGenerated(firstPass);

console.info(
  `declared environment wired for ${subject.name} (discovered, not named): ${
    cases.map((entry) => `${entry.key}=${entry.rule}`).join(', ')
  }`,
);

/** Reads the mutable service entry out of the parsed settings. */
function readServiceSection(value: unknown, name: string): Record<string, unknown> {
  if (!isRecord(value) || !isRecord(value.NetScript) || !isRecord(value.NetScript.Services)) {
    throw new Error(`${appsettingsPath} declares no NetScript.Services section`);
  }
  const entry = value.NetScript.Services[name];
  if (!isRecord(entry)) throw new Error(`${appsettingsPath} declares no service named ${name}`);
  return entry;
}

function readReferences(entry: Record<string, unknown>): string[] {
  const value = entry.ServiceReferences;
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

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
 * Fails when a declared entry the generator is supposed to apply never reached the
 * generated registration.
 *
 * Matched per line rather than per file: `generate aspire` formats what it writes,
 * so a declared pair lands on one line — while a whole-file substring search for a
 * value as ordinary as `http` would pass on any generated helper.
 */
function assertDeclaredEntriesGenerated(snapshot: Map<string, string>): void {
  const lines = generatedLines(snapshot);
  const missing = applied(cases)
    .filter((entry) =>
      !lines.some((line) => line.includes(entry.key) && line.includes(entry.value))
    )
    .map((entry) => entry.key);
  if (missing.length > 0) {
    throw new Error(
      `regenerated helpers do not apply declared Services.${subject.name}.Env entries: ${
        missing.join(', ')
      }`,
    );
  }
}

/**
 * Fails when a refused key was applied anyway, or when its refusal was not
 * recorded where a consumer would look for the value they wrote.
 */
function assertRefusedEntriesNotGenerated(snapshot: Map<string, string>): void {
  const lines = generatedLines(snapshot);
  const failures: string[] = [];
  for (const entry of cases.filter((item) => item.rule === 'refused')) {
    if (lines.some((line) => line.includes(entry.value))) {
      failures.push(`${entry.key} was applied with the declared value ${entry.value}`);
    }
    if (!lines.some((line) => line.includes(`Declared \`${entry.key}\` is not applied`))) {
      failures.push(`${entry.key} was dropped without saying so in the generated helper`);
    }
  }
  if (failures.length > 0) {
    throw new Error(`refused declared entries are mishandled: ${failures.join('; ')}`);
  }
}

function generatedLines(snapshot: Map<string, string>): string[] {
  return [...snapshot.values()].flatMap((content) => content.split('\n'));
}

function applied(entries: readonly DeclaredEnvironmentCase[]): DeclaredEnvironmentCase[] {
  return entries.filter((entry) => entry.rule !== 'refused');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
