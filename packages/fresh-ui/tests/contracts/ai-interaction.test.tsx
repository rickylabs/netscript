import { assert, assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import { render } from 'npm:preact-render-to-string@^6.7.0';
import { MessageScroller } from '../../registry/components/ui/message-scroller.tsx';
import { Questionnaire } from '../../registry/components/ui/questionnaire.tsx';
import { componentContracts } from '../../contracts.ts';
import { renderedElements, renderViolations } from './contract-render.ts';
import { aiInteractionFixtures } from './utility-ai-interaction.tsx';

Deno.test('AI interaction fixtures start strict and reject unclassified additions/invalid axes', () => {
  for (const f of aiInteractionFixtures) {
    const c = componentContracts.components.find((c) => c.name === f.component)!;
    const html = render(<>{f.render!()}</>);
    assertEquals(renderViolations(c, f, html), []);
    for (const name of ['data-surprise', 'data-x-undocumented']) {
      assert(
        renderViolations(
          c,
          f,
          html.replace('data-part="root"', 'data-part="root" ' + name + '="true"'),
        ).some((e) => e.includes('undeclared attribute')),
      );
    }
    const axis = Object.keys(c.attributes)[0];
    assert(
      renderViolations(c, f, html.replace(axis + '="', axis + '="unsupported-')).some((e) =>
        e.includes('invalid')
      ),
    );
  }
});
Deno.test('MessageScroller SSR never fabricates measured geometry and preserves native child controls', () => {
  const html = render(
    <MessageScroller label='Conversation' followEnd={false}>
      <MessageScroller.Item>
        <button type='button'>Inspect message</button>
      </MessageScroller.Item>
    </MessageScroller>,
  );
  const all = renderedElements(html);
  const root = all.find((e) =>
    e['data-part'] === 'root' && e['data-scope'] === 'message-scroller'
  )!;
  assertEquals(root['data-scrollable'], 'none');
  const viewport = all.find((e) => e['data-part'] === 'viewport')!;
  assertEquals(viewport['role'], 'region');
  assertEquals(viewport['aria-label'], 'Conversation');
  assertEquals(viewport['tabindex'], '0');
  const action = all.find((e) => e['data-part'] === 'scroll-button')!;
  assertEquals(action['aria-controls'], viewport.id);
  assertEquals(action['aria-disabled'], 'true');
  assert(!html.includes('aria-live'));
  assertStringIncludes(html, 'Inspect message');
  assertThrows(() => render(<MessageScroller label=' ' />), TypeError);
  for (const endThreshold of [NaN, Infinity, -1]) {
    assertThrows(
      () => render(<MessageScroller label='Messages' endThreshold={endThreshold} />),
      TypeError,
    );
  }
});
Deno.test('Questionnaire uses native form ownership, exact accepted values, field labels and disabled controls', () => {
  const opts = [{ value: 'a', label: 'First', shortcut: '1' }, { value: 'b', label: 'Second' }, {
    value: 'c',
    label: 'Unavailable',
    disabled: true,
  }];
  const html = render(
    <>
      <Questionnaire
        title='First question'
        options={opts}
        value={['b', 'a']}
        error='Pick one'
        description='Choose a value'
        disabled={false}
      />
      <Questionnaire title='Second question' options={opts} multiple defaultValue={['a', 'b']} />
    </>,
  );
  const all = renderedElements(html);
  const roots = all.filter((e) => e['data-part'] === 'root' && e['data-scope'] === 'questionnaire');
  assertEquals(roots.length, 2);
  assert(roots[0]['aria-labelledby'] !== roots[1]['aria-labelledby']);
  const controls = all.filter((e) => e['data-part'] === 'input');
  assertEquals(controls.map((e) => [e.type, e.name, e.value, 'checked' in e, 'disabled' in e]), [
    ['radio', 'answer', 'a', false, false],
    ['radio', 'answer', 'b', true, false],
    ['radio', 'answer', 'c', false, true],
    ['checkbox', 'answer', 'a', true, false],
    ['checkbox', 'answer', 'b', true, false],
    ['checkbox', 'answer', 'c', false, true],
  ]);
  assert(controls[0]['aria-describedby'].includes('-description'));
  assert(controls[0]['aria-describedby'].includes('-error'));
  assertEquals(controls[0]['aria-invalid'], 'true');
  assert(!html.includes('aria-live'));
});
Deno.test('Questionnaire freeform/complete are truthful, escape caller content and keep host actions outside disabled answers', () => {
  const html = render(
    <Questionnaire
      title={0}
      step='freeform'
      disabled
      name='notes'
      text='<script>unsafe</script>'
      description={0}
      error={0}
      actions={<button type='submit'>Submit</button>}
    />,
  );
  assertStringIncludes(html, 'name="notes"');
  assertStringIncludes(html, '&lt;script>');
  assertStringIncludes(html, 'data-part="title">0');
  assertStringIncludes(html, 'data-part="description">0');
  assertStringIncludes(html, 'data-part="error">0');
  assert(html.indexOf('</fieldset>') < html.indexOf('data-part="actions"'));
  const done = render(
    <Questionnaire
      title='Answers sent'
      step='complete'
      options={[{ value: 'a', label: 'First' }]}
      value={['a']}
      text='old'
      actions={<button type='button'>Edit answers</button>}
    />,
  );
  assert(!done.includes('<input'));
  assert(!done.includes('<textarea'));
  assertStringIncludes(done, 'Edit answers');
  for (
    const opts of [[{ value: '', label: 'Empty' }], [{ value: 'a', label: 'First' }, {
      value: 'a',
      label: 'Duplicate',
    }]]
  ) {
    assertThrows(() => render(<Questionnaire title='Question' options={opts} />), TypeError);
  }
});
