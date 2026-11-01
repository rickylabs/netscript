import { assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import { render } from 'npm:preact-render-to-string@^6.7.0';
import { SidebarShell } from '../../registry/components/ui/sidebar-shell.tsx';
import SidebarToggle from '../../registry/islands/SidebarToggle.tsx';

Deno.test('shell SSR preserves useful native navigation and actual ports', () => {
  const html = render(
    <SidebarShell
      layout='docs'
      navLabel='Workspace sections'
      pathname='/orders'
      navigation={[{
        label: 'Work',
        items: [{ href: '/orders', label: 'Orders', count: 0 }, {
          href: '/restricted',
          label: 'Restricted',
          disabled: true,
        }],
      }]}
      brand='N'
      topbarStart={<SidebarToggle />}
      rail
      railContent={<a href='#install'>Install</a>}
      mobileRailContent='Contents'
    >
      Main
    </SidebarShell>,
  );
  assertStringIncludes(html, 'data-sidebar-mode="static"');
  assertStringIncludes(html, '>Workspace sections</summary>');
  assertStringIncludes(html, '<details');
  assertStringIncludes(html, ' open');
  assertEquals((html.match(/<nav\b/g) ?? []).length, 1);
  assertEquals(html.includes('data-breakpoint='), false);
  assertEquals(html.includes('<dialog'), false);
  assertStringIncludes(html, 'aria-current="page"');
  assertEquals(html.includes('href="/restricted"'), false);
  assertEquals(html.includes('role="listitem"'), false);
  assertStringIncludes(html, 'data-part="count">0</span>');
  assertStringIncludes(html, 'data-part="mobile-rail"');
});
Deno.test('shell none and nav=false remove destinations; chat preserves host slots', () => {
  for (const props of [{ sidebar: 'none' as const }, { nav: false }]) {
    const html = render(
      <SidebarShell
        {...props}
        pathname='/'
        navigation={[{ items: [{ href: '/', label: 'Home' }] }]}
        brand='N'
      >
        Main
      </SidebarShell>,
    );
    assertEquals(html.includes('<aside'), false);
    assertEquals(html.includes('sidebar-summary'), false);
  }
  const html = render(
    <SidebarShell
      layout='chat'
      pathname='/'
      navigation={[]}
      brand='N'
      session='Session'
      thread='Chosen thread'
      composer='Compose'
    >
      Fallback thread
    </SidebarShell>,
  );
  for (const text of ['Session', 'Chosen thread', 'Compose']) assertStringIncludes(html, text);
  assertEquals(html.includes('Fallback thread'), false);
});
Deno.test('native sidebar sections require usable summary names', () => {
  assertThrows(
    () =>
      render(
        <SidebarShell pathname='/' navigation={[{ collapsible: true, items: [] }]} brand='N'>
          Main
        </SidebarShell>,
      ),
    Error,
    'require a label',
  );
});
