import { join } from '@std/path';

const [projectRoot, repoRoot, database = 'postgres'] = Deno.args;
if (!projectRoot || !repoRoot) throw new Error('project root and repository root are required');
if (Deno.build.os !== 'linux') throw new Error('TTY migration fixture requires Linux script(1)');

const workspace = join(projectRoot, 'database', database);
const schemaPath = join(workspace, 'schema', 'schema.prisma');
const migrationsPath = join(workspace, 'migrations');
const cli = join(repoRoot, 'packages', 'cli', 'bin', 'netscript-dev.ts');

await mutateSchema('w2HeadlessProof String?');
const headlessBefore = await migrations();
const headless = await runCli(['db', 'migrate', '--project-root', projectRoot, '--db', database, '--name', 'w2-headless']);
assertArtifactResult('headless', headless, headlessBefore, await migrations());

await mutateSchema('w2TtyProof String?');
const ttyBefore = await migrations();
const ttyCommand = ['deno', 'run', '-A', cli, 'db', 'migrate', '--project-root', projectRoot, '--db', database, '--name', 'w2-tty']
  .map(shellQuote).join(' ');
const tty = await run('script', ['-qec', ttyCommand, '/dev/null'], projectRoot);
assertArtifactResult('TTY', tty, ttyBefore, await migrations());

const deployBefore = await migrations();
const deploy = await runCli(['db', 'deploy', '--project-root', projectRoot, '--db', database]);
if (deploy.code !== 0) throw new Error(`deploy-only control failed: ${deploy.stderr || deploy.stdout}`);
assertSameArtifacts('deploy-only', deployBefore, await migrations());

const noChangeBefore = await migrations();
const noChange = await runCli(['db', 'migrate', '--project-root', projectRoot, '--db', database, '--name', 'w2-no-change']);
if (noChange.code === 0) throw new Error('no-change migration falsely returned success');
assertSameArtifacts('no-change', noChangeBefore, await migrations());
if (!`${noChange.stdout}\n${noChange.stderr}`.includes('created no migration artifact')) {
  throw new Error(`no-change failure omitted artifact diagnostic: ${noChange.stderr || noChange.stdout}`);
}

const status = await runCli(['db', 'status', '--project-root', projectRoot, '--db', database]);
if (status.code !== 0) throw new Error(`database applied-state inspection failed: ${status.stderr || status.stdout}`);
console.info(`migration artifact fixture passed: headless=${created(headlessBefore, await migrations()).join(',')} TTY verified; database status applied`);

async function mutateSchema(field: string): Promise<void> {
  const schema = await Deno.readTextFile(schemaPath);
  const marker = 'model User {';
  if (!schema.includes(marker)) throw new Error(`generated schema omitted ${marker}`);
  await Deno.writeTextFile(schemaPath, schema.replace(marker, `${marker}\n  ${field}`));
}

async function migrations(): Promise<string[]> {
  const names: string[] = [];
  for await (const entry of Deno.readDir(migrationsPath)) {
    if (!entry.isDirectory) continue;
    try {
      if ((await Deno.stat(join(migrationsPath, entry.name, 'migration.sql'))).isFile) names.push(entry.name);
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  }
  return names.sort();
}

function assertArtifactResult(label: string, result: Result, before: string[], after: string[]): void {
  if (result.code !== 0) throw new Error(`${label} migration failed: ${result.stderr || result.stdout}`);
  const added = created(before, after);
  if (added.length !== 1) throw new Error(`${label} migration created ${added.length} artifacts: ${added.join(',')}`);
  const output = `${result.stdout}\n${result.stderr}`;
  if (!output.includes(`Created migrations: ${added[0]}`) || !output.includes(`Applied migrations: ${added[0]}`)) {
    throw new Error(`${label} output did not report created/applied sets: ${output}`);
  }
}

function assertSameArtifacts(label: string, before: string[], after: string[]): void {
  if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error(`${label} control changed migration files`);
}

function created(before: string[], after: string[]): string[] {
  return after.filter((name) => !before.includes(name));
}

function runCli(args: string[]): Promise<Result> {
  return run('deno', ['run', '-A', cli, ...args], projectRoot);
}

interface Result { readonly code: number; readonly stdout: string; readonly stderr: string }

async function run(command: string, args: string[], cwd: string): Promise<Result> {
  const output = await new Deno.Command(command, { args, cwd, stdout: 'piped', stderr: 'piped' }).output();
  return {
    code: output.code,
    stdout: new TextDecoder().decode(output.stdout),
    stderr: new TextDecoder().decode(output.stderr),
  };
}

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`;
}
