import { ensureDir } from '@std/fs';
import { basename, dirname, join } from '@std/path';

import type {
  RuntimeConfigStorePort,
  RuntimeOverridePointer,
  RuntimeOverrideTopic,
} from '../../../ports/runtime-config-store-port.ts';

const CURRENT_POINTER = 'current';

/** Deno filesystem adapter for versioned runtime overrides. */
export class DenoRuntimeConfigStore implements RuntimeConfigStorePort {
  constructor(private readonly root: () => string) {}

  /** Create a store from the runtime-config environment override or project root. */
  static fromEnvironment(projectRoot: string): DenoRuntimeConfigStore {
    return new DenoRuntimeConfigStore(() =>
      Deno.env.get('NETSCRIPT_RUNTIME_CONFIG_DIR') ?? join(projectRoot, 'runtime')
    );
  }

  async readPointer(): Promise<RuntimeOverridePointer> {
    try {
      const text = (await Deno.readTextFile(join(this.root(), CURRENT_POINTER))).trim();
      if (!text) return {};
      const parsed = JSON.parse(text) as unknown;
      return isPointer(parsed) ? parsed : {};
    } catch (error) {
      if (error instanceof Deno.errors.NotFound || error instanceof SyntaxError) return {};
      throw error;
    }
  }

  async activate(pointer: RuntimeOverridePointer): Promise<void> {
    const path = join(this.root(), CURRENT_POINTER);
    await ensureDir(dirname(path));
    const temporary = `${path}.${crypto.randomUUID()}.tmp`;
    try {
      await Deno.writeTextFile(temporary, `${JSON.stringify(pointer, null, 2)}\n`);
      await Deno.rename(temporary, path);
    } catch (error) {
      await Deno.remove(temporary).catch(() => undefined);
      throw error;
    }
  }

  async read(topic: RuntimeOverrideTopic, version: string): Promise<unknown> {
    return JSON.parse(await Deno.readTextFile(this.path(topic, version))) as unknown;
  }

  async write(topic: RuntimeOverrideTopic, version: string, value: unknown): Promise<void> {
    const path = this.path(topic, version);
    await ensureDir(dirname(path));
    await Deno.writeTextFile(path, `${JSON.stringify(value, null, 2)}\n`);
  }

  async versions(topic: RuntimeOverrideTopic): Promise<readonly string[]> {
    const path = join(this.root(), topic);
    try {
      const versions: string[] = [];
      for await (const entry of Deno.readDir(path)) {
        if (entry.isFile && entry.name.endsWith('.json')) {
          versions.push(entry.name.slice(0, -'.json'.length).replace(/^v/, ''));
        }
      }
      return versions.sort();
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) return [];
      throw error;
    }
  }

  private path(topic: RuntimeOverrideTopic, version: string): string {
    const safeVersion = basename(version).replace(/^v/, '').replace(/\.json$/, '');
    return join(this.root(), topic, `v${safeVersion}.json`);
  }
}

function isPointer(value: unknown): value is RuntimeOverridePointer {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.values(value as Record<string, unknown>).every((entry) =>
    entry === undefined || typeof entry === 'string'
  );
}
