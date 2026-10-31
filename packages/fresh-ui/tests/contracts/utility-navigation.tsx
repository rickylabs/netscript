import { LocationMarker } from '../../registry/components/ui/location-marker.tsx';
import { NavigationMenu } from '../../registry/components/ui/navigation-menu.tsx';
import { Menubar } from '../../registry/components/ui/menubar.tsx';
import { Stepper } from '../../registry/components/ui/stepper.tsx';
import type { ContractKeyboardFixture, ContractRenderFixture } from './style-provider.ts';

export const navigationFixtures: readonly ContractRenderFixture[] = [
  ...(['sm', 'md'] as const).map((size) => ({
    component: 'location-marker',
    scenario: size,
    props: ['size'],
    attributes: ['data-size'],
    render: () => <LocationMarker size={size} />,
  })),
  {
    component: 'navigation-menu',
    scenario: 'links-and-disclosures',
    props: ['label', 'items'],
    parts: [
      'list',
      'item',
      'marker',
      'label',
      'chevron',
      'viewport',
      'link',
      'title',
      'description',
      'indicator',
    ],
    attributes: ['data-open', 'data-trigger', 'data-state'],
    render: () => (
      <NavigationMenu
        label='Docs'
        items={[
          { id: 'build', label: 'Build', href: '#build', current: true },
          {
            id: 'learn',
            label: 'Learn',
            links: [{
              id: 'tutorials',
              href: '#tutorials',
              title: 'Tutorials',
              description: 'Step by step',
            }],
          },
        ]}
      />
    ),
  },
  {
    component: 'menubar',
    scenario: 'actions-and-choices',
    props: ['label', 'menus', 'defaultValue'],
    parts: ['trigger', 'content'],
    attributes: ['data-state'],
    render: () => (
      <Menubar
        label='Application'
        defaultValue='file'
        menus={[
          {
            id: 'file',
            label: 'File',
            items: [{ id: 'new', label: 'New' }, {
              id: 'share',
              kind: 'submenu',
              label: 'Share',
              items: [{ id: 'email', label: 'Email' }],
            }],
          },
          {
            id: 'view',
            label: 'View',
            items: [{
              id: 'side',
              kind: 'checkbox',
              label: 'Show sidebar',
              checked: true,
              onCheckedChange: () => {},
            }, {
              id: 'compact',
              kind: 'radio',
              label: 'Compact',
              checked: true,
              onCheckedChange: () => {},
            }],
          },
        ]}
      />
    ),
  },
  ...(['horizontal', 'vertical'] as const).map((orientation) => ({
    component: 'stepper',
    scenario: orientation,
    props: ['steps', 'orientation', 'description', 'connector'],
    parts: ['step', 'indicator', 'body', 'title', 'description', 'connector'],
    attributes: ['data-orientation', 'data-status'],
    render: () => (
      <Stepper
        orientation={orientation}
        steps={[
          {
            id: 'account',
            title: 'Account',
            status: 'complete',
            href: '#account',
            description: 'Email',
          },
          { id: 'ship', title: 'Shipping', status: 'current', description: 'Carrier' },
          { id: 'pay', title: 'Payment', status: 'error', description: 'Retry card' },
          { id: 'review', title: 'Review', status: 'upcoming' },
        ]}
      />
    ),
  })),
];

export const navigationKeyboard: readonly ContractKeyboardFixture[] = [
  {
    component: 'navigation-menu',
    scenario: 'native-disclosure',
    keys: ['Tab', 'Shift+Tab', 'Enter', 'Space', 'Escape'],
    expectation:
      'Native summaries toggle exclusive links; Escape and focus exit close and restore appropriately.',
  },
  {
    component: 'menubar',
    scenario: 'application-menus',
    keys: [
      'ArrowRight',
      'ArrowLeft',
      'ArrowDown',
      'ArrowUp',
      'Home',
      'End',
      'Escape',
      'Enter',
      'Space',
      'Tab',
      'Shift+Tab',
      'p',
    ],
    expectation:
      'Roving triggers and native popovers support disabled items, choices, submenus and direction.',
  },
  {
    component: 'location-marker',
    scenario: 'decorative-tab-skip',
    keys: ['Tab'],
    expectation: 'A decorative mark is skipped between actual buttons.',
  },
  {
    component: 'stepper',
    scenario: 'native-step-links',
    keys: ['Tab', 'Shift+Tab', 'Enter'],
    expectation:
      'Only links are focusable, current/status presentation adds no widget key manager.',
  },
];
