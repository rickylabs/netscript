import { assertEquals, assertStringIncludes } from '@std/assert';
import { render } from 'npm:preact-render-to-string@^6.7.0';
import { StatsGrid } from '../../registry/components/ui/stats-grid.tsx';
import type { StatsGridColumns, StatsGridProps } from '../../registry/components/ui/stats-grid.tsx';
import { componentContracts } from '../../contracts.ts';
import { renderedElements, renderViolations } from './contract-render.ts';
import { statsGridFixtures } from './utility-stats-grid.tsx';

const contract = componentContracts.components.find((item) => item.name === 'stats-grid')!;
Deno.test('StatsGrid public axes and optional parts satisfy strict render contracts', () => {
  for (const fixture of statsGridFixtures) {
    assertEquals(
      renderViolations(contract, fixture, render(<>{fixture.render!()}</>), true),
      [],
      fixture.scenario,
    );
  }
  for (const columns of [2, 3, 4] satisfies StatsGridColumns[]) {
    const props: StatsGridProps = {
      columns,
      children: <StatsGrid.Card label='Count' value={42} />,
    };
    const root = renderedElements(render(<StatsGrid {...props} />))[0];
    assertEquals(root['data-columns'], String(columns));
  }
});
Deno.test('StatsGrid defaults retain automatic fitting without Card-owned axes or empty slots', () => {
  const html = render(
    <StatsGrid id='metrics' class='host' style='max-width:360px'>
      <StatsGrid.Card label='<script>' value={0} class='host-card' />
    </StatsGrid>,
  );
  const elements = renderedElements(html).filter((e) => e['data-scope'] === 'stats-grid');
  assertEquals(elements.map((e) => e['data-part']), [
    'root',
    'card',
    'body',
    'header',
    'label',
    'value',
  ]);
  assertEquals(elements[0]['data-columns'], undefined);
  assertEquals(elements[0]['data-joined'], 'false');
  assertEquals(elements[1]['data-variant'], 'default');
  assertEquals(elements[1]['data-delta'], 'none');
  assertEquals(
    elements.some((e) =>
      e['data-state'] !== undefined || e['data-size'] !== undefined || e.tabindex !== undefined
    ),
    false,
  );
  assertStringIncludes(html, '&lt;script');
  assertEquals(html.includes('<script'), false);
  assertStringIncludes(html, '>0</p>');
  assertStringIncludes(html, 'ns-card ns-stats-grid__card host-card');
  assertStringIncludes(html, 'max-width:360px');
});
Deno.test('StatsGrid keeps zero-valued slots and makes optional decorations inert', () => {
  const html = render(
    <StatsGrid>
      <StatsGrid.Card
        label='Count'
        value={0}
        detail={0}
        badge={0}
        icon={0}
        sparkline={<button type='button'>Decorative child</button>}
        ticks={0}
        blockbars={false}
        delta='up'
      />
    </StatsGrid>,
  );
  const all = renderedElements(html).filter((e) => e['data-scope'] === 'stats-grid');
  assertEquals(
    all.filter((e) =>
      ['badge', 'detail', 'icon', 'sparkline', 'ticks', 'delta'].includes(e['data-part'])
    ).length,
    6,
  );
  assertEquals(all.some((e) => e['data-part'] === 'blockbars'), false);
  for (const part of ['icon', 'sparkline', 'ticks']) {
    const element = all.find((e) => e['data-part'] === part)!;
    assertEquals(element['aria-hidden'], 'true');
    assertEquals('inert' in element, true);
  }
  const fixture = statsGridFixtures[0];
  assertEquals(
    renderViolations(
      contract,
      fixture,
      render(<>{fixture.render!()}</>).replace('data-columns="2"', 'data-columns="5"'),
      true,
    ).some((e) => e.includes('invalid data-columns=5')),
    true,
  );
});
