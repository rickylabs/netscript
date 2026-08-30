import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import { describe, it } from 'jsr:@std/testing@^1/bdd';

import type { DirEntry, FileInfo, WalkEntry } from '../../../../kernel/domain/core-types.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { ProcessPort, ProcessResult } from '../../../../kernel/ports/process-port.ts';
import { EmptyPluginRegistryError } from './generate-installed-plugin-registries.ts';
import { createInstalledRuntimeRegistryGenerator } from './installed-runtime-registry-generator.ts';

describe('installed runtime registry generator', () => {
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

  it('names the installed plugin and rejects a declared empty runtime', async () => {
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

    const error = await assertRejects(
      () => generate({ dryRun: false, projectRoot: '/workspace/app' }),
      EmptyPluginRegistryError,
      '@acme/plugin-empty',
    );
    assertEquals(error.plugin, '@acme/plugin-empty');
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
      fetchManifest: () => Promise.resolve(jsonResponse(runtimeManifest('custom', 2))),
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

  it('preserves EmptyPluginRegistryError when an advertised report selects nothing', async () => {
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

    await assertRejects(
      () => generate({ dryRun: true, projectRoot: '/workspace/app' }),
      EmptyPluginRegistryError,
      '@acme/plugin-custom',
    );
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
