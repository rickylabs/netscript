import { assert, assertStringIncludes } from '@std/assert';
import workspace from '../../../../../../../deno.json' with { type: 'json' };
const preactSpecifier = `npm:preact@${workspace.catalog.preact}`;
const { h } = await import(preactSpecifier);
const { renderToString } = await import(
  `npm:preact-render-to-string@${workspace.catalog['preact-render-to-string']}`
);
import { QUERY_RESULT_TEMPLATE } from './query-result-template.ts';

/** Exercise the emitted component, including values hidden by the collapsed details control. */
async function renderer() {
  const source =
    `/** @jsx h */\n/** @jsxFrag Fragment */\nimport { h, Fragment, type VNode } from ${
      JSON.stringify(preactSpecifier)
    };\n${QUERY_RESULT_TEMPLATE}\nexport { QueryResult };`;
  const module = await import('data:text/tsx,' + encodeURIComponent(source));
  return (value: unknown, amountUnit?: 'minor' | 'major') =>
    renderToString(h(module.QueryResult, { value, amountUnit }));
}

Deno.test('query result preserves envelope collections and extended rich fields', async () => {
  const render = await renderer();
  const row = {
    id: 7,
    reference: 'REC-7',
    name: 'Actual record',
    ownerName: 'Ada Test',
    ownerEmail: 'ada@example.test',
    amount: 100,
    currency: 'USD',
    status: 'paid',
    createdAt: new Date('2026-11-01T00:00:00Z'),
    customNote: 'Retain this field',
  };
  const html = render({
    page: 1,
    total: 1,
    totalPages: 1,
    limit: 25,
    items: [row],
    customEnvelope: 'Keep envelope',
  });
  for (
    const text of [
      'Actual record',
      'Retain this field',
      'Keep envelope',
      'REC-7',
      'ada@example.test',
      '<time',
      'Page 1',
      '1 record',
    ]
  ) assertStringIncludes(html, text);
  assert(!html.includes('No details available'));
});

Deno.test('query amounts convert only with an explicit unit and malformed currencies never throw', async () => {
  const render = await renderer();
  const row = { reference: 'R-1', ownerName: 'Test', amount: 100, currency: 'USD' };
  assertStringIncludes(render([row]), '100 USD');
  assertStringIncludes(render([row], 'major'), '$100.00');
  assertStringIncludes(render([row], 'minor'), '$1.00');
  for (const currency of ['credits', '', '12!']) {
    assertStringIncludes(render([{ ...row, currency }], 'minor'), '100');
  }
});

Deno.test('rich-looking rows and pagination preserve structured values in presentation fields', async () => {
  const render = await renderer();
  const row = {
    reference: 'R-2',
    ownerName: 'Test',
    amount: 100,
    currency: 'USD',
    name: { localized: 'Structured name' },
    ownerEmail: { privateLabel: 'Structured contact' },
  };
  const html = render({
    page: 1,
    total: 1,
    totalPages: 1,
    limit: { reason: 'Unusual metadata' },
    items: [row],
  });
  for (const text of ['Structured name', 'Structured contact', 'Unusual metadata']) {
    assertStringIncludes(html, text);
  }
  assert(!html.includes('[object Object]'));
});
