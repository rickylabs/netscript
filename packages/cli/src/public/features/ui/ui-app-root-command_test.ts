import {
  assert,
  assertEquals,
  assertStringIncludes,
} from 'jsr:@std/assert@^1';
import { join, resolve } from 'jsr:@std/path@^1';
import { fromFileUrl } from 'jsr:@std/path@^1';
import { stripAnsiCode } from '@std/fmt/colors';

import { DenoFileSystem } from '../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import { createPublicCommandTree } from '../root/public-command-tree.ts';
import { createUiAddCommand } from './add/add-ui-command.ts';
import { createUiInitCommand } from './init/init-ui-command.ts';
import { createUiListCommand } from './list/list-ui-command.ts';
import { createUiRemoveCommand } from './remove/remove-ui-command.ts';
import { createUiUpdateCommand } from './update/update-ui-command.ts';
import type { UiAddCommandInput } from './add/add-ui-input.ts';

Deno.test('ui commands resolve the sole Fresh app and never write the workspace root', async () => {
  await withWorkspace(['dashboard'], async (root) => {
    await parseUiAdd(root, root, ['page', 'incidents']);

    await assertPathExists(join(root, 'apps', 'dashboard', 'routes', 'incidents', 'index.tsx'));
    await assertPathAbsent(join(root, 'routes', 'incidents', 'index.tsx'));
  });
});

Deno.test('ui commands accept --app and select the named Fresh app', async () => {
  await withWorkspace(['admin', 'dashboard'], async (root) => {
    await parseUiAdd(root, root, ['page', 'incidents', '--app', 'dashboard']);

    await assertPathExists(join(root, 'apps', 'dashboard', 'routes', 'incidents', 'index.tsx'));
    await assertPathAbsent(join(root, 'routes', 'incidents', 'index.tsx'));
    await assertPathAbsent(join(root, 'apps', 'admin', 'routes', 'incidents', 'index.tsx'));
  });
});

Deno.test('ui commands infer the Fresh app from an app descendant cwd', async () => {
  await withWorkspace(['admin', 'dashboard'], async (root) => {
    const appRoot = join(root, 'apps', 'dashboard');
    const nestedCwd = join(appRoot, 'routes');
    await Deno.mkdir(nestedCwd, { recursive: true });

    await parseUiAdd(root, nestedCwd, ['page', 'incidents']);

    await assertPathExists(join(appRoot, 'routes', 'incidents', 'index.tsx'));
    await assertPathAbsent(join(root, 'routes', 'incidents', 'index.tsx'));
  });
});

Deno.test('ui commands reject an ambiguous workspace and name every candidate app', async () => {
  await withWorkspace(['dashboard', 'admin'], async (root) => {
    let error: unknown;
    try {
      await parseUiAdd(root, root, ['page', 'incidents']);
    } catch (caught) {
      error = caught;
    }

    assert(error instanceof Error, 'Expected an ambiguous UI invocation to fail.');
    assertStringIncludes(error.message, 'admin');
    assertStringIncludes(error.message, 'dashboard');
    assertStringIncludes(error.message, '--app');
    await assertPathAbsent(join(root, 'routes', 'incidents', 'index.tsx'));
  });
});

Deno.test('every ui command help documents --app', () => {
  const fs = new DenoFileSystem();
  const dependencies = {
    installDependencies: { fs },
    resolveProjectRoot: () => Promise.resolve('/workspace'),
    resolveUiAppRoot: () => Promise.resolve('/workspace/apps/dashboard'),
  };
  const commands = [
    createUiInitCommand(dependencies),
    createUiAddCommand(dependencies),
    createUiListCommand(dependencies),
    createUiUpdateCommand(dependencies),
    createUiRemoveCommand(dependencies),
  ];

  for (const command of commands) {
    const help = stripAnsiCode(command.getHelp()).replace(/\s+/g, ' ');
    assertStringIncludes(help, '--app <name>');
  }
  assertEquals(commands.length, 5);
});

Deno.test('ambiguous ui command process exits non-zero and prints actual candidate apps', async () => {
  await withWorkspace(['dashboard', 'admin'], async (root) => {
    const entrypoint = fromFileUrl(new URL('../../../../bin/netscript.ts', import.meta.url));
    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--no-lock',
        '--allow-all',
        entrypoint,
        'ui:add',
        'page',
        'incidents',
      ],
      cwd: root,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const message = `${new TextDecoder().decode(output.stdout)}\n${
      new TextDecoder().decode(output.stderr)
    }`;

    assert(output.code !== 0, `Expected non-zero exit, received ${output.code}.`);
    assertStringIncludes(message, 'admin');
    assertStringIncludes(message, 'dashboard');
    assertStringIncludes(message, '--app');
  });
});

Deno.test('UiAddCommandInput exposes every accepted option', () => {
  const input: UiAddCommandInput = {
    projectRoot: '/workspace/apps/dashboard',
    app: 'dashboard',
    registryRoot: '/registry',
    theme: 'default',
    force: true,
    route: 'incidents.detail',
    island: true,
    query: true,
  };
  assertEquals(input.app, 'dashboard');
  assertEquals(input.route, 'incidents.detail');
  assertEquals(input.island, true);
  assertEquals(input.query, true);
});

async function withWorkspace(
  apps: readonly string[],
  run: (root: string) => Promise<void>,
): Promise<void> {
  const root = await Deno.makeTempDir({ prefix: 'netscript-ui-app-root-' });
  try {
    await Deno.writeTextFile(
      join(root, 'deno.json'),
      `${JSON.stringify({ workspace: apps.map((app) => `apps/${app}`) }, null, 2)}\n`,
    );
    for (const app of apps) {
      await Deno.mkdir(join(root, 'apps', app), { recursive: true });
    }
    await run(root);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

async function parseUiAdd(
  workspaceRoot: string,
  cwd: string,
  args: readonly string[],
): Promise<void> {
  const command = createPublicCommandTree({
    cwd: () => cwd,
    resolvePath: (path) => resolve(cwd, path ?? '.'),
  });
  await command.parse(['ui:add', ...args]);
  assert(await pathExists(workspaceRoot));
}

async function assertPathExists(path: string): Promise<void> {
  assert(await pathExists(path), `Expected path to exist: ${path}`);
}

async function assertPathAbsent(path: string): Promise<void> {
  assertEquals(await pathExists(path), false, `Expected path to be absent: ${path}`);
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}
