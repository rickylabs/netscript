import { useState } from 'preact/hooks';
import {
  DesktopWindowChrome,
  type DesktopWindowChromeAction,
} from '../../packages/fresh-ui/registry/components/ui/desktop-window-chrome.tsx';
import {
  DesktopTrayMenu,
  type DesktopTrayMenuItem,
} from '../../packages/fresh-ui/registry/components/ui/desktop-tray-menu.tsx';
import { Button } from '../../packages/fresh-ui/registry/components/ui/button.tsx';

const ITEMS: readonly DesktopTrayMenuItem[] = [
  { type: 'action', id: 'open', label: 'Open', accelerator: 'Ctrl+O' },
  { type: 'action', id: 'locked', label: 'Locked', enabled: false },
  { type: 'separator' },
  {
    type: 'submenu',
    label: 'Edit',
    items: [
      { type: 'role', role: 'copy' },
      { type: 'action', id: 'copy', label: 'Copy document', accelerator: 'Ctrl+C' },
    ],
  },
  { type: 'action', id: 'open', label: 'Open another' },
];
const ALL_ACTIONS: readonly DesktopWindowChromeAction[] = [
  'show',
  'hide',
  'focus',
  'reload',
  'close',
];

/** Same source renders to SSR and hydrates as a caller-owned island. */
export function DesktopControlsExamples() {
  const [windowEvents, setWindowEvents] = useState<string[]>([]);
  const [menuEvents, setMenuEvents] = useState<string[]>([]);
  const [revision, setRevision] = useState(0);
  const windowAction = (action: DesktopWindowChromeAction) =>
    setWindowEvents((events) => [...events, action]);
  const menuAction = (id: string) => setMenuEvents((events) => [...events, id]);
  return (
    <main id='desktop-controls'>
      <h1>Desktop controls examples</h1>
      <Button id='before-desktop' type='button'>Before desktop controls</Button>
      <div id='window-defaults' style={{ display: 'grid', gap: 24 }}>
        {([undefined, 'macos', 'windows', 'linux'] as const).map((platform) => (
          <div key={platform ?? 'legacy'} id={'window-' + (platform ?? 'legacy')}>
            <DesktopWindowChrome platform={platform} title='NetScript' onAction={windowAction} />
          </div>
        ))}
      </div>
      <div id='window-all'>
        <DesktopWindowChrome
          title='All window operations'
          actions={ALL_ACTIONS}
          onAction={windowAction}
        />
      </div>
      <div id='window-empty'>
        <DesktopWindowChrome title='Empty actions' actions={[]} />
      </div>
      <div id='window-snapshots' style={{ display: 'grid', gap: 24, marginBlock: 24 }}>
        {(['macos', 'windows', 'linux'] as const).flatMap((platform) =>
          (['focused', 'blurred', 'hover', 'unfocused', 'disabled'] as const).map((state) => (
            <div key={platform + state} id={'window-' + platform + '-' + state}>
              <DesktopWindowChrome
                platform={platform}
                state={state}
                title={'NetScript ' + state}
                onAction={windowAction}
              />
            </div>
          ))
        )}
      </div>
      <div id='window-leading'>
        <DesktopWindowChrome
          platform='macos'
          title={'long_unbroken_window_title_'.repeat(10)}
          leading={<a href='#leading-target'>App</a>}
          onAction={windowAction}
        />
      </div>
      <div id='window-advanced' style={{ display: 'grid', gap: 24, marginBlock: 24 }}>
        {(['macos', 'windows', 'linux'] as const).map((platform) => (
          <div id={'window-five-' + platform} key={platform}>
            <DesktopWindowChrome
              platform={platform}
              title={'long_unbroken_title_'.repeat(12)}
              leading={<a href='#leading-target'>{'long_unbroken_leading_'.repeat(40)}</a>}
              actions={ALL_ACTIONS}
              onAction={windowAction}
            />
          </div>
        ))}
      </div>
      <div id='window-forced-disabled'>
        <DesktopWindowChrome
          state='focused'
          disabled
          title='Busy'
          actions={ALL_ACTIONS}
          onAction={windowAction}
        />
      </div>
      <output aria-label='Window operations'>{windowEvents.join(',')}</output>
      <Button id='rerender-desktop' type='button' onClick={() => setRevision((n) => n + 1)}>
        Rerender declarations
      </Button>
      <output aria-label='Desktop revision'>{revision}</output>
      <div id='tray-one'>
        <DesktopTrayMenu source='tray' items={[...ITEMS]} onAction={menuAction} />
      </div>
      <Button id='between-trays' type='button'>Between tray menus</Button>
      <div id='tray-two'>
        <DesktopTrayMenu source='application-menu' items={ITEMS} onAction={menuAction} />
      </div>
      <Button id='after-trays' type='button'>After tray menus</Button>
      <div id='tray-snapshots' style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        {(['tray', 'application-menu'] as const).flatMap((source) =>
          (['rest', 'hover', 'disabled'] as const).map((state) => (
            <div key={source + state} id={'tray-' + source + '-' + state}>
              <DesktopTrayMenu
                source={source}
                state={state}
                type='action'
                items={ITEMS}
                onAction={menuAction}
              />
            </div>
          ))
        )}
      </div>
      <div id='tray-no-accelerator'>
        <DesktopTrayMenu source='tray' items={ITEMS} accelerator={false} />
      </div>
      <div id='tray-empty'>
        <DesktopTrayMenu source='tray' items={[]} />
      </div>
      <div id='tray-disabled'>
        <DesktopTrayMenu source='tray' state='rest' disabled items={ITEMS} onAction={menuAction} />
      </div>
      <div id='tray-long'>
        <DesktopTrayMenu
          source='tray'
          items={[{
            type: 'action',
            id: 'long',
            label: 'long_command_label_'.repeat(12),
            accelerator: 'VeryLongShortcut'.repeat(8),
          }]}
        />
      </div>
      <output aria-label='Menu operations'>{menuEvents.join(',')}</output>
      <Button id='after-desktop' type='button'>After desktop controls</Button>
      <div id='leading-target'>Native caller content</div>
    </main>
  );
}
