/** Proves published CLI parity and byte-drift rejection on a fresh consumer project. */
const [version, reportPath] = Deno.args;
if (!version || !/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(version) || !reportPath) {
  throw new Error('Usage: check-published-generated-surface.ts <published-version> <report.json>');
}

const cli = `jsr:@netscript/cli@${version}`;
const scratch = await Deno.makeTempDir({ prefix: 'netscript-parity-' });
const project = `${scratch}/parity-smoke`;
const decoder = new TextDecoder();
const targets = {
  plugins: '.netscript/generated/plugin-workers/job-registry.ts',
  aspire: 'aspire/apphost.mts',
} as const;
type Generator = keyof typeof targets;
interface Inventory {
  version: number;
  generator: string;
  status: string;
  exitCode: number;
  outputs: { path: string }[];
  drift: { path: string; kind: string }[];
}

const evidence: {
  generator: Generator;
  scenario: string;
  command: string;
  exitCode: number;
  status: string;
  outputCount: number;
  drift: { path: string; kind: string }[];
  nonMutating: boolean;
}[] = [];

/** Uses only the published entrypoint, outside the repository's import map. */
async function run(args: string[]): Promise<Deno.CommandOutput> {
  return await new Deno.Command(Deno.execPath(), {
    args: ['run', '--no-config', '-A', cli, ...args],
    cwd: scratch,
    stdin: 'null',
    stdout: 'piped',
    stderr: 'piped',
  }).output();
}

/** Setup failures cannot masquerade as successful hostile checks. */
async function prepare(args: string[]): Promise<void> {
  const result = await run(args);
  if (!result.success) {
    diagnose(result);
    throw new Error(`Setup ${args.slice(0, 2).join(' ')} exited ${result.code}`);
  }
}

/** Keeps failure diagnostics useful without publishing consumer or operator paths. */
function diagnose(result: Deno.CommandOutput): void {
  const tail = decoder.decode(result.stderr).slice(-3000)
    .replaceAll(scratch, '<scratch>')
    .replaceAll(Deno.cwd(), '<checkout>')
    .replace(/(?:[A-Za-z]:[\\/]|\/(?:home|Users|tmp|ephemeral)\/)[^\s"'<>]+/g, '<path>');
  console.error(`CLI exit ${result.code}; stderr tail: ${tail || '<empty>'}`);
}

/** Snapshots consumer files and locks, excluding installed npm dependency trees. */
async function snapshot(root = project): Promise<string> {
  const entries: string[] = [];
  for await (const entry of Deno.readDir(root)) {
    if (entry.name === 'node_modules' && entry.isDirectory) continue;
    const path = `${root}/${entry.name}`;
    if (entry.isSymlink) throw new Error('Unexpected symlink in consumer fixture');
    if (entry.isDirectory) entries.push(`${entry.name}/${await snapshot(path)}`);
    else {
      const digest = await crypto.subtle.digest('SHA-256', await Deno.readFile(path));
      entries.push(`${entry.name}:${Array.from(new Uint8Array(digest)).join(',')}`);
    }
  }
  return JSON.stringify(entries.sort());
}

/** Requires the documented native status, exit code and exact target's byte finding. */
async function check(generator: Generator, hostile: boolean): Promise<void> {
  const before = await snapshot();
  const args = ['generate', generator, '--check', '--format', 'json', '--project-root', project];
  const result = await run(args);
  let report: Inventory;
  try {
    report = JSON.parse(decoder.decode(result.stdout));
    if (!report || !Array.isArray(report.outputs) || !Array.isArray(report.drift)) {
      throw new Error('Invalid inventory shape');
    }
  } catch {
    diagnose(result);
    throw new Error(`Invalid JSON inventory: ${generator} ${hostile ? 'hostile' : 'clean'}`);
  }
  const expectedCode = hostile ? 1 : 0;
  const expectedStatus = hostile ? 'drift' : 'current';
  const target = targets[generator];
  const nonMutating = before === await snapshot();
  const conditions = {
    processExit: result.code === expectedCode,
    reportExit: report.exitCode === expectedCode,
    status: report.status === expectedStatus,
    schema: report.version === 1,
    generator: report.generator === `public.generate.${generator}`,
    targetPresent: report.outputs.some((output) => output.path === target),
    nonMutating,
    findings: hostile
      ? report.drift.length === 1 &&
        report.drift[0].path === target && report.drift[0].kind === 'bytes'
      : report.drift.length === 0,
  };
  const failed = Object.entries(conditions).filter(([, passed]) => !passed).map(([name]) => name);
  if (failed.length) {
    diagnose(result);
    throw new Error(
      `Parity assertion failed: ${generator} ${hostile ? 'hostile' : 'clean'}: ${
        failed.join(', ')
      }`,
    );
  }
  // Publish only known relative targets and finite finding kinds, never diagnostic messages.
  evidence.push({
    generator,
    scenario: hostile ? 'hostile-byte-mutation' : 'clean',
    command:
      `deno run --no-config -A ${cli} generate ${generator} --check --format json --project-root <project>`,
    exitCode: result.code,
    status: report.status,
    outputCount: report.outputs.length,
    drift: report.drift.map((finding) => ({
      path: finding.path === target ? target : '<other-output>',
      kind: finding.kind === 'bytes' ? 'bytes' : '<other-finding>',
    })),
    nonMutating,
  });
}

await prepare([
  'init',
  'parity-smoke',
  '--path',
  scratch,
  '--db',
  'none',
  '--editor',
  'none',
  '--no-agent',
  '--ci',
  '--yes',
  '--no-git',
]);
// Workers require streams in the published plugin composition.
await prepare([
  'plugin',
  'install',
  'stream',
  '--name',
  'streams',
  '--project-root',
  project,
  '--no-db',
  '--samples',
  '--ci',
]);
await prepare([
  'plugin',
  'install',
  'worker',
  '--name',
  'workers',
  '--project-root',
  project,
  '--no-db',
  '--samples',
  '--ci',
]);
// Normal generation prepares the consumer lock and registry before read-only inspection.
await prepare(['generate', 'plugins', '--project-root', project]);
await prepare(['generate', 'aspire', '--project-root', project]);

await check('plugins', false);
await check('aspire', false);
for (const generator of ['plugins', 'aspire'] as const) {
  const path = `${project}/${targets[generator]}`;
  const original = await Deno.readFile(path);
  try {
    await Deno.writeTextFile(path, '\n// hostile parity smoke mutation\n', { append: true });
    await check(generator, true);
  } finally {
    await Deno.writeFile(path, original);
  }
}

const report = { cli, deno: Deno.version.deno, os: Deno.build.os, checks: evidence };
await Deno.writeTextFile(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
