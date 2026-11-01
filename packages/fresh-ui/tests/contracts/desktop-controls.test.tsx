import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { render } from 'npm:preact-render-to-string@^6.7.0';
import { componentContracts } from '../../contracts.ts';
import {
  DesktopWindowChrome,
  type DesktopWindowChromeAction,
} from '../../registry/components/ui/desktop-window-chrome.tsx';
import { DesktopTrayMenu } from '../../registry/components/ui/desktop-tray-menu.tsx';
import { renderedElements, renderViolations } from './contract-render.ts';
import { desktopControlFixtures, desktopMenuItems } from './utility-desktop-controls.tsx';

Deno.test('Desktop control renders immediately enforce every declared axis and reject undeclared additions', () => {
  for (const fixture of desktopControlFixtures) {
    const contract = componentContracts.components.find((c) => c.name === fixture.component)!;
    const html = render(<>{fixture.render!()}</>);
    assertEquals(renderViolations(contract, fixture, html), [], fixture.scenario);
    for (const attr of ['data-surprise', 'data-x-undeclared']) {
      assert(
        renderViolations(
          contract,
          fixture,
          html.replace('data-part="root"', 'data-part="root" ' + attr + '="true"'),
        ).some((s) => s.includes('undeclared attribute')),
      );
    }
    assert(
      renderViolations(contract, fixture, html.replace('data-part="action"', 'data-part="unknown"'))
        .some((s) => s.includes('part')),
    );
    assert(
      renderViolations(contract, fixture, html.replace('data-state="', 'data-state="invalid-'))
        .some((s) => s.includes('invalid')),
    );
    assert(
      renderViolations(
        contract,
        fixture,
        html.replace('data-part="root"', 'data-part="root" data-desktop-action="close"'),
      ).some((s) => s.includes('undeclared attribute')),
    );
  }
});

Deno.test('Window defaults preserve the exact platform table and every supplied state spelling', () => {
  const expected = [
    [undefined, ['reload', 'hide', 'close']],
    ['macos', ['close', 'hide', 'reload']],
    ['windows', ['hide', 'reload', 'close']],
    ['linux', ['hide', 'reload', 'close']],
  ] as const;
  for (const [platform, actions] of expected) {
    const html = render(<DesktopWindowChrome platform={platform} title='Window' />);
    assertEquals(
      renderedElements(html).filter((e) => e['data-part'] === 'action').map((e) =>
        e['data-action']
      ),
      [...actions],
    );
  }
  for (const state of ['focused', 'blurred', 'hover', 'unfocused', 'disabled'] as const) {
    const nodes = renderedElements(render(<DesktopWindowChrome state={state} title='Window' />));
    assertEquals(nodes[0]['data-state'], state);
    for (const button of nodes.filter((e) => e['data-part'] === 'action')) {
      assertEquals(button['data-state'], state);
      assertEquals(button.disabled !== undefined, state === 'disabled');
    }
  }
});

Deno.test('Window preserves custom all-five, empty, leading and escaped title without render effects', () => {
  const events: DesktopWindowChromeAction[] = [];
  const actions = ['show', 'hide', 'focus', 'reload', 'close'] as const;
  const html = render(
    <DesktopWindowChrome
      platform='macos'
      title='<script>unsafe</script>'
      leading={<a href='#native'>App</a>}
      actions={actions}
      onAction={(a) => events.push(a)}
    />,
  );
  assertEquals(events, []);
  assertEquals(
    renderedElements(html).filter((e) => e['data-part'] === 'action').map((e) =>
      e['data-desktop-action']
    ),
    [...actions],
  );
  assert(!html.includes('<script>'));
  assertStringIncludes(html, '&lt;script>');
  assertStringIncludes(html, 'href="#native"');
  assertEquals(
    renderedElements(render(<DesktopWindowChrome title='Empty' actions={[]} />)).filter((e) =>
      e['data-part'] === 'action'
    ),
    [],
  );
});

Deno.test('Tray SSR retains every enabled Tab stop and native expanded disclosure without hydration', () => {
  const events: string[] = [];
  const html = render(
    <DesktopTrayMenu source='tray' items={desktopMenuItems} onAction={(a) => events.push(a)} />,
  );
  const nodes = renderedElements(html);
  assertEquals(events, []);
  assert(!html.includes('tabindex'));
  const details = nodes.find((e) => e['data-part'] === 'desktop-menu')!;
  assert('open' in details);
  const buttons = nodes.filter((e) => e['data-part'] === 'action');
  assertEquals(buttons.map((e) => e['data-action-id']), ['open', 'locked', 'copy', 'open']);
  assertEquals(buttons.map((e) => e.disabled !== undefined), [false, true, false, false]);
  assertStringIncludes(html, 'role="group"');
  assertStringIncludes(html, 'aria-label="Edit"');
  assertStringIncludes(html, 'aria-disabled="true"');
});

Deno.test('Tray snapshot type never filters entries, accelerators only hide text, disabled wins', () => {
  for (const type of ['action', 'role', 'submenu', 'separator'] as const) {
    const html = render(
      <DesktopTrayMenu
        source='application-menu'
        type={type}
        items={desktopMenuItems}
        accelerator={false}
        state='hover'
        disabled
      />,
    );
    const nodes = renderedElements(html);
    assertEquals(nodes[0]['data-type'], type);
    assertEquals(nodes[0]['data-state'], 'disabled');
    assertEquals(nodes.filter((e) => e['data-part'] === 'action').length, 4);
    assert(nodes.filter((e) => e['data-part'] === 'action').every((e) => e.disabled !== undefined));
    assert(!html.includes('<kbd'));
    assertEquals(nodes.find((e) => e['data-part'] === 'source')!.tabindex, '-1');
  }
  const escaped = render(
    <DesktopTrayMenu
      source='tray'
      items={[{ type: 'action', id: 'a"<', label: '<script>x</script>', accelerator: '<key>' }]}
    />,
  );
  assert(!escaped.includes('<script>'));
  assertStringIncludes(escaped, '&lt;key>');
});
