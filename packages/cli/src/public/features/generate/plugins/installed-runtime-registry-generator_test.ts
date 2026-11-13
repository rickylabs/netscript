import { assertEquals, assertRejects } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import { join, toFileUrl } from '@std/path';

import type { DirEntry, FileInfo, WalkEntry } from '../../../../kernel/domain/core-types.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { ProcessPort, ProcessResult } from '../../../../kernel/ports/process-port.ts';
import { createInstalledRuntimeRegistryGenerator } from './installed-runtime-registry-generator.ts';

describe('installed runtime registry generator', () => {
  for (const entrypoint of ['./plugins/custom/services/main.ts', './showcase/host.ts']) {
    for (
      const source of [
        './plugins/custom',
        'workspace:plugins/custom',
        'local:./plugins/custom',
        'file:///workspace/app/plugins/custom/',
      ]
    ) {
      it(`resolves installed package directory ${source} for ${entrypoint}`, async () => {
        const fs = new MemoryFileSystem({
          '/workspace/app/appsettings.json': JSON.stringify({
            NetScript: { Plugins: { custom: { Entrypoint: entrypoint, InstalledFrom: source } } },
          }),
          '/workspace/app/deno.json': JSON.stringify({
            name: '@app/consumer',
            version: '0.0.0',
            workspace: ['./plugins/custom'],
          }),
          '/workspace/app/plugins/custom/deno.json': JSON.stringify({
            name: '@acme/plugin-custom',
            version: '1.2.3',
          }),
          '/workspace/app/plugins/custom/scaffold.runtime.json': JSON.stringify(
            runtimeManifest('custom'),
          ),
          '/workspace/app/plugins/custom/services/main.ts': 'export {};',
          '/workspace/app/custom/item.ts': 'export const item = {};',
        });
        const generate = createInstalledRuntimeRegistryGenerator({
          fs,
          process: new RecordingProcess(fs),
          fetchManifest: () => {
            throw new Error(
              'Must resolve the declared local package, never the consumer or registry',
            );
          },
        });
        const result = await generate({ dryRun: false, projectRoot: '/workspace/app' });
        assertEquals(result[0].plugin, '@acme/plugin-custom');
      });
    }
  }

  it('keeps installed package authority when an app owns the service entrypoint', async () => {
    const fs = new MemoryFileSystem({
      '/workspace/app/appsettings.json': JSON.stringify({
        NetScript: {
          Plugins: {
            custom: {
              Entrypoint: './showcase/host.ts',
              InstalledFrom: 'jsr:@acme/plugin-custom@1.2.3/services',
            },
          },
        },
      }),
      '/workspace/app/deno.json': JSON.stringify({ name: '@app/root', version: '0.0.0' }),
      '/workspace/app/custom/item.ts': 'export const item = {};',
    });
    const requested: string[] = [];
    const generate = createInstalledRuntimeRegistryGenerator({
      fs,
      process: new RecordingProcess(fs),
      fetchManifest: (url) => {
        requested.push(url);
        return Promise.resolve(jsonResponse(runtimeManifest('custom')));
      },
    });
    const result = await generate({ dryRun: false, projectRoot: '/workspace/app' });
    assertEquals(result[0].plugin, '@acme/plugin-custom');
    assertEquals(requested[0], 'https://jsr.io/@acme/plugin-custom/1.2.3/scaffold.runtime.json');
  });

  it('finds the local installed package behind an app-owned service wrapper', async () => {
    const fs = new MemoryFileSystem({
      '/workspace/app/appsettings.json': JSON.stringify({
        NetScript: {
          Plugins: {
            custom: {
              Entrypoint: './showcase/host.ts',
              InstalledFrom: '/workspace/source/plugins/custom/services/main.ts',
            },
          },
        },
      }),
      '/workspace/app/deno.json': JSON.stringify({
        name: '@app/root',
        version: '0.0.0',
        imports: { '@acme/plugin-custom': '../source/plugins/custom/mod.ts' },
      }),
      '/workspace/source/plugins/custom/deno.json': JSON.stringify({
        name: '@acme/plugin-custom',
        version: '1.2.3',
      }),
      '/workspace/source/plugins/custom/scaffold.runtime.json': JSON.stringify(
        runtimeManifest('custom'),
      ),
      '/workspace/app/custom/item.ts': 'export const item = {};',
    });
    const generate = createInstalledRuntimeRegistryGenerator({
      fs,
      process: new RecordingProcess(fs),
      fetchManifest: () => {
        throw new Error('Local package must not fall back to the registry');
      },
    });
    const result = await generate({ dryRun: false, projectRoot: '/workspace/app' });
    assertEquals(result[0].plugin, '@acme/plugin-custom');
  });

  it('runs a published manifest generator under the project config and canonical target', async () => {
    const fs = new MemoryFileSystem({
      '/workspace/app/appsettings.json': appsettings(
        'custom-api',
        'jsr:@acme/plugin-custom@1.2.3/services',
      ),
      '/workspace/app/deno.json': '{}',
      '/workspace/app/custom/item.ts': 'export const item = {};',
    });
    const process = new RecordingProcess(fs);
    const generate = createInstalledRuntimeRegistryGenerator({
      fs,
      process,
      fetchManifest: () => Promise.resolve(jsonResponse(runtimeManifest('custom'))),
    });

    const result = await generate({ dryRun: false, projectRoot: '/workspace/app' });

    assertEquals(result, [{
      path: '.netscript/generated/plugin-custom/custom.registry.ts',
      plugin: '@acme/plugin-custom',
      registrableItems: 1,
    }]);
    assertEquals(process.calls.length, 1);
    assertEquals(process.calls[0].options, { cwd: '/workspace/app' });
    assertEquals(process.calls[0].args.slice(0, 4), [
      'run',
      '--config',
      '/workspace/app/deno.json',
      '--allow-read',
    ]);
    assertEquals(
      process.calls[0].args.includes(
        'https://jsr.io/@acme/plugin-custom/1.2.3/src/cli/generate-runtime-registries.ts',
      ),
      true,
    );
    assertEquals(
      await fs.exists('/workspace/app/.netscript/.runtime-manifests/plugin-custom.json'),
      false,
    );
  });

  it('runs the declared generator and reports zero items for an empty runtime', async () => {
    const fs = new MemoryFileSystem({
      '/workspace/app/appsettings.json': appsettings(
        'empty-api',
        'jsr:@acme/plugin-empty@1.0.0/services',
      ),
      '/workspace/app/deno.json': '{}',
    });
    const generate = createInstalledRuntimeRegistryGenerator({
      fs,
      process: new RecordingProcess(fs),
      fetchManifest: () => Promise.resolve(jsonResponse(runtimeManifest('empty'))),
    });

    assertEquals(await generate({ dryRun: false, projectRoot: '/workspace/app' }), [{
      path: '.netscript/generated/plugin-empty/empty.registry.ts',
      plugin: '@acme/plugin-empty',
      registrableItems: 0,
    }]);
  });

  it('dry-run reports canonical paths without executing or writing', async () => {
    const fs = new MemoryFileSystem({
      '/workspace/app/appsettings.json': appsettings(
        'custom-api',
        'jsr:@acme/plugin-custom@1.2.3/services',
      ),
      '/workspace/app/custom/item.ts': 'export const item = {};',
    });
    const process = new RecordingProcess(fs);
    const generate = createInstalledRuntimeRegistryGenerator({
      fs,
      process,
      fetchManifest: () => Promise.resolve(jsonResponse(runtimeManifest('custom'))),
    });

    const result = await generate({ dryRun: true, projectRoot: '/workspace/app' });

    assertEquals(result.length, 1);
    assertEquals(result[0].sourceAuthority, 'manifest');
    assertEquals(process.calls, []);
    assertEquals(await fs.exists(result[0].path), false);
  });

  it('uses an advertised generator report without granting writes or changing files', async () => {
    const fs = new MemoryFileSystem({
      '/workspace/app/appsettings.json': appsettings(
        'custom-api',
        'jsr:@acme/plugin-custom@1.2.3/services',
      ),
      '/workspace/app/deno.json': '{}',
      '/workspace/app/custom/item.ts': 'export const item = {};',
    });
    const before = new Map(fs.files);
    const process = new RecordingProcess(fs);
    const generate = createInstalledRuntimeRegistryGenerator({
      fs,
      process,
      fetchManifest: () => Promise.resolve(jsonResponse(runtimeManifest('custom', 1))),
    });

    const result = await generate({ dryRun: true, projectRoot: '/workspace/app' });

    assertEquals(result, [{
      path: '.netscript/generated/plugin-custom/custom.registry.ts',
      plugin: '@acme/plugin-custom',
      registrableItems: 1,
      sourceAuthority: 'generator',
      sourceFiles: ['custom/item.ts'],
    }]);
    assertEquals(fs.files, before);
    assertEquals(process.calls.length, 1);
    const args = process.calls[0].args;
    assertEquals(args.includes('--allow-write'), false);
    assertEquals(args.includes('--manifest'), false);
    assertEquals(args.slice(args.indexOf('--inspect')), [
      '--inspect',
      '--inspection-protocol',
      '1',
      '--manifest-json',
      args[args.indexOf('--manifest-json') + 1],
    ]);
  });

  it('fails closed when an advertised protocol is invalid or its process fails', async () => {
    const fs = new MemoryFileSystem({
      '/workspace/app/appsettings.json': appsettings(
        'custom-api',
        'jsr:@acme/plugin-custom@1.2.3/services',
      ),
      '/workspace/app/deno.json': '{}',
      '/workspace/app/custom/item.ts': 'export const item = {};',
    });
    const invalidProcess = new RecordingProcess(fs);
    const invalidGenerate = createInstalledRuntimeRegistryGenerator({
      fs,
      process: invalidProcess,
      fetchManifest: () => Promise.resolve(jsonResponse(runtimeManifest('custom', 3))),
    });
    await assertRejects(
      () => invalidGenerate({ dryRun: true, projectRoot: '/workspace/app' }),
      Error,
      'manifest inspectionProtocol must be the integer 1',
    );
    assertEquals(invalidProcess.calls, []);

    const failedGenerate = createInstalledRuntimeRegistryGenerator({
      fs,
      process: new RecordingProcess(fs, { code: 7, stdout: '', stderr: 'selection failed' }),
      fetchManifest: () => Promise.resolve(jsonResponse(runtimeManifest('custom', 1))),
    });
    await assertRejects(
      () => failedGenerate({ dryRun: true, projectRoot: '/workspace/app' }),
      Error,
      'Generator inspection protocol 1 failed for @acme/plugin-custom: generator exited 7: selection failed',
    );

    const malformedGenerate = createInstalledRuntimeRegistryGenerator({
      fs,
      process: new RecordingProcess(fs, { code: 0, stdout: 'progress\n{}', stderr: '' }),
      fetchManifest: () => Promise.resolve(jsonResponse(runtimeManifest('custom', 1))),
    });
    await assertRejects(
      () => malformedGenerate({ dryRun: true, projectRoot: '/workspace/app' }),
      Error,
      'stdout is not one protocol 1 JSON document',
    );
  });

  it('fails closed when a declared protocol has an omitted or malformed command, and falls back when no protocol is declared', async () => {
    const fs = new MemoryFileSystem({
      '/workspace/app/appsettings.json': appsettings(
        'custom-api',
        'jsr:@acme/plugin-custom@1.2.3/services',
      ),
      '/workspace/app/deno.json': '{}',
      '/workspace/app/custom/item.ts': 'export const item = {};',
    });

    const declaredButOmittedCommand = {
      runtimeRegistryGenerator: { inspectionProtocol: 1 },
      runtimeRegistries: [{
        kind: 'map',
        dir: 'custom',
        registryPath: '.netscript/generated/plugin-custom/custom.registry.ts',
        fileSuffixes: ['.ts'],
        exclude: ['mod.ts'],
      }],
    };
    const declaredButNonStringCommand = {
      runtimeRegistryGenerator: { command: 42, inspectionProtocol: 1 },
      runtimeRegistries: declaredButOmittedCommand.runtimeRegistries,
    };
    for (const manifest of [declaredButOmittedCommand, declaredButNonStringCommand]) {
      const process = new RecordingProcess(fs);
      const generate = createInstalledRuntimeRegistryGenerator({
        fs,
        process,
        fetchManifest: () => Promise.resolve(jsonResponse(manifest)),
      });
      await assertRejects(
        () => generate({ dryRun: true, projectRoot: '/workspace/app' }),
        Error,
        'Generator inspection protocol 1 failed for @acme/plugin-custom: manifest declares inspectionProtocol but omits or malforms command',
      );
      assertEquals(process.calls, []);
    }

    const legacyProcess = new RecordingProcess(fs);
    const legacyGenerate = createInstalledRuntimeRegistryGenerator({
      fs,
      process: legacyProcess,
      fetchManifest: () => Promise.resolve(jsonResponse(runtimeManifest('custom'))),
    });
    const legacyResult = await legacyGenerate({ dryRun: true, projectRoot: '/workspace/app' });
    assertEquals(legacyResult, [{
      path: '.netscript/generated/plugin-custom/custom.registry.ts',
      plugin: '@acme/plugin-custom',
      registrableItems: 1,
      sourceAuthority: 'manifest',
      sourceFiles: ['custom/item.ts'],
    }]);
    assertEquals(legacyProcess.calls, []);
  });

  it('fails closed with the stable protocol-failure prefix when the generator process itself fails to start', async () => {
    const fs = new MemoryFileSystem({
      '/workspace/app/appsettings.json': appsettings(
        'custom-api',
        'jsr:@acme/plugin-custom@1.2.3/services',
      ),
      '/workspace/app/deno.json': '{}',
      '/workspace/app/custom/item.ts': 'export const item = {};',
    });
    const throwingProcess: ProcessPort = {
      exec() {
        throw new Error('spawn deno ENOENT');
      },
    };
    const generate = createInstalledRuntimeRegistryGenerator({
      fs,
      process: throwingProcess,
      fetchManifest: () => Promise.resolve(jsonResponse(runtimeManifest('custom', 1))),
    });
    await assertRejects(
      () => generate({ dryRun: true, projectRoot: '/workspace/app' }),
      Error,
      'Generator inspection protocol 1 failed for @acme/plugin-custom: generator process failed to start: spawn deno ENOENT',
    );
  });

  it('rejects invalid report targets, source paths, duplicates, and source files', async () => {
    const cases: ReadonlyArray<{ readonly report: unknown; readonly message: string }> = [
      {
        report: { inspectionProtocol: 2, registries: [] },
        message: 'inspectionProtocol must equal 1',
      },
      {
        report: { inspectionProtocol: 1, registries: [], extra: true },
        message: 'document must contain exactly inspectionProtocol, registries',
      },
      {
        report: { inspectionProtocol: 1, registries: [] },
        message: 'response omitted declared registry path',
      },
      {
        report: {
          inspectionProtocol: 1,
          registries: [{ registryPath: 'unknown.registry.ts', sourceFiles: [] }],
        },
        message: 'response declared unknown registry path',
      },
      {
        report: {
          inspectionProtocol: 1,
          registries: [
            {
              registryPath: '.netscript/generated/plugin-custom/custom.registry.ts',
              sourceFiles: ['custom/item.ts'],
            },
            {
              registryPath: '.netscript/generated/plugin-custom/custom.registry.ts',
              sourceFiles: ['custom/item.ts'],
            },
          ],
        },
        message: 'response duplicated registry path',
      },
      {
        report: {
          inspectionProtocol: 1,
          registries: [{
            registryPath: '.netscript/generated/plugin-custom/custom.registry.ts',
            sourceFiles: ['../escape.ts'],
          }],
        },
        message: 'response source path is invalid',
      },
      {
        report: {
          inspectionProtocol: 1,
          registries: [{
            registryPath: '.netscript/generated/plugin-custom/custom.registry.ts',
            sourceFiles: ['custom/item.ts', 'custom/item.ts'],
          }],
        },
        message: 'response duplicated source',
      },
      {
        report: {
          inspectionProtocol: 1,
          registries: [{
            registryPath: '.netscript/generated/plugin-custom/custom.registry.ts',
            sourceFiles: ['custom/missing.ts'],
          }],
        },
        message: 'response source is not a regular project file',
      },
    ];

    for (const testCase of cases) {
      const fs = new MemoryFileSystem({
        '/workspace/app/appsettings.json': appsettings(
          'custom-api',
          'jsr:@acme/plugin-custom@1.2.3/services',
        ),
        '/workspace/app/deno.json': '{}',
        '/workspace/app/custom/item.ts': 'export const item = {};',
      });
      const generate = createInstalledRuntimeRegistryGenerator({
        fs,
        process: new RecordingProcess(fs, {
          code: 0,
          stdout: JSON.stringify(testCase.report),
          stderr: '',
        }),
        fetchManifest: () => Promise.resolve(jsonResponse(runtimeManifest('custom', 1))),
      });
      await assertRejects(
        () => generate({ dryRun: true, projectRoot: '/workspace/app' }),
        Error,
        testCase.message,
      );
    }
  });

  it('reports an empty protocol 1 selection without substituting manifest candidates', async () => {
    const fs = new MemoryFileSystem({
      '/workspace/app/appsettings.json': appsettings(
        'custom-api',
        'jsr:@acme/plugin-custom@1.2.3/services',
      ),
      '/workspace/app/deno.json': '{}',
      '/workspace/app/custom/item.ts': 'export const item = {};',
    });
    const generate = createInstalledRuntimeRegistryGenerator({
      fs,
      process: new RecordingProcess(fs, {
        code: 0,
        stdout: JSON.stringify({
          inspectionProtocol: 1,
          registries: [{
            registryPath: '.netscript/generated/plugin-custom/custom.registry.ts',
            sourceFiles: [],
          }],
        }),
        stderr: '',
      }),
      fetchManifest: () => Promise.resolve(jsonResponse(runtimeManifest('custom', 1))),
    });

    assertEquals(await generate({ dryRun: true, projectRoot: '/workspace/app' }), [{
      path: '.netscript/generated/plugin-custom/custom.registry.ts',
      plugin: '@acme/plugin-custom',
      registrableItems: 0,
      sourceAuthority: 'generator',
      sourceFiles: [],
    }]);
  });

  it('does not substitute an unrelated marked source package for a third-party plugin', async () => {
    const fs = new MemoryFileSystem({
      '/workspace/app/appsettings.json': appsettings(
        'custom-api',
        'jsr:@acme/plugin-custom@1.2.3/services',
      ),
      '/workspace/app/deno.json': '{}',
      '/workspace/app/.netscript-source-root': '/source',
      '/workspace/app/custom/item.ts': 'export const item = {};',
      '/source/deno.json': JSON.stringify({ workspace: ['plugins/official'] }),
      '/source/plugins/official/deno.json': JSON.stringify({ name: '@netscript/plugin-official' }),
      '/source/plugins/official/scaffold.runtime.json': JSON.stringify(runtimeManifest('official')),
    });
    let fetchCalls = 0;
    const generate = createInstalledRuntimeRegistryGenerator({
      fs,
      process: new RecordingProcess(fs),
      fetchManifest: () => {
        fetchCalls++;
        return Promise.resolve(jsonResponse(runtimeManifest('custom')));
      },
    });

    await generate({ dryRun: false, projectRoot: '/workspace/app' });

    assertEquals(fetchCalls, 1);
  });
});

Deno.test('normal generation prepares configured module graphs; dry-run never evaluates config', async () => {
  const root = Deno.cwd();
  const fs = new MemoryFileSystem({
    [join(root, 'appsettings.json')]: '{}',
    [join(root, 'deno.json')]: '{}',
    [join(root, 'netscript.config.ts')]: 'export default {};',
  });
  const calls: string[][] = [];
  const process: ProcessPort = {
    exec(_command, args) {
      calls.push([...args]);
      return Promise.resolve({
        code: 0,
        stderr: '',
        stdout: args[0] === 'cache' ? '' : JSON.stringify({ plugins: ['./plugin.ts'] }),
      });
    },
  };
  const generate = createInstalledRuntimeRegistryGenerator({
    fs,
    process,
    fetchManifest: () => Promise.resolve(jsonResponse({})),
  });
  await generate({ projectRoot: root, dryRun: true });
  assertEquals(calls, []);
  await generate({ projectRoot: root, dryRun: false });
  assertEquals(calls.length, 2);
  assertEquals(calls[1][0], 'cache');
  assertEquals(calls[1].includes('--'), false);
  assertEquals(calls[1].at(-1), toFileUrl(join(root, 'plugin.ts')).href);
});

for (const filename of ['netscript.config.ts', 'netscript.config.js', 'netscript.config.mjs']) {
  Deno.test(`graph preparation handles ${filename}, aliases, empty lists and failures`, async () => {
    const root = Deno.cwd();
    const fs = new MemoryFileSystem({
      [join(root, filename)]: '',
      [join(root, 'deno.json')]: '{}',
      [join(root, 'appsettings.json')]: '{}',
    });
    for (
      const scenario of [
        'alias',
        'empty',
        'invalid',
        'config-timeout',
        'resolve-timeout',
        'cache-timeout',
        'cache-error',
        'malformed',
      ]
    ) {
      const stages: string[] = [];
      const process: ProcessPort = {
        exec(_command, args, options) {
          const stage = args[0] === 'cache' ? 'cache' : args.at(-1) === '-' ? 'resolve' : 'config';
          stages.push(stage);
          assertEquals(options?.timeoutMs, stage === 'cache' ? 60_000 : 30_000);
          assertEquals(options?.maxOutputBytes, 1024 * 1024);
          if (scenario === `${stage}-timeout`) {
            return Promise.resolve({ code: 0, timedOut: true, stdout: '{}', stderr: '' });
          }
          if (scenario === 'cache-error' && stage === 'cache') {
            return Promise.resolve({ code: 1, stdout: '', stderr: 'cache failed' });
          }
          return Promise.resolve({
            code: 0,
            stderr: '',
            stdout: stage === 'config'
              ? JSON.stringify({
                plugins: scenario === 'empty'
                  ? []
                  : scenario === 'invalid'
                  ? ['--reload']
                  : ['alias/subpath'],
              })
              : scenario === 'malformed'
              ? 'null'
              : '["jsr:@fixture/plugin@1.0.0/subpath"]',
          });
        },
      };
      const generate = createInstalledRuntimeRegistryGenerator({
        fs,
        process,
        fetchManifest: () => Promise.resolve(jsonResponse({})),
      });
      if (scenario === 'alias' || scenario === 'empty') {
        await generate({ projectRoot: root, dryRun: false });
        assertEquals(stages, scenario === 'empty' ? ['config'] : ['config', 'resolve', 'cache']);
      } else {
        await assertRejects(() => generate({ projectRoot: root, dryRun: false }));
        if (scenario === 'invalid' || scenario === 'config-timeout') {
          assertEquals(stages, ['config']);
        }
      }
    }
  });
}

function appsettings(name: string, entrypoint: string): string {
  return JSON.stringify({ NetScript: { Plugins: { [name]: { Entrypoint: entrypoint } } } });
}

function runtimeManifest(name: string, inspectionProtocol?: unknown): unknown {
  return {
    runtimeRegistryGenerator: {
      command: 'src/cli/generate-runtime-registries.ts',
      args: ['--profile', 'scaffold'],
      ...(inspectionProtocol === undefined ? {} : { inspectionProtocol }),
    },
    runtimeRegistries: [{
      kind: 'map',
      dir: name,
      registryPath: `.netscript/generated/plugin-${name}/${name}.registry.ts`,
      fileSuffixes: ['.ts'],
      exclude: ['mod.ts'],
    }],
  };
}

function jsonResponse(value: unknown): { ok: true; status: 200; json(): Promise<unknown> } {
  return { ok: true, status: 200, json: () => Promise.resolve(value) };
}

class RecordingProcess implements ProcessPort {
  readonly calls: Array<{
    command: string;
    args: readonly string[];
    options?: { readonly cwd?: string; readonly env?: Readonly<Record<string, string>> };
  }> = [];

  constructor(
    private readonly fs: MemoryFileSystem,
    private readonly inspectionResult?: ProcessResult,
  ) {}

  async exec(
    command: string,
    args: readonly string[],
    options?: { readonly cwd?: string; readonly env?: Readonly<Record<string, string>> },
  ): Promise<ProcessResult> {
    this.calls.push({ command, args, options });
    if (args.includes('--inspect')) {
      if (this.inspectionResult) return Promise.resolve(this.inspectionResult);
      const manifest = JSON.parse(args[args.indexOf('--manifest-json') + 1]) as {
        runtimeRegistries: Array<{ dir: string; registryPath: string }>;
      };
      return Promise.resolve({
        code: 0,
        stdout: JSON.stringify({
          inspectionProtocol: 1,
          registries: manifest.runtimeRegistries.map((target) => ({
            registryPath: target.registryPath,
            sourceFiles: [`${target.dir}/item.ts`],
          })),
        }),
        stderr: '',
      });
    }
    const manifestIndex = args.indexOf('--manifest');
    const manifest = JSON.parse(await this.fs.readFile(args[manifestIndex + 1])) as {
      runtimeRegistries: Array<{ registryPath: string }>;
    };
    for (const target of manifest.runtimeRegistries) {
      await this.fs.writeFile(
        `${options?.cwd}/${target.registryPath}`,
        'import item from "../../custom/item.ts";',
      );
    }
    return { code: 0, stdout: '', stderr: '' };
  }
}

class MemoryFileSystem implements FileSystemPort {
  readonly files: Map<string, string>;

  constructor(files: Readonly<Record<string, string>>) {
    this.files = new Map(Object.entries(files));
  }

  readFile(path: string): Promise<string> {
    const value = this.files.get(path);
    if (value === undefined) return Promise.reject(new Deno.errors.NotFound(path));
    return Promise.resolve(value);
  }

  writeFile(path: string, content: string): Promise<void> {
    this.files.set(path, content);
    return Promise.resolve();
  }

  exists(path: string): Promise<boolean> {
    return Promise.resolve(
      this.files.has(path) || [...this.files].some(([file]) => file.startsWith(`${path}/`)),
    );
  }

  stat(path: string): Promise<FileInfo> {
    return Promise.resolve({ isFile: this.files.has(path), isDirectory: !this.files.has(path) });
  }

  createDir(_path: string): Promise<void> {
    return Promise.resolve();
  }

  readDir(path: string): Promise<DirEntry[]> {
    const prefix = `${path}/`;
    const entries = [...this.files.keys()]
      .filter((file) => file.startsWith(prefix) && !file.slice(prefix.length).includes('/'))
      .map((file) => ({ name: file.slice(prefix.length), isFile: true, isDirectory: false }));
    return Promise.resolve(entries);
  }

  remove(path: string): Promise<void> {
    this.files.delete(path);
    for (const file of [...this.files.keys()]) {
      if (file.startsWith(`${path}/`)) this.files.delete(file);
    }
    return Promise.resolve();
  }

  copy(src: string, dest: string): Promise<void> {
    return this.readFile(src).then((content) => this.writeFile(dest, content));
  }

  async *walk(_dir: string): AsyncIterable<WalkEntry> {}
}

for (const status of [404, 503]) {
  Deno.test(`published runtime manifest HTTP ${status} only permits immutable 404 absence`, async () => {
    const fs = new MemoryFileSystem({
      '/workspace/app/appsettings.json': appsettings(
        'custom',
        'jsr:@acme/plugin-custom@1.2.3/runtime',
      ),
      '/workspace/app/deno.json': '{}',
    });
    const process = new RecordingProcess(fs);
    const generate = createInstalledRuntimeRegistryGenerator({
      fs,
      process,
      fetchManifest: () =>
        Promise.resolve({
          ok: false,
          status,
          json: () => Promise.reject(new Error('must not decode missing manifest')),
        }),
    });
    if (status === 404) {
      assertEquals(await generate({ projectRoot: '/workspace/app', dryRun: false }), []);
    } else {await assertRejects(
        () => generate({ projectRoot: '/workspace/app', dryRun: false }),
        Error,
        'HTTP 503',
      );}
    assertEquals(process.calls, []);
  });
}

Deno.test('published runtime manifest 404 does not certify a mutable version range', async () => {
  const fs = new MemoryFileSystem({
    '/workspace/app/appsettings.json': appsettings(
      'custom',
      'jsr:@acme/plugin-custom@^1.2.3/runtime',
    ),
    '/workspace/app/deno.json': '{}',
  });
  const generate = createInstalledRuntimeRegistryGenerator({
    fs,
    process: new RecordingProcess(fs),
    fetchManifest: () =>
      Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) }),
  });
  await assertRejects(
    () => generate({ projectRoot: '/workspace/app', dryRun: false }),
    Error,
    'HTTP 404',
  );
});
