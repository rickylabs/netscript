import { assertEquals } from '@std/assert';
import { GlobFilter } from './glob.ts';
import type { WatchEvent } from '../types.ts';

function makeEvent(path: string, kind: 'create' | 'modify' | 'remove' = 'create'): WatchEvent {
  return {
    path,
    kind,
    contentHash: null,
    fileInfo: null,
    timestamp: new Date(),
  };
}

async function collectEvents(
  filter: GlobFilter,
  events: WatchEvent[],
): Promise<WatchEvent[]> {
  async function* gen() {
    for (const e of events) yield e;
  }
  const results: WatchEvent[] = [];
  for await (const e of filter.apply(gen())) {
    results.push(e);
  }
  return results;
}

Deno.test('GlobFilter — matches *.csv files', async () => {
  const filter = new GlobFilter(['*.csv']);
  const events = [
    makeEvent('/data/sales.csv'),
    makeEvent('/data/report.txt'),
    makeEvent('/data/backup.csv.bak'),
    makeEvent('/data/orders.csv'),
  ];
  const results = await collectEvents(filter, events);
  assertEquals(results.length, 2);
  assertEquals(results[0].path, '/data/sales.csv');
  assertEquals(results[1].path, '/data/orders.csv');
});

Deno.test('GlobFilter — matches multiple patterns', async () => {
  const filter = new GlobFilter(['*.csv', '*.xlsx']);
  const events = [
    makeEvent('/data/sales.csv'),
    makeEvent('/data/report.xlsx'),
    makeEvent('/data/notes.txt'),
  ];
  const results = await collectEvents(filter, events);
  assertEquals(results.length, 2);
});

Deno.test('GlobFilter — remove events always pass through', async () => {
  const filter = new GlobFilter(['*.csv']);
  const events = [makeEvent('/data/report.txt', 'remove')];
  const results = await collectEvents(filter, events);
  assertEquals(results.length, 1);
  assertEquals(results[0].kind, 'remove');
});

Deno.test('GlobFilter — rejects non-matching files', async () => {
  const filter = new GlobFilter(['*.csv']);
  const events = [
    makeEvent('/data/report.txt'),
    makeEvent('/data/image.png'),
  ];
  const results = await collectEvents(filter, events);
  assertEquals(results.length, 0);
});

Deno.test('GlobFilter — matches() method', () => {
  const filter = new GlobFilter(['*.csv', 'sales_*.xlsx']);
  assertEquals(filter.matches('/data/sales.csv'), true);
  assertEquals(filter.matches('/data/sales_2026.xlsx'), true);
  assertEquals(filter.matches('/data/report.txt'), false);
});
