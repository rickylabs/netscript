/**
 * @module
 *
 * Behavior gate for #1447: the **AppHost-started process** of every service that
 * declared an environment observes it, and every documented precedence category
 * resolved the way it is documented to.
 *
 * Three independent things have to hold, and none of them is "a command exited 0":
 *
 * 1. **Explicitly healthy.** `aspire wait <resource> --status healthy` is the
 *    AppHost's own verdict that the resource is up. #1447's symptom was a service
 *    that started, read EOF on stdio, and exited successfully inside a second — a
 *    gate that cannot tell that from healthy is the bug in test form.
 * 2. **The resource model carries it.** `aspire describe --format Json`, with the
 *    state required to be `Running`/`Healthy` whenever describe publishes one.
 * 3. **The process itself carries it.** `/proc/<pid>/environ` of the process the
 *    AppHost started, which the kernel wrote at exec time. This is the leg that
 *    makes the difference between "the AppHost intended to pass the value" and
 *    "the service got it", and it is where the per-category precedence verdict is
 *    taken.
 *
 * Nothing here is told which service to look at: the subjects are discovered from
 * the generated `appsettings.json`, and discovering none is a failure, not a pass.
 */

import { join } from '@std/path';
import { SCAFFOLD_FILES } from '../../../../../../src/kernel/constants/scaffold/scaffold-files.ts';
import {
  discoverDeclaringSubjects,
  type DiscoveredService,
  readTopology,
} from './discover-service-subjects.ts';
import {
  buildDeclaredEnvironmentCases,
  declaredEnvironment,
  type DeclaredEnvironmentCase,
} from './service-env-contract.ts';
import {
  collectProcessFailures,
  collectTopologyFailures,
  readDescribedResource,
} from './service-env-evidence.ts';
import { requireResourceProcesses, scanResourceProcesses } from './process-evidence.ts';

/** Failure ceiling for a hung first-readiness wait; not an assumed time-to-healthy. */
const HEALTHY_TIMEOUT_SECONDS = 180;

const [projectRoot, appHost] = Deno.args;
if (!projectRoot || !appHost) {
  throw new Error('project root and AppHost path are required');
}

const topology = readTopology(
  await Deno.readTextFile(join(projectRoot, SCAFFOLD_FILES.APPSETTINGS)),
);
const subjects = discoverDeclaringSubjects(topology);
const failures: string[] = [];

// Healthiness first, for every subject, before anything reads the topology: a
// resource still in `Starting` would otherwise be reported as a precedence failure
// when it is really a timing one.
const healthy: DiscoveredService[] = [];
for (const subject of subjects) {
  const problems = await requireHealthy(subject);
  failures.push(...problems);
  if (problems.length === 0) healthy.push(subject);
}

const described = failures.length === 0
  ? await runAspire(['describe', '--format', 'Json', '--include-hidden'])
  : '';

for (const subject of healthy) {
  failures.push(...await verifySubject(subject, described));
}

if (failures.length > 0) {
  throw new Error(
    `the AppHost-started service processes do not honor their declared environment:\n` +
      failures.map((failure) => `  - ${failure}`).join('\n'),
  );
}

console.info(
  `verified ${subjects.length} discovered subject(s): ${
    subjects.map((subject) => subject.name).join(', ')
  } — declared entries observed in the AppHost-started process, every documented category resolved ` +
    'as documented',
);

/**
 * Step 1 — the declaration matches the contract, and the AppHost itself reports the
 * resource healthy.
 */
async function requireHealthy(subject: DiscoveredService): Promise<string[]> {
  const coverage = checkCaseCoverage(subject, casesFor(subject));
  if (coverage.length > 0) return coverage;

  const wait = await runAspireResult([
    'wait',
    subject.name,
    '--status',
    'healthy',
    '--timeout',
    String(HEALTHY_TIMEOUT_SECONDS),
  ]);
  if (wait.ok) return [];
  return [
    `${subject.name} never reached the healthy state (aspire wait exited ${wait.code}): ` +
    `${wait.output.trim() || 'no output'}`,
  ];
}

/** Steps 2 and 3 — the resource model, then the process the AppHost started. */
async function verifySubject(subject: DiscoveredService, described: string): Promise<string[]> {
  const cases = casesFor(subject);
  const collected = [
    ...collectTopologyFailures(readDescribedResource(described, subject.name), subject.name, cases),
  ];

  const workdir = join(projectRoot, subject.workdir);
  const scan = await scanResourceProcesses(workdir, subject.name);
  const processes = requireResourceProcesses(scan, subject.name, workdir);
  for (const process of processes) {
    collected.push(...collectProcessFailures(process, subject.name, cases));
  }

  return collected;
}

/** The documented cases for a subject, derived from the same topology both gates read. */
function casesFor(subject: DiscoveredService): readonly DeclaredEnvironmentCase[] {
  return buildDeclaredEnvironmentCases(
    subject,
    topology.primaryDatabase,
    subject.references[0] ?? subject.name,
  );
}

/**
 * Fails when the discovered declaration does not match the contract, or does not
 * cover all three rules.
 *
 * Without this, the verifier could compute a case list the fixture never wrote —
 * or a list with no collision in it — and report success for checks that could not
 * have failed.
 */
function checkCaseCoverage(
  subject: DiscoveredService,
  cases: readonly DeclaredEnvironmentCase[],
): string[] {
  const expected = declaredEnvironment(cases);
  const problems: string[] = [];

  const missing = Object.entries(expected).filter(([key, value]) =>
    subject.declared[key] !== value
  );
  if (missing.length > 0) {
    problems.push(
      `${subject.name} declares ${JSON.stringify(subject.declared)}, which does not match the ` +
        `#1447 contract for keys ${missing.map(([key]) => key).join(', ')} — the fixture did not ` +
        'run, or a later gate regenerated over it',
    );
  }

  for (const rule of ['declared-wins', 'generated-wins', 'refused'] as const) {
    if (!cases.some((entry) => entry.rule === rule)) {
      problems.push(`the ${subject.name} case list covers no "${rule}" category`);
    }
  }

  return problems;
}

/** Runs an `aspire` subcommand against this AppHost and requires success. */
async function runAspire(args: readonly string[]): Promise<string> {
  const result = await runAspireResult(args);
  if (!result.ok) {
    throw new Error(`aspire ${args[0]} failed (${result.code}): ${result.output}`);
  }
  return result.output;
}

/** Runs an `aspire` subcommand against this AppHost, reporting rather than throwing. */
async function runAspireResult(
  args: readonly string[],
): Promise<{ ok: boolean; code: number; output: string }> {
  const output = await new Deno.Command('aspire', {
    args: [...args, '--apphost', appHost, '--non-interactive', '--nologo'],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const decoder = new TextDecoder();
  const stdout = decoder.decode(output.stdout);
  const stderr = decoder.decode(output.stderr);
  return { ok: output.success, code: output.code, output: stdout || stderr };
}
