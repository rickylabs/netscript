import { DesktopWindowChrome } from '../../registry/components/ui/desktop-window-chrome.tsx';
import {
  DesktopTrayMenu,
  type DesktopTrayMenuItem,
} from '../../registry/components/ui/desktop-tray-menu.tsx';
import type { ContractKeyboardFixture, ContractRenderFixture } from './style-provider.ts';

/** All published declaration kinds, including a skipped disabled action and an expanded subgroup. */
export const desktopMenuItems: readonly DesktopTrayMenuItem[] = [
  { type: 'action', id: 'open', label: 'Open', accelerator: 'Ctrl+O' },
  { type: 'action', id: 'locked', label: 'Locked', enabled: false },
  { type: 'separator' },
  {
    type: 'submenu',
    label: 'Edit',
    items: [
      { type: 'action', id: 'copy', label: 'Copy', accelerator: 'Ctrl+C' },
      { type: 'role', role: 'paste' },
    ],
  },
  { type: 'action', id: 'open', label: 'Open another' },
];

/** Real SSR renders exercise every shared snapshot without native bridge side effects. */
export const desktopControlFixtures: readonly ContractRenderFixture[] = [
  ...([undefined, 'macos', 'windows', 'linux'] as const).flatMap((platform) =>
    ([undefined, 'focused', 'blurred', 'disabled', 'hover', 'unfocused'] as const).map((state) => ({
      component: 'window-chrome',
      scenario: String(platform) + '/' + String(state),
      props: ['platform', 'state', 'title', 'leading', 'actions', 'onAction', 'disabled'],
      parts: ['leading', 'identity', 'title', 'actions', 'action'],
      attributes: ['data-state', 'data-action', ...(platform ? ['data-platform'] : [])],
      render: () => (
        <DesktopWindowChrome
          platform={platform}
          state={state}
          title={<a href='#window'>Window</a>}
          leading='App'
          onAction={() => {}}
        />
      ),
    }))
  ),
  ...(['macos', 'windows', 'linux'] as const).map((platform) => ({
    component: 'window-chrome',
    scenario: platform + '/all-five-and-long-leading',
    props: ['platform', 'title', 'leading', 'actions'],
    parts: ['leading', 'identity', 'title', 'actions', 'action'],
    attributes: ['data-platform', 'data-state', 'data-action'],
    render: () => (
      <DesktopWindowChrome
        platform={platform}
        title={'long_title_'.repeat(16)}
        leading={<a href='#app'>{'long_leading_'.repeat(40)}</a>}
        actions={['show', 'hide', 'focus', 'reload', 'close']}
      />
    ),
  })),
  ...(['tray', 'application-menu'] as const).flatMap((source) =>
    ([undefined, 'rest', 'hover', 'disabled'] as const).flatMap((state) =>
      (['action', 'role', 'submenu', 'separator'] as const).map((type) => ({
        component: 'tray-menu',
        scenario: source + '/' + String(state) + '/' + type,
        props: [
          'source',
          'type',
          'state',
          'accelerator',
          'items',
          'onAction',
          'disabled',
          'Item.type',
          'Item.id',
          'Item.label',
          'Item.accelerator',
          'Item.enabled',
          'Item.role',
          'Item.items',
        ],
        parts: [
          'desktop-menu',
          'source',
          'items',
          'action-item',
          'action',
          'label',
          'accelerator',
          'role-item',
          'role',
          'submenu',
          'separator',
        ],
        attributes: ['data-type', 'data-source', 'data-state'],
        render: () => (
          <DesktopTrayMenu
            source={source}
            type={type}
            state={state}
            items={desktopMenuItems}
            onAction={() => {}}
          />
        ),
      }))
    )
  ),
];

/** Scenario IDs are exercised through native browser keys, rather than SSR claims. */
export const desktopControlKeyboard: readonly ContractKeyboardFixture[] = [
  {
    component: 'window-chrome',
    scenario: 'window-chrome/native-operation-controls',
    keys: ['Tab', 'Shift+Tab', 'Enter', 'Space'],
    expectation:
      'Platform defaults and explicit action order emit the five documented payloads exactly once.',
  },
  {
    component: 'tray-menu',
    scenario: 'tray-menu/native-disclosure-and-roving',
    keys: ['ArrowUp', 'ArrowDown', 'Enter', 'Space', 'Escape', 'Tab', 'Shift+Tab'],
    expectation:
      'Hydrated roving skips disabled/read-only entries, preserves duplicate IDs, dismisses with focus return and leaves naturally.',
  },
  {
    component: 'tray-menu',
    scenario: 'tray-menu/ssr-native-tab-order',
    keys: ['Tab', 'Shift+Tab', 'Enter', 'Space'],
    expectation:
      'Initially-open SSR details preserves all native enabled action stops before hydration.',
  },
];
