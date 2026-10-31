import { assert, assertEquals, assertThrows } from '@std/assert';
import { createRef, Fragment, h } from 'preact';
import { render } from 'npm:preact-render-to-string@^6.7.0';
import { Direction, DirectionProvider } from '../../registry/components/ui/direction.tsx';
import { ScrollArea } from '../../registry/components/ui/scroll-area.tsx';
import { componentContracts } from '../../contracts.ts';
import { renderViolations } from './contract-render.ts';
import { nativeLayoutFixtures } from './utility-native-layout.tsx';

Deno.test('native layout uses strict data binding checks from its first shipped fixture', () => {
  for (const fixture of nativeLayoutFixtures) {
    const contract = componentContracts.components.find((c) => c.name === fixture.component)!;
    const html = render(<>{fixture.render!()}</>);
    assertEquals(renderViolations(contract, fixture, html), []);
    for (
      const addition of [
        'data-surprise="yes"',
        'data-x-hero="yes"',
        'data-surprise',
        'data-x-hero=yes',
      ]
    ) {
      assert(
        renderViolations(
          contract,
          fixture,
          html.replace('data-part="root"', `data-part="root" ${addition}`),
        )
          .some((e) => e.includes('undeclared attribute')),
      );
    }
    const axis = Object.keys(contract.attributes)[0];
    assert(
      renderViolations(contract, fixture, html.replace(`${axis}="`, `${axis}="unsupported-`))
        .some((e) => e.includes('invalid')),
    );
    if (fixture.component !== 'direction') {
      const childPart = fixture.component === 'scroll-area' ? 'viewport' : 'media';
      const value = contract.attributes[axis as `data-${string}`].values[0];
      assert(
        renderViolations(
          contract,
          fixture,
          html.replace(`data-part="${childPart}"`, `data-part="${childPart}" ${axis}="${value}"`),
        )
          .some((e) => e.includes('not allowed on this part')),
      );
    }
    assert(
      renderViolations(contract, { ...fixture, contextOnly: true, expectedHtml: html }, html)
        .length > 0,
    );
  }
});

Deno.test('Direction preserves the existing boundary identity and owns only direction/markers', () => {
  assertEquals(DirectionProvider, Direction);
  const ref = createRef<HTMLElement>();
  const handler = () => {};
  const style = { paddingInlineStart: 12 };
  const child = h('section', {
    key: 'boundary',
    ref,
    class: 'existing',
    style,
    onClick: handler,
    dir: 'ltr',
  });
  const result = Direction({ dir: 'rtl', children: child });
  assertEquals(result.type, 'section');
  assertEquals(result.key, child.key);
  assertEquals(result.ref, child.ref);
  assertEquals(result.props.class, 'existing');
  assertEquals(result.props.style, style);
  assertEquals(result.props.onClick, handler);
  assertEquals(result.props.dir, 'rtl');
  assertEquals(
    render(
      h(Direction, {
        dir: 'rtl',
        children: h('section', {}, h(Direction, { dir: 'ltr', children: h('div', {}, 'Local') })),
      }),
    ),
    '<section dir="rtl" data-dir="rtl" data-scope="direction" data-part="root"><div dir="ltr" data-dir="ltr" data-scope="direction" data-part="root">Local</div></section>',
  );
});

Deno.test('Direction rejects invalid and already scoped boundaries on the server', () => {
  for (
    const children of [
      null,
      [],
      'text',
      h(Fragment, {}),
      h(() => <div />, {}),
      h('div', { 'data-scope': 'button' }),
      h('div', { 'data-part': 'root' }),
    ]
  ) {
    assertThrows(() => Reflect.apply(Direction, undefined, [{ children }]), TypeError);
  }
});

Deno.test('ScrollArea rejects an empty viewport name', () => {
  assertThrows(() => ScrollArea({ label: '  ' }), TypeError, 'name the native viewport');
});

Deno.test('Direction as forwards native props/ref/handlers and supports nested precompiled JSX', () => {
  const ref = createRef<HTMLElement>();
  const handler = () => {};
  const result = Direction({
    as: 'section',
    dir: 'rtl',
    class: 'existing',
    boundaryRef: ref,
    onClick: handler,
    children: 'Content',
  });
  assertEquals(result.type, 'section');
  assertEquals(result.ref, ref);
  assertEquals(result.props.class, 'existing');
  assertEquals(result.props.onClick, handler);
  assertEquals(result.props.dir, 'rtl');
  const html = render(
    <Direction as='section' dir='rtl'>
      <Direction as='div' dir='ltr'>
        <input aria-label='Search' />
      </Direction>
    </Direction>,
  );
  assertEquals(
    html,
    '<section dir="rtl" data-dir="rtl" data-scope="direction" data-part="root"><div dir="ltr" data-dir="ltr" data-scope="direction" data-part="root"><input aria-label="Search"></div></section>',
  );
  const contract = componentContracts.components.find((c) => c.name === 'direction')!;
  const fixture = {
    component: 'direction',
    scenario: 'nested-precompiled-boundaries',
    props: ['as', 'dir', 'children'],
  };
  assertEquals(renderViolations(contract, fixture, html), []);
  assert(
    renderViolations(contract, fixture, html + html).some((e) => e.includes('duplicate root')),
  );
  for (
    const bad of [{ as: 'script', children: 'x' }, { as: () => h('div', {}), children: 'x' }, {
      as: 'div',
      'data-scope': 'button',
      children: 'x',
    }]
  ) {
    assertThrows(() => Reflect.apply(Direction, undefined, [bad]), TypeError);
  }
});
