import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { render } from 'npm:preact-render-to-string@^6.7.0';
import { componentContracts } from '../../contracts.ts';
import { Hero, type HeroProps } from '../../registry/components/ui/hero.tsx';
import { RuledGrid } from '../../registry/components/ui/ruled-grid.tsx';
import { renderedElements, renderViolations } from './contract-render.ts';
import { docsCompositionFixtures } from './utility-docs-composition.tsx';

type Assignable<A, B> = A extends B ? true : false;
const rejectsNumericHeading: Assignable<{ title: string; headingLevel: 2 }, HeroProps> = false;

Deno.test('Docs composition actual renders start strict and every declared axis is reachable', () => {
  assertEquals(rejectsNumericHeading, false);
  for (const fixture of docsCompositionFixtures) {
    const contract = componentContracts.components.find((c) => c.name === fixture.component)!;
    const html = render(<>{fixture.render!()}</>);
    assertEquals(renderViolations(contract, fixture, html), [], fixture.scenario);
    assert(!html.includes('tabindex'));
    for (const attribute of ['data-surprise', 'data-x-undeclared']) {
      assert(
        renderViolations(
          contract,
          fixture,
          html.replace('data-part="root"', 'data-part="root" ' + attribute + '="true"'),
        ).some((s) => s.includes('undeclared attribute')),
      );
    }
    assert(
      renderViolations(
        contract,
        fixture,
        html.replace('data-part="grid"', 'data-part="unknown"')
          .replace('data-part="layout"', 'data-part="unknown"'),
      ).some((s) => s.includes('part')),
    );
    assert(
      renderViolations(
        contract,
        fixture,
        html.replace('data-layout="', 'data-layout="invalid-')
          .replace('data-columns="', 'data-columns="invalid-'),
      ).some((s) => s.includes('invalid')),
    );
  }
});

Deno.test('Hero SSR rank changes neither slots nor responsive axis ownership', () => {
  for (const headingLevel of ['1', '2', '3', '4', '5', '6'] as const) {
    const html = render(<Hero title='Boundary' headingLevel={headingLevel} />);
    assertStringIncludes(html, '<h' + headingLevel + ' ');
    assert(!html.includes('data-breakpoint'));
    assert(!html.includes('data-part="aside"'));
    assert(!html.includes('data-part="path-stack"'));
    assertEquals(renderedElements(html)[0]['data-layout'], 'split');
  }
  const paths = render(<Hero title='Paths' paths={<a href='#owned'>Owned files</a>} />);
  assertStringIncludes(paths, 'data-part="aside"><div data-scope="hero" data-part="path-stack"');
  const aside = render(<Hero title='Aside' aside='Caller content' />);
  assertStringIncludes(aside, 'data-part="aside"');
  assert(!aside.includes('data-part="path-stack"'));
  const escaped = render(<Hero title='<script>unsafe</script>'>{'<b>escaped</b>'}</Hero>);
  assert(!escaped.includes('<script>'));
  assertStringIncludes(escaped, '&lt;script>');
});

Deno.test('Docs frames own scope/parts/axes without rewriting caller control semantics', () => {
  const html = render(
    <RuledGrid columns='4' variant='feature' data-scope='foreign' data-part='foreign'>
      <RuledGrid.Cell
        data-columns='2'
        data-variant='ruled'
        data-scope='foreign'
        data-part='foreign'
        title={<a href='#native'>Native link</a>}
        action={<button type='button'>Run</button>}
      />
    </RuledGrid>,
  );
  const elements = renderedElements(html);
  assertEquals(elements[0]['data-columns'], '4');
  assertEquals(elements[0]['data-variant'], 'feature');
  const cell = elements.find((e) => e['data-part'] === 'cell')!;
  assertEquals(cell['data-columns'], undefined);
  assertEquals(cell['data-variant'], undefined);
  assertEquals(cell['data-scope'], 'ruled-grid');
  assert(!html.includes('foreign'));
  assertStringIncludes(html, 'href="#native"');
  assertStringIncludes(html, 'type="button"');
  const hero = render(
    <Hero
      title='Title'
      data-layout='wrong'
      data-breakpoint='mobile'
      data-scope='foreign'
      data-part='foreign'
    />,
  );
  assertEquals(renderedElements(hero)[0]['data-layout'], 'split');
  assert(!hero.includes('data-breakpoint'));
  assert(!hero.includes('foreign'));
});
