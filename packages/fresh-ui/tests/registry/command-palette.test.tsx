import { assert, assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import { render } from 'npm:preact-render-to-string@^6.7.0';
import { CommandPalette } from '../../registry/components/ui/command-palette.tsx';

Deno.test('CommandPalette preserves item fields and escapes plain-text result content', () => {
  let selections = 0;
  const html = render(
    <CommandPalette
      scrim={false}
      groups={[{
        id: 'docs',
        label: 'Docs',
        items: [{
          id: 'guide /α#1',
          label: 'Guide',
          icon: '★',
          hash: '/guide',
          kind: 'Guide',
          type: 'page',
          url: '/docs/guide',
          excerpt: '<img src=x onerror=alert(1)>',
          shortcut: '⌘G',
          onSelect: () => selections++,
        }],
      }]}
    />,
  );
  for (
    const value of [
      'data-content="results"',
      'data-scrim="false"',
      'data-type="page"',
      'data-part="item-url"',
      'data-part="item-excerpt"',
      'data-part="item-shortcut"',
      'aria-label="Search commands"',
      'guide%20%2F%CE%B1%231',
      '&lt;img',
    ]
  ) assertStringIncludes(html, value);
  assert(!html.includes('<img'));
  assert(!html.includes('data-part="empty"'));
  assert(!html.includes('<dialog'));
  assertEquals(selections, 0);
});

Deno.test('CommandPalette derives empty/loading and retains a real listbox for aria-controls', () => {
  for (const loading of [false, true]) {
    const html = render(
      <CommandPalette
        scrim={false}
        loading={loading}
        groups={[]}
        emptyLabel='Nothing found'
        loadingLabel='Please wait'
        filters={<button type='button'>All</button>}
        footer='Keyboard help'
      />,
    );
    for (
      const value of [
        `data-content="${loading ? 'loading' : 'empty'}"`,
        'role="listbox"',
        'data-part="filters"',
        'data-part="footer"',
        loading ? 'Please wait' : 'Nothing found',
      ]
    ) assertStringIncludes(html, value);
    assert(!html.includes('role="option"'));
  }
});

Deno.test('CommandPalette keeps visible disabled options without registering activation', () => {
  const html = render(
    <CommandPalette
      scrim={false}
      groups={[{
        id: 'actions',
        items: [{ id: 'locked', label: 'Locked', disabled: true }, {
          id: 'next',
          label: 'Next',
          type: 'section',
        }],
      }]}
    />,
  );
  assertStringIncludes(html, 'aria-disabled="true"');
  assertStringIncludes(html, 'data-state="disabled"');
  assertStringIncludes(html, 'data-type="section"');
  assertEquals((html.match(/data-part="item-return"/g) ?? []).length, 1);
  assertStringIncludes(render(<CommandPalette scrim={false} open={false} groups={[]} />), 'hidden');
});

Deno.test('CommandPalette refuses ambiguous identifiers rather than selecting an arbitrary action', () => {
  for (
    const groups of [
      [{ id: 'same', items: [] }, { id: 'same', items: [] }],
      [{ id: ' ', items: [] }],
      [{ id: 'first', items: [{ id: 'same', label: 'A' }] }, {
        id: 'second',
        items: [{ id: 'same', label: 'B' }],
      }],
      [{ id: 'first', items: [{ id: ' ', label: 'A' }] }],
    ]
  ) assertThrows(() => render(<CommandPalette scrim={false} groups={groups} />), RangeError);
});
