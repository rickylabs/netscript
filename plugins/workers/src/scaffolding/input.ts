/** Task runtimes covered by first-party workers scaffolding templates. */
export const WORKERS_TASK_SCAFFOLD_RUNTIMES = [
  'deno',
  'python',
  'shell',
  'powershell',
] as const;

/** First-party task runtime scaffold kind. */
export type WorkersTaskScaffoldRuntime = typeof WORKERS_TASK_SCAFFOLD_RUNTIMES[number];

/** Input accepted by workers item scaffolders. */
export interface WorkersScaffoldInput {
  /** Stable worker item identifier. */
  readonly id: string;
  /** Optional output directory relative to the project root. */
  readonly directory?: string;
  /** Task runtime for task scaffolders. */
  readonly runtime?: WorkersTaskScaffoldRuntime;
  /** Optional worker topic name. */
  readonly topic?: string;
  /** Optional cron schedule. */
  readonly schedule?: string;
  /** Optional timeout in milliseconds. */
  readonly timeoutMs?: number;
  /** Optional maximum retry count. */
  readonly maxRetries?: number;
  /** Optional item tags. */
  readonly tags?: readonly string[];
}

/** Return true when the input can identify a worker item. */
export function isWorkersScaffoldInput(input: unknown): input is WorkersScaffoldInput {
  if (typeof input !== 'object' || input === null) {
    return false;
  }

  const candidate = input as { readonly id?: unknown };
  return typeof candidate.id === 'string' && candidate.id.trim().length > 0;
}

/** Convert an item identifier into a stable file stem. */
export function toWorkerFileStem(id: string): string {
  return id.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Create a relative entrypoint path for generated worker items. */
export function createWorkerEntrypoint(
  input: WorkersScaffoldInput,
  folder: string,
  extension: string,
): string {
  const directory = input.directory?.replace(/\\/g, '/') ?? `workers/${folder}`;
  return `${directory}/${toWorkerFileStem(input.id)}${extension}`;
}

/** Render an array literal for generated TypeScript source. */
export function renderStringArray(values: readonly string[] = []): string {
  return `[${values.map((value) => JSON.stringify(value)).join(', ')}]`;
}
