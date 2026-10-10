import { DOC_CONTENT_BUDGET } from './doc-retrieval-contract.ts';

/** Indivisible source span used to retain snippets without paraphrasing. */
export interface DocSourceBlock {
  readonly text: string;
  readonly offset: number;
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
        offset: start,
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

interface Candidate {
  readonly text: string;
  readonly offset: number;
  readonly block: number;
  readonly tier: number;
  readonly bytes: number;
}

const protectedSpan = /(`+)[^`\n]*?\1|\[[^\]\n]+\]\([^\n]+?\)|https?:\/\/[^\s<>]+/g;
const commandLine =
  /^\s*(?:\$\s+\S|(?:deno|netscript|npm|npx|pnpm|yarn|bun|docker|git|curl|aspire)\s+\S)/;
const configLine =
  /^(?:\s+[\w.-]+:\s*\S|\s*[\w.-]+\s*=\s*\S|\s*[\w.-]+:\s*(?:["'[{]|https?:\/\/|true\b|false\b|null\b|[-+]?\d))/;

/** Select code, headings, protected sentences, then plain first sentences within the byte budget. */
export function extractDocContent(content: string): {
  content: string;
  omitted: { blocks: number; characters: number };
} {
  const blocks = docSourceBlocks(content);
  const candidates: Candidate[] = [];
  const add = (text: string, offset: number, block: number, tier: number) => {
    if (text.trim()) {
      candidates.push({ text, offset, block, tier, bytes: docContentBytes(text) - 2 });
    }
  };
  blocks.forEach((block, index) => {
    if (block.fenced) {
      add(block.text, block.offset, index, 1);
      return;
    }
    let proseStart = 0;
    const flush = (end: number) => {
      const text = block.text.slice(proseStart, end);
      const lastTextEnd = text.trimEnd().length;
      const spans = [...text.matchAll(protectedSpan)];
      let start = 0;
      let first = true;
      let sentenceSpan = 0;
      let boundarySpan = 0;
      const sentence = (end: number) => {
        while (sentenceSpan < spans.length && spans[sentenceSpan]!.index < start) sentenceSpan++;
        const protectedSentence = sentenceSpan < spans.length && spans[sentenceSpan]!.index < end;
        if (protectedSentence || first) {
          add(
            text.slice(start, end),
            block.offset + proseStart + start,
            index,
            protectedSentence ? 3 : 4,
          );
        }
        first = false;
        start = end;
      };
      for (const boundary of text.matchAll(/[.!?](?=\s|$)/g)) {
        while (
          boundarySpan < spans.length &&
          spans[boundarySpan]!.index + spans[boundarySpan]![0].length <= boundary.index
        ) boundarySpan++;
        const span = spans[boundarySpan];
        if (span && boundary.index >= span.index && boundary.index < span.index + span[0].length) {
          continue;
        }
        const end = boundary.index + 1;
        if (end < lastTextEnd) sentence(end);
      }
      sentence(text.length);
      proseStart = end;
    };
    const lines = [...block.text.matchAll(/[^\n]*(?:\n|$)/g)].filter((line) => line[0]);
    const mappingLines = lines.filter((line) => /^\s*[\w.-]+:\s+\S/.test(line[0])).length;
    for (const line of lines) {
      const heading = /^ {0,3}#{1,6}\s/.test(line[0]);
      if (
        heading || commandLine.test(line[0]) || configLine.test(line[0]) ||
        (mappingLines > 1 && /^\s*[\w.-]+:\s+\S/.test(line[0]))
      ) {
        flush(line.index);
        add(line[0], block.offset + line.index, index, heading ? 2 : 1);
        proseStart = line.index + line[0].length;
      }
    }
    flush(block.text.length);
  });
  // Cheap code units get first claim, so one large early fence cannot starve many small later ones.
  candidates.sort((a, b) =>
    a.tier - b.tier || (a.tier <= 2 ? a.bytes - b.bytes : 0) || a.offset - b.offset
  );
  const selected: Candidate[] = [];
  let remaining = DOC_CONTENT_BUDGET - 2;
  for (const candidate of candidates) {
    // Reserve at most two separator newlines; exact assembly below can only use fewer bytes.
    const cost = candidate.bytes + (selected.length ? 4 : 0);
    if (cost > remaining) continue;
    selected.push(candidate);
    remaining -= cost;
  }
  selected.sort((a, b) => a.offset - b.offset);
  let result = '';
  let previousEnd = -1;
  for (const candidate of selected) {
    if (result && previousEnd !== candidate.offset) {
      const trailing = /(?:\r?\n)*$/.exec(result)![0].split('\n').length - 1;
      const leading = /^(?:\r?\n)*/.exec(candidate.text)![0].split('\n').length - 1;
      result += '\n'.repeat(Math.max(0, 2 - trailing - leading));
    }
    result += candidate.text;
    previousEnd = candidate.offset + candidate.text.length;
  }
  const retainedByBlock = new Map<number, number>();
  for (const candidate of selected) {
    retainedByBlock.set(
      candidate.block,
      (retainedByBlock.get(candidate.block) ?? 0) + candidate.text.length,
    );
  }
  return {
    content: result,
    omitted: {
      blocks: blocks.filter((block, index) => (retainedByBlock.get(index) ?? 0) < block.text.length)
        .length,
      characters: content.length -
        selected.reduce((sum, candidate) => sum + candidate.text.length, 0),
    },
  };
}
