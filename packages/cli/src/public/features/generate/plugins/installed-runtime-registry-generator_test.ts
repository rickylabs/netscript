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
      '/workspace/app/appsettings.json': appsettings('custom-api', 'jsr:@acme/plugin-custom@1.2.3/services'),
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
      plugin: 'custom-api',
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
    assertEquals(await fs.exists('/workspace/app/.netscript/.runtime-manifests/plugin-custom.json'), false);
  });

  it('names the installed plugin and rejects a declared empty runtime', async () => {
    const fs = new MemoryFileSystem({
      '/workspace/app/appsettings.json': appsettings('empty-api', 'jsr:@acme/plugin-empty@1.0.0/services'),
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
      'empty-api',
    );
    assertEquals(error.plugin, 'empty-api');
  });

  it('dry-run reports canonical paths without executing or writing', async () => {
    const fs = new MemoryFileSystem({
      '/workspace/app/appsettings.json': appsettings('custom-api', 'jsr:@acme/plugin-custom@1.2.3/services'),
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
    assertEquals(process.calls, []);
    assertEquals(await fs.exists(result[0].path), false);
  });
});

function appsettings(name: string, entrypoint: string): string {
  return JSON.stringify({ NetScript: { Plugins: { [name]: { Entrypoint: entrypoint } } } });
}

function runtimeManifest(name: string): unknown {
  return {
    runtimeRegistryGenerator: {
      command: 'src/cli/generate-runtime-registries.ts',
      args: ['--profile', 'scaffold'],
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

  constructor(private readonly fs: MemoryFileSystem) {}

  async exec(
    command: string,
    args: readonly string[],
    options?: { readonly cwd?: string; readonly env?: Readonly<Record<string, string>> },
  ): Promise<ProcessResult> {
    this.calls.push({ command, args, options });
    const manifestIndex = args.indexOf('--manifest');
    const manifest = JSON.parse(await this.fs.readFile(args[manifestIndex + 1])) as {
      runtimeRegistries: Array<{ registryPath: string }>;
    };
    for (const target of manifest.runtimeRegistries) {
      await this.fs.writeFile(`${options?.cwd}/${target.registryPath}`, 'import item from "../../custom/item.ts";');
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
    return Promise.resolve(this.files.has(path) || [...this.files].some(([file]) => file.startsWith(`${path}/`)));
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
