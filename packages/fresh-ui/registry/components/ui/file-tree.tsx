/**
 * @component FileTree
 * @layer 2
 * @depends theme-seed, cn
 * @description Read-only native file lists with ownership annotations and caller labels.
 */
import type { ComponentChildren, JSX, VNode } from 'preact';
import { Icon } from '@netscript/fresh-ui/primitives';
import { cn } from '../../lib/cn.ts';

/** Caller-declared provenance, never a filesystem permission or scan result. */
export type FileTreeOwnership = 'none' | 'owned' | 'generated' | 'guidance';
/** A stable render identity and documentation label; only folders contain children. */
export type FileTreeEntry =
  & {
    readonly id: string;
    readonly name: ComponentChildren;
    readonly comment?: ComponentChildren;
    readonly ownership?: FileTreeOwnership;
    readonly tag?: string;
  }
  & ({ readonly type: 'file'; readonly children?: never } | {
    readonly type: 'folder';
    readonly children?: readonly FileTreeEntry[];
  });

/** The frame owns no selection, expanded state or tree keyboard manager. */
export interface FileTreeProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'role' | 'aria-label'> {
  items: readonly FileTreeEntry[];
  label?: string;
  tag?: boolean;
  typeLabels?: Partial<Readonly<Record<'folder' | 'file', string>>>;
  class?: string;
}
const OWNERSHIP_TAGS: Readonly<Record<FileTreeOwnership, string>> = {
  none: '',
  owned: '[owned]',
  generated: '[generated]',
  guidance: '[guidance]',
};
const TYPE_LABELS = { folder: 'Folder', file: 'File' } as const;

/** Validate only caller structure; no filesystem or content lookup is performed. */
function validateEntries(entries: readonly FileTreeEntry[]): void {
  const ids = new Set<string>();
  const ancestors = new Set<FileTreeEntry>();
  const visit = (entry: FileTreeEntry) => {
    if (ancestors.has(entry)) throw new TypeError('FileTree entries must not contain cycles');
    if (!entry.id.trim() || ids.has(entry.id)) {
      throw new TypeError('FileTree IDs must be unique and nonblank');
    }
    if (entry.type !== 'folder' && entry.type !== 'file') {
      throw new TypeError('FileTree entries must be folder or file');
    }
    if (entry.ownership !== undefined && !(Object.hasOwn(OWNERSHIP_TAGS, entry.ownership))) {
      throw new TypeError('Invalid FileTree ownership');
    }
    if (entry.type === 'file' && entry.children !== undefined) {
      throw new TypeError('FileTree files cannot contain children');
    }
    ids.add(entry.id);
    ancestors.add(entry);
    if (entry.type === 'folder') { for (const child of entry.children ?? []) visit(child); }
    ancestors.delete(entry);
  };
  for (const entry of entries) visit(entry);
}

/** All nodes remain visible; supplied native links keep their own focus and behavior. */
export function FileTree(
  { items, label = 'Project files', tag = true, typeLabels, class: className, ...props }:
    FileTreeProps,
): VNode {
  if (!label.trim()) throw new TypeError('FileTree label must name the list frame');
  validateEntries(items);
  const rows = (entries: readonly FileTreeEntry[]): VNode => (
    <ul role='list' data-scope='file-tree' data-part='list'>
      {entries.map((entry) => {
        const ownership = entry.ownership ?? 'none';
        const annotation = entry.tag ?? OWNERSHIP_TAGS[ownership];
        return (
          <li key={entry.id} role='listitem' data-scope='file-tree' data-part='node'>
            <div
              data-scope='file-tree'
              data-part='row'
              data-type={entry.type}
              data-ownership={ownership}
            >
              <span data-scope='file-tree' data-part='icon' aria-hidden='true'>
                <Icon name={entry.type === 'folder' ? 'folder' : 'file-text'} size={14} />
              </span>
              <span class='ns-file-tree__sr' data-scope='file-tree' data-part='type-label'>
                {typeLabels?.[entry.type]?.trim()
                  ? typeLabels[entry.type]
                  : TYPE_LABELS[entry.type]}
                {': '}
              </span>
              <span data-scope='file-tree' data-part='name'>{entry.name}</span>
              {entry.comment != null && (
                <span data-scope='file-tree' data-part='comment'>{entry.comment}</span>
              )}
              {annotation && (
                <span
                  data-scope='file-tree'
                  data-part='tag'
                  class={!tag ? 'ns-file-tree__sr' : undefined}
                >
                  {annotation}
                </span>
              )}
            </div>
            {entry.type === 'folder' && entry.children?.length ? rows(entry.children) : null}
          </li>
        );
      })}
    </ul>
  );
  return (
    <div
      {...props}
      role='group'
      aria-label={label}
      class={cn('ns-file-tree', className)}
      data-scope='file-tree'
      data-part='root'
    >
      {rows(items)}
    </div>
  );
}
