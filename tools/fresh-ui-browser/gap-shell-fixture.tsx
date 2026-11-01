import { Toc } from '../../packages/fresh-ui/registry/components/ui/toc.tsx';
import { Button } from '../../packages/fresh-ui/registry/components/ui/button.tsx';
import { MessageScroller } from '../../packages/fresh-ui/registry/components/ui/message-scroller.tsx';
import { useRef, useState } from 'preact/hooks';
import { SidebarShell } from '../../packages/fresh-ui/registry/components/ui/sidebar-shell.tsx';
import SidebarToggle from '../../packages/fresh-ui/registry/islands/SidebarToggle.tsx';
import type { SidebarNavSection } from '../../packages/fresh-ui/registry/components/ui/sidebar-shell.tsx';

export const shellNavigation: readonly SidebarNavSection[] = [
  {
    label: 'Workspace',
    items: [
      { href: '#overview', label: 'Overview', icon: '◇', count: '12', chevron: true },
      { href: '#locked', label: 'Restricted', icon: '×', disabled: true },
      { href: '#orders', label: 'Orders', icon: '▤', level: 2, marker: false },
    ],
  },
  {
    label: 'Reference',
    collapsible: true,
    defaultOpen: false,
    items: [
      { href: '#guide', label: 'Quick start', icon: '↗' },
      { href: '#api', label: 'API reference', icon: '⌘' },
    ],
  },
];

/** Same real shell is rendered on the server for no-JS and isolated-toggle controls. */
export function StaticShell() {
  return (
    <SidebarShell
      id='static-shell'
      pathname='#overview'
      navigation={shellNavigation}
      brand={<a href='#home' aria-label='NetScript home'>N</a>}
      contentId='static-content'
      topbarStart={
        <span id='standalone-toggle'>
          <SidebarToggle />
        </span>
      }
      topbarEnd={<button type='button'>Account</button>}
    >
      <h1>Workspace</h1>
      <p>Server-rendered navigation remains useful without JavaScript.</p>
      <a href='#outside'>Main destination</a>
    </SidebarShell>
  );
}

/** Browser host owns all layout and modal ports; no backend is simulated. */
export function ShellExamples() {
  const parameters = new URLSearchParams(location.search);
  const initialLayout = parameters.get('layout');
  const [layout, setLayout] = useState<'dashboard' | 'chat' | 'docs'>(
    initialLayout === 'docs' || initialLayout === 'chat' ? initialLayout : 'dashboard',
  );
  const [sidebar, setSidebar] = useState<'expanded' | 'collapsed' | 'none'>('expanded');
  const [variant, setVariant] = useState<'sidebar' | 'floating' | 'inset'>('sidebar');
  const [show, setShow] = useState(true);
  const [custom, setCustom] = useState(parameters.get('custom') !== 'false');
  const [disabled, setDisabled] = useState(false);
  const [legacySelectors, setLegacySelectors] = useState(false);
  const [controlled, setControlled] = useState(false);
  const [accept, setAccept] = useState(false);
  const [open, setOpen] = useState(false);
  const [revision, setRevision] = useState(0);
  const [messages, setMessages] = useState(60);
  const reasons = useRef<string[]>([]);
  const output = useRef<HTMLOutputElement>(null);
  return (
    <>
      <div aria-label='Shell host controls' class='shell-host-controls'>
        <button type='button' onClick={() => setLayout('dashboard')}>Dashboard layout</button>
        <button type='button' onClick={() => setLayout('chat')}>Chat layout</button>
        <button type='button' onClick={() => setLayout('docs')}>Docs layout</button>
        <button type='button' onClick={() => setSidebar('collapsed')}>
          Collapse desktop sidebar
        </button>
        <button type='button' onClick={() => setSidebar('none')}>Remove sidebar</button>
        <button type='button' onClick={() => setSidebar('expanded')}>Expand sidebar</button>
        <button type='button' onClick={() => setVariant('floating')}>Floating sidebar</button>
        <button type='button' onClick={() => setVariant('inset')}>Inset sidebar</button>
        <button
          type='button'
          onClick={() => {
            setControlled(true);
            setOpen(true);
          }}
        >
          Refuse dismissal
        </button>
        <button type='button' onClick={() => setAccept(true)}>Accept dismissal</button>
        <button type='button' onClick={() => setRevision((value) => value + 1)}>
          Parent refresh
        </button>
        <button type='button' onClick={() => setCustom((value) => !value)}>
          Toggle custom control
        </button>
        <button type='button' onClick={() => setDisabled((value) => !value)}>
          Disable custom control
        </button>
        <button type='button' onClick={() => setLegacySelectors((value) => !value)}>
          Use legacy selectors
        </button>
        <button type='button' onClick={() => setShow((value) => !value)}>Mount shell</button>
        <output ref={output} aria-label='Shell proposals' />
      </div>
      {show && (
        <SidebarShell
          id='shell-example'
          title={`Revision ${revision}`}
          contentId='shell-content'
          layout={layout}
          pathname='#overview'
          navigation={shellNavigation}
          brand={<a href='#home' aria-label='NetScript home'>N</a>}
          brandBadge={<span>Acme</span>}
          sidebar={sidebar}
          sidebarVariant={variant}
          footer={<Button type='button' variant='ghost' size='sm'>Workspace settings</Button>}
          topbarBrand={<a href='#docs-home'>NetScript docs</a>}
          topbarStart={custom
            ? (
              <SidebarToggle
                disabled={disabled}
                sidebarSelector={legacySelectors ? '#legacy-sidebar' : undefined}
                backdropSelector={legacySelectors ? '#legacy-backdrop' : undefined}
              />
            )
            : <span>Workspace</span>}
          topbarEnd={<Button type='button' variant='ghost' size='sm'>Account</Button>}
          rail={layout === 'docs'}
          railContent={
            <Toc breakpoint='desktop' currentId='section'>
              <Toc.Item href='#section'>Installation</Toc.Item>
            </Toc>
          }
          mobileRailContent={
            <Toc breakpoint='mobile' currentId='section'>
              <Toc.Item href='#section'>Installation</Toc.Item>
            </Toc>
          }
          session={<h1>Support conversation</h1>}
          composer={
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setMessages((n) => n + 1);
              }}
            >
              <label>
                Message<input name='message' />
              </label>
              <Button type='submit' variant='ghost' size='sm'>Send</Button>
            </form>
          }
          sidebarOpen={controlled ? open : undefined}
          onSidebarOpenChange={(next, details) => {
            reasons.current.push(`${next}:${details.reason}`);
            if (output.current) output.current.value = JSON.stringify(reasons.current);
            if (controlled && (next || accept)) setOpen(next);
          }}
        >
          {layout === 'chat'
            ? (
              <MessageScroller label='Shell conversation' style={{ height: '100%' }}>
                {Array.from(
                  { length: messages },
                  (_, index) => (
                    <MessageScroller.Item key={index}>
                      <p>Message {index + 1}: Your workspace is ready to use.</p>
                    </MessageScroller.Item>
                  ),
                )}
              </MessageScroller>
            )
            : (
              <>
                <h1>Orders</h1>
                <p id='section'>Review recent orders and workspace activity.</p>
                <a href='#main-action'>View orders</a>
              </>
            )}
        </SidebarShell>
      )}
      {parameters.get('two') === 'true' && (
        <SidebarShell
          id='second-shell'
          contentId='second-content'
          pathname='/second'
          navigation={[{ items: [{ href: '#second', label: 'Second destination' }] }]}
          brand='Other'
          topbarStart={<SidebarToggle />}
        >
          Second shell
        </SidebarShell>
      )}
      {parameters.get('legacy') === 'true' && (
        <div id='legacy-example'>
          <SidebarToggle sidebarSelector='#legacy-sidebar' backdropSelector='#legacy-backdrop' />
          <aside id='legacy-sidebar'>Legacy navigation</aside>
          <div id='legacy-backdrop'>Legacy backdrop</div>
        </div>
      )}
    </>
  );
}
