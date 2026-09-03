/**
 * @module
 *
 * Proves each #1447 gate command carries the permissions its own script needs.
 *
 * This is the regression for the #1449 failure. `BEHAVIOR_SERVICE_ENV` was
 * registered with `--allow-read`, its script reads `/proc`, and Deno refuses
 * `/proc` to anything short of full access — but nothing connected the two.
 * Every unit test of the `/proc` reader passed, because `deno test` runs with
 * `--allow-all`; the gate's own permission set was never the thing under test.
 * The mismatch therefore could not fail until the full `scaffold.runtime` suite
 * had built and started an AppHost, an hour in.
 *
 * So these tests do not read the flags and compare them to a list — a list is
 * just the same unverified claim written twice. They take the flags out of the
 * real gate command, launch a real `deno run` with exactly those flags, and make
 * the subprocess perform the capability the gate script performs. Dropping or
 * narrowing a flag fails here in about a second.
 */

import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { fromFileUrl, resolve } from '@std/path';
import { GATE } from '../../../../domain/cli-surface.ts';
import type { GateDefinition } from '../../../../domain/gate-definition.ts';
import type { GateId } from '../../../../domain/cli-surface.ts';
import type { RunContext, RunOptions } from '../../../../domain/run-context.ts';
import type { SmokeProject } from '../../../../domain/smoke-project.ts';
import { createServiceEnvironmentGates } from './service-env-gates.ts';
import { PERMISSION_UNITS, SCAN_PROC, SPAWNED_EXECUTABLES } from './gate-permission-probe.ts';

const PROBE = fromFileUrl(import.meta.resolve('./gate-permission-probe.ts'));

/** Repository root, eight directories above this file. */
const REPO_ROOT = fromFileUrl(import.meta.resolve('../../../../../../../../'));

Deno.test('service env gates: the behavior gate can read /proc with the flags it declares', async () => {
  const flags = permissionFlags(GATE.BEHAVIOR_SERVICE_ENV);
  const report = await probe(flags, SCAN_PROC);

  // Deno gates `/proc` on full access, so a scoped or missing unit is what the
  // #1449 `NotCapable` was. Asserting the census as well as the scan names which
  // unit regressed instead of only reporting that the scan died.
  for (const unit of PERMISSION_UNITS) {
    assertEquals(
      report.units.get(unit),
      'granted',
      `${GATE.BEHAVIOR_SERVICE_ENV} runs verify-service-env.ts with [${flags.join(' ')}], which ` +
        `leaves "${unit}" ungranted. Deno refuses /proc to anything short of full access, and ` +
        'the /proc read is the only evidence that the declared value reached the started process.',
    );
  }

  assert(
    report.examined !== null && report.examined > 0,
    `the scan enumerated ${report.examined} processes under the gate's own flags; the #1447 ` +
      'evidence depends on it enumerating /proc for real',
  );
});

Deno.test('service env gates: the fixture gate can spawn the CLI and rewrite appsettings', async () => {
  const flags = permissionFlags(GATE.RUNTIME_SERVICE_ENV_FIXTURE);
  const report = await probe(flags);

  // configure-service-env.ts reads and rewrites appsettings.json, then shells out
  // to `deno run … netscript generate aspire`. It never touches /proc, which is
  // why it survived the run that #1449 reports — it is checked here so it cannot
  // acquire that gap silently.
  for (const unit of ['read', 'write', 'env'] as const) {
    assertEquals(
      report.units.get(unit),
      'granted',
      `${GATE.RUNTIME_SERVICE_ENV_FIXTURE} runs configure-service-env.ts with ` +
        `[${flags.join(' ')}], which leaves "${unit}" ungranted`,
    );
  }
  assertEquals(
    report.commands.get('deno'),
    'granted',
    `${GATE.RUNTIME_SERVICE_ENV_FIXTURE} regenerates through a spawned \`deno run\`, which ` +
      `[${flags.join(' ')}] does not permit`,
  );
  assertEquals(report.examined, null, 'the fixture gate was not asked to scan /proc');
});

Deno.test('service env gates: the probe fails when a declared flag is taken away', async () => {
  // The guard on the guard. If the probe could pass under insufficient
  // permissions, both tests above would be decorative. `--allow-read` alone is
  // precisely what #1449 shipped.
  const weakened = await run(['--allow-read'], SCAN_PROC);

  assertEquals(weakened.code === 0, false, 'reading /proc under --allow-read must not succeed');
  assertStringIncludes(weakened.stderr, 'NotCapable');
  assertStringIncludes(weakened.stderr, '/proc');
});

Deno.test('service env gates: every gate command names a script that exists', async () => {
  for (const gate of createServiceEnvironmentGates()) {
    const script = commandOf(gate).find((argument) => argument.endsWith('.ts'));
    assert(script, `${gate.id} builds a command with no script argument`);
    const stat = await Deno.stat(resolve(REPO_ROOT, script));
    assert(stat.isFile, `${gate.id} points at ${script}, which is not a file`);
  }
});

/** A probe report, with every expected key proven present rather than assumed. */
interface ProbeReport {
  readonly units: ReadonlyMap<string, string>;
  readonly commands: ReadonlyMap<string, string>;
  readonly examined: number | null;
}

/** Runs the probe under the given flags and requires it to complete. */
async function probe(flags: readonly string[], ...args: string[]): Promise<ProbeReport> {
  const result = await run(flags, ...args);
  assertEquals(
    result.code,
    0,
    `the permission probe exited ${result.code} under the gate's own flags ` +
      `[${flags.join(' ')}]:\n${result.stderr}`,
  );
  return readReport(result.stdout);
}

/** Launches the probe as a real `deno run`, exactly as a gate command would. */
async function run(
  flags: readonly string[],
  ...args: string[]
): Promise<{ code: number; stdout: string; stderr: string }> {
  const output = await new Deno.Command(Deno.execPath(), {
    args: ['run', ...flags, PROBE, ...args],
    cwd: REPO_ROOT,
    // Without a stdin, a missing permission is denied outright instead of
    // waiting on a prompt that no one is there to answer.
    stdin: 'null',
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

/** The `--allow-*` flags one gate hands to `deno run`. */
function permissionFlags(id: GateId): string[] {
  const command = commandOf(gate(id));
  assertEquals(
    command.slice(0, 2),
    ['deno', 'run'],
    `${id} no longer invokes \`deno run\`, so its permission flags cannot be read from it`,
  );
  return command.filter((argument) => argument.startsWith('--allow-'));
}

function gate(id: GateId): GateDefinition {
  const found = createServiceEnvironmentGates().find((entry) => entry.id === id);
  assert(found, `createServiceEnvironmentGates() no longer returns ${id}`);
  return found;
}

function commandOf(definition: GateDefinition): readonly string[] {
  assertEquals(definition.kind, 'command', `${definition.id} is not a command gate`);
  assert(definition.kind === 'command');
  return definition.command(context());
}

/** Parses the probe's stdout, failing when a key it must report is absent. */
function readReport(raw: string): ProbeReport {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed)) throw new Error(`the permission probe printed no report: ${raw}`);
  const examined = parsed.examined;
  if (examined !== null && typeof examined !== 'number') {
    throw new Error(`the permission probe reported no scan result: ${raw}`);
  }
  return {
    units: states(parsed.units, PERMISSION_UNITS, 'units'),
    commands: states(parsed.commands, SPAWNED_EXECUTABLES, 'commands'),
    examined,
  };
}

/**
 * Reads one reported section, requiring a state for every expected key.
 *
 * Requiring the keys is the point: a probe that printed `{}` would otherwise let
 * every `assertEquals` above iterate zero times and pass.
 */
function states(
  value: unknown,
  expected: readonly string[],
  section: string,
): ReadonlyMap<string, string> {
  if (!isRecord(value)) throw new Error(`the permission probe printed no "${section}" section`);
  const reported = new Map<string, string>();
  for (const key of expected) {
    const state = value[key];
    if (typeof state !== 'string') {
      throw new Error(`the permission probe reported no "${section}" state for "${key}"`);
    }
    reported.set(key, state);
  }
  return reported;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A context shaped like the runner's, with the real repository root. */
function context(): RunContext {
  const project: SmokeProject = {
    repoRoot: REPO_ROOT,
    cliEntrypoint: './packages/cli/bin/netscript.ts',
    smokeRoot: '.llm/tmp/cli-e2e',
    projectName: 'service-env-gates-test',
    projectRoot: '/workspace',
    appHost: '/workspace/aspire/apphost.mts',
  };
  const options: RunOptions = {
    repoRoot: REPO_ROOT,
    cliEntrypoint: project.cliEntrypoint,
    smokeRoot: project.smokeRoot,
    projectName: project.projectName,
    database: 'postgres',
    packageSource: 'local',
    plugins: [],
    samples: true,
    cache: true,
    cleanup: true,
    format: 'json',
    commandTimeoutMs: 30_000,
    httpTimeoutMs: 30_000,
  };
  return { request: { suiteId: 'scaffold.runtime', options }, project };
}
