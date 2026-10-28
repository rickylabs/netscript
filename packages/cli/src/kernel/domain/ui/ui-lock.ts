import { z } from 'zod';
import { isUiRelativePath } from './ui-config.ts';

const hash = z.string().regex(/^[a-f0-9]{64}$/);
/** Baseline content is copied source, never resolved request credentials. */
export const UiLockedFileSchema = z.object({
  target: z.string().refine((path) =>
    isUiRelativePath(path) && path.split('/').some((part) => part !== '.')
  ),
  hash,
  content: z.string(),
  managed: z.boolean().default(false),
}).strict();
/** Validate install history before trusting file ownership and edit detection. */
export const UiLockSchema = z.object({
  version: z.literal(1),
  items: z.record(
    z.string(),
    z.object({
      source: z.string().min(1),
      sourceHash: hash,
      type: z.string().startsWith('registry:'),
      requested: z.boolean().default(false),
      files: z.array(UiLockedFileSchema),
      registryDependencies: z.array(z.string()).default([]),
    }).strict(),
  ),
}).strict();

/** Serializable provenance for all installed registry items. */
export type UiLock = z.infer<typeof UiLockSchema>;
/** Last installed file bytes and SHA-256 used to identify local edits. */
export type UiLockedFile = z.infer<typeof UiLockedFileSchema>;

/** Hash content using the Web Platform SHA-256 implementation. */
export async function uiContentHash(content: string): Promise<string> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content)))
    .toHex();
}

/** Render a deterministic unified hunk around changed lines, with three context lines. */
export function uiFileDiff(
  before: string,
  after: string,
  target: string,
  labels = ['installed', 'local'],
): string {
  if (before === after) return '';
  const a = before ? before.replace(/\n$/, '').split('\n') : [];
  const b = after ? after.replace(/\n$/, '').split('\n') : [];
  let prefix = 0;
  while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) prefix++;
  const newlineChanged = before.endsWith('\n') !== after.endsWith('\n');
  if (newlineChanged && (prefix === a.length || prefix === b.length)) {
    prefix = Math.max(0, prefix - 1);
  }
  let suffix = 0;
  while (
    !newlineChanged && suffix < a.length - prefix && suffix < b.length - prefix &&
    a[a.length - suffix - 1] === b[b.length - suffix - 1]
  ) suffix++;
  const start = Math.max(0, prefix - 3);
  const contextEnd = Math.min(3, suffix);
  const removed = a.slice(prefix, a.length - suffix);
  const added = b.slice(prefix, b.length - suffix);
  return [
    `--- ${labels[0]}/${target}`,
    `+++ ${labels[1]}/${target}`,
    `@@ -${start + 1},${prefix - start + removed.length + contextEnd} +${start + 1},${
      prefix - start + added.length + contextEnd
    } @@`,
    ...a.slice(start, prefix).map((line) => ` ${line}`),
    ...removed.map((line) => `-${line}`),
    ...(removed.length && !suffix && !before.endsWith('\n')
      ? ['\\ No newline at end of file']
      : []),
    ...added.map((line) => `+${line}`),
    ...(added.length && !suffix && !after.endsWith('\n') ? ['\\ No newline at end of file'] : []),
    ...a.slice(a.length - suffix, a.length - suffix + contextEnd).map((line) => ` ${line}`),
  ].join('\n');
}
