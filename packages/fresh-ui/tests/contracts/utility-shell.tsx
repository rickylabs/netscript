import { SidebarShell } from '../../registry/components/ui/sidebar-shell.tsx';
import SidebarToggle from '../../registry/islands/SidebarToggle.tsx';
import type { ContractKeyboardFixture, ContractRenderFixture } from './style-provider.ts';

const navigation = [{
  label: 'Work',
  items: [{ href: '/orders', label: 'Orders', icon: '◇', count: '12', chevron: true }, {
    href: '/restricted',
    label: 'Restricted',
    disabled: true,
    level: 2 as const,
  }],
}, { label: 'Learn', collapsible: true, items: [{ href: '/docs', label: 'Docs' }] }];
export const shellFixtures: readonly ContractRenderFixture[] = [
  ...(['dashboard', 'chat', 'docs'] as const).map((layout) => ({
    component: 'app-shell',
    scenario: layout + '-native-ssr',
    props: [
      'layout',
      'sidebar',
      'rail',
      'railContent',
      'mobileRailContent',
      'session',
      'composer',
      'navigation',
      'brand',
      'children',
    ],
    parts: [
      'sidebar-disclosure',
      'sidebar-summary',
      'main',
      'content',
      ...(layout === 'chat' ? ['session', 'thread', 'composer'] : []),
      'rail',
      'mobile-rail',
    ],
    attributes: [
      'data-layout',
      'data-nav',
      'data-rail',
      'data-sidebar-mode',
      'data-sidebar-presentation',
    ],
    render: () => (
      <SidebarShell
        layout={layout}
        pathname='/orders'
        navigation={navigation}
        brand='NetScript'
        rail
        railContent='On this page'
        mobileRailContent='Contents'
        session='Conversation'
        composer={<input aria-label='Message' />}
      >
        <a href='#content'>Content</a>
      </SidebarShell>
    ),
  })),
  ...(['sidebar', 'floating', 'inset'] as const).map((sidebarVariant) => ({
    component: 'sidebar',
    scenario: sidebarVariant + '-native-sections',
    props: ['sidebarVariant', 'navigation'],
    parts: [
      'nav-group',
      'nav-group-label',
      'nav-item',
      'nav-icon',
      'nav-label',
      'marker',
      'count',
      'chevron',
      'nav-divider',
    ],
    attributes: ['data-variant', 'data-collapsible', 'data-state', 'data-level', 'data-collapsed'],
    render: () => (
      <SidebarShell
        sidebarVariant={sidebarVariant}
        pathname='/orders'
        navigation={navigation}
        brand='NetScript'
      >
        Content
      </SidebarShell>
    ),
  })),
  {
    component: 'top-bar',
    scenario: 'docs-slots',
    props: ['layout', 'topbarBrand', 'topbarStart', 'topbarEnd'],
    parts: ['brand', 'topbar-start', 'topbar-end'],
    attributes: ['data-variant'],
    render: () => (
      <SidebarShell
        layout='docs'
        pathname='/orders'
        navigation={navigation}
        brand='N'
        topbarBrand={<a href='/'>NetScript</a>}
        topbarStart='Search'
        topbarEnd={<button type='button'>Theme</button>}
      >
        Content
      </SidebarShell>
    ),
  },
  {
    component: 'sidebar-toggle',
    scenario: 'native-button-unconnected-ssr',
    props: ['openLabel', 'closeLabel', 'openIcon'],
    attributes: ['data-open', 'data-state', 'data-variant', 'data-size', 'data-icon'],
    render: () => (
      <SidebarToggle openLabel='Open navigation' closeLabel='Close navigation' openIcon='◇' />
    ),
  },
];
export const shellKeyboard: readonly ContractKeyboardFixture[] = [
  {
    component: 'app-shell',
    scenario: 'native-navigation-modal',
    keys: ['Tab', 'Shift+Tab', 'Enter', 'Space', 'Escape'],
    expectation:
      'Static native disclosure and nested groups work without JS; hydrated mobile Dialog owns modal focus, Escape and return; breakpoint replacement restores owned focus.',
  },
  {
    component: 'sidebar',
    scenario: 'native-destinations-and-sections',
    keys: ['Tab', 'Enter', 'Space'],
    expectation:
      'Native list links retain current and skip disabled items; section summaries disclose links in either branch.',
  },
  {
    component: 'top-bar',
    scenario: 'native-slot-controls',
    keys: ['Tab', 'Shift+Tab', 'Enter', 'Space'],
    expectation: 'Slot and sidebar controls follow native source order in app/docs geometry.',
  },
  {
    component: 'sidebar-toggle',
    scenario: 'owned-native-state',
    keys: ['Enter', 'Space'],
    expectation:
      'One connected button controls only its nearest shell, reports physical state and honors controlled refusal.',
  },
];
