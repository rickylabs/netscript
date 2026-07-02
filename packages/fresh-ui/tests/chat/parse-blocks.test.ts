import { assert, assertEquals } from '@std/assert';
import {
  blockToText,
  type ChartRenderPart,
  type DonutRenderPart,
  type LineRenderPart,
  parseBlocks,
  type RenderPart,
  type StatsRenderPart,
  type TableRenderPart,
  type TextRenderPart,
} from '../../src/chat/parse-blocks.ts';

/** Re-serialise a parsed tree and re-parse it — the reload-fidelity operation. */
function reload(parts: RenderPart[]): RenderPart[] {
  return parseBlocks(parts.map(blockToText).join(''));
}

/** Asserts the parse of `input` survives a serialise→parse round-trip byte-for-byte. */
function assertRoundTrip(input: string): RenderPart[] {
  const first = parseBlocks(input);
  assertEquals(reload(first), first, 'reload must be deep-equal to the first parse');
  // Idempotent a second time: canonical text is already a fixed point.
  assertEquals(reload(reload(first)), first, 'canonical reload must be stable');
  return first;
}

Deno.test('parseBlocks: chart JSON body → typed ChartRenderPart', () => {
  const input = '```chart\n' +
    '{"data":[{"label":"VIF","value":80,"tone":"success"},{"label":"Errors","value":10,"tone":"destructive"}],"title":"Throughput","unit":"/h","variant":"column"}\n' +
    '```';
  const parts = parseBlocks(input);
  assertEquals(parts.length, 1);
  const chart = parts[0] as ChartRenderPart;
  assertEquals(chart.kind, 'chart');
  assertEquals(chart.data.length, 2);
  assertEquals(chart.data[0], { label: 'VIF', value: 80, tone: 'success' });
  assertEquals(chart.title, 'Throughput');
  assertEquals(chart.variant, 'column');
  assertRoundTrip(input);
});

Deno.test('parseBlocks: chart DSL body → normalised to canonical JSON on reload', () => {
  const input = '```chart\nVIF: 80 @success\nErrors: 10 @destructive\n```';
  const parts = parseBlocks(input);
  const chart = parts[0] as ChartRenderPart;
  assertEquals(chart.data, [
    { label: 'VIF', value: 80, tone: 'success' },
    { label: 'Errors', value: 10, tone: 'destructive' },
  ]);
  // DSL is normalised; the reload emits canonical JSON that re-parses identically.
  assertRoundTrip(input);
});

Deno.test('parseBlocks: donut JSON body with total', () => {
  const input = '```donut\n' +
    '{"data":[{"label":"Open","value":12},{"label":"Closed","value":8,"tone":"secondary"}],"total":"20 tickets"}\n' +
    '```';
  const donut = parseBlocks(input)[0] as DonutRenderPart;
  assertEquals(donut.kind, 'donut');
  assertEquals(donut.data[1].tone, 'secondary');
  assertEquals(donut.total, '20 tickets');
  assertRoundTrip(input);
});

Deno.test('parseBlocks: table pipe DSL → columns/rows with alignment', () => {
  const input = '```table\n' +
    '| Name | Age | Score |\n' +
    '| :--- | ---: | :---: |\n' +
    '| Ann | 30 | 98 |\n' +
    '| Bob | 25 | 71 |\n' +
    '```';
  const table = parseBlocks(input)[0] as TableRenderPart;
  assertEquals(table.kind, 'table');
  assertEquals(table.columns, [
    { key: 'name', label: 'Name', align: 'start' },
    { key: 'age', label: 'Age', align: 'end' },
    { key: 'score', label: 'Score', align: 'center' },
  ]);
  assertEquals(table.rows, [
    { name: 'Ann', age: '30', score: '98' },
    { name: 'Bob', age: '25', score: '71' },
  ]);
  assertRoundTrip(input);
});

Deno.test('parseBlocks: table JSON body with string columns and array rows', () => {
  const input = '```table\n' +
    '{"columns":["Region","Revenue"],"rows":[["EU",1200],["NA",980]],"caption":"Q3"}\n' +
    '```';
  const table = parseBlocks(input)[0] as TableRenderPart;
  assertEquals(table.columns, [
    { key: 'Region', label: 'Region' },
    { key: 'Revenue', label: 'Revenue' },
  ]);
  assertEquals(table.rows, [
    { Region: 'EU', Revenue: '1200' },
    { Region: 'NA', Revenue: '980' },
  ]);
  assertEquals(table.caption, 'Q3');
  assertRoundTrip(input);
});

Deno.test('parseBlocks: stats DSL keeps formatted string values', () => {
  const input = '```stats\nUsers: 1.2k\nRevenue: $48,200\nUptime: 99.9%\n```';
  const stats = parseBlocks(input)[0] as StatsRenderPart;
  assertEquals(stats.kind, 'stats');
  assertEquals(stats.items, [
    { label: 'Users', value: '1.2k' },
    { label: 'Revenue', value: '$48,200' },
    { label: 'Uptime', value: '99.9%' },
  ]);
  assertRoundTrip(input);
});

Deno.test('parseBlocks: stats JSON body with numeric value + detail', () => {
  const input = '```stats\n' +
    '{"items":[{"label":"Orders","value":412,"detail":"+8% WoW"}]}\n' +
    '```';
  const stats = parseBlocks(input)[0] as StatsRenderPart;
  assertEquals(stats.items[0], { label: 'Orders', value: 412, detail: '+8% WoW' });
  assertRoundTrip(input);
});

Deno.test('parseBlocks: line DSL → points series', () => {
  const input = '```line\nMon: 12\nTue: 18\nWed: 9\n```';
  const line = parseBlocks(input)[0] as LineRenderPart;
  assertEquals(line.kind, 'line');
  assertEquals(line.points, [
    { x: 'Mon', y: 12 },
    { x: 'Tue', y: 18 },
    { x: 'Wed', y: 9 },
  ]);
  assertRoundTrip(input);
});

Deno.test('parseBlocks: line JSON body with title/unit', () => {
  const input = '```line\n' +
    '{"points":[{"x":"Jan","y":4},{"x":"Feb","y":6.5}],"title":"Signups","unit":"k"}\n' +
    '```';
  const line = parseBlocks(input)[0] as LineRenderPart;
  assertEquals(line.points[1], { x: 'Feb', y: 6.5 });
  assertEquals(line.title, 'Signups');
  assertEquals(line.unit, 'k');
  assertRoundTrip(input);
});

Deno.test('parseBlocks: malformed fence falls back to a verbatim text part (never throws)', () => {
  const input = '```chart\nthis is not valid data ::: {oops\n```';
  const parts = parseBlocks(input);
  assertEquals(parts.length, 1);
  assertEquals(parts[0].kind, 'text');
  assertEquals((parts[0] as TextRenderPart).text, input);
  assertRoundTrip(input);
});

Deno.test('parseBlocks: unknown info-string is left as prose text', () => {
  const input = '```python\nprint("hi")\n```';
  const parts = parseBlocks(input);
  assertEquals(parts.length, 1);
  assertEquals(parts[0].kind, 'text');
  assertEquals((parts[0] as TextRenderPart).text, input);
  assertRoundTrip(input);
});

Deno.test('parseBlocks: mixed prose + multiple blocks preserves order and text', () => {
  const input = [
    'Here is the throughput:',
    '',
    '```chart',
    '{"data":[{"label":"A","value":5}]}',
    '```',
    '',
    'and the split:',
    '',
    '```donut',
    'Open: 3',
    'Closed: 7',
    '```',
    '',
    'Done.',
  ].join('\n');

  const parts = parseBlocks(input);
  assertEquals(parts.map((p) => p.kind), ['text', 'chart', 'text', 'donut', 'text']);
  assert((parts[0] as TextRenderPart).text.startsWith('Here is the throughput:'));
  assert((parts[4] as TextRenderPart).text.includes('Done.'));
  assertRoundTrip(input);
});

Deno.test('parseBlocks: plain prose with no fences is a single text part', () => {
  const input = 'Just a normal sentence with `inline code` and no fenced blocks.';
  const parts = parseBlocks(input);
  assertEquals(parts, [{ kind: 'text', text: input }]);
  assertRoundTrip(input);
});

Deno.test('parseBlocks: adjacent blocks with no prose between round-trip', () => {
  const input = '```stats\nA: 1\n```\n```line\nX: 2\n```';
  const parts = parseBlocks(input);
  assertEquals(parts.map((p) => p.kind), ['stats', 'text', 'line']);
  assertRoundTrip(input);
});

Deno.test('blockToText: text parts export verbatim; blocks export canonical fences', () => {
  const text: TextRenderPart = { kind: 'text', text: 'hello world' };
  assertEquals(blockToText(text), 'hello world');

  const chart: ChartRenderPart = { kind: 'chart', data: [{ label: 'A', value: 1 }] };
  assertEquals(blockToText(chart), '```chart\n{"data":[{"label":"A","value":1}]}\n```');
});

Deno.test('reload-fidelity property holds across a combined all-kinds fixture', () => {
  const input = [
    'Report:',
    '```chart',
    'North: 10 @primary',
    'South: 4 @warning',
    '```',
    'segments:',
    '```donut',
    '{"data":[{"label":"A","value":1},{"label":"B","value":2}],"total":3}',
    '```',
    '```table',
    '| K | V |',
    '| --- | --- |',
    '| a | 1 |',
    '```',
    '```stats',
    'MRR: $12k',
    '```',
    '```line',
    '{"points":[{"x":"t0","y":0},{"x":"t1","y":5}]}',
    '```',
    'End.',
  ].join('\n');

  const first = assertRoundTrip(input);
  // Every curated kind plus text fallback is represented.
  const kinds = new Set(first.map((p) => p.kind));
  for (const kind of ['chart', 'donut', 'table', 'stats', 'line', 'text']) {
    assert(kinds.has(kind as RenderPart['kind']), `expected a ${kind} part`);
  }
});
