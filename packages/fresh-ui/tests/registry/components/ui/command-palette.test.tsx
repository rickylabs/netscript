import { h } from 'preact';
import { render as renderToString } from 'npm:preact-render-to-string@^6.7.0';
import { assert } from '@std/assert';
import {
  type CommandGroup,
  CommandPalette,
} from '../../../../registry/components/ui/command-palette.tsx';

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
  const json = renderToString(
    h(CommandPalette, { open: true, groups: GROUPS, placeholder: 'Find anything…' }),
  );
  assert(json.includes('ns-cmdk__backdrop'), 'dialog backdrop');
  assert(json.includes('ns-cmdk__input-row'), 'input row');
  assert(json.includes('ns-cmdk__input'), 'combobox input class');
  assert(json.includes('Find anything…'), 'placeholder copy');
  assert(json.includes('ns-cmdk__list'), 'list content');
  assert(json.includes('Deployments') && json.includes('Agents'), 'item labels');
  assert(json.includes('ns-cmdk__group-label') && json.includes('Navigate'), 'group label');
});

Deno.test('CommandPalette renders item icon, hash, and kind sub-parts', () => {
  const json = renderToString(h(CommandPalette, { groups: GROUPS }));
  assert(json.includes('ns-cmdk__item-icon') && json.includes('⛅'), 'item icon');
  assert(json.includes('ns-cmdk__item-hash') && json.includes('/deployments'), 'item hash');
  assert(json.includes('ns-cmdk__item-kind') && json.includes('Page'), 'item kind');
});

Deno.test('CommandPalette renders an empty-state slot with custom copy', () => {
  const json = renderToString(h(CommandPalette, { groups: [], emptyLabel: 'Nothing here' }));
  assert(json.includes('ns-cmdk__empty'), 'empty slot class');
  assert(json.includes('Nothing here'), 'empty copy');
});

Deno.test('CommandPalette composes native dialog and combobox without a false empty state', () => {
  const html = renderToString(h(CommandPalette, { open: true, groups: GROUPS }));
  assert(html.includes('<dialog'), 'native dialog');
  assert(html.includes('role="combobox"'), 'keyboard combobox');
  assert(html.includes('Close command palette'), 'visible dismiss control');
  assert(html.includes('Command keyboard help'), 'keyboard instructions');
  assert(!html.includes('No matching commands'), 'populated palette has no empty message');
});
