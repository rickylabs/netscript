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

const METADATA_TOKEN = 'netscript-workers-resource: ';
const TYPESCRIPT_METADATA_PREFIX = `// ${METADATA_TOKEN}`;
const SCRIPT_METADATA_PREFIX = `# ${METADATA_TOKEN}`;

/** Render the stable source marker consumed by worker CLI management commands. */
export function renderWorkerResourceMetadata(metadata: WorkerResourceMetadata): string {
  const prefix = metadata.kind === 'task' && metadata.runtime !== 'deno'
    ? SCRIPT_METADATA_PREFIX
    : TYPESCRIPT_METADATA_PREFIX;
  return `${prefix}${JSON.stringify(metadata)}\n`;
}

/** Parse embedded metadata, falling back to metadata inferred from the source path. */
export function parseWorkerResourceMetadata(
  source: string,
  path: string,
  kind: 'job' | 'task',
): WorkerResourceMetadata {
  const line = source.split(/\r?\n/, 8).find(isMetadataLine);
  if (line) {
    const parsed: unknown = JSON.parse(
      line.slice(line.indexOf(METADATA_TOKEN) + METADATA_TOKEN.length),
    );
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
  const index = lines.findIndex(isMetadataLine);
  if (index >= 0) lines[index] = marker;
  else if (lines[0]?.startsWith('#!')) lines.splice(1, 0, marker);
  else lines.unshift(marker);
  return `${lines.join('\n').replace(/\n*$/, '')}\n`;
}

function isMetadataLine(line: string): boolean {
  return line.startsWith(TYPESCRIPT_METADATA_PREFIX) || line.startsWith(SCRIPT_METADATA_PREFIX);
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
