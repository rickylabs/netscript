import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { render } from 'npm:preact-render-to-string@^6.7.0';
import { Marker } from '../../registry/components/ui/marker.tsx';
import { Trace } from '../../registry/components/ui/trace.tsx';
import { Attachment } from '../../registry/components/ui/attachment.tsx';
import { componentContracts } from '../../contracts.ts';
import { renderedElements, renderViolations } from './contract-render.ts';
import { aiFixtures } from './utility-ai.tsx';

Deno.test('AI scopes reject undeclared attributes and canonical axis changes from the first fixture', () => {
  for (const fixture of aiFixtures) {
    const c = componentContracts.components.find((c) => c.name === fixture.component)!;
    const html = render(<>{fixture.render!()}</>);
    assertEquals(renderViolations(c, fixture, html), []);
    for (const attr of ['data-surprise', 'data-x-undocumented']) {
      assert(
        renderViolations(
          c,
          fixture,
          html.replace('data-part="root"', 'data-part="root" ' + attr + '="true"'),
        ).some((e) => e.includes('undeclared attribute')),
      );
    }
    const axis = Object.keys(c.attributes)[0];
    assert(
      renderViolations(c, fixture, html.replace(axis + '="', axis + '="unsupported-')).some((e) =>
        e.includes('invalid')
      ),
    );
  }
});

Deno.test('Marker content precedence preserves empty strings, zero and escaped caller text', () => {
  assertStringIncludes(render(<Marker label={0}>Fallback</Marker>), '>0</span>');
  assert(!render(<Marker label=''>Fallback</Marker>).includes('Fallback'));
  assertStringIncludes(render(<Marker>{'<script>unsafe</script>'}</Marker>), '&lt;script>');
  assertEquals(renderedElements(render(<Marker>Today</Marker>))[0]['data-variant'], 'default');
});

Deno.test('Trace emits ordered list semantics, scoped actual state and no static disclosure target', () => {
  const html = render(
    <Trace status='done' title='Run' duration={0}>
      <Trace.Line status='pending' title='Wait' collapsible={false} open connector={false}>
        Visible output
      </Trace.Line>
    </Trace>,
  );
  assertStringIncludes(html, '<ol');
  assertStringIncludes(html, '<li');
  assert(!html.includes('<details'));
  assert(!html.includes('<summary'));
  assertStringIncludes(html, 'Visible output');
  const elements = renderedElements(html);
  const root = elements.find((e) => e['data-part'] === 'root')!;
  const line = elements.find((e) => e['data-part'] === 'line')!;
  assertEquals(root['data-status'], 'done');
  assertEquals(line['data-status'], 'pending');
  assertEquals(line['data-open'], 'false');
  assertEquals(line['data-connector'], 'false');
  assert(!elements.some((e) => e['data-part'] === 'connector'));
  assertStringIncludes(html, '>0</span>');
  const ssr = render(
    <Trace>
      <Trace.Line title='Search' collapsible defaultOpen statusLabel='En cours'>Output</Trace.Line>
    </Trace>,
  );
  assert(renderedElements(ssr).some((e) => e['data-part'] === 'disclosure' && 'open' in e));
  assertStringIncludes(ssr, 'En cours');
  assert(!ssr.includes('aria-live'));
});

Deno.test('Attachment state text survives every ledger combination and compact descriptions stay accessible', () => {
  const labels = { uploading: 'Uploading', processing: 'Processing', error: 'Error', done: 'Done' };
  for (const fixture of aiFixtures.filter((f) => f.component === 'attachment')) {
    const html = render(<>{fixture.render!()}</>);
    const [state, size, orientation] = fixture.scenario.split('/');
    const root = renderedElements(html).find((e) => e['data-part'] === 'root')!;
    assertEquals([root['data-state'], root['data-size'], root['data-orientation']], [
      state,
      size,
      orientation,
    ]);
    assertStringIncludes(html, 'PDF · 248 KB');
    if (state !== 'idle') {
      const label = labels[state as keyof typeof labels];
      assertStringIncludes(html, 'data-part="state-label">' + label);
      assertStringIncludes(html, 'data-part="state-icon" aria-hidden="true"');
    }
    assertEquals(
      html.includes('data-part="progress"'),
      !(size === 'xs' && orientation === 'horizontal'),
    );
    assert(!html.includes('aria-live'));
  }
  const html = render(
    <Attachment
      title={0}
      description={0}
      state='error'
      stateLabel='Échec'
      size='xs'
      actions={<button type='button'>Retry</button>}
    />,
  );
  assertStringIncludes(html, 'Échec');
  assertStringIncludes(html, 'data-part="title">0');
  assertStringIncludes(html, 'data-part="description">0');
  assert(!html.includes('role="button"'));
  assertStringIncludes(
    render(<Attachment title='File' state='error' stateLabel='  ' />),
    'data-part="state-label">Error',
  );
});
