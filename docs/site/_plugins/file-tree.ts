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

/** Indentation made of rails and spaces, then a `├──` or `└──` branch glyph. */
const BRANCH = /^([\s│]*)[├└]─+[ \t]?(.*)$/;
/** A line holding only rails, kept by some authors as vertical spacing. */
const RAIL_ONLY = /^[\s│]*$/;
/** The annotation starts at the first `#` preceded by whitespace. */
const ANNOTATION = /\s#(?=\s|$)/;
const OWNERSHIP = /^\[([^\]]+)\]\s*(.*)$/;

interface MutableNode {
  name: string;
  comment?: string;
  ownership?: string;
  children: MutableNode[];
}

function parseEntry(text: string, line: number): MutableNode {
  const annotationAt = text.search(ANNOTATION);
  const name = (annotationAt < 0 ? text : text.slice(0, annotationAt)).trim();
  if (!name) throw new Error(`Tree line ${line} has no name`);
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
 * Parse an ASCII file tree drawn with `│`, `├──` and `└──`.
 *
 * A line without a branch glyph starts a top-level entry. A branch line belongs to the
 * nearest earlier entry whose glyph sits further left, so any consistent indentation width
 * works. Text after the first whitespace-preceded `#` is the annotation: a leading
 * `[tag]` becomes `ownership`, and the rest becomes `comment`.
 */
export function parseAsciiTree(source: string): ParsedFileTreeNode[] {
  const roots: MutableNode[] = [];
  const open: { column: number; node: MutableNode }[] = [];

  for (const [index, line] of source.split(/\r?\n/).entries()) {
    if (RAIL_ONLY.test(line)) continue;
    const branch = line.match(BRANCH);
    if (!branch) {
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

  if (roots.length === 0) throw new Error('Tree fence has no entries');
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
  readonly info: string;
  readonly content: string;
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

/**
 * markdown-it plugin: render fenced `tree` blocks as the file tree component.
 * Typed loosely so this module stays free of the site's markdown-it import.
 */
export function fileTreeFence(instance: object): void {
  const md = instance as MarkdownItRenderer;
  const fallback = md.renderer.rules.fence;
  if (!fallback) throw new Error('markdown-it has no fence renderer to extend');
  md.renderer.rules.fence = (tokens, index, options, env, self) => {
    const token = tokens[index];
    if (token.info.trim().split(/\s+/, 1)[0] !== TREE_FENCE) {
      return fallback(tokens, index, options, env, self);
    }
    const filename = (env as { filename?: string } | undefined)?.filename;
    try {
      return `${renderTreeFence(token.content)}\n`;
    } catch (error) {
      const where = filename ? ` in ${filename}` : '';
      throw new Error(`Invalid tree fence${where}: ${(error as Error).message}`);
    }
  };
}
