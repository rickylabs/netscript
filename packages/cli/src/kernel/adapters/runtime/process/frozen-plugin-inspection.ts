import { parse as parseJsonc } from '@std/jsonc';
import { basename, dirname, resolve } from '@std/path';
import { tmpdir } from 'node:os';
import type { ProcessPort } from '../../../ports/process-port.ts';
import { readInspectionFile } from '../../service/generated-surface-reader.ts';

/** Inspect using a frozen scratch copy of the consumer lock, with no project package installs. */
export function frozenPluginInspection(process: ProcessPort): ProcessPort {
  return {
    async exec(_command, args, options) {
      const root = options?.cwd;
      if (!root) throw new Error('Plugin inspection requires a project root.');
      const configBytes = await readInspectionFile(root, 'deno.json');
      if (!configBytes) throw new Error('Missing authored project configuration.');
      const config = parseJsonc(new TextDecoder().decode(configBytes));
      const record = config !== null && typeof config === 'object' ? Object(config) : {};
      const configured = record.lock;
      const path = typeof configured === 'string'
        ? configured
        : configured && typeof configured === 'object' && typeof configured.path === 'string'
        ? configured.path
        : 'deno.lock';
      if (configured === false) {
        throw new Error(
          'Plugin inspection requires a project lock; run generate plugins to prepare it.',
        );
      }
      const lockPath = resolve(root, path);
      const bytes = await readInspectionFile(dirname(lockPath), basename(lockPath));
      if (!bytes) throw new Error('Missing consumer lock; run generate plugins to prepare it.');
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
