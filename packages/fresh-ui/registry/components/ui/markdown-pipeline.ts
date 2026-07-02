/**
 * @module
 * @support markdown-pipeline
 * @layer 3
 * @depends citation-chip
 * @description Pure, dependency-free helpers behind the copy-based `markdown`
 * registry item: the `remarkCitations` mdast transform, the `stripIncompleteSyntax`
 * mid-stream guard, and `extendSanitizeSchema` — the whitelist that keeps the
 * MANDATORY `rehype-sanitize` pass safe while still allowing citation chips,
 * KaTeX math markup, and highlight.js class output.
 *
 * This module imports NO npm packages on purpose: it carries the load-bearing,
 * security-relevant logic so it can be type-checked, published, and unit-tested
 * inside `@netscript/fresh-ui` without pulling `react-markdown` (or any of the
 * remark/rehype plugins) into the package's own import graph. The `markdown.tsx`
 * component wires these helpers into `react-markdown`; the npm dependencies live
 * only on the registry item and only land in the consuming app.
 */

/** Custom element name emitted for a recognized citation token. */
export const CITATION_ELEMENT = 'citation-chip';

/**
 * Citation token recognized in model output: a bracketed 1–3 digit index such
 * as `[1]`, matching the grounded-agent `[n]` convention shared with `message`.
 */
export const CITATION_PATTERN: RegExp = /\[(\d{1,3})\]/g;

/**
 * KaTeX (via `rehype-katex`) emits MathML/HTML elements that the default
 * sanitize schema would strip. These tag names are re-allowed so the sanitize
 * pass can run LAST without erasing rendered math.
 */
export const KATEX_TAG_NAMES: readonly string[] = [
  'math',
  'semantics',
  'annotation',
  'mrow',
  'mi',
  'mo',
  'mn',
  'ms',
  'mtext',
  'mspace',
  'msup',
  'msub',
  'msubsup',
  'mfrac',
  'msqrt',
  'mroot',
  'munder',
  'mover',
  'munderover',
  'mtable',
  'mtr',
  'mtd',
  'mpadded',
  'mphantom',
  'menclose',
  'mstyle',
];

/** Minimal mdast node shape touched by {@link remarkCitations}. */
export interface MdastNode {
  /** Node type (e.g. `text`, `paragraph`, `root`, or a custom citation type). */
  type: string;
  /** Literal text value, present on `text` nodes. */
  value?: string;
  /** Child nodes, present on parent nodes. */
  children?: MdastNode[];
  /** hast hints used by `mdast-util-to-hast` to emit a custom element. */
  data?: { hName?: string; hProperties?: Record<string, unknown> };
}

/** Minimal mdast root shape passed to the transformer. */
export interface MdastRoot extends MdastNode {
  /** Root nodes are always of type `root`. */
  type: 'root';
  /** Top-level block children of the document. */
  children: MdastNode[];
}

/** A unified transformer over an mdast tree. */
export type MdastTransformer = (tree: MdastRoot) => void;

/**
 * Minimal `rehype-sanitize` schema shape. Kept structural so this module never
 * imports `rehype-sanitize`; the component passes the plugin's real
 * `defaultSchema` at call time.
 */
export interface SanitizeSchema {
  /** Allowed tag names. */
  tagNames?: string[];
  /** Allowed attributes, keyed by tag name (or `*` for all elements). */
  attributes?: Record<string, unknown[]>;
  /** Other schema fields passed through untouched (e.g. `protocols`, `clobber`). */
  [key: string]: unknown;
}

/**
 * Splits a text node on citation tokens, replacing each `[n]` with a node that
 * renders as a `<citation-chip index="n">` element (via `data.hName`).
 * @param node - The mdast `text` node to scan.
 * @returns The original node, or the split sequence of text + citation nodes.
 */
function splitTextNode(node: MdastNode): MdastNode[] {
  const value = node.value ?? '';
  CITATION_PATTERN.lastIndex = 0;
  if (!CITATION_PATTERN.test(value)) return [node];

  CITATION_PATTERN.lastIndex = 0;
  const out: MdastNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = CITATION_PATTERN.exec(value)) !== null) {
    if (match.index > last) {
      out.push({ type: 'text', value: value.slice(last, match.index) });
    }
    const index = Number(match[1]);
    out.push({
      type: 'citationReference',
      data: { hName: CITATION_ELEMENT, hProperties: { index } },
      children: [{ type: 'text', value: match[1] }],
    });
    last = match.index + match[0].length;
  }
  if (last < value.length) out.push({ type: 'text', value: value.slice(last) });
  return out;
}

/**
 * Recursively rewrites citation tokens within a node's children.
 * @param node - The parent node whose children are scanned.
 */
function visit(node: MdastNode): void {
  if (!node.children) return;
  const next: MdastNode[] = [];
  for (const child of node.children) {
    if (child.type === 'text') {
      next.push(...splitTextNode(child));
    } else {
      visit(child);
      next.push(child);
    }
  }
  node.children = next;
}

/**
 * A remark plugin that rewrites `[n]` citation tokens in model output into
 * `citation-chip` render calls. Pair with `components={{ 'citation-chip': ... }}`
 * on `react-markdown` to render the sibling `citation-chip` registry item.
 * @returns The mdast transformer.
 * @example
 * ```ts
 * import { remarkCitations } from './markdown-pipeline.ts';
 * const transform = remarkCitations();
 * transform({ type: 'root', children: [] });
 * ```
 */
export function remarkCitations(): MdastTransformer {
  return (tree: MdastRoot): void => {
    visit(tree);
  };
}

/**
 * Counts non-overlapping occurrences of a marker in text.
 * @param text - The text to scan.
 * @param marker - The literal marker to count.
 * @returns The occurrence count.
 */
function countMarker(text: string, marker: string): number {
  let count = 0;
  let index = text.indexOf(marker);
  while (index !== -1) {
    count += 1;
    index = text.indexOf(marker, index + marker.length);
  }
  return count;
}

/**
 * Pre-processes a possibly-truncated mid-stream markdown chunk so partial GFM /
 * math syntax renders meaningfully instead of leaking raw markers. Unterminated
 * fenced code blocks, inline code spans, bold runs, and math are closed, and a
 * dangling incomplete link/image at the tail is dropped. Complete input is
 * returned effectively unchanged.
 * @param chunk - The (possibly partial) markdown source.
 * @returns The repaired markdown source, safe to feed to the renderer.
 * @example
 * ```ts
 * stripIncompleteSyntax('Here is **bold'); // -> 'Here is **bold**'
 * ```
 */
export function stripIncompleteSyntax(chunk: string): string {
  let text = chunk;

  // 1) Close an unterminated fenced code block (odd number of ``` fences).
  if (countMarker(text, '```') % 2 === 1) {
    if (!text.endsWith('\n')) text += '\n';
    text += '```';
  }

  // Mask now-balanced fenced blocks so inline scanning ignores code content.
  const masked = text.replace(/```[\s\S]*?```/g, '');

  // 2) Close an unterminated inline code span.
  if (countMarker(masked, '`') % 2 === 1) text += '`';

  // 3) Close an unterminated bold/strong run.
  if (countMarker(masked, '**') % 2 === 1) text += '**';

  // 4) Close unterminated block math, else unterminated inline math.
  if (countMarker(masked, '$$') % 2 === 1) {
    text += '$$';
  } else if (countMarker(masked.replace(/\$\$/g, ''), '$') % 2 === 1) {
    text += '$';
  }

  // 5) Drop a dangling incomplete link/image at the very end.
  text = text
    .replace(/!?\[[^\]]*\]\([^)]*$/, '')
    .replace(/!?\[[^\]]*$/, '');

  return text;
}

/**
 * Extends a base `rehype-sanitize` schema so the MANDATORY final sanitize pass
 * keeps citation chips, KaTeX math markup, and highlight.js class output while
 * still stripping anything dangerous. `script` is force-removed from the allowed
 * tag set and no event-handler attribute is ever added, so model-authored
 * `<script>` / `on*=` HTML can never survive the pass.
 * @param base - The plugin's `defaultSchema` (passed structurally).
 * @returns A new schema; the input is not mutated.
 * @example
 * ```ts
 * import { defaultSchema } from 'rehype-sanitize';
 * const schema = extendSanitizeSchema(defaultSchema);
 * ```
 */
export function extendSanitizeSchema(base: SanitizeSchema): SanitizeSchema {
  const tagNames = new Set<string>(base.tagNames ?? []);
  // Sanitize is non-negotiable: scripts never render, no matter the base schema.
  tagNames.delete('script');
  tagNames.add(CITATION_ELEMENT);
  for (const tag of KATEX_TAG_NAMES) tagNames.add(tag);

  const attributes: Record<string, unknown[]> = { ...(base.attributes ?? {}) };
  attributes['*'] = [...new Set<unknown>([...(attributes['*'] ?? []), 'className', 'class'])];
  attributes['span'] = [
    ...new Set<unknown>([
      ...(attributes['span'] ?? []),
      'className',
      'class',
      'style',
      'aria-hidden',
    ]),
  ];
  attributes['div'] = [
    ...new Set<unknown>([...(attributes['div'] ?? []), 'className', 'class', 'style']),
  ];
  attributes[CITATION_ELEMENT] = ['index', 'source', 'className', 'class'];

  return { ...base, tagNames: [...tagNames], attributes };
}
