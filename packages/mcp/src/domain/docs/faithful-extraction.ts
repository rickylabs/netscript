import { DOC_CONTENT_BUDGET } from './doc-retrieval-contract.ts';

/** Indivisible source span used to retain snippets without paraphrasing. */
export interface DocSourceBlock {
  readonly text: string;
  readonly protected: boolean;
  readonly fenced: boolean;
}

const encoder = new TextEncoder();

/** Serialized UTF-8 size, accounting for JSON escaping rather than just source length. */
export function docContentBytes(content: string): number {
  return encoder.encode(JSON.stringify(content)).length;
}

/** Parse fenced blocks and paragraphs while preserving their exact source spelling. */
export function docSourceBlocks(content: string): readonly DocSourceBlock[] {
  const blocks: DocSourceBlock[] = [];
  let start = 0;
  let fence: string | undefined;
  const append = (end: number, protectedFence = false) => {
    const text = content.slice(start, end);
    if (text.trim()) {
      blocks.push({
        text,
        fenced: protectedFence,
        protected: protectedFence ||
          /`|https?:\/\/|\[[^\]]+\]|^\s*(?:\$\s|deno\s|netscript\s|npm\s|npx\s|[\w.-]+\s*[:=])/m
            .test(text),
      });
    }
    start = end;
  };
  for (const match of content.matchAll(/[^\n]*(?:\n|$)/g)) {
    const line = match[0];
    if (!line) continue;
    const end = match.index + line.length;
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)/.exec(line);
    if (fence) {
      if (
        marker && marker[1]![0] === fence[0] && marker[1]!.length >= fence.length &&
        !marker[2]!.trim()
      ) {
        append(end, true);
        fence = undefined;
      }
    } else if (marker) {
      append(match.index);
      fence = marker[1];
    } else if (!line.trim()) {
      append(end);
    } else if (/^#{1,6}\s/.test(line)) {
      append(match.index);
      append(end);
    }
  }
  append(content.length, fence !== undefined);
  return blocks;
}

/** Greedily retain whole protected blocks, then source sentences; never split a snippet. */
export function extractDocContent(content: string): {
  content: string;
  omitted: { blocks: number; characters: number };
} {
  const blocks = docSourceBlocks(content);
  const selected = new Map<number, string>();
  let remaining = DOC_CONTENT_BUDGET - 2;
  const retain = (index: number, text: string) => {
    const bytes = docContentBytes(text) - 2 + 4;
    if (bytes > remaining) return;
    selected.set(index, text);
    remaining -= bytes;
  };
  blocks.forEach((block, index) => {
    if (block.protected) retain(index, block.text);
  });
  blocks.forEach((block, index) => {
    if (block.protected) return;
    // Sentence selection is verbatim. If there is no sentence boundary, retain the whole block.
    const sentence = /^[\s\S]*?[.!?](?=\s|$)/.exec(block.text)?.[0];
    retain(index, sentence ?? block.text);
  });
  const retained = [...selected].sort(([a], [b]) => a - b);
  return {
    content: retained.map(([, text]) => text).join('\n\n'),
    omitted: {
      blocks: blocks.length - selected.size,
      characters: content.length - retained.reduce((sum, [, text]) => sum + text.length, 0),
    },
  };
}
