import { expect, test } from '@playwright/test';
import { islandHydrationObservationExpression } from '../../../packages/cli/e2e/src/application/gates/scaffold/runtime/island-hydration-observation.ts';
import { APP_DIR, EXTERNAL_SERVER } from '../settings.ts';

for (const generator of ['page', 'resource']) {
  test(`runtime hydration observes only successful ${generator} query results`, async ({ page }) => {
    test.skip(EXTERNAL_SERVER, 'Requires the owned scaffold with installed component fixtures');
    await page.goto('/');
    const name = generator === 'resource' ? 'test-resource-query.tsx' : 'test-query-result.tsx';
    const fixture = `/@fs/${APP_DIR}/browser-fixtures/${name}`;
    const observation = islandHydrationObservationExpression('/@id/@netscript/fresh/query');
    const state = async (data: unknown, isLoading = false, isError = false, withQuery = true) => {
      await page.evaluate(async ({ fixture, data, isLoading, isError, withQuery }) => {
        await (await import(fixture)).renderState({ data, isLoading, isError }, withQuery);
      }, { fixture, data, isLoading, isError, withQuery });
    };
    for (const data of [{ data: [{ name: '<img src=x>' }] }, [], {}, null, 'value', false]) {
      await state(data);
      expect(await page.evaluate(observation)).toEqual({
        queryClientFound: true,
        listQueryFound: true,
        freshIslandElement: 'div',
      });
      await expect(page.locator('#query-result-fixture [data-query-result]')).toHaveCount(1);
      await expect(page.locator('#query-result-fixture img, #query-result-fixture script'))
        .toHaveCount(0);
    }
    for (const status of ['loading', 'error']) {
      await state([], status === 'loading', status === 'error');
      expect(await page.evaluate(observation)).toEqual({
        queryClientFound: true,
        listQueryFound: true,
        freshIslandElement: null,
      });
    }
    await state([], false, false, false);
    expect(await page.evaluate(observation)).toEqual({
      queryClientFound: true,
      listQueryFound: false,
      freshIslandElement: 'div',
    });
    await page.evaluate(async (fixture) => (await import(fixture)).renderUnrelated(), fixture);
    expect(await page.evaluate(observation)).toEqual({
      queryClientFound: true,
      listQueryFound: true,
      freshIslandElement: null,
    });
  });
}
