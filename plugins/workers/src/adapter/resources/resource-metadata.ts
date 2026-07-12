/** Metadata embedded in generated worker resource files. */
export type WorkerResourceMetadata = Readonly<{
  kind: 'job' | 'task';
  id: string;
  enabled: boolean;
  entrypoint: string;
  topic?: string;
  schedule?: string;
  timeout?: number;
  maxRetries?: number;
  tags?: readonly string[];
  runtime?: string;
}>;

const METADATA_PREFIX = '// netscript-workers-resource: ';

/** Render the stable source marker consumed by worker CLI management commands. */
export function renderWorkerResourceMetadata(metadata: WorkerResourceMetadata): string {
  return `${METADATA_PREFIX}${JSON.stringify(metadata)}\n`;
}

/** Parse embedded metadata, falling back to metadata inferred from the source path. */
export function parseWorkerResourceMetadata(
  source: string,
  path: string,
  kind: 'job' | 'task',
): WorkerResourceMetadata {
  const line = source.split(/\r?\n/, 8).find((candidate) => candidate.startsWith(METADATA_PREFIX));
  if (line) {
    const parsed: unknown = JSON.parse(line.slice(METADATA_PREFIX.length));
    if (isWorkerResourceMetadata(parsed, kind)) return Object.freeze(parsed);
  }
  const id = fileStem(path);
  return Object.freeze({
    kind,
    id,
    enabled: true,
    entrypoint: path,
    ...(kind === 'task' ? { runtime: runtimeFromPath(path) } : {}),
  });
}

/** Insert or replace the metadata marker without changing executable source. */
export function updateWorkerResourceMetadata(
  source: string,
  metadata: WorkerResourceMetadata,
): string {
  const marker = renderWorkerResourceMetadata(metadata).trimEnd();
  const lines = source.split(/\r?\n/);
  const index = lines.findIndex((line) => line.startsWith(METADATA_PREFIX));
  if (index >= 0) lines[index] = marker;
  else lines.unshift(marker);
  return `${lines.join('\n').replace(/\n*$/, '')}\n`;
}

function isWorkerResourceMetadata(
  value: unknown,
  kind: 'job' | 'task',
): value is WorkerResourceMetadata {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return record.kind === kind && typeof record.id === 'string' &&
    typeof record.enabled === 'boolean' && typeof record.entrypoint === 'string';
}

function fileStem(path: string): string {
  const file = path.replaceAll('\\', '/').split('/').at(-1) ?? path;
  return file.replace(/\.(?:ts|tsx|py|sh|ps1|cmd)$/, '').replace(/\.config$/, '');
}

function runtimeFromPath(path: string): string {
  if (path.endsWith('.py')) return 'python';
  if (path.endsWith('.sh')) return 'shell';
  if (path.endsWith('.ps1')) return 'powershell';
  if (path.endsWith('.cmd')) return 'cmd';
  return 'deno';
}
