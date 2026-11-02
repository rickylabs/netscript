import { assert } from '@std/assert';
import { render } from 'npm:preact-render-to-string@^6.7.0';
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
  const json = render(<CommandPalette open groups={GROUPS} placeholder='Find anything…' />);
  assert(json.includes('ns-cmdk__backdrop'), 'dialog backdrop');
  assert(json.includes('ns-cmdk__input-row'), 'input row');
  assert(json.includes('ns-cmdk__input'), 'combobox input class');
  assert(json.includes('Find anything…'), 'placeholder copy');
  assert(json.includes('ns-cmdk__list'), 'list content');
  assert(json.includes('Deployments') && json.includes('Agents'), 'item labels');
  assert(json.includes('ns-cmdk__group-label') && json.includes('Navigate'), 'group label');
});

Deno.test('CommandPalette renders item icon, hash, and kind sub-parts', () => {
  const json = render(<CommandPalette groups={GROUPS} />);
  assert(json.includes('ns-cmdk__item-icon') && json.includes('⛅'), 'item icon');
  assert(json.includes('ns-cmdk__item-hash') && json.includes('/deployments'), 'item hash');
  assert(json.includes('ns-cmdk__item-kind') && json.includes('Page'), 'item kind');
});

Deno.test('CommandPalette renders an empty-state slot with custom copy', () => {
  const json = render(<CommandPalette groups={[]} emptyLabel='Nothing here' />);
  assert(json.includes('ns-cmdk__empty'), 'empty slot class');
  assert(json.includes('Nothing here'), 'empty copy');
});

Deno.test('CommandPalette renders native dialog and combobox accessibility boundaries', () => {
  const html = render(<CommandPalette open groups={GROUPS} />);
  for (
    const attribute of [
      '<dialog',
      'role="dialog"',
      'role="combobox"',
      'role="listbox"',
      'aria-controls=',
      'aria-labelledby=',
    ]
  ) assert(html.includes(attribute), attribute);
});

Deno.test('CommandPalette preserves scaffold dismiss and keyboard-help behavior', () => {
  const html = render(<CommandPalette open groups={GROUPS} />);
  assert(html.includes('Close command palette'), 'visible dismiss control');
  assert(html.includes('Command keyboard help'), 'keyboard instructions');
  assert(!html.includes('No matching commands'), 'populated palette has no empty message');
  const inline = render(<CommandPalette scrim={false} groups={GROUPS} footer={false} />);
  assert(
    !inline.includes('Close command palette'),
    'inline composition has no modal close controller',
  );
  assert(!inline.includes('Command keyboard help'), 'explicit caller footer refusal is preserved');
});
