import { Button } from '../../packages/fresh-ui/registry/components/ui/button.tsx';
import { useState } from 'preact/hooks';
import { CommandPalette } from '../../packages/fresh-ui/registry/components/ui/command-palette.tsx';
import { Kbd } from '../../packages/fresh-ui/registry/components/ui/kbd.tsx';

export function CommandPalettes() {
  const [open, setOpen] = useState(false), [selections, setSelections] = useState(0);
  const [closeRequests, setCloseRequests] = useState(0), [query, setQuery] = useState('');
  const [fixedOpen, setFixedOpen] = useState(false),
    [fixedRequests, setFixedRequests] = useState(0);
  const [inlineActions, setInlineActions] = useState(''),
    [inlineCount, setInlineCount] = useState(0);
  const [loading, setLoading] = useState(false), [pagesOnly, setPagesOnly] = useState(false);
  const record = (id: string) => () => {
    setInlineActions(id);
    setInlineCount((n) => n + 1);
  };
  const advancedGroups = [
    {
      id: 'pages /α',
      label: 'Pages',
      items: [
        {
          id: 'page /α#1',
          label: 'Getting started',
          type: 'page' as const,
          url: '/docs/getting-started',
          excerpt: 'Install the CLI, then scaffold a project. Literal a.b(c) stays text.',
          kind: 'Guide',
          onSelect: record('page /α#1'),
        },
        {
          id: 'locked',
          label: 'Unavailable result',
          type: 'page' as const,
          disabled: true,
          onSelect: record('locked'),
        },
      ],
    },
    {
      id: 'sections',
      label: 'Sections',
      items: [{
        id: 'install',
        label: 'Install the CLI',
        type: 'section' as const,
        hash: '#install-the-cli',
        excerpt: 'Run the installer, then check the version.',
        onSelect: record('install'),
      }],
    },
    {
      id: 'actions',
      label: 'Actions',
      items: [{
        id: 'theme',
        label: 'Toggle theme',
        icon: '☼',
        shortcut: '⌘L',
        onSelect: record('theme'),
      }],
    },
  ];
  return (
    <section aria-label='Command palette components'>
      <h2>Command palette components</h2>
      <button type='button' id='open-commands' onClick={() => setOpen(true)}>Open commands</button>
      <output aria-label='Command selections'>{selections}</output>
      <output aria-label='Command close requests'>{closeRequests}</output>
      <output aria-label='Command query'>{query}</output>
      <CommandPalette
        open={open}
        onOpenChange={(next) => {
          if (!next) setCloseRequests((n) => n + 1);
          setOpen(next);
        }}
        onQueryChange={setQuery}
        groups={[{
          id: 'pages',
          label: 'Pages',
          items: [
            {
              id: 'orders',
              label: 'Find orders',
              onSelect: () => setSelections((n) => n + 1),
            },
            {
              id: 'settings',
              label: 'Workspace settings',
              onSelect: () => setSelections((n) => n + 1),
            },
          ],
        }]}
      />
      <button type='button' id='open-fixed-commands' onClick={() => setFixedOpen(true)}>
        Open fixed commands
      </button>
      <output aria-label='Fixed command requests'>{fixedRequests}</output>
      <CommandPalette
        open={fixedOpen}
        onOpenChange={() => setFixedRequests((n) => n + 1)}
        dialogLabel='Fixed command palette'
        groups={[{
          id: 'fixed',
          label: 'Fixed',
          items: [{
            id: 'repeat',
            label: 'Repeat command',
            onSelect: () => setSelections((n) => n + 1),
          }],
        }]}
        filters={<button type='button'>Fixed filter</button>}
      />
      <button type='button' id='before-inline-command'>Before inline command</button>
      <div id='command-inline'>
        <CommandPalette
          scrim={false}
          loading={loading}
          searchLabel='Search inline commands'
          groups={pagesOnly ? advancedGroups.slice(0, 1) : advancedGroups}
          filters={
            <Button
              variant='ghost'
              size='sm'
              aria-pressed={pagesOnly}
              onClick={() => setPagesOnly(!pagesOnly)}
            >
              Pages only
            </Button>
          }
          footer={
            <>
              <Kbd size='sm'>↑↓</Kbd> to navigate <Kbd size='sm'>↵</Kbd> to open{' '}
              <a href='#command-help'>Command help</a>
            </>
          }
        />
      </div>
      <button type='button' id='after-inline-command'>After inline command</button>
      <output aria-label='Inline command selection'>{inlineActions}</output>
      <output aria-label='Inline command count'>{inlineCount}</output>
      <button type='button' id='command-loading' onClick={() => setLoading(!loading)}>
        Toggle command loading
      </button>
    </section>
  );
}
