import { DOC_CONTENT_BUDGET } from '../../domain/docs/doc-retrieval-contract.ts';
import { docContentBytes } from '../../domain/docs/faithful-extraction.ts';

/** A document identity and content digest prevent pages from different versions being spliced. */
export async function docPageIdentity(
  slug: string,
  section: string,
  content: string,
): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(JSON.stringify([slug, section, content])),
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Return a bounded exact source slice, or reject a stale, mismatched, or malformed cursor. */
export function fullDocPage(content: string, identity: string, cursor?: string): {
  content: string;
  nextCursor?: string;
} | undefined {
  let start = 0;
  if (cursor !== undefined) {
    const match = /^v2:([a-f0-9]{64}):([1-9]\d*)$/.exec(cursor);
    if (!match || match[1] !== identity) return undefined;
    start = Number(match[2]);
    if (
      !Number.isSafeInteger(start) || start >= content.length || splitsSurrogate(content, start)
    ) return undefined;
  }
  let low = start;
  let high = Math.min(content.length, start + DOC_CONTENT_BUDGET);
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (docContentBytes(content.slice(start, middle)) <= DOC_CONTENT_BUDGET) low = middle;
    else high = middle - 1;
  }
  const end = splitsSurrogate(content, low) ? low - 1 : low;
  return {
    content: content.slice(start, end),
    ...(end < content.length ? { nextCursor: `v2:${identity}:${end}` } : {}),
  };
}

function splitsSurrogate(content: string, offset: number): boolean {
  const before = content.charCodeAt(offset - 1);
  const after = content.charCodeAt(offset);
  return before >= 0xd800 && before <= 0xdbff && after >= 0xdc00 && after <= 0xdfff;
}
