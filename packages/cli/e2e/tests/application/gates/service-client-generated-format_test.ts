import { assertEquals, assertStringIncludes } from '@std/assert';
import { fromFileUrl, join } from '@std/path';

const REPO_ROOT = fromFileUrl(new URL('../../../../../../', import.meta.url));
const CLI = join(REPO_ROOT, 'packages', 'cli', 'bin', 'netscript-dev.ts');

interface CommandResult {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

Deno.test('post-init service generation leaves the exact 12 owned outputs formatted and stable', async () => {
  const parent = await Deno.makeTempDir({
    dir: join(REPO_ROOT, '.llm', 'tmp'),
    prefix: 'netscript-service-format-',
  });
  const projectName = 'format-proof';
  const projectRoot = join(parent, projectName);
  const appName = `${projectName}-web`;

  try {
    await assertCommand(runCli([
      'init',
      projectName,
      '--path',
      parent,
      '--db',
      'postgres',
      '--service',
      '--service-name',
      'users',
      '--ci',
      '--yes',
      '--no-git',
      '--force',
    ]));
    await assertCommand(runCli([
      'service',
      'add',
      '--name',
      'payments',
      '--with-client',
      '--project-root',
      projectRoot,
    ]));
    await assertCommand(runCli([
      'service',
      'generate',
      '--project-root',
      projectRoot,
    ]));

    const ownedPaths = [
      `apps/${appName}/lib/users.ts`,
      `apps/${appName}/lib/payments.ts`,
      'contracts/versions/v1/payments.contract.ts',
      'contracts/versions/v1/mod.ts',
      'services/payments/src/routers/v1.ts',
      'aspire/.helpers/register-apps.mts',
      'aspire/.helpers/index.mts',
      'aspire/.helpers/db-cli-mode.mts',
      'aspire/.helpers/register-tools.mts',
      'aspire/.helpers/register-infrastructure.mts',
      'aspire/.helpers/register-background.mts',
      'aspire/.helpers/register-plugins.mts',
    ] as const;
    const snapshot = await readOwnedOutput(projectRoot, ownedPaths);
    assertEquals(Object.keys(snapshot), [...ownedPaths]);

    await assertCommand(runDeno(['fmt', '--check', ...ownedPaths], projectRoot));
    await assertCommand(runDeno(['task', 'fmt:check'], projectRoot));

    const repeated = await assertCommand(runCli([
      'service',
      'generate',
      '--project-root',
      projectRoot,
    ]));
    assertStringIncludes(repeated.stdout, 'Wrote 0 service client modules.');
    assertStringIncludes(repeated.stdout, 'Skipped 2 current service client modules.');
    assertStringIncludes(repeated.stdout, 'Wrote 0 Aspire helper files.');
    assertEquals(await readOwnedOutput(projectRoot, ownedPaths), snapshot);
  } finally {
    await Deno.remove(parent, { recursive: true });
  }
});

async function readOwnedOutput(
  projectRoot: string,
  paths: readonly string[],
): Promise<Readonly<Record<string, string>>> {
  const entries = await Promise.all(
    paths.map(async (path) => [path, await Deno.readTextFile(join(projectRoot, path))] as const),
  );
  return Object.fromEntries(entries);
}

async function runCli(args: readonly string[]): Promise<CommandResult> {
  return await runDeno(['run', '-A', CLI, ...args], REPO_ROOT);
}

async function runDeno(args: readonly string[], cwd: string): Promise<CommandResult> {
  const output = await new Deno.Command(Deno.execPath(), {
    args: [...args],
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

async function assertCommand(result: Promise<CommandResult>): Promise<CommandResult> {
  const settled = await result;
  assertEquals(settled.code, 0, `${settled.stderr}\n${settled.stdout}`);
  return settled;
}
