import { assertEquals, assertStringIncludes } from '@std/assert';
import { render } from 'npm:preact-render-to-string@^6.7.0';
import { PageHeader } from '../../registry/components/ui/page-header.tsx';
import { renderedElements } from './contract-render.ts';

Deno.test('PageHeader declarative content is escaped, ordered and empty by default', () => {
  const html = render(
    <PageHeader
      title='<script>bad</script>'
      eyebrow='Commerce'
      description='Recent orders'
      breadcrumb={<a href='#workspace'>Workspace</a>}
      actions={<button type='button'>Export</button>}
      tabs='Tabs'
      status='Operational'
    >
      Children
    </PageHeader>,
  );
  assertStringIncludes(html, '&lt;script');
  assertEquals(html.includes('<script'), false);
  const parts = renderedElements(html).filter((e) => e['data-scope'] === 'page-header').map((e) =>
    e['data-part']
  );
  assertEquals(parts, [
    'root',
    'breadcrumb',
    'layout',
    'main',
    'intro',
    'eyebrow',
    'title',
    'description',
    'actions',
    'tabs',
    'status-bar',
  ]);
  assertEquals((html.match(/<h1 /g) ?? []).length, 1);
  assertEquals(html.indexOf('Operational') < html.indexOf('Children'), true);
  assertEquals(renderedElements(render(<PageHeader />)).map((e) => e['data-part']), ['root']);
});

Deno.test('PageHeader preserves legacy section attributes and children without generated duplicates', () => {
  const html = render(
    <PageHeader id='header' class='host'>
      <PageHeader.Layout>
        <PageHeader.Main>
          <PageHeader.Intro>
            <h1>Custom heading</h1>
          </PageHeader.Intro>
        </PageHeader.Main>
        <PageHeader.Aside>
          <PageHeader.Badges>Badge</PageHeader.Badges>
        </PageHeader.Aside>
      </PageHeader.Layout>
      <PageHeader.Actions aria-label='Host actions'>
        <button type='button'>Save</button>
      </PageHeader.Actions>
      <PageHeader.Status id='status'>Ready</PageHeader.Status>
    </PageHeader>,
  );
  assertStringIncludes(html, 'id="header"');
  assertStringIncludes(html, 'ns-page-header host');
  assertStringIncludes(html, 'aria-label="Host actions"');
  assertStringIncludes(html, 'id="status"');
  assertEquals((html.match(/<h1/g) ?? []).length, 1);
  assertEquals(renderedElements(html).some((e) => e.tabindex !== undefined), false);
});

Deno.test('PageHeader empty optional slots add no empty heading or wrapper and retain zero', () => {
  const html = render(
    <PageHeader
      title={false}
      eyebrow
      description=''
      actions={[]}
      tabs={[null, false, []]}
      status={null}
      breadcrumb={undefined}
    />,
  );
  assertEquals(renderedElements(html).map((e) => e['data-part']), ['root']);
  const numeric = render(<PageHeader title={0} status={0} />);
  assertStringIncludes(numeric, 'data-part="title" data-scope="page-header">0</h1>');
  assertStringIncludes(numeric, 'data-part="status-bar" data-scope="page-header">0</div>');
});
