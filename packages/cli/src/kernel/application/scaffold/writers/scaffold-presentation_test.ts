import { assertEquals, assertStringIncludes } from '@std/assert';
import { readTemplateAssetSync } from '../../../adapters/templates/template-asset.ts';
import { TEMPLATE_KEYS } from '../../../assets/manifest.ts';

const source = readTemplateAssetSync(TEMPLATE_KEYS.appScaffoldContract);
const presentation = await import(`data:application/typescript,${encodeURIComponent(source)}`);

Deno.test('record controls retain real search and sorting when paging', () => {
  const request = new Request(
    'https://app.test/records?search=%20Maya%20&status=paid&sortBy=amount&sortOrder=asc&page=2',
  );
  const query = presentation.scaffoldRecordQuery(request);
  assertEquals(query, {
    search: 'Maya',
    status: 'paid',
    sortBy: 'amount',
    sortOrder: 'asc',
    page: 2,
  });
  const href = presentation.scaffoldPageHref('/records', {
    query: {
      search: query.search,
      status: query.status,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    },
  }, 3);
  const params = new URL(href, 'https://app.test').searchParams;
  assertEquals(params.get('search'), 'Maya');
  assertEquals(params.get('status'), 'paid');
  assertEquals(params.get('sortBy'), 'amount');
  assertEquals(params.get('page'), '3');
  assertEquals(
    presentation.scaffoldRecordQuery(
      new Request('https://app.test/?status=invalid&sortBy=nope&page=-1'),
    ),
    { page: 1, sortBy: 'createdAt', sortOrder: 'desc' },
  );
});

Deno.test('presentation formats minor units, singular counts and locale dates without inventing data', () => {
  assertEquals(presentation.scaffoldAmount(8990, 'USD', 'en-US'), '$89.90');
  assertEquals(presentation.scaffoldAmount(8990, 'JPY', 'en-US'), '¥8,990');
  assertEquals(presentation.scaffoldAmount(-8990, 'USD', 'en-US'), '-$89.90');
  assertEquals(presentation.scaffoldRecordCount(1, 'en-US'), '1 record');
  assertEquals(presentation.scaffoldRecordCount(0, 'en-US'), '0 records');
  assertEquals(presentation.scaffoldInitials('  Maya  Rossi '), 'MR');
  assertEquals(presentation.scaffoldDate('invalid', 'en-US'), '—');
  assertEquals(
    presentation.scaffoldDate('2026-11-01T00:00:00.000Z', 'de-DE'),
    new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeZone: 'UTC' }).format(
      new Date('2026-11-01T00:00:00.000Z'),
    ),
  );
  assertEquals(
    presentation.scaffoldLocale(
      new Request('https://app.test', {
        headers: { 'accept-language': '*,invalid_tag,de-DE;q=0.8' },
      }),
    ),
    'de-DE',
  );
});

Deno.test('record page composes registry controls and canonical service route', () => {
  const page = readTemplateAssetSync(TEMPLATE_KEYS.appRecordsRoute);
  for (const component of ['FilterForm', 'Pagination', 'appRoutes.serviceExample.href()']) {
    assertStringIncludes(page, component);
  }
  assertEquals(page.includes('appRoutes.examples.href() +'), false);
  const detail = readTemplateAssetSync(TEMPLATE_KEYS.appRecordRoute);
  assertStringIncludes(detail, 'DetailLayout');
  assertStringIncludes(detail, 'scaffoldDate(record.updatedAt, locale, true)');
  assertEquals(detail.includes('Date.toString'), false);
});
