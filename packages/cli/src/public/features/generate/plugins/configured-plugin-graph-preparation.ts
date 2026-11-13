import { join } from '@std/path';
import { loadProjectConfigForInspection } from '../../../../kernel/adapters/config/project-config-loader.ts';
import { resolvePluginImportSpecifier } from '../../../../kernel/application/plugin/configured-plugin-specifier.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { ProcessPort, ProcessResult } from '../../../../kernel/ports/process-port.ts';

const URL_SCHEME = /^[a-zA-Z][a-zA-Z0-9+.-]+:/;
const MAX_OUTPUT_BYTES = 1024 * 1024;

function requireSuccess(result: ProcessResult, stage: string): ProcessResult {
  if (result.timedOut) throw new Error(`Plugin graph ${stage} timed out.`);
  if (result.code !== 0) {
    throw new Error(
      `Plugin graph ${stage} failed: ${(result.stderr || result.stdout).slice(0, 4096)}`,
    );
  }
  return result;
}

/** Prepare configured public modules only on the normal generation write path. */
export async function prepareConfiguredPluginGraphs(
  projectRoot: string,
  fs: FileSystemPort,
  process: ProcessPort,
): Promise<void> {
  let configFile: string | undefined;
  for (const name of ['netscript.config.ts', 'netscript.config.js', 'netscript.config.mjs']) {
    if (await fs.exists(join(projectRoot, name))) {
      configFile = name;
      break;
    }
  }
  if (!configFile) return;
  const config = await loadProjectConfigForInspection({ cwd: projectRoot, configFile }, {
    process: {
      async exec(command, args, options) {
        return requireSuccess(
          await process.exec(command, args, {
            ...options,
            timeoutMs: 30_000,
            maxOutputBytes: MAX_OUTPUT_BYTES,
          }),
          'config loading',
        );
      },
    },
  });
  const authored = config.plugins ?? [];
  if (authored.some((spec) => !spec.trim() || spec.startsWith('-'))) {
    throw new Error('Plugin graph has an invalid configured module specifier.');
  }
  let specs = [...new Set(authored.map((spec) => resolvePluginImportSpecifier(projectRoot, spec)))];
  if (!specs.length) return;
  let configArgs = ['--no-config'];
  for (const name of ['deno.json', 'deno.jsonc']) {
    if (await fs.exists(join(projectRoot, name))) {
      configArgs = ['--config', join(projectRoot, name)];
      break;
    }
  }
  if (specs.some((spec) => !URL_SCHEME.test(spec))) {
    const result = requireSuccess(
      await process.exec('deno', [
        'run',
        '--no-check',
        '--no-lock',
        '--node-modules-dir=none',
        '--no-prompt',
        '--allow-read',
        '--deny-write',
        '--deny-run',
        '--deny-net',
        '--deny-env',
        ...configArgs,
        '-',
      ], {
        cwd: projectRoot,
        timeoutMs: 30_000,
        maxOutputBytes: MAX_OUTPUT_BYTES,
        stdin: `console.log(JSON.stringify(${
          JSON.stringify(specs)
        }.map(s => import.meta.resolve(s).replace(/^(jsr|npm):\\//, '$1:'))));`,
      }),
      'specifier resolution',
    );
    const resolved: unknown = JSON.parse(result.stdout);
    if (
      !Array.isArray(resolved) || resolved.length !== specs.length ||
      !resolved.every((spec): spec is string => typeof spec === 'string' && URL_SCHEME.test(spec))
    ) {
      throw new Error('Plugin graph specifier resolution returned invalid URLs.');
    }
    specs = [...new Set(resolved)];
  }
  requireSuccess(
    await process.exec('deno', [
      'cache',
      '--no-check',
      '--frozen=false',
      '--node-modules-dir=none',
      ...configArgs,
      ...specs,
    ], { cwd: projectRoot, timeoutMs: 60_000, maxOutputBytes: MAX_OUTPUT_BYTES }),
    'caching',
  );
}
