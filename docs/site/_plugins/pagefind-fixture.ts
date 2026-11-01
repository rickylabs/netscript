import { deepStrictEqual, notDeepStrictEqual, ok, strictEqual } from 'node:assert/strict';
import lume from 'lume/mod.ts';
import { Page } from 'lume/core/file.ts';
import nativePagefind from 'lume/plugins/pagefind.ts';
import reproduciblePagefind from './pagefind.ts';

const RECORDS = [
  { url: '/Alpha/', lane: 'CLI', title: 'CLI commands' },
  { url: '/bravo/', lane: 'Design system', title: 'Design components' },
  { url: '/charlie/', lane: 'Guides', title: 'Guided setup' },
];

async function indexPages(order: number[], stable: boolean): Promise<Map<string, Uint8Array>> {
  const site = lume();
  site.use(stable ? reproduciblePagefind() : nativePagefind({ ui: false }));
  const pages = order.map((i) => {
    const { url, lane, title } = RECORDS[i];
    return Page.create({
      url,
      content: `<html lang="en"><head><title>${title}</title></head><body data-pagefind-body>
        <span data-pagefind-filter="lane">${lane}</span><h1 id="heading">${title}</h1>
        <p>Searchable words for every lane.</p></body></html>`,
    });
  });
  const twin = Page.create({ url: '/article.md', content: '# Original Markdown twin\n' });
  pages.push(twin);
  const originals = new Map(pages.map((page) => [page.data.url, page.content]));
  await site.processors.run(pages);
  // Ordering must leave HTML/twins untouched and keep non-HTML files out of the native index.
  for (const page of pages.filter((page) => originals.has(page.data.url))) {
    strictEqual(page.content, originals.get(page.data.url));
  }
  const outputs = new Map<string, Uint8Array>();
  for (const page of pages.filter((page) => page.data.url.startsWith('/pagefind/'))) {
    const content = page.content;
    if (typeof content === 'string') outputs.set(page.data.url, new TextEncoder().encode(content));
    else {
      ok(content instanceof Uint8Array);
      outputs.set(page.data.url, content);
    }
  }
  const entry = JSON.parse(new TextDecoder().decode(outputs.get('/pagefind/pagefind-entry.json')));
  strictEqual(entry.version, '1.6.0');
  strictEqual(entry.languages.en.page_count, RECORDS.length);
  ok([...outputs.keys()].some((path) => path.endsWith('.pf_filter')));
  ok([...outputs.keys()].some((path) => path.endsWith('.pf_meta')));
  return new Map([...outputs].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
}

Deno.test('native Pagefind output is byte-identical for shuffled Lume pages', async () => {
  const ordered = await indexPages([0, 1, 2], true);
  const shuffled = await indexPages([2, 0, 1], true);
  deepStrictEqual(shuffled, ordered);
  // This control proves the fixture detects native ingestion-order entropy without our plugin.
  const unsorted = await indexPages([2, 0, 1], false);
  notDeepStrictEqual(unsorted, ordered);
});
