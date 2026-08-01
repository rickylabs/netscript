import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { dirname, join } from '@std/path';

import { DenoFileSystem } from '../../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import { DenoProcess } from '../../../../kernel/adapters/runtime/process/deno-process.ts';
import { netscriptJsrSpecifier } from '../../../../kernel/constants/jsr-specifiers.ts';
import type { ProcessPort, ProcessResult } from '../../../../kernel/ports/process-port.ts';
import { createInstalledRuntimeRegistryGenerator } from './installed-runtime-registry-generator.ts';

const REPOSITORY_ROOT = new URL('../../../../../../..', import.meta.url);

Deno.test('clean installed workers, sagas, and triggers emit non-empty canonical registries', async () => {
  const projectRoot = await Deno.makeTempDir({ prefix: 'netscript-registry-integration-' });
  try {
    await writeProject(projectRoot);
    const fs = new DenoFileSystem();
    const generate = createInstalledRuntimeRegistryGenerator({
      fs,
      process: new LocalOfficialGeneratorProcess(),
      fetchManifest: async (url) => {
        const kind = packageKind(url);
        const value = JSON.parse(
          await Deno.readTextFile(new URL(`plugins/${kind}/scaffold.runtime.json`, REPOSITORY_ROOT)),
        );
        return { ok: true, status: 200, json: () => Promise.resolve(value) };
      },
    });

    const generated = await generate({ dryRun: false, projectRoot });

    assertEquals(generated.map((item) => item.path), [
      '.netscript/generated/plugin-workers/job-registry.ts',
      '.netscript/generated/plugin-sagas/sagas.registry.ts',
      '.netscript/generated/plugin-triggers/triggers.registry.ts',
    ]);
    await assertRegistry(
      projectRoot,
      generated[0].path,
      'workers/jobs/health-check.ts',
      'export const registry = new Map',
    );
    await assertRegistry(
      projectRoot,
      generated[1].path,
      'sagas/user-registration-saga.ts',
      'export const sagaRegistry',
    );
    await assertRegistry(
      projectRoot,
      generated[2].path,
      'triggers/generic.ts',
      'export const registry:',
    );
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
  }
});

class LocalOfficialGeneratorProcess implements ProcessPort {
  private readonly process = new DenoProcess();

  exec(
    command: string,
    args: readonly string[],
    options?: { readonly cwd?: string; readonly env?: Readonly<Record<string, string>> },
  ): Promise<ProcessResult> {
    const localArgs = args.map((arg) => {
      if (!arg.startsWith('https://jsr.io/@netscript/plugin-')) return arg;
      const kind = packageKind(arg);
      return new URL(`plugins/${kind}/src/cli/generate-runtime-registries.ts`, REPOSITORY_ROOT).href;
    });
    return this.process.exec(command, localArgs, options);
  }
}

async function writeProject(projectRoot: string): Promise<void> {
  const rootConfig = JSON.parse(await Deno.readTextFile(new URL('deno.json', REPOSITORY_ROOT))) as {
    imports: Record<string, string>;
  };
  await Deno.writeTextFile(
    join(projectRoot, 'deno.json'),
    `${JSON.stringify({
      imports: {
        ...rootConfig.imports,
        '@netscript/plugin/cli': new URL(
          'packages/plugin/src/cli/mod.ts',
          REPOSITORY_ROOT,
        ).href,
      },
    })}\n`,
  );
  await Deno.writeTextFile(
    join(projectRoot, 'appsettings.json'),
    `${JSON.stringify({
      NetScript: {
        Plugins: {
          workers: { Entrypoint: netscriptJsrSpecifier('plugin-workers', '/services') },
          sagas: { Entrypoint: netscriptJsrSpecifier('plugin-sagas', '/services') },
          triggers: { Entrypoint: netscriptJsrSpecifier('plugin-triggers', '/services') },
        },
      },
    })}\n`,
  );
  await write(join(projectRoot, 'workers/jobs/health-check.ts'), 'export default { id: "health-check" };\n');
  await write(
    join(projectRoot, 'sagas/user-registration-saga.ts'),
    'export default defineSaga("user-registration").build();\n',
  );
  await write(join(projectRoot, 'triggers/generic.ts'), 'export default { id: "generic" };\n');
}

async function write(path: string, text: string): Promise<void> {
  await Deno.mkdir(dirname(path), { recursive: true });
  await Deno.writeTextFile(path, text);
}

async function assertRegistry(
  projectRoot: string,
  path: string,
  sourcePath: string,
  exportShape: string,
): Promise<void> {
  const source = await Deno.readTextFile(join(projectRoot, path));
  assert(source.trim().length > 0, `${path} must be non-empty`);
  assertStringIncludes(source, sourcePath);
  assertStringIncludes(source, exportShape);
}

function packageKind(url: string): string {
  const match = /\/plugin-([^/@]+)(?:@|\/)/.exec(url);
  if (!match) throw new Error(`Cannot resolve official plugin kind from test URL: ${url}`);
  return match[1];
}
