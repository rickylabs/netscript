import { assertEquals, assertStringIncludes } from '@std/assert';
import { h } from 'preact';
import { render } from 'npm:preact-render-to-string@^6.7.0';
import DesktopOnly, { isDesktopBindingAvailable } from '../../../registry/islands/DesktopOnly.tsx';

Deno.test('isDesktopBindingAvailable uses a local structural binding check', () => {
  assertEquals(isDesktopBindingAvailable('__netscript_rpc__', {}), false);
  assertEquals(
    isDesktopBindingAvailable('__netscript_rpc__', {
      bindings: { __netscript_rpc__: () => Promise.resolve() },
    }),
    true,
  );
  assertEquals(
    isDesktopBindingAvailable('custom', {
      bindings: { __netscript_rpc__: () => Promise.resolve() },
    }),
    false,
  );
});

Deno.test('DesktopOnly server/browser rendering is inert by default', () => {
  const html = render(h(DesktopOnly, null, h('span', null, 'desktop content')));
  assertEquals(html, '');
});

Deno.test('DesktopOnly can render an explicit browser/Aspire fallback without desktop content', () => {
  const html = render(
    h(
      DesktopOnly,
      { fallback: h('span', { 'data-fallback': true }, 'Web mode') },
      h('span', { 'data-desktop': true }, 'Desktop mode'),
    ),
  );
  assertStringIncludes(html, 'data-fallback="true"');
  assertStringIncludes(html, 'Web mode');
  assertEquals(html.includes('Desktop mode'), false);
});
