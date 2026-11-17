/** Explicit static-documentation child policy; ordinary callers keep their existing loader. */
import { isAbsolute, join, resolve } from '@std/path';

export interface ExportCorpusDocOptions {
  readonly lockfile?: string;
  readonly importHosts?: readonly string[];
  readonly cacheDir?: string;
  readonly compilerFlags?: string;
  readonly onChild?: (notice: {
    readonly packageName: string;
    readonly ordinal: number;
    readonly total: number;
    readonly phase: 'attempt' | 'complete';
    readonly exitCode?: number;
  }) => void;
}

/** Construct only supported Deno doc flags and a sterile strict-mode environment. */
export function exportCorpusDocCommand(
  root: string,
  entrypoints: readonly string[],
  options: ExportCorpusDocOptions,
  ordinaryEnvironment: () => Record<string, string>,
): { args: string[]; env: Record<string, string> } {
  const strict = options.lockfile !== undefined || options.importHosts !== undefined ||
    options.cacheDir !== undefined;
  if (!strict) return { args: ['doc', '--json', ...entrypoints], env: ordinaryEnvironment() };
  const lockfile = options.lockfile && resolve(root, options.lockfile);
  const cache = options.cacheDir && resolve(options.cacheDir);
  const hosts = options.importHosts;
  if (
    lockfile !== resolve(root, 'deno.lock') || !cache || !isAbsolute(options.cacheDir!) ||
    cache === resolve(root) || !hosts?.length || hosts.length > 16 ||
    new Set(hosts).size !== hosts.length
  ) {
    throw new Error(
      'Locked documentation requires the repository lock, explicit cache and public import hosts',
    );
  }
  for (const host of hosts) {
    if (
      !/^[a-z0-9]+(?:[.-][a-z0-9]+)*\.[a-z]{2,}$/.test(host) ||
      /(?:^|\.)(?:localhost|local|internal|invalid|test)$/.test(host)
    ) {
      throw new Error('Documentation import host is not an explicit public hostname');
    }
  }
  if (
    options.compilerFlags && !/^--max-old-space-size=[1-9][0-9]{1,4}$/.test(options.compilerFlags)
  ) {
    throw new Error('Unsupported documentation compiler flags');
  }
  const home = join(cache, 'home');
  return {
    args: [
      'doc',
      '--json',
      '--lock',
      lockfile,
      '--frozen-lockfile',
      '--allow-import=' + hosts.join(','),
      '--node-modules-dir=none',
      ...entrypoints,
    ],
    env: {
      DENO_DIR: cache,
      HOME: home,
      USERPROFILE: home,
      NO_COLOR: '1',
      ...(options.compilerFlags ? { DENO_V8_FLAGS: options.compilerFlags } : {}),
    },
  };
}
