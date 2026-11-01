import { z } from 'npm:zod@^4.6.5';
import type { LibraryBundle, LibraryInput } from './contract.ts';
import { generateLibrary } from './generate.ts';

type Json = null | string | boolean | number | Json[] | { [key: string]: Json };

function canonical(value: unknown): Json {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.map(canonical);
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
        .map(([key, entry]) => [key, canonical(entry)]),
    );
  }
  throw new Error('Library must contain only finite JSON values');
}

/** Canonical object ordering makes source/transport key order irrelevant without losing array order. */
export function serializeLibrary(value: unknown): string {
  return JSON.stringify(canonical(value), null, 2) + '\n';
}

/** Re-derive from source contracts to reject missing, duplicate, unknown or modified output. */
export function validateLibrary(input: unknown, sources: LibraryInput): LibraryBundle {
  const selection = z.object({
    coverage: z.object({ selected: z.array(z.string()).min(1).max(8192) }).passthrough(),
  }).passthrough().parse(input);
  const expected = generateLibrary(sources, { items: selection.coverage.selected });
  if (serializeLibrary(input) !== serializeLibrary(expected)) {
    throw new Error('Library differs from current registry/contracts/token bindings');
  }
  return expected;
}

/** Content address ties native receipts to the complete contract, coverage and binding document. */
export async function libraryHash(bundle: LibraryBundle): Promise<string> {
  const bytes = new TextEncoder().encode(serializeLibrary(bundle));
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return [...digest].map((v) => v.toString(16).padStart(2, '0')).join('');
}
