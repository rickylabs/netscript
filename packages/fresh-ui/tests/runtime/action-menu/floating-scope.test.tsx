import { assert, assertEquals } from '@std/assert';
import { render } from 'npm:preact-render-to-string@^6.7.0';
import { ActionMenu } from '../../../src/runtime/action-menu/ActionMenu.tsx';
import { renderedElements } from '../../contracts/contract-render.ts';

Deno.test('ActionMenu preserves the floating stylesheet scope for every rendered part', async () => {
  const html = render(
    <ActionMenu.Root defaultOpen>
      <ActionMenu.Trigger>Actions</ActionMenu.Trigger>
      <ActionMenu.Content>
        <ActionMenu.Item>Edit</ActionMenu.Item>
        <ActionMenu.Separator />
      </ActionMenu.Content>
    </ActionMenu.Root>,
  );
  const parts = renderedElements(html).filter((element) => element['data-part']);
  assertEquals(parts.map((element) => element['data-part']), [
    'trigger',
    'content',
    'item',
    'separator',
  ]);
  for (const element of parts) assertEquals(element['data-scope'], 'popover');
  const css = await Deno.readTextFile(
    new URL('../../../registry/components/ui/floating.css', import.meta.url),
  );
  const content = parts.find((element) => element['data-part'] === 'content')!;
  assertEquals(content['data-state'], 'open');
  assertEquals(content['popover'], 'auto');
  assert(css.includes(`[data-scope='${content['data-scope']}'][data-part='content']`));
});
