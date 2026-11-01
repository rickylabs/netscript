import { Button } from '../../packages/fresh-ui/registry/components/ui/button.tsx';
import { useState } from 'preact/hooks';
import { LocationMarker } from '../../packages/fresh-ui/registry/components/ui/location-marker.tsx';
import { NavigationMenu } from '../../packages/fresh-ui/registry/components/ui/navigation-menu.tsx';
import { Menubar } from '../../packages/fresh-ui/registry/components/ui/menubar.tsx';
import { Stepper } from '../../packages/fresh-ui/registry/components/ui/stepper.tsx';
import { ActionMenu, Dialog } from '../../packages/fresh-ui/interactive.ts';

/** Caller paint keeps headless native controls legible without adding data axes. */
const CALLER_BUTTON_STYLE = Object.freeze({
  background: 'var(--ns-primary)',
  color: 'var(--ns-primary-fg)',
});

export function Navigation() {
  const [action, setAction] = useState(''),
    [sidebar, setSidebar] = useState(true),
    [density, setDensity] = useState('compact');
  return (
    <section id='navigation'>
      <h2>Navigation components</h2>
      <NavigationMenu
        id='site-navigation'
        label='Site'
        items={[
          { id: 'build', label: 'Build', href: '#build', current: true },
          {
            id: 'learn',
            label: 'Learn',
            links: [{
              id: 'tutorials',
              title: 'Tutorials',
              description: 'Build step by step',
              href: '#tutorials',
            }, {
              id: 'guides',
              title: 'Guides',
              description: 'Task-focused help',
              href: '#guides',
            }],
          },
          {
            id: 'concepts',
            label: 'Concepts',
            links: [{
              id: 'runtime',
              title: 'Runtime',
              description: 'Learn the model',
              href: '#runtime',
            }],
          },
        ]}
      />
      <Button type='button' id='before-menubar'>Before menus</Button>
      <Menubar
        label='Application'
        id='application-menu'
        menus={[
          {
            id: 'file',
            label: 'File',
            items: [
              {
                id: 'new',
                label: 'New tab',
                shortcut: '⌘T',
                onSelect: () => setAction('new'),
              },
              { id: 'unavailable', label: 'Unavailable', disabled: true },
              {
                id: 'share',
                kind: 'submenu',
                label: 'Share',
                items: [{ id: 'email', label: 'Email', onSelect: () => setAction('email') }, {
                  id: 'copy',
                  label: 'Copy link',
                  onSelect: () => setAction('copy'),
                }],
              },
              { id: 'print', label: 'Print', shortcut: '⌘P', onSelect: () => setAction('print') },
            ],
          },
          { id: 'locked', label: 'Locked', disabled: true, items: [] },
          {
            id: 'view',
            label: 'View',
            items: [
              {
                id: 'sidebar',
                kind: 'checkbox',
                label: 'Show sidebar',
                checked: sidebar,
                onCheckedChange: setSidebar,
              },
              { id: 'separator', kind: 'separator' },
              { id: 'density', kind: 'label', label: 'Density' },
              {
                id: 'compact',
                kind: 'radio',
                label: 'Compact',
                checked: density === 'compact',
                onCheckedChange: () => setDensity('compact'),
              },
              {
                id: 'comfortable',
                kind: 'radio',
                label: 'Comfortable',
                checked: density === 'comfortable',
                onCheckedChange: () => setDensity('comfortable'),
              },
            ],
          },
        ]}
      />
      <Button type='button' id='after-menubar'>After menus</Button>
      <output aria-label='Menu action'>{action}</output>
      <div id='marker-example'>
        <Button type='button'>Before marker</Button>
        <LocationMarker />
        <Button type='button'>After marker</Button>
      </div>
      <Stepper
        id='steps'
        aria-label='Checkout'
        steps={[
          {
            id: 'account',
            title: 'Account',
            status: 'complete',
            href: '#account',
            description: 'Email and password',
          },
          {
            id: 'shipping',
            title: 'Shipping',
            status: 'current',
            href: '#shipping',
            description: 'Carrier and tracking',
          },
          { id: 'payment', title: 'Payment', status: 'error', description: 'Card declined' },
          { id: 'review', title: 'Review', status: 'upcoming', description: 'Confirm order' },
        ]}
      />
      <Button type='button' id='after-steps'>After steps</Button>
      <Dialog.Root>
        <Dialog.Trigger style={CALLER_BUTTON_STYLE}>Mobile navigation</Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>Mobile navigation</Dialog.Title>
          <Dialog.Description>Browse mobile site links.</Dialog.Description>
          <NavigationMenu
            label='Mobile site'
            items={[
              { id: 'build', label: 'Mobile build', href: '#mobile-build' },
              {
                id: 'learn',
                label: 'Mobile learn',
                links: [{
                  id: 'guide',
                  title: 'Mobile guide',
                  href: '#mobile-guide',
                  current: true,
                }],
              },
            ]}
          />
          <Dialog.Close style={CALLER_BUTTON_STYLE}>Close navigation</Dialog.Close>
        </Dialog.Content>
      </Dialog.Root>
      <div id='independent-menu'>
        <ActionMenu.Root>
          <ActionMenu.Trigger style={CALLER_BUTTON_STYLE}>Independent actions</ActionMenu.Trigger>
          <ActionMenu.Content
            aria-label='Independent actions'
            aria-labelledby=''
            aria-describedby=''
          >
            <ActionMenu.Item>Inspect</ActionMenu.Item>
          </ActionMenu.Content>
        </ActionMenu.Root>
        <Button type='button' id='outside-menu'>Outside action</Button>
      </div>
    </section>
  );
}
