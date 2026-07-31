import { assert, assertEquals } from '@std/assert';
import { ACTION_MENU_ITEM_INTENTS } from '../../../src/runtime/action-menu/action-menu.types.ts';

Deno.test('ActionMenu publishes default and destructive item intents', () => {
  assertEquals(ACTION_MENU_ITEM_INTENTS, ['default', 'destructive']);
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
