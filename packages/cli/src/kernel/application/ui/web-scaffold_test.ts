import { MemoryFileSystemAdapter } from '../../adapters/scaffold/memory-fs.ts';
import { scaffoldUiIsland, scaffoldUiPage } from './web-scaffold.ts';

Deno.test('page scaffold emits a definePage route and colocated island files', async () => {
  const fs = new MemoryFileSystemAdapter();
  const result = await scaffoldUiPage({ projectRoot: '/app', path: 'admin/status', island: true }, fs);
  if (result.files.length !== 3) throw new Error(`Expected three files, got ${result.files.length}`);
  const page = await fs.readFile('/app/routes/admin/status/index.tsx');
  for (const fragment of ['definePage()', "createRouteReference('/admin/status'", '.withRoute(route)', 'StatusIsland']) {
    if (!page.includes(fragment)) throw new Error(`Generated page omitted ${fragment}`);
  }
});

Deno.test('island scaffold emits signals or query hydration templates', async () => {
  const fs = new MemoryFileSystemAdapter();
  await scaffoldUiIsland({ projectRoot: '/app', name: 'live-counter' }, fs);
  if (!(await fs.readFile('/app/islands/LiveCounter.tsx')).includes('useSignal')) throw new Error('Signal template missing');
  await scaffoldUiIsland({ projectRoot: '/app', name: 'query-panel', query: true }, fs);
  if (!(await fs.readFile('/app/islands/QueryPanel.tsx')).includes("@netscript/fresh/query")) throw new Error('Query template missing');
});
