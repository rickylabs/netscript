import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { render } from 'npm:preact-render-to-string@^6.7.0';
import { h } from 'preact';
import { Toc, type TocItemProps } from '../../registry/components/ui/toc.tsx';
import { AnchorNav, type AnchorNavProps } from '../../registry/components/ui/anchor-nav.tsx';
import { sectionId } from '../../registry/lib/section-navigation.ts';
import { componentContracts } from '../../contracts.ts';
import { renderedElements, renderViolations } from './contract-render.ts';
import { docsNavigationFixtures } from './utility-docs-navigation.tsx';

type Assignable<A, B> = A extends B ? true : false;
const observeRejectsState: Assignable<
  { observe: true; state: 'scrolled'; children: null },
  AnchorNavProps
> = false;
const itemRejectsCurrent: Assignable<
  { href: string; children: null; state: 'current' },
  TocItemProps
> = false;

Deno.test('Docs navigation types prevent competing observed state and writable Item current', () => {
  assertEquals(observeRejectsState, false);
  assertEquals(itemRejectsCurrent, false);
});

Deno.test('Document navigation starts strict with actual native semantics and all renderable axes', () => {
  const values = new Set<string>();
  for (const fixture of docsNavigationFixtures) {
    const contract = componentContracts.components.find((c) => c.name === fixture.component)!;
    const html = render(<>{fixture.render!()}</>);
    assertEquals(renderViolations(contract, fixture, html), [], fixture.scenario);
    assert(!html.includes('role="tab'));
    assert(!html.includes('tabindex'));
    for (const e of renderedElements(html)) {
      if (e['data-scope'] === 'toc' && e['data-part'] === 'item') values.add(e['data-state']);
    }
    for (const attribute of ['data-surprise', 'data-x-undeclared']) {
      assert(
        renderViolations(
          contract,
          fixture,
          html.replace('data-part="root"', 'data-part="root" ' + attribute + '="true"'),
        ).some((e) => e.includes('undeclared attribute')),
      );
    }
    assert(
      renderViolations(contract, fixture, html.replace('data-state="', 'data-state="invalid-'))
        .some((e) => e.includes('invalid')),
    );
    assert(
      renderViolations(contract, { ...fixture, contextOnly: true, expectedHtml: html }, html)
        .length > 0,
    );
  }
  assertEquals([...values].sort(), ['current', 'hover', 'rest']);
});

Deno.test('Toc SSR is useful desktop by default, mobile native details starts closed and null stays controlled', () => {
  for (const currentId of [undefined, null, 'install'] as const) {
    const html = render(
      <Toc currentId={currentId} defaultCurrentId='install'>
        <Toc.Item href='#install'>Installation</Toc.Item>
      </Toc>,
    );
    assertStringIncludes(html, '<nav');
    assertStringIncludes(html, 'data-breakpoint="desktop"');
    assert(!html.includes('<details'));
    assertEquals(html.includes('aria-current="location"'), currentId !== null);
  }
  const plain = render(
    <Toc>
      <Toc.Item href='#install'>Installation</Toc.Item>
    </Toc>,
  );
  assert(!plain.includes('data-part="marker"'));
  const mobile = render(
    <Toc breakpoint='mobile'>
      <Toc.Item href='#install'>Installation</Toc.Item>
    </Toc>,
  );
  assertStringIncludes(mobile, '<details>');
  assertStringIncludes(mobile, '<summary');
  assert(!mobile.includes(' open'));
});

Deno.test('Navigation owns aria-current and part/axis markers after native attribute spreading', () => {
  const toc = render(
    <Toc currentId='install'>
      <Toc.Item
        href='#install'
        state='hover'
        aria-current='page'
        data-scope='foreign'
        data-part='foreign'
        data-state='hover'
        data-level='wrong'
      >
        Install &amp; configure
      </Toc.Item>
      <Toc.Item href='#other' aria-current='page'>Other</Toc.Item>
    </Toc>,
  );
  const items = renderedElements(toc).filter((e) => e['data-part'] === 'item');
  assertEquals(items.map((e) => e['aria-current']), ['location', undefined]);
  assertEquals(items[0]['data-state'], 'current');
  assertEquals(items[0]['data-level'], '2');
  assertEquals(items[0]['data-scope'], 'toc');
  assert(!toc.includes('foreign'));
  const anchor = render(
    <AnchorNav>
      <AnchorNav.Link
        href='#install'
        aria-current='page'
        data-state='current'
        data-level='2'
        data-scope='foreign'
        data-part='foreign'
      >
        Install
      </AnchorNav.Link>
    </AnchorNav>,
  );
  const link = renderedElements(anchor).find((e) => e['data-part'] === 'anchor')!;
  for (const name of ['aria-current', 'data-state', 'data-level']) {
    assertEquals(link[name], undefined);
  }
  assertEquals(link['data-scope'], 'anchor-nav');
});

Deno.test('AnchorNav SSR snapshots and observation have explicit state precedence', () => {
  for (const state of [undefined, 'rest', 'scrolled'] as const) {
    const html = render(
      <AnchorNav state={state}>
        <AnchorNav.Link href='#install'>Install</AnchorNav.Link>
      </AnchorNav>,
    );
    assertEquals(renderedElements(html)[0]['data-state'], state ?? 'rest');
  }
  const invalid = {
    observe: true,
    state: 'scrolled',
    children: <AnchorNav.Link href='#install'>Install</AnchorNav.Link>,
  };
  const html = render(Reflect.apply(h, undefined, [AnchorNav, invalid]));
  assertEquals(renderedElements(html)[0]['data-state'], 'rest');
});

Deno.test('Section IDs safely decode only same-document fragments without CSS selector interpolation', () => {
  const base = 'https://docs.example/guide?scheme=dark';
  for (const href of ['#install', '/guide?scheme=dark#install', base + '#install']) {
    assertEquals(sectionId(href, base), 'install');
  }
  assertEquals(sectionId('#a%20%22%5B%5D', base), 'a "[]');
  for (
    const href of [
      '#',
      '#%XX',
      '/elsewhere#install',
      'https://other.example/guide#install',
      '/guide?scheme=light#install',
    ]
  ) assertEquals(sectionId(href, base), null);
  assertEquals(sectionId('/guide#install'), null);
});
