import {
  AUDITED_BASELINE_COMPONENTS,
  FRESH_UI_RUNTIME_DEPENDENCY,
  POST_V1_COMPONENTS,
} from './post-v1-items.ts';
import { freshUiRegistryManifest } from '../../registry.manifest.ts';
import { componentContracts } from '../../contracts.ts';
import { renderViolations } from '../contracts/contract-render.ts';
import { assertEquals, assertStringIncludes } from '@std/assert';
import { fromFileUrl, join, toFileUrl } from '@std/path';

const repo = fromFileUrl(new URL('../../../../', import.meta.url));

Deno.test('Phase-two registry gaps preserve installed source and consumer APIs', async () => {
  const names = freshUiRegistryManifest.items.filter((item) =>
    item.kind === 'component' && item.tags.includes('contract')
  ).map((item) => item.name);
  assertEquals(
    [...names].sort(),
    [...POST_V1_COMPONENTS].sort(),
    'Every reviewed gap must be exercised; an empty projection cannot pass.',
  );
  const installedNames = [...names, ...AUDITED_BASELINE_COMPONENTS];
  const root = await Deno.makeTempDir({ prefix: 'fresh-ui-gaps-' });
  const run = async (cwd: string, args: string[]) => {
    const result = await new Deno.Command(Deno.execPath(), {
      cwd,
      args,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
    return new TextDecoder().decode(result.stdout);
  };
  try {
    await Deno.writeTextFile(
      join(root, 'deno.json'),
      JSON.stringify({
        catalog: JSON.parse(await Deno.readTextFile(join(repo, 'deno.json'))).catalog,
        name: '@netscript/actions-contract-test',
        version: '0.0.0',
        imports: {
          preact: 'npm:preact@^10.29.2',
          '@preact/signals': 'npm:@preact/signals@2.11.3',
        },
        compilerOptions: {
          jsx: 'precompile',
          jsxImportSource: 'preact',
          lib: ['dom', 'dom.iterable', 'deno.ns'],
        },
      }),
    );
    const install = (name: string) =>
      run(repo, [
        'run',
        '-A',
        '--frozen',
        join(repo, 'packages/cli/bin/netscript-dev.ts'),
        'ui:add',
        name,
        '--project-root',
        root,
        '--registry-root',
        join(repo, 'packages/fresh-ui'),
        '--force',
      ]);
    // Prove CodeBlock alone contributes its parser before Markdown can mask a missing dependency.
    await install('code-block');
    const codeConfig = JSON.parse(await Deno.readTextFile(join(root, 'deno.json')));
    assertEquals(codeConfig.imports['highlight.js'], 'npm:highlight.js@^11');
    assertEquals(codeConfig.imports['@netscript/fresh-ui'], FRESH_UI_RUNTIME_DEPENDENCY);
    for (const name of installedNames) await install(name);
    const installedConfig = JSON.parse(await Deno.readTextFile(join(root, 'deno.json')));
    assertEquals(
      installedConfig.imports['@netscript/fresh-ui'],
      FRESH_UI_RUNTIME_DEPENDENCY,
      'The installer must contribute its runtime package mapping; local subpath aliases cannot prove that.',
    );
    // Compile the unreleased local API only after proving the production root mapping was installed.
    installedConfig.imports['@netscript/fresh-ui'] =
      toFileUrl(join(repo, 'packages/fresh-ui/mod.ts')).href;
    installedConfig.imports['@netscript/fresh-ui/interactive'] =
      toFileUrl(join(repo, 'packages/fresh-ui/interactive.ts')).href;
    installedConfig.imports['@netscript/fresh-ui/primitives'] =
      toFileUrl(join(repo, 'packages/fresh-ui/primitives.tsx')).href;
    await Deno.writeTextFile(join(root, 'deno.json'), JSON.stringify(installedConfig));
    for (const name of installedNames) {
      const installed = await Deno.readTextFile(join(root, 'components/ui', name + '.tsx'));
      const source = await Deno.readTextFile(
        join(repo, 'packages/fresh-ui/registry/components/ui', name + '.tsx'),
      );
      // The copy installer relocates only the canonical lib/ui imports.
      assertEquals(installed.replaceAll('@/lib/cn.ts', '../../lib/cn.ts'), source);
      if (name === 'code-block') {
        assertEquals(
          await Deno.readTextFile(join(root, 'assets/ui/code-block.css')),
          await Deno.readTextFile(
            join(repo, 'packages/fresh-ui/registry/components/ui/code-block.css'),
          ),
        );
      }
      if (['marker', 'trace', 'attachment', 'message-scroller', 'questionnaire'].includes(name)) {
        assertEquals(
          await Deno.readTextFile(join(root, 'assets/ui', name + '.css')),
          await Deno.readTextFile(
            join(repo, 'packages/fresh-ui/registry/components/ui', name + '.css'),
          ),
          'New AI styles must preserve actual installed CSS bytes.',
        );
      }
      if (names.includes(name)) {
        assertStringIncludes(
          installed,
          name === 'direction' ? "'data-scope': 'direction'" : `data-scope='${name}'`,
        );
      }
    }
    await run(root, [
      'check',
      '--unstable-kv',
      ...installedNames.map((name) => `components/ui/${name}.tsx`),
    ]);
    await run(root, [
      'lint',
      '--rules-include=jsx-curly-braces',
      ...installedNames.map((name) => `components/ui/${name}.tsx`),
    ]);
    // Audited baseline components preserve overridable scopes; verify actual installed rendering.
    await Deno.writeTextFile(
      join(root, 'render-audited.tsx'),
      `
import { h } from 'preact';
import { render } from 'npm:preact-render-to-string@^6.7.0';
import { CodeBlock } from './components/ui/code-block.tsx';
import { Label } from './components/ui/label.tsx';
import { Card } from './components/ui/card.tsx';
import { Pagination } from './components/ui/pagination.tsx';
import { Alert } from './components/ui/alert.tsx';
import { CommandPalette } from './components/ui/command-palette.tsx';
import { PageHeader } from './components/ui/page-header.tsx';
import { ScrollArea } from './components/ui/scroll-area.tsx';
import { AspectRatio } from './components/ui/aspect-ratio.tsx';
import { Direction } from './components/ui/direction.tsx';
import { Resizable } from './components/ui/resizable.tsx';
import { SidebarShell } from './components/ui/sidebar-shell.tsx';
import { StatsGrid } from './components/ui/stats-grid.tsx';
import { DataTable } from './components/ui/data-table.tsx';
import { DataGrid } from '@netscript/fresh-ui';
import { Marker } from './components/ui/marker.tsx';
import { Trace } from './components/ui/trace.tsx';
import { Attachment } from './components/ui/attachment.tsx';
import { MessageScroller } from './components/ui/message-scroller.tsx';
import { Questionnaire } from './components/ui/questionnaire.tsx';
console.log(JSON.stringify({
  'message-scroller': render(<MessageScroller label='Conversation' style={{height:320}}><MessageScroller.Item><a href='#source'>Read source</a></MessageScroller.Item></MessageScroller>),
  questionnaire: render(<Questionnaire title='Which storage?' options={[{value:'postgres',label:'PostgreSQL',shortcut:'1'},{value:'sqlite',label:'SQLite'}]} defaultValue={['postgres']} description='Choose project storage' error='Review the answer' actions={<button type='submit'>Next</button>} />),
  marker: render(<Marker variant='separator' icon='ⓘ' label='Restored' />),
  trace: render(<Trace status='running' title='Run'><Trace.Line title='Search' status='running' collapsible defaultOpen description='Searching docs' duration='312ms'><button type='button'>Read output</button></Trace.Line></Trace>),
  attachment: render(<Attachment title='report.pdf' description='PDF · 248 KB' state='error' size='xs' media='PDF' actions={<button type='button'>Retry</button>} />),
  'data-table': render(<DataTable state='default'><DataTable.Header>Orders</DataTable.Header><DataTable.Body><DataGrid label='Orders' columns={[{key:'name',header:<button type='button'>Sort name</button>,headerLabel:'Name',sort:'ascending',cell:'strong'}]} rows={[{id:'one',data:{name:'First order'},href:'/orders/one',label:'Read first order'}]} /></DataTable.Body><DataTable.Footer><a href='#next-orders'>Next orders</a></DataTable.Footer></DataTable>),
  'stats-grid': render(<StatsGrid columns={3} joined><StatsGrid.Card label='Revenue' value='$284,920' detail='+8.2% versus the previous period' delta='up' variant='hero' badge={<button type='button'>Inspect revenue</button>} /></StatsGrid>),
  'sidebar-shell': render(<SidebarShell layout='docs' pathname='/orders' navigation={[{label:'Work',items:[{href:'/orders',label:'Orders',count:'12'}]}]} brand={<a href='/'>NetScript</a>} rail railContent={<a href='#installation'>Installation</a>} mobileRailContent={<details><summary>On this page</summary>Contents</details>}><h1>Orders</h1></SidebarShell>),
  resizable: render(<Resizable label='Contents' startContent={<button type='button'>Open chapter</button>} endContent={<a href='#chapter'>Read chapter</a>} style={{height: 240}} />),
  'scroll-area': render(h(ScrollArea, { label: 'Recent activity', orientation: 'both', children: h('a', { href: '#activity' }, 'Activity') })),
  'aspect-ratio': render(h(AspectRatio, { ratio: '4:3', children: h('button', { type: 'button' }, 'Play') })),
  direction: render(<Direction as='section' dir='rtl'><Direction as='div' dir='ltr'><input aria-label='Search' /></Direction></Direction>),
  'page-header': render(h(PageHeader, { title: 'Overview', eyebrow: 'Commerce', description: 'Recent orders', variant: 'with-status', status: 'Operational', actions: h('button', {children: 'Create order'}) })),
  'command-palette': render(h(CommandPalette, { scrim: false, groups: [{id: 'docs', label: 'Docs', items: [{id: 'start', label: 'Start', type: 'page', excerpt: 'Read the guide', shortcut: 'Enter'}]}] })),
  'code-block': render(h(CodeBlock, { tabs: [{ value: 'source', label: 'Source', code: 'x' }] })),
  label: render(h(Label, { children: 'Email', variant: 'eyebrow', optional: true })),
  card: render(h(Card, { children: 'Card', variant: 'rule', size: 'sm' })),
  alert: render(h(Alert, { variant: 'important', emphasis: 'strong', close: true, title: 'Important', description: 'Review settings' })),
  pagination: render(h(Pagination, { variant: 'pager', children: h(Pagination.Next, { href: '#next', children: 'Next document' }) })),
}));
`,
    );
    const rendered: Record<string, string> = JSON.parse(
      await run(root, ['run', '--node-modules-dir=auto', 'render-audited.tsx']),
    );
    const renderedNames = [
      ...AUDITED_BASELINE_COMPONENTS,
      'scroll-area',
      'aspect-ratio',
      'direction',
      'resizable',
      'marker',
      'trace',
      'attachment',
      'message-scroller',
      'questionnaire',
    ];
    assertEquals(Object.keys(rendered).sort(), renderedNames.sort());
    for (const name of renderedNames) {
      if (name === 'sidebar-shell') {
        for (const component of ['app-shell', 'sidebar', 'top-bar']) {
          const contract = componentContracts.components.find((contract) =>
            contract.name === component
          )!;
          assertEquals(
            renderViolations(
              contract,
              { component, scenario: 'installed-shell', props: [] },
              rendered[name],
            ),
            [],
          );
        }
        continue;
      }
      const contract = componentContracts.components.find((contract) => contract.name === name)!;
      assertEquals(
        renderViolations(contract, {
          component: name,
          scenario: 'installed-audited-baseline',
          props: [],
        }, rendered[name]),
        [],
      );
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
