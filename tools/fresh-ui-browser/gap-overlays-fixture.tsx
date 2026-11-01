import { Button } from '../../packages/fresh-ui/registry/components/ui/button.tsx';
import { useState } from 'preact/hooks';
import { AlertDialog } from '../../packages/fresh-ui/registry/components/ui/alert-dialog.tsx';
import { HoverCard } from '../../packages/fresh-ui/registry/components/ui/hover-card.tsx';
import { ContextMenu } from '../../packages/fresh-ui/registry/components/ui/context-menu.tsx';

export function Overlays() {
  const [actions, setActions] = useState(0), [cancels, setCancels] = useState(0);
  const [menuAction, setMenuAction] = useState(''), [bookmarks, setBookmarks] = useState(true);
  const [fixedOpen, setFixedOpen] = useState(false), [request, setRequest] = useState('');
  return (
    <section id='overlays'>
      <h2>Overlay components</h2>
      <AlertDialog
        triggerLabel='Review deletion'
        title='Delete project?'
        description='This removes the project for everyone.'
        actionLabel='Delete project'
        variant='destructive'
        onAction={() => setActions(actions + 1)}
        onCancel={() => setCancels(cancels + 1)}
      >
        <HoverCard
          triggerLabel='Peek owner'
          title='Project owner'
          description={<a href='#owner'>View owner</a>}
        />
      </AlertDialog>
      <AlertDialog
        triggerLabel='Review small change'
        title='Continue small change?'
        description='Review this local operation.'
        actionLabel='Apply small change'
        size='sm'
        media={false}
      />
      <AlertDialog
        triggerLabel='Review pending change'
        title='Pending change'
        description='The application controls pending state.'
        actionLabel='Apply pending change'
        pending
      />
      <AlertDialog
        triggerLabel='Review fixed change'
        title='Fixed change'
        description='Parent refuses close requests.'
        actionLabel='Apply fixed change'
        open={fixedOpen}
        onOpenChange={(next) => {
          setRequest(String(next));
          if (next) setFixedOpen(true);
        }}
      />
      <output aria-label='Confirmed changes'>{actions}</output>
      <output aria-label='Canceled changes'>{cancels}</output>
      <output aria-label='Requested alert open'>{request}</output>
      <Button type='button' id='before-hover'>Before preview</Button>
      <HoverCard
        triggerLabel='Preview NetScript'
        title='NetScript team'
        description={
          <>
            <span>The full-stack framework.</span> <a href='#team'>View team</a>
          </>
        }
        meta='Joined December 2021'
      />
      <Button type='button' id='after-hover'>After preview</Button>
      <Button type='button' id='before-context'>Before context</Button>
      <ContextMenu
        label='Order context'
        items={[
          {
            id: 'open',
            label: 'Open order',
            onSelect: () => setMenuAction('open'),
          },
          { id: 'unavailable', label: 'Unavailable order', disabled: true },
          { id: 'copy', label: 'Copy ID', shortcut: '⌘C', onSelect: () => setMenuAction('copy') },
          {
            id: 'bookmarks',
            kind: 'checkbox',
            label: 'Show bookmarks',
            checked: bookmarks,
            onCheckedChange: setBookmarks,
          },
          {
            id: 'delete',
            label: 'Delete order',
            intent: 'destructive',
            onSelect: () => setMenuAction('delete'),
          },
          {
            id: 'tools',
            kind: 'submenu',
            label: 'More tools',
            items: [{
              id: 'inspect',
              label: 'Inspect order',
              onSelect: () => setMenuAction('inspect'),
            }],
          },
        ]}
      >
        Right-click order
      </ContextMenu>
      <Button type='button' id='after-context'>After context</Button>
      <ContextMenu label='Disabled context' disabled items={[{ id: 'none', label: 'Never opens' }]}>
        Disabled context area
      </ContextMenu>
      <output aria-label='Context action'>{menuAction}</output>
    </section>
  );
}
