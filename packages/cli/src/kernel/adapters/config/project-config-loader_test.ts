import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import { dirname, fromFileUrl, join, resolve } from '@std/path';
import { toFileUrl } from '@std/path/to-file-url';

import type { ProcessPort, ProcessResult } from '../../ports/process-port.ts';
import { createProjectConfigLoader, loadProjectConfig } from './project-config-loader.ts';

const REPO_ROOT = resolve(dirname(fromFileUrl(import.meta.url)), '../../../../../..');

function repoPath(path: string): string {
  return join(REPO_ROOT, path);
}

Deno.test('loadProjectConfig runs the child loader under the project deno.json', async () => {
  const projectRoot = await createProject({
    configName: 'netscript.config.ts',
    configText: `import { defineConfig } from '@netscript/config';

export default defineConfig({
  name: 'child-loaded-app',
  databases: { config: [] },
});
`,
  });

  const config = await loadProjectConfig(
    { cwd: projectRoot },
    { process: new RealProcess(), loaderSpecifier: childLoaderSpecifier() },
  );

  assertEquals(config.name, 'child-loaded-app');
});

Deno.test('loadProjectConfig preserves JavaScript config file resolution', async () => {
  const projectRoot = await createProject({
    configName: 'netscript.config.js',
    configText: `import { defineConfig } from '@netscript/config';

export default defineConfig({
  name: 'javascript-config-app',
  databases: { config: [] },
});
`,
  });

  const config = await createProjectConfigLoader({
    process: new RealProcess(),
    loaderSpecifier: childLoaderSpecifier(),
  })({ cwd: projectRoot });

  assertEquals(config.name, 'javascript-config-app');
});

Deno.test('loadProjectConfig reports a missing config from the child process', async () => {
  const projectRoot = await createProject();

  await assertRejects(
    () =>
      loadProjectConfig(
        { cwd: projectRoot },
        { process: new RealProcess(), loaderSpecifier: childLoaderSpecifier() },
      ),
    Error,
    'No config file found',
  );
});

Deno.test('loadProjectConfig parses stdout without reading stderr noise', async () => {
  const process = new RecordingProcess({
    code: 0,
    stdout: '{"name":"stderr-noise-app","databases":{"config":[]},"paths":{}}\n',
    stderr: 'Download https://example.invalid/@netscript/config\n',
  });

  const config = await loadProjectConfig({ cwd: '/workspace/app' }, {
    process,
  });

  assertEquals(config.name, 'stderr-noise-app');
  assertEquals(process.calls[0]?.command, 'deno');
  assertEquals(process.calls[0]?.options?.cwd, '/workspace/app');
});

async function createProject(options?: {
  readonly configName: string;
  readonly configText: string;
}): Promise<string> {
  const projectRoot = await Deno.makeTempDir();
  await Deno.writeTextFile(
    join(projectRoot, 'deno.json'),
    JSON.stringify({
      imports: {
        '@netscript/config': toFileUrl(repoPath('packages/config/mod.ts')).href,
      },
    }),
  );

  if (options) {
    await Deno.writeTextFile(
      join(projectRoot, options.configName),
      options.configText,
    );
  }

  return projectRoot;
}

function childLoaderSpecifier(): string {
  return toFileUrl(
    repoPath('packages/cli/src/kernel/adapters/config/project-config-loader-child.ts'),
  )
    .href;
}

class RealProcess implements ProcessPort {
  async exec(
    command: string,
    args: readonly string[],
    options?: {
      readonly cwd?: string;
      readonly env?: Readonly<Record<string, string>>;
    },
  ): Promise<ProcessResult> {
    const output = await new Deno.Command(command, {
      args: [...args],
      cwd: options?.cwd,
      env: options?.env,
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
}

class RecordingProcess implements ProcessPort {
  readonly calls: {
    readonly command: string;
    readonly args: readonly string[];
    readonly options?: {
      readonly cwd?: string;
      readonly env?: Readonly<Record<string, string>>;
    };
  }[] = [];

  constructor(private readonly result: ProcessResult) {}

  exec(
    command: string,
    args: readonly string[],
    options?: {
      readonly cwd?: string;
      readonly env?: Readonly<Record<string, string>>;
    },
  ): Promise<ProcessResult> {
    this.calls.push({ command, args, options });
    return Promise.resolve(this.result);
  }
}
