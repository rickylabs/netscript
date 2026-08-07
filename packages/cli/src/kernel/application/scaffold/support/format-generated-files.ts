import type { ProcessPort } from '../../../ports/process-port.ts';

/** Format an exact set of generated TypeScript files as part of their owning mutation. */
export async function formatGeneratedFiles(
  process: ProcessPort,
  projectRoot: string,
  files: readonly string[],
  exists: (path: string) => Promise<boolean> = () => Promise.resolve(true),
): Promise<void> {
  const existingFiles: string[] = [];
  for (const file of files) {
    if (await exists(file)) existingFiles.push(file);
  }
  if (existingFiles.length === 0) return;
  const result = await process.exec(
    'deno',
    ['fmt', '--no-config', '--line-width', '100', '--single-quote', ...existingFiles],
    { cwd: projectRoot },
  );
  if (result.code !== 0) {
    const detail = result.stderr.trim() || result.stdout.trim() || `exit ${result.code}`;
    throw new Error(`Unable to format generated files: ${detail}`);
  }
}
