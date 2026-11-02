import { AlertDialog } from '../../registry/components/ui/alert-dialog.tsx';
import { HoverCard } from '../../registry/components/ui/hover-card.tsx';
import { ContextMenu } from '../../registry/components/ui/context-menu.tsx';
import { Icon } from '../../primitives.tsx';
import type { ContractKeyboardFixture, ContractRenderFixture } from './style-provider.ts';

export const overlayFixtures: readonly ContractRenderFixture[] = [
  ...(['default', 'destructive'] as const).flatMap((variant) =>
    (['sm', 'md'] as const).flatMap((size) =>
      [true, false].map((media) => ({
        component: 'alert-dialog',
        scenario: `${variant}/${size}/${media}`,
        props: [
          'triggerLabel',
          'title',
          'description',
          'actionLabel',
          'variant',
          'size',
          'media',
          'children',
        ],
        parts: [
          'trigger',
          'content',
          'header',
          'title',
          'description',
          'body',
          'footer',
          'cancel',
          'action',
          ...(media ? ['media'] : []),
        ],
        attributes: ['data-variant', 'data-size', 'data-state'],
        render: () => (
          <AlertDialog
            triggerLabel='Review change'
            title='Continue?'
            description='Confirm this change.'
            actionLabel='Continue'
            variant={variant}
            size={size}
            media={media}
          >
            <p>Caller-supplied detail.</p>
          </AlertDialog>
        ),
      }))
    )
  ),
  {
    component: 'alert-dialog',
    scenario: 'pending',
    props: ['triggerLabel', 'title', 'description', 'actionLabel', 'pending'],
    parts: ['spinner'],
    render: () => (
      <AlertDialog
        triggerLabel='Wait'
        title='Pending'
        description='Caller-owned work'
        actionLabel='Apply'
        pending
      />
    ),
  },
  ...(['top', 'right', 'bottom', 'left'] as const).map((placement) => ({
    component: 'hover-card',
    scenario: placement,
    props: ['triggerLabel', 'title', 'description', 'meta', 'placement'],
    parts: ['trigger', 'content', 'avatar', 'title', 'description', 'meta'],
    attributes: ['data-placement', 'data-state'],
    render: () => (
      <HoverCard
        triggerLabel='@netscript'
        title='NetScript'
        description='Full-stack framework.'
        meta='Joined December 2021'
        placement={placement}
      />
    ),
  })),
  {
    component: 'context-menu',
    scenario: 'actions',
    props: ['label', 'items', 'children'],
    parts: ['trigger', 'content'],
    attributes: ['data-open', 'data-state'],
    render: () => (
      <ContextMenu
        label='Order actions'
        items={[
          { id: 'open', label: 'Open order' },
          { id: 'copy', label: 'Copy order ID' },
        ]}
      >
        Right-click here
      </ContextMenu>
    ),
  },
  ...(['alert-triangle', 'calendar'] as const).map((name) => ({
    component: 'icon',
    scenario: name,
    props: ['name'],
    parts: ['glyph'],
    render: () => <Icon name={name} />,
  })),
];

export const overlayKeyboard: readonly ContractKeyboardFixture[] = [
  {
    component: 'alert-dialog',
    scenario: 'native-confirmation',
    keys: ['Enter', 'Space', 'Tab', 'Shift+Tab', 'Escape'],
    expectation:
      'Cancel receives initial focus; native modal confines focus, explicit action/cancel and Escape restore trigger.',
  },
  {
    component: 'hover-card',
    scenario: 'focus-preserving-preview',
    keys: ['Tab', 'Shift+Tab', 'Enter', 'Space', 'Escape'],
    expectation:
      'Focus opens informational preview without moving focus; links remain usable and Escape does not reopen.',
  },
  {
    component: 'context-menu',
    scenario: 'native-context-region',
    keys: [
      'Shift+F10',
      'ContextMenu',
      'ArrowDown',
      'ArrowUp',
      'Home',
      'End',
      'Enter',
      'Escape',
      'Tab',
    ],
    expectation:
      'Context region invokes shared menu traversal at client coordinates; explicit close restores region and Tab exits.',
  },
];
