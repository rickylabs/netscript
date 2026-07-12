import type { TriggerKind } from '@netscript/plugin-triggers-core/domain';

/** Supported source-level trigger definition updates. */
export type TriggerSourceUpdates = Readonly<{
  cron?: string;
  timezone?: string;
  path?: string;
  verifier?: string;
  secretEnv?: string;
  description?: string;
  tags?: readonly string[];
}>;

/** Rewrite supported static fields in one code-defined trigger source module. */
export function updateTriggerSource(
  source: string,
  kind: TriggerKind | 'unknown',
  updates: TriggerSourceUpdates,
): string {
  assertCompatibleUpdates(kind, updates);
  let updated = source;
  for (const [property, value] of Object.entries(updates)) {
    if (value === undefined) continue;
    updated = replaceOrInsertProperty(updated, property, JSON.stringify(value));
  }
  if (updated === source) {
    throw new Error('No trigger fields were supplied to update.');
  }
  return updated;
}

function assertCompatibleUpdates(
  kind: TriggerKind | 'unknown',
  updates: TriggerSourceUpdates,
): void {
  if (kind !== 'scheduled' && (updates.cron !== undefined || updates.timezone !== undefined)) {
    throw new Error('Flags --cron and --timezone require a scheduled trigger.');
  }
  if (
    kind !== 'webhook' &&
    (updates.path !== undefined || updates.verifier !== undefined ||
      updates.secretEnv !== undefined)
  ) {
    throw new Error('Flags --path, --verifier, and --secret-env require a webhook trigger.');
  }
}

function replaceOrInsertProperty(source: string, property: string, literal: string): string {
  if (property === 'tags') {
    const multilineArray = /^(\s*)tags:\s*\[\s*\n[\s\S]*?^\s*\],?\s*$/m;
    if (multilineArray.test(source)) {
      return source.replace(multilineArray, `$1tags: ${literal},`);
    }
  }
  const line = new RegExp(`^(\\s*)${property}:\\s*.*?,?\\s*$`, 'm');
  if (line.test(source)) {
    return source.replace(line, `$1${property}: ${literal},`);
  }

  const idLines = [...source.matchAll(/^(\s*)id:\s*.*?,\s*$/gm)];
  const anchor = idLines.at(-1);
  if (anchor === undefined || anchor.index === undefined) {
    throw new Error('Trigger source does not contain a static definition id.');
  }
  const end = anchor.index + anchor[0].length;
  return `${source.slice(0, end)}\n${anchor[1]}${property}: ${literal},${source.slice(end)}`;
}
