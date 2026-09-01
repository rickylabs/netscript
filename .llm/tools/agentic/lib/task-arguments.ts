const TASK_SEPARATOR = '--';

/** Removes Deno's single leading task separator and rejects every later separator. */
export function normalizeTaskArguments(args: readonly string[]): string[] {
  const normalized = args[0] === TASK_SEPARATOR ? args.slice(1) : [...args];
  if (normalized.includes(TASK_SEPARATOR)) {
    throw new Error(`Unknown argument: ${TASK_SEPARATOR}`);
  }
  return normalized;
}
