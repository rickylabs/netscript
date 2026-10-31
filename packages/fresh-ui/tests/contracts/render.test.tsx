import { assert, assertEquals } from '@std/assert';
import { render } from 'npm:preact-render-to-string@^6.7.0';
import { componentContracts } from '../../contracts.ts';
import { proseFixture } from './utility-prose.ts';
import { basicFixtures } from './utility-basic.tsx';
import { compositeFixtures } from './utility-composites.tsx';
import { renderViolations } from './contract-render.ts';
import type { ContractStyleProvider } from './style-provider.ts';

export const utility: ContractStyleProvider = {
  style: 'Utility',
  fixtures: [...basicFixtures, ...compositeFixtures, proseFixture],
};
for (const fixture of utility.fixtures) {
  Deno.test(`${utility.style}: ${fixture.component}/${fixture.scenario} conforms to the shared contract`, async () => {
    const contract = componentContracts.components.find((contract) =>
      contract.name === fixture.component
    );
    assert(contract?.shipped, 'fixture must name a shipped contract');
    assertEquals(
      renderViolations(
        contract,
        fixture,
        fixture.renderHtml ? await fixture.renderHtml() : render(<>{fixture.render!()}</>),
      ),
      [],
    );
  });
}

Deno.test('render contract fails when a required part or attribute is removed', () => {
  const fixture = basicFixtures.find((fixture) => fixture.component === 'button')!;
  const contract = componentContracts.components.find((contract) => contract.name === 'button')!;
  const html = render(<>{fixture.render!()}</>);
  assertEquals(renderViolations(contract, fixture, html), []);
  assert(
    renderViolations(contract, fixture, html + html).some((error) =>
      error.includes('duplicate root')
    ),
  );
  assert(
    renderViolations(contract, fixture, html.replace('data-part="label"', '')).some((error) =>
      error.includes('missing part label')
    ),
  );
  assert(
    renderViolations(contract, fixture, html.replace('data-variant="primary"', '')).some((error) =>
      error.includes('missing attribute data-variant')
    ),
  );
  assert(
    renderViolations(contract, fixture, html.replace('data-size="md"', 'data-size="unsupported"'))
      .some((error) => error.includes('invalid data-size')),
  );
});

Deno.test('Utility fixtures cover every shipped contract and exclude design-only gaps', () => {
  const actual = [...new Set(utility.fixtures.map((fixture) => fixture.component))].sort();
  const expected = componentContracts.components.filter((contract) => contract.shipped).map((
    contract,
  ) => contract.name).sort();
  assertEquals(actual, expected);
  for (const fixture of utility.fixtures) {
    assert(
      Boolean(fixture.render) !== Boolean(fixture.renderHtml),
      'one real rendering backend per fixture',
    );
  }
});
