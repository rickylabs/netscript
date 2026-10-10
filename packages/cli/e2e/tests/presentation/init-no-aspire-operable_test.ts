/**
 * #1996: a project scaffolded with `netscript init --no-aspire` must be
 * operable by the CLI commands the initializer advertises. Pins exit codes for
 * the commands the issue reported as dead ends or false successes.
 */

import { assert, assertEquals, assertNotEquals, assertStringIncludes } from '@std/assert';
import { dirname, fromFileUrl, join } from '@std/path';

const PROJECT = 'noaspire-probe';
const SQLITE_PROJECT = 'noaspire-sqlite';
const CONFIG_NOT_FOUND_EXIT = 100;

function repoRoot(): string {
  return dirname(dirname(dirname(dirname(dirname(dirname(fromFileUrl(import.meta.url)))))));
}

interface CliRun {
  readonly code: number;
  readonly output: string;
}

/** Run the maintainer CLI with DATABASE_URL removed, so only POSTGRES_URI is offered. */
async function cli(cwd: string, args: readonly string[]): Promise<CliRun> {
  const env = Deno.env.toObject();
  delete env.DATABASE_URL;
  env.POSTGRES_URI = 'postgres://probe:probe@127.0.0.1:1/probe';
  const result = await new Deno.Command(Deno.execPath(), {
    cwd,
    args: ['run', '-A', join(repoRoot(), 'packages/cli/bin/netscript-dev.ts'), ...args],
    env,
    clearEnv: true,
    stdin: 'null',
  }).output();
  const decoder = new TextDecoder();
  return {
    code: result.code,
    output: `${decoder.decode(result.stdout)}\n${decoder.decode(result.stderr)}`,
  };
}

async function locateProjectRoot(targetPath: string, name = PROJECT): Promise<string> {
  // The maintainer CLI nests the project under the target path.
  for (const candidate of [join(targetPath, name), targetPath]) {
    try {
      await Deno.stat(join(candidate, 'netscript.config.ts'));
      return candidate;
    } catch {
      // try the next candidate
    }
  }
  throw new Error(`Scaffolded project not found under ${targetPath}`);
}

Deno.test({
  name: 'init --no-aspire produces a project its advertised CLI commands can operate',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const root = repoRoot();
    const targetPath = join(root, '.llm/tmp', `init-no-aspire-${crypto.randomUUID()}`);
    try {
      const init = await cli(root, [
        'init',
        PROJECT,
        '--path',
        targetPath,
        '--no-aspire',
        '--db',
        'postgres',
        '--service',
        '--service-name',
        'probe-svc',
        '--model-name',
        'ProbeReceipt',
        '--cache',
        '--ci',
        '--yes',
        '--no-git',
        '--force',
      ]);
      assertEquals(init.code, 0, init.output);

      const project = await locateProjectRoot(targetPath);

      const services = await cli(project, ['service', 'list']);
      assertEquals(services.code, 0, services.output);
      assertStringIncludes(services.output, 'probe-svc');

      const databases = await cli(project, ['db', 'list']);
      assertEquals(databases.code, 0, databases.output);
      assertStringIncludes(databases.output, 'postgres');

      const set = await cli(project, ['config', 'set', 'NetScript.Name', 'renamed-probe']);
      assertEquals(set.code, 0, set.output);
      const get = await cli(project, ['config', 'get', 'NetScript.Name']);
      assertEquals(get.code, 0, get.output);
      assertStringIncludes(get.output, 'renamed-probe');

      // No AppHost exists, so db generate runs the database workspace task
      // with only POSTGRES_URI set (generation needs no live database).
      const generate = await cli(project, ['db', 'generate']);
      assertEquals(generate.code, 0, generate.output);
      assertStringIncludes(generate.output, 'No Aspire AppHost in this project');
      assertEquals(generate.output.includes('aspire start'), false, generate.output);

      const aspire = await cli(project, ['generate', 'aspire']);
      assertNotEquals(aspire.code, 0, aspire.output);
      assertStringIncludes(aspire.output, 'scaffolded without Aspire');

      // Unreadable configuration is a named failure, never an empty success.
      await Deno.remove(join(project, 'appsettings.json'));
      for (
        const args of [
          ['service', 'list'],
          ['db', 'list'],
          ['config', 'list', '--json'],
          ['config', 'get', 'NetScript.Databases.postgres.Mode'],
          ['config', 'set', 'NetScript.Name', 'unreachable'],
        ]
      ) {
        const unreadable = await cli(project, args);
        assertEquals(
          unreadable.code,
          CONFIG_NOT_FOUND_EXIT,
          `${args.join(' ')}\n${unreadable.output}`,
        );
        assertStringIncludes(unreadable.output, 'NetScript config not found');
        assertEquals(unreadable.output.includes('No services configured.'), false);
      }

      // Every advertised db step is preceded by the connection it needs.
      assert(
        init.output.indexOf('set POSTGRES_URI or DATABASE_URL') <
          init.output.indexOf('db generate'),
        init.output,
      );
    } finally {
      await Deno.remove(targetPath, { recursive: true }).catch(() => {});
    }
  },
});

/** The `db …` commands the init summary advertises, in order, as CLI arguments. */
function advertisedDbSteps(initOutput: string): string[][] {
  return [...initOutput.matchAll(/netscript-dev\.ts (db [^#\n]+?)\s*(?:#.*)?$/gm)]
    .map((match) => match[1].trim().split(/\s+/));
}

// #1996 runtime acceptance: every database step `init --no-aspire` advertises
// runs against a live database with no AppHost. SQLite is file-backed, so the
// whole lifecycle (migrate, generate, seed, status) is real and needs no server.
Deno.test({
  name: 'init --no-aspire database lifecycle runs end to end without an AppHost',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const root = repoRoot();
    const targetPath = join(root, '.llm/tmp', `init-no-aspire-db-${crypto.randomUUID()}`);
    try {
      const init = await cli(root, [
        'init',
        SQLITE_PROJECT,
        '--path',
        targetPath,
        '--no-aspire',
        '--db',
        'sqlite',
        '--service',
        '--service-name',
        'probe-svc',
        '--model-name',
        'ProbeReceipt',
        '--ci',
        '--yes',
        '--no-git',
        '--force',
      ]);
      assertEquals(init.code, 0, init.output);
      const project = await locateProjectRoot(targetPath, SQLITE_PROJECT);

      // Run exactly what the summary advertises, then confirm the schema state.
      const steps = advertisedDbSteps(init.output);
      const outputs: string[] = [];
      for (const step of [...steps, ['db', 'status']]) {
        const run = await cli(project, step);
        assertEquals(run.code, 0, `${step.join(' ')}\n${run.output}`);
        assertStringIncludes(run.output, 'No Aspire AppHost in this project');
        outputs.push(run.output);
      }
      assertEquals(
        steps.map((step) => step.join(' ')),
        ['db init --name init', 'db generate', 'db seed'],
        init.output,
      );
      const [migrate, , seed, status] = outputs;
      assertStringIncludes(migrate, 'Applied migrations');
      assertStringIncludes(seed, 'Seeded representative ProbeReceipt row');
      assertStringIncludes(status, 'Database schema is up to date!');
    } finally {
      await Deno.remove(targetPath, { recursive: true }).catch(() => {});
    }
  },
});
