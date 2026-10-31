import { assertEquals, assertStringIncludes } from '@std/assert';
import { render } from 'npm:preact-render-to-string@^6.7.0';
import { componentContracts } from '../../contracts.ts';
import { DataTable } from '../../registry/components/ui/data-table.tsx';
import { dataTableFixtures } from './utility-data-table.tsx';
import { renderedElements, renderViolations } from './contract-render.ts';

const contract = componentContracts.components.find((item) => item.name === 'data-table')!;
Deno.test('DataTable and DataGrid real compound/state renders satisfy the strict canonical contract', () => {
  for (const fixture of dataTableFixtures) {
    assertEquals(
      renderViolations(contract, fixture, render(<>{fixture.render!()}</>), true),
      [],
      fixture.scenario,
    );
  }
});
Deno.test('DataTable owns canonical state without leaking Card axes and preserves zero content', () => {
  const html = render(
    <DataTable state='loading' interactive id='orders' class='host' style='max-width:320px'>
      <DataTable.Header>Header</DataTable.Header>
      <DataTable.Body>{0}</DataTable.Body>
      <DataTable.Footer>Footer</DataTable.Footer>
    </DataTable>,
  );
  const elements = renderedElements(html).filter((e) => e['data-scope'] === 'data-table');
  assertEquals(elements.map((e) => e['data-part']), ['root', 'header', 'body', 'footer']);
  assertEquals(elements[0]['data-state'], 'loading');
  assertEquals(elements[0]['aria-busy'], 'true');
  assertEquals(elements[0]['data-interactive'], 'true');
  assertEquals(
    elements.some((e) => e['data-size'] !== undefined || e['data-variant'] !== undefined),
    false,
  );
  assertStringIncludes(html, 'ns-card ns-data-table host');
  assertStringIncludes(html, '>0</div>');
  assertStringIncludes(html, 'max-width:320px');
  const root = renderedElements(render(<DataTable>Content</DataTable>))[0];
  assertEquals(root['data-state'], 'default');
  assertEquals(root['data-interactive'], undefined);
  assertEquals(root['aria-busy'], undefined);
});
Deno.test('DataTable.Row preserves native string styles while owning its explicit cols', () => {
  const html = render(
    <DataTable.Row cols='1fr 2fr' style='opacity:0.5;grid-template-columns:1fr'>
      Content
    </DataTable.Row>,
  );
  assertStringIncludes(html, 'opacity:0.5;grid-template-columns:1fr;grid-template-columns:1fr 2fr');
});
