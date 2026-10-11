/** Canonical Deno formatting policy and bounded batch transport. */
export const GENERATED_FORMAT_ARGS: readonly string[] = [
  '--no-config',
  '--line-width',
  '100',
  '--single-quote',
] as const;

/** Source dialects supported by the canonical formatter. */
export const SUPPORTED_EXTENSIONS: ReadonlySet<string> = new Set([
  'ts',
  'tsx',
  'js',
  'jsx',
  'mts',
  'mjs',
  'cts',
  'cjs',
  'md',
  'json',
  'jsonc',
  'css',
  'scss',
  'less',
  'html',
  'xml',
  'svg',
  'svelte',
  'vue',
  'astro',
  'yml',
  'yaml',
  'ipynb',
  'sql',
  'vto',
  'njk',
]);

/** Aggregate source-character budget across one formatting batch. */
export const MAX_BATCH_CHARACTERS: number = 64 * 1024 * 1024;
/** Maximum encoded JSON size, including worst-case escaping and framing. */
export const MAX_BATCH_PROTOCOL_BYTES: number = MAX_BATCH_CHARACTERS * 6 + 16 * 1024;
