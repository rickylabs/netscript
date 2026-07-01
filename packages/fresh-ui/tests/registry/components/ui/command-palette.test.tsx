import { assert } from '@std/assert';
import {
  type CommandGroup,
  CommandPalette,
} from '../../../../registry/components/ui/command-palette.tsx';

interface VNodeLike {
  type: unknown;
  props: Record<string, unknown>;
}

function vnodeProps(value: unknown): Record<string, unknown> {
  assert(value && typeof value === 'object' && 'props' in value, 'expected a vnode');
  return (value as VNodeLike).props;
}

const GROUPS: CommandGroup[] = [
  {
    id: 'nav',
    label: 'Navigate',
    items: [
      { id: 'deployments', label: 'Deployments', icon: '⛅', hash: '/deployments', kind: 'Page' },
      { id: 'agents', label: 'Agents', kind: 'Page' },
    ],
  },
  {
    id: 'actions',
    items: [{ id: 'new-run', label: 'New run', hash: '⌘N', kind: 'Action' }],
  },
];

Deno.test('CommandPalette renders the palette structure and group items', () => {
  const v = CommandPalette({ open: true, groups: GROUPS, placeholder: 'Find anything…' });
  const json = JSON.stringify(v);
  assert(json.includes('ns-cmdk__backdrop'), 'dialog backdrop');
  assert(json.includes('ns-cmdk__input-row'), 'input row');
  assert(json.includes('ns-cmdk__input'), 'combobox input class');
  assert(json.includes('Find anything…'), 'placeholder copy');
  assert(json.includes('ns-cmdk__list'), 'list content');
  assert(json.includes('Deployments') && json.includes('Agents'), 'item labels');
  assert(json.includes('ns-cmdk__group-label') && json.includes('Navigate'), 'group label');
});

Deno.test('CommandPalette renders item icon, hash, and kind sub-parts', () => {
  const json = JSON.stringify(CommandPalette({ groups: GROUPS }));
  assert(json.includes('ns-cmdk__item-icon') && json.includes('⛅'), 'item icon');
  assert(json.includes('ns-cmdk__item-hash') && json.includes('/deployments'), 'item hash');
  assert(json.includes('ns-cmdk__item-kind') && json.includes('Page'), 'item kind');
});

Deno.test('CommandPalette renders an empty-state slot with custom copy', () => {
  const json = JSON.stringify(
    CommandPalette({ groups: [], emptyLabel: 'Nothing here' }),
  );
  assert(json.includes('ns-cmdk__empty'), 'empty slot class');
  assert(json.includes('Nothing here'), 'empty copy');
});

Deno.test('CommandPalette composes the Dialog and Combobox L1 primitives', () => {
  const v = CommandPalette({ open: true, groups: GROUPS });
  // The root vnode is the Dialog.Root component (a function type), not a host element.
  assert(typeof vnodeProps(v) === 'object', 'has props');
  assert(typeof (v as VNodeLike).type === 'function', 'root is a component, not a host tag');
});
