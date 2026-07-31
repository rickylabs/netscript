import { assert, assertEquals } from '@std/assert';
import {
  activateActionMenuItem,
  navigateActionMenu,
} from '../../../src/runtime/action-menu/ActionMenu.tsx';
import { ACTION_MENU_ITEM_INTENTS } from '../../../src/runtime/action-menu/action-menu.types.ts';

Deno.test('ActionMenu publishes default and destructive item intents', () => {
  assertEquals(ACTION_MENU_ITEM_INTENTS, ['default', 'destructive']);
});

Deno.test('ActionMenu item activation is isolated and closes the menu', () => {
  let stopped = false;
  let closed = false;
  activateActionMenuItem({ stopPropagation: () => stopped = true }, () => closed = true);
  assertEquals({ stopped, closed }, { stopped: true, closed: true });
});

Deno.test('ActionMenu traverses enabled items with Arrow/Home/End keys', () => {
  let focused = '';
  const item = (id: string, disabled = false): HTMLButtonElement =>
    Object.assign(Object.create(null), {
      getAttribute: (name: string) => name === 'aria-disabled' && disabled ? 'true' : null,
      focus: () => focused = id,
    });
  const first = item('first');
  const disabled = item('disabled', true);
  const last = item('last');
  const menu: HTMLElement = Object.assign(Object.create(null), {
    querySelectorAll: () => [first, disabled, last],
  });
  let prevented = false;
  const event: KeyboardEvent = Object.assign(Object.create(null), {
    key: 'End',
    target: first,
    preventDefault: () => prevented = true,
  });
  assertEquals(navigateActionMenu(event, menu), true);
  assertEquals({ focused, prevented }, { focused: 'last', prevented: true });
});

Deno.test('ActionMenu source composes package runtime without new global listeners', async () => {
  const source = await Deno.readTextFile(
    new URL('../../../src/runtime/action-menu/ActionMenu.tsx', import.meta.url),
  );
  assert(source.includes('usePopover('));
  assert(source.includes('getNextCollectionIndex('));
  assert(!source.includes('document.addEventListener'));
  assert(!source.includes('globalThis.addEventListener'));
});
