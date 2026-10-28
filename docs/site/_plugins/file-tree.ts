/**
 * The docs site's file tree: one renderer for the `fileTree` component and for fenced
 * `tree` blocks in Markdown.
 *
 * Authors keep writing an ASCII tree, so the Markdown source and the page's Markdown twin
 * stay readable as plain text:
 *
 * ````md
 * ```tree
 * my-app/
 * ├── deno.json        # [owned config] workspace, imports, and tasks
 * └── .generated/      # [generated] replaced by `db generate`
 * ```
 * ````
 *
 * The site renders the same markup as `comp.fileTree`. The root list carries the authored
 * ASCII in `data-tree-source`, which the Markdown twin emits as a plain `text` fence.
 *
 * This module has no imports, so root test discovery can run its unit tests without the
 * site's import map.
 */

/** One entry of a rendered file tree. */
export interface FileTreeNode {
  /** Display name. A trailing `/` marks a folder. */
  readonly name: string;
  /** Muted note after the name. Backtick spans render as inline code. */
  readonly comment?: string;
  /** Ownership tag, such as `owned`, `generated history` or `CLI-managed`. */
  readonly ownership?: string;
  /** Overrides folder detection (children, or a trailing `/`). */
  readonly folder?: boolean;
  /** Nested entries. */
  readonly children?: readonly FileTreeNode[];
}

/** A tree entry as parsed from ASCII; every field the parser decides is present. */
export interface ParsedFileTreeNode extends FileTreeNode {
  readonly folder: boolean;
  readonly children: readonly ParsedFileTreeNode[];
}

/** Rendering options for {@link renderFileTree}. */
export interface RenderFileTreeOptions {
  /** Render a nested list, without the root frame and keyboard stop. */
  readonly nested?: boolean;
  /** Authored ASCII, kept on the root list for the Markdown twin. */
  readonly source?: string;
}

/** The fence info string that renders through the file tree component. */
export const TREE_FENCE = 'tree';

/** Root attribute holding the authored ASCII tree for the Markdown twin. */
export const TREE_SOURCE_ATTRIBUTE = 'data-tree-source';

const FOLDER_ICON = '<path d="M3 6h7l2 3h9v11H3z" />';
const FILE_ICON = '<path d="M14 2H5v20h14V7zM14 2v6h6" />';

/**
 * Rails (`│`, `|` or spaces), then a branch: Unicode `├` or `└` followed by `─` or `-`, or
 * ASCII `|`, `` ` ``, `+` or `\` followed by two or more `-`, as `tree --charset=ascii` and
 * Windows `tree /A` draw them. Glyph styles may be mixed; nesting comes from the column.
 */
const BRANCH = /^([\s│|]*?)(?:[├└][─-]+|[|`+\\]-{2,})[ \t]?(.*)$/;
/** A line holding only rails, kept by some authors as vertical spacing. */
const RAIL_ONLY = /^[\s│|]*$/;
/** Drawing characters left in a name mean the line's glyphs were not understood. */
const STRAY_GLYPH = /[─-╿]|^[|`+\\]-|^[-|`+\\]+$/;
/** The annotation starts at the first `#` preceded by whitespace. */
const ANNOTATION = /\s#(?=\s|$)/;
const OWNERSHIP = /^\[([^\]]+)\]\s*(.*)$/;

/** An ASCII tree that cannot be read. `line` is 1-based within the fence body. */
export class TreeParseError extends Error {
  /** The offending line within the fence body, when there is one. */
  readonly line?: number;

  constructor(message: string, line?: number) {
    super(message);
    this.name = 'TreeParseError';
    this.line = line;
  }
}

interface MutableNode {
  name: string;
  comment?: string;
  ownership?: string;
  children: MutableNode[];
}

function parseEntry(text: string, line: number): MutableNode {
  const annotationAt = text.search(ANNOTATION);
  const name = (annotationAt < 0 ? text : text.slice(0, annotationAt)).trim();
  if (!name) throw new TreeParseError(`line ${line} has no name`, line);
  if (STRAY_GLYPH.test(name)) {
    throw new TreeParseError(`line ${line} has tree glyphs that are not understood`, line);
  }
  const node: MutableNode = { name, children: [] };
  if (annotationAt < 0) return node;

  const annotation = text.slice(annotationAt).replace(ANNOTATION, '').trim();
  const tag = annotation.match(OWNERSHIP);
  if (tag) {
    node.ownership = tag[1].trim();
    if (tag[2].trim()) node.comment = tag[2].trim();
  } else if (annotation) {
    node.comment = annotation;
  }
  return node;
}

function freeze(node: MutableNode): ParsedFileTreeNode {
  const children = node.children.map(freeze);
  return {
    name: node.name,
    ...(node.comment === undefined ? {} : { comment: node.comment }),
    ...(node.ownership === undefined ? {} : { ownership: node.ownership }),
    folder: children.length > 0 || node.name.endsWith('/'),
    children,
  };
}

/**
 * Parse a file tree drawn with Unicode (`│ ├── └──`) or ASCII (`| |-- `--`) glyphs.
 *
 * An unindented line without a branch starts a top-level entry. A branch line belongs to the
 * nearest earlier entry whose branch sits further left, so any consistent indentation width
 * works. Text after the first whitespace-preceded `#` is the annotation: a leading `[tag]`
 * becomes `ownership`, and the rest becomes `comment`.
 *
 * @throws {TreeParseError} for an empty tree, an indented line without a branch, an entry
 * without a name, or drawing characters left in a name.
 */
export function parseAsciiTree(source: string): ParsedFileTreeNode[] {
  const roots: MutableNode[] = [];
  const open: { column: number; node: MutableNode }[] = [];

  for (const [index, line] of source.split(/\r?\n/).entries()) {
    if (RAIL_ONLY.test(line)) continue;
    const branch = line.match(BRANCH);
    if (!branch) {
      if (/^\s/.test(line)) {
        throw new TreeParseError(`line ${index + 1} is indented but has no branch`, index + 1);
      }
      const node = parseEntry(line, index + 1);
      roots.push(node);
      open.length = 0;
      open.push({ column: -1, node });
      continue;
    }

    const column = branch[1].length;
    const node = parseEntry(branch[2], index + 1);
    while (open.length > 0 && open[open.length - 1].column >= column) open.pop();
    const parent = open[open.length - 1];
    if (parent) parent.node.children.push(node);
    else roots.push(node);
    open.push({ column, node });
  }

  if (roots.length === 0) throw new TreeParseError('the tree has no entries');
  return roots.map(freeze);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Escape a comment and turn backtick spans into inline code. */
function commentHtml(comment: string): string {
  return escapeHtml(comment).replace(/`([^`]+)`/g, '<code>$1</code>');
}

function isFolder(node: FileTreeNode): boolean {
  return node.folder ?? ((node.children?.length ?? 0) > 0 || String(node.name).endsWith('/'));
}

function renderItem(node: FileTreeNode): string {
  const children = node.children ?? [];
  const ownership = node.ownership ? escapeHtml(String(node.ownership)) : '';
  return `<li class="ns-file-tree__item"${ownership ? ` data-ownership="${ownership}"` : ''}>` +
    '<span class="ns-file-tree__row">' +
    '<svg class="ns-file-tree__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" ' +
    `stroke="currentColor" aria-hidden="true">${isFolder(node) ? FOLDER_ICON : FILE_ICON}</svg>` +
    `<span class="ns-file-tree__name">${escapeHtml(String(node.name))}</span>` +
    (node.comment
      ? `<span class="ns-file-tree__comment"> # ${commentHtml(String(node.comment))}</span>`
      : '') +
    (ownership ? `<span class="ns-file-tree__ownership"> [${ownership}]</span>` : '') +
    '</span>' +
    (children.length > 0 ? renderFileTree(children, { nested: true }) : '') +
    '</li>';
}

/**
 * Render the `fileTree` component markup: a read-only nested list with folder and file
 * icons, optional `# comment` notes and `[ownership]` tags. It is not an interactive ARIA tree.
 */
export function renderFileTree(
  nodes: readonly FileTreeNode[],
  options: RenderFileTreeOptions = {},
): string {
  const root = options.nested ? '' : ' tabindex="0" aria-label="Project files"' +
    (options.source === undefined
      ? ''
      : ` ${TREE_SOURCE_ATTRIBUTE}="${escapeHtml(options.source)}"`);
  const className = options.nested ? 'ns-file-tree' : 'ns-file-tree ns-file-tree--root';
  return `<ul class="${className}"${root}>${nodes.map(renderItem).join('')}</ul>`;
}

/** Render one fenced `tree` block body as the file tree component. */
export function renderTreeFence(content: string): string {
  const source = content.replace(/\s+$/, '');
  return renderFileTree(parseAsciiTree(source), { source });
}

interface FenceToken {
  info: string;
  readonly content: string;
  readonly map: readonly [number, number] | null;
}

type RenderRule = (
  tokens: FenceToken[],
  index: number,
  options: unknown,
  env: unknown,
  self: unknown,
) => string;

/** The part of a markdown-it instance this plugin touches. */
interface MarkdownItRenderer {
  readonly renderer: { rules: Record<string, RenderRule | undefined> };
}

/** Options for {@link fileTreeFence}. */
export interface FileTreeFenceOptions {
  /** Receives build warnings for trees that fall back to a plain text block. */
  readonly warn?: (message: string) => void;
}

/**
 * markdown-it plugin: render fenced `tree` blocks as the file tree component.
 *
 * A tree that cannot be parsed never stops the build: it renders through markdown-it's
 * original fence renderer as a plain `text` block, and the build warns with the page and line.
 * Typed loosely so this module stays free of the site's markdown-it import.
 */
export function fileTreeFence(instance: object, options: FileTreeFenceOptions = {}): void {
  const md = instance as MarkdownItRenderer;
  const warn = options.warn ?? ((message: string) => console.warn(message));
  const fallback = md.renderer.rules.fence;
  if (!fallback) throw new Error('markdown-it has no fence renderer to extend');
  md.renderer.rules.fence = (tokens, index, renderOptions, env, self) => {
    const token = tokens[index];
    if (token.info.trim().split(/\s+/, 1)[0] !== TREE_FENCE) {
      return fallback(tokens, index, renderOptions, env, self);
    }
    try {
      return `${renderTreeFence(token.content)}\n`;
    } catch (error) {
      if (!(error instanceof TreeParseError)) throw error;
      const filename = (env as { filename?: string } | undefined)?.filename ?? 'Markdown';
      const fence = (token.map?.[0] ?? 0) + 1;
      const line = error.line === undefined ? fence : fence + error.line;
      warn(`${filename}:${line}: tree fence ${error.message}; it renders as plain text.`);
      const info = token.info;
      token.info = 'text';
      try {
        return fallback(tokens, index, renderOptions, env, self);
      } finally {
        token.info = info;
      }
    }
  };
}
