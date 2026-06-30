import type { FileSystemPort } from '../ports/mod.ts';
import type { PluginLogger } from '../domain/mod.ts';
import type { NetScriptPlugin, PluginCommandContext } from './contract.ts';
import { textArtifact } from './item/artifact.ts';

/** In-memory file system used by adapter unit tests. */
export class MemoryFileSystem implements FileSystemPort {
  readonly files: Map<string, string> = new Map();

  readText(path: string): Promise<string> {
    const text = this.files.get(path);
    if (text === undefined) {
      throw new Deno.errors.NotFound(path);
    }
    return Promise.resolve(text);
  }

  writeText(path: string, text: string): Promise<void> {
    this.files.set(path, text);
    return Promise.resolve();
  }

  exists(path: string): Promise<boolean> {
    return Promise.resolve(this.files.has(path));
  }
}

/** No-op logger used by scaffold protocol tests. */
export const testLogger: PluginLogger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

/** Create a minimal plugin contract for adapter tests. */
export function createTestPlugin(): NetScriptPlugin {
  return {
    name: '@example/plugin-workers',
    kind: 'workers',
    displayName: 'Workers',
    install: {
      dependencySpecifier: 'jsr:@example/plugin-workers@^1',
      starterResources: [{
        scaffolder: {
          name: 'job',
          emit: (input: { readonly id: string }) => [
            textArtifact(`src/jobs/${input.id}.ts`, `export const id = "${input.id}";`),
          ],
        },
        input: { id: 'starter' },
      }],
    },
    doctor: { requiredConfigKeys: ['DATABASE_URL'] },
    info: { capabilities: ['jobs'], version: '1.0.0', versionSource: 'static' },
    resources: [{
      name: 'job',
      scaffolder: {
        name: 'job',
        emit: (input: { readonly id: string }) => [
          textArtifact(`src/jobs/${input.id}.ts`, `export const id = "${input.id}";`),
        ],
      },
      parseInput: (args) => ({ id: args.values?.[1] ?? 'resource' }),
    }],
    commands: [{
      verb: 'logs',
      description: 'Show logs.',
      run: () => ({ code: 0, message: 'logs' }),
    }],
  };
}

/** Create a command context for adapter tests. */
export function createTestContext(fileSystem: FileSystemPort): PluginCommandContext {
  return {
    workspaceRoot: '/workspace',
    options: {},
    config: { DATABASE_URL: 'postgres://example' },
    dryRun: false,
    fileSystem,
  };
}
