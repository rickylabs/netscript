import { assertEquals } from '@std/assert';
import { walk } from '@std/fs';
import { join } from '@std/path';
import { createScaffoldGates } from './scaffold-gates.ts';
import { createSmokeProject } from '../../builders/workspace/smoke-project-factory.ts';
import { GATE, SCAFFOLD } from '../../../domain/cli-surface.ts';
import { DATABASE, PACKAGE_SOURCE, REPORT_FORMAT } from '../../../domain/extension-axes.ts';
import type { RunOptions } from '../../../domain/run-context.ts';

Deno.test('public guarded service probe isolates ambient agent hosts and removes its scratch project', async () => {
  const root = await Deno.makeTempDir({ prefix: 'guarded-service-isolation-' });
  const repo = new URL('../../../../../../../', import.meta.url).pathname;
  const shared = join(root, 'shared');
  const run = async (args: string[], env?: Record<string, string>) => {
    const result = await new Deno.Command(Deno.execPath(), {
      args: ['run', '--no-lock', '-A', ...args],
      cwd: repo,
      // These are the parent environment inherited by every CLI spawned by the probe.
      env: {
        CLAUDECODE: '1',
        OPENCODE: '1',
        OPENCODE_CONFIG_DIR: join(root, 'opencode'),
        TERM_PROGRAM: 'vscode',
        VSCODE_PID: '1',
        VSCODE_IPC_HOOK_CLI: 'fixture',
        CURSOR_TRACE_ID: 'fixture',
        ZED_TERM: 'true',
        TMPDIR: root,
        ...env,
      },
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(
      result.code,
      0,
      new TextDecoder().decode(result.stderr) + new TextDecoder().decode(result.stdout),
    );
  };
  const snapshot = async () => {
    const files = new Map<string, string>();
    for await (const file of walk(shared, { includeDirs: false })) {
      files.set(file.path, await Deno.readTextFile(file.path));
    }
    return files;
  };
  try {
    const options: RunOptions = {
      repoRoot: repo,
      cliEntrypoint: join(repo, 'packages/cli/bin/netscript.ts'),
      smokeRoot: root,
      projectName: 'shared',
      database: DATABASE.POSTGRES,
      packageSource: PACKAGE_SOURCE.JSR,
      plugins: [],
      samples: false,
      cache: false,
      cleanup: true,
      format: REPORT_FORMAT.PRETTY,
      commandTimeoutMs: 60_000,
      httpTimeoutMs: 10_000,
    };
    const gate = createScaffoldGates({ plugins: [], samples: false }).find((entry) =>
      entry.id === GATE.SCAFFOLD_INIT
    );
    if (gate?.kind !== 'command') throw new Error('Expected scaffold init command gate');
    const command = gate.command({
      request: { suiteId: SCAFFOLD.RUNTIME, options },
      project: createSmokeProject(options),
    });
    // Execute the suite's real init arguments through the local Deno executable.
    await run([...command.slice(3)]);
    const before = await snapshot();
    await run([
      '--unstable-kv',
      new URL('./probe-generated-guarded-service.ts', import.meta.url).pathname,
      shared,
      repo,
    ], { TMPDIR: root });
    assertEquals(await snapshot(), before);
    const entries: string[] = [];
    for await (const entry of Deno.readDir(root)) entries.push(entry.name);
    assertEquals(entries, ['shared']);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
