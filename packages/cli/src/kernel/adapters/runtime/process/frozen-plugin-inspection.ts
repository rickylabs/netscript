import { parse as parseJsonc } from '@std/jsonc';
import { isAbsolute, parse, relative, resolve } from '@std/path';
import { tmpdir } from 'node:os';
import type { ProcessPort } from '../../../ports/process-port.ts';
import { readInspectionFile } from '../../service/generated-surface-reader.ts';

/** Read the consumer's bounded, unlinked lock bytes without changing its resolution or installation. */
export async function readConsumerInspectionLock(root: string): Promise<Uint8Array> {
  const configBytes = await readInspectionFile(root, 'deno.json');
  if (!configBytes) throw new Error('Missing authored project configuration.');
  const config = parseJsonc(new TextDecoder().decode(configBytes));
  if (config === null || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error('Invalid authored project configuration.');
  }
  const configured = Reflect.get(config, 'lock');
  if (
    configured !== undefined && typeof configured !== 'boolean' && typeof configured !== 'string' &&
    (configured === null || typeof configured !== 'object' || Array.isArray(configured))
  ) throw new Error('Invalid authored lock configuration.');
  if (
    configured && typeof configured === 'object' && !Array.isArray(configured) &&
    configured.path !== undefined && typeof configured.path !== 'string'
  ) throw new Error('Invalid authored lock path.');
  const path = typeof configured === 'string'
    ? configured
    : configured && typeof configured === 'object' && !Array.isArray(configured) &&
        typeof configured.path === 'string'
    ? configured.path
    : 'deno.lock';
  if (configured === false) {
    throw new Error(
      'Plugin inspection requires a project lock; run generate plugins to prepare it.',
    );
  }
  const lockPath = resolve(root, path);
  const readerRoot = isAbsolute(relative(root, lockPath)) ? parse(lockPath).root : root;
  const bytes = await readInspectionFile(
    readerRoot,
    relative(readerRoot, lockPath).replaceAll('\\', '/'),
  );
  if (!bytes) throw new Error('Missing consumer lock; run generate plugins to prepare it.');
  return bytes;
}

/** Inspect using a frozen scratch copy of the consumer lock, with no project package installs. */
export function frozenPluginInspection(process: ProcessPort): ProcessPort {
  return {
    async exec(_command, args, options) {
      const root = options?.cwd;
      if (!root) throw new Error('Plugin inspection requires a project root.');
      const bytes = await readConsumerInspectionLock(root);
      const temporaryDirectory = resolve(tmpdir());
      return await process.exec('deno', [
        'run',
        '--no-config',
        '--frozen',
        '--node-modules-dir=none',
        '--no-prompt',
        '--allow-read',
        `--allow-write=${temporaryDirectory}`,
        `--deny-write=${root}`,
        '--allow-run=deno',
        '--deny-env',
        '--deny-net',
        new URL('./frozen-plugin-inspection-child.ts', import.meta.url).href,
        temporaryDirectory,
      ], {
        ...options,
        stdin: JSON.stringify({ args, root, lock: new TextDecoder().decode(bytes) }),
      });
    },
  };
}
