import { assert, assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import { render } from 'npm:preact-render-to-string@^6.7.0';
import { FilePathChip } from '../../registry/components/ui/file-path-chip.tsx';
import { AttributeChip } from '../../registry/components/ui/attribute-chip.tsx';
import { FileTree } from '../../registry/components/ui/file-tree.tsx';
import { Figure } from '../../registry/components/ui/figure.tsx';
import { ICON_PATHS } from '../../primitives.tsx';
import { componentContracts } from '../../contracts.ts';
import { renderedElements, renderViolations } from './contract-render.ts';
import { docsStructureFixtures } from './utility-docs-structure.tsx';

Deno.test('Docs structures start strict and reject undeclared attributes, invalid axes and context bypasses', () => {
  for (const fixture of docsStructureFixtures.filter((f) => f.component !== 'icon')) {
    const c = componentContracts.components.find((c) => c.name === fixture.component)!;
    const html = render(<>{fixture.render!()}</>);
    assertEquals(renderViolations(c, fixture, html), []);
    for (const name of ['data-surprise', 'data-x-undocumented']) {
      assert(
        renderViolations(
          c,
          fixture,
          html.replace('data-part="root"', 'data-part="root" ' + name + '="true"'),
        ).some((e) => e.includes('undeclared attribute')),
      );
    }
    const axis = Object.keys(c.attributes)[0];
    if (axis) {
      assert(
        renderViolations(c, fixture, html.replace(axis + '="', axis + '="unsupported-')).some((e) =>
          e.includes('invalid')
        ),
      );
    }
    assert(
      renderViolations(c, { ...fixture, contextOnly: true, expectedHtml: html }, html).length > 0,
    );
  }
});
Deno.test('Folder is a real public glyph in the canonical Icon vocabulary', () => {
  const names = componentContracts.components.find((c) => c.name === 'icon')!.props.name.values!;
  assertEquals([...names].sort(), Object.keys(ICON_PATHS).sort());
  const fixture = docsStructureFixtures.find((f) => f.component === 'icon')!;
  const html = render(<>{fixture.render!()}</>);
  assertStringIncludes(html, '<svg');
  assertStringIncludes(html, '<path');
  assert(!html.includes('undefined'));
  assert(ICON_PATHS.folder.length > 0);
});
Deno.test('Path SSR is escaped exact text, never fake Copied, with useful native button description', () => {
  const path = 'apps/a "<script>&"/file.ts';
  const html = render(<FilePathChip path={path} />);
  assert(!html.includes('<script>'));
  assertStringIncludes(html, '&lt;script>');
  const elements = renderedElements(html);
  const code = elements.find((e) => e['data-part'] === 'path')!;
  const button = elements.find((e) => e['data-part'] === 'copy')!;
  assertEquals(button.type, 'button');
  assertEquals(button['aria-label'], 'Copy path');
  assertEquals(button['aria-describedby'], code.id);
  assertEquals(
    elements.find((e) =>
      e['data-part'] === 'root' && e['data-scope'] === 'file-path-chip'
    )!['data-state'],
    'rest',
  );
  assert(!html.includes('Path copied'));
  const noCopy = render(<FilePathChip path='' copy={false} />);
  assert(!noCopy.includes('<button'));
  assert(!noCopy.includes('tabindex'));
});
Deno.test('AttributeChip stringifies and quotes scalars while escaping markup as text', () => {
  for (const value of [0, false, true, null, '', 'a "<script>&\nline']) {
    const html = render(<AttributeChip name='data-example' value={value} />);
    assert(!html.includes('<script>'));
    assertStringIncludes(html, 'data-part="value"');
    if (typeof value !== 'string' || !value.includes('<')) {
      assertStringIncludes(html, JSON.stringify(String(value)).replaceAll('"', '&quot;'));
    }
    assert(!html.includes('tabindex'));
  }
});
Deno.test('FileTree is a native nested list with visible-independent type/ownership meaning', () => {
  const html = render(
    <FileTree
      tag={false}
      items={[{
        id: 'folder',
        type: 'folder',
        name: 'routes/',
        ownership: 'owned',
        tag: '[owned config]',
        comment: 0,
        children: [{
          id: 'file',
          type: 'file',
          name: <a href='#guide'>index.tsx</a>,
          ownership: 'generated',
        }],
      }]}
    />,
  );
  const all = renderedElements(html);
  assertEquals(all.filter((e) => e.role === 'list').length, 2);
  assertEquals(all.filter((e) => e.role === 'listitem').length, 2);
  assert(
    !all.some((e) =>
      e.role === 'tree' || e.role === 'treeitem' || 'aria-expanded' in e || 'aria-selected' in e
    ),
  );
  assertStringIncludes(html, 'Folder');
  assertStringIncludes(html, 'File');
  assertStringIncludes(html, '[owned config]');
  assertStringIncludes(html, '[generated]');
  assertStringIncludes(html, 'data-part="comment">0');
  assertStringIncludes(html, 'href="#guide"');
  assert(!html.includes('tabindex'));
  for (const row of all.filter((e) => e['data-part'] === 'row')) {
    assert(row['data-type'] && row['data-ownership']);
  }
});
Deno.test('FileTree rejects malformed structures without filesystem work or infinite recursion', () => {
  const same = { id: 'same', type: 'file', name: 'One' };
  const cycle: { id: string; type: string; name: string; children: unknown[] } = {
    id: 'cycle',
    type: 'folder',
    name: 'Folder',
    children: [],
  };
  cycle.children.push(cycle);
  for (
    const items of [[same, same], [{ id: ' ', type: 'file', name: 'Empty' }], [cycle], [{
      id: 'file',
      type: 'file',
      name: 'File',
      children: [],
    }], [{ id: 'bad', type: 'file', name: 'Bad', ownership: 'toString' }]]
  ) {
    assertThrows(() => Reflect.apply(FileTree, undefined, [{ items }]), TypeError);
  }
});
Deno.test('Figure uses native media/caption semantics, preserves zero and adds no placeholder or tab stop', () => {
  const html = render(
    <Figure width='wide' media='diagram' caption={0}>
      <svg role='img' aria-label='Named diagram' viewBox='0 0 320 160'>
        <path d='M0 80H320' />
      </svg>
    </Figure>,
  );
  assertStringIncludes(html, '<figure');
  assertStringIncludes(html, '<figcaption');
  assertStringIncludes(html, 'data-part="caption">0');
  assertStringIncludes(html, 'aria-label="Named diagram"');
  assert(!html.includes('tabindex'));
  assert(!html.includes('placeholder'));
  const emptyCaption = render(
    <Figure caption=''>
      <img src='image.svg' alt='Named image' />
    </Figure>,
  );
  assertStringIncludes(emptyCaption, '<figcaption');
});
