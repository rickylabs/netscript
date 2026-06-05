/** Trigger kinds supported by the F29 scaffolders. */
export type TriggerScaffoldKind = 'webhook' | 'file-watch' | 'scheduled';

/** Input shared by trigger definition scaffolders. */
export type TriggerScaffoldInput = Readonly<{
  id: string;
  kind: TriggerScaffoldKind;
  path?: string;
  paths?: readonly string[];
  patterns?: readonly string[];
  ignored?: readonly string[];
  cron?: string;
  timezone?: string;
  secretEnv?: string;
  job?: string;
  force?: boolean;
}>;

/** Convert a trigger id into a stable TypeScript identifier prefix. */
export function toTriggerExportName(id: string): string {
  const words = id.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  const [first = 'trigger', ...rest] = words;
  return [
    first.slice(0, 1).toLowerCase() + first.slice(1),
    ...rest.map((word) => word.slice(0, 1).toUpperCase() + word.slice(1)),
  ].join('');
}

/** Convert a trigger id into the project file stem convention. */
export function toTriggerFileStem(id: string): string {
  return id.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Render an immutable string array expression. */
export function renderStringArray(values: readonly string[]): string {
  return `[${values.map((value) => JSON.stringify(value)).join(', ')}]`;
}
