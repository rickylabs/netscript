import { assertEquals, assertStringIncludes } from '@std/assert';
import { render } from 'npm:preact-render-to-string@^6.7.0';
import { Accordion } from '../../../src/runtime/accordion/Accordion.tsx';

Deno.test('Accordion renders a typed summary trigger with disabled item semantics', () => {
  let clickCount = 0;
  const html = render(
    <Accordion.Root>
      <Accordion.Item disabled value='profile'>
        <Accordion.ItemTrigger
          onClick={(event) => {
            assertEquals(event.currentTarget.localName, 'summary');
            clickCount += 1;
          }}
        >
          Profile
        </Accordion.ItemTrigger>
        <Accordion.ItemContent>Profile settings</Accordion.ItemContent>
      </Accordion.Item>
    </Accordion.Root>,
  );

  assertStringIncludes(html, '<summary');
  assertStringIncludes(html, 'aria-disabled="true"');
  assertStringIncludes(html, 'role="button"');
  assertEquals(clickCount, 0, 'server rendering must register but not invoke the click handler');
});
