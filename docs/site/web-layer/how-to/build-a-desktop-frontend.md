---
layout: layouts/base.vto
title: Building a desktop frontend the NetScript way
templateEngine: [vento, md]
order: 102
oldUrl: /how-to/build-a-desktop-frontend/
---

# Building a desktop frontend the NetScript way

**Goal:** compose one Fresh frontend that runs as an ordinary browser/Aspire app and gains native
window chrome, tray menus, dialogs, notifications, typed RPC, and update-ready UX when hosted by
Deno Desktop.

The boundary is capability-based. Your route tree stays a normal Fresh 2 application. The native
host owns window creation and policy; `@netscript/fresh/desktop` binds your existing oRPC router to
that window, `@netscript/sdk/desktop` creates the typed webview client, and copied
`@netscript/fresh-ui` components render the controls. None of those layers exits the process, starts
an updater, or invents browser fallbacks.

{{ comp callout { type: "note", title: "Browser and Aspire are first-class modes" } }} The desktop
lifecycle and <code>DesktopOnly</code> island return inert results when the native capability is
absent. Server rendering therefore never opens a dialog, requests notification permission, or calls
a window global. {{ /comp }}

## 1. Install the desktop UI collection

From the workspace root, copy the app-owned desktop controls into the dashboard:

```bash
netscript ui:add desktop --app dashboard
```

The collection installs tray/menu, dialog, notification, window-chrome, update-prompt, and
`DesktopOnly` sources plus their token-driven CSS. They are copied code: import components from your
app barrel, not from the registry package.

## 2. Bind your existing router in the native host

Create the Deno Desktop window explicitly, then bind the same oRPC router and context you use for
other transports. The Fresh adapter accepts a narrow window shape and returns `bound | disabled`, so
cleanup is unconditional:

```ts
import { bindDesktopRpcWindow } from '@netscript/fresh/desktop';
import { appRouter } from './rpc/router.ts';

const window = new BrowserWindow({ title: 'NetScript Studio' });
const rpc = bindDesktopRpcWindow({
  window,
  router: appRouter,
  context: { windowId: 'main' },
});

addEventListener('unload', () => void rpc.close());
```

Keep window creation, exit-on-last-window, updater scheduling, and application shutdown in this
composition root. Reusable UI must not decide those policies.

## 3. Call the contract from the webview

Use the existing service contract for inference. No ambient `bindings.d.ts`, hand-written JSON
protocol, or duplicate RPC contract is needed:

```ts
import { createDesktopServiceClient } from '@netscript/sdk/desktop';
import { appContract } from '../contracts/app.ts';

export const desktopApi = createDesktopServiceClient({ contract: appContract });
const session = await desktopApi.sessions.get({ id: 'session-42' });
```

Outside Deno Desktop, construct this client only behind the same desktop gate. Ordinary browser and
Aspire data paths continue to use the normal SDK transport.

## 4. Wire native chrome without hiding policy

`createDesktopChrome` owns the mechanical adapter: declarative menu translation, stable action-ID
dispatch, feature-gated dialogs and notifications, documented window operations, replacement, and
cleanup. Your host still decides what an action means:

```ts
import { createDesktopChrome } from '@netscript/fresh-ui/desktop';

const chrome = createDesktopChrome({
  window,
  tray: {
    tooltip: 'NetScript Studio',
    menu: [
      { type: 'action', id: 'show-window', label: 'Show window' },
      { type: 'separator' },
      { type: 'role', role: 'quit' },
    ],
  },
  onAction(event) {
    if (event.actionId === 'show-window') chrome.show();
  },
});
```

Only documented operations are exposed: title, show, hide, focus, reload, and close. There are no
fake minimize/maximize controls, and `dispose()` releases listeners and tray state without exiting
the application.

## 5. Render desktop-gated, app-owned controls

The copied controls emit intents. Connect those intents to an active lifecycle in a small island;
keep ordinary page content outside the gate:

```tsx
import DesktopOnly from '@app/islands/DesktopOnly.tsx';
import { DesktopWindowChrome } from '@app/components/ui/mod.ts';

export function NativeChrome() {
  return (
    <DesktopOnly>
      <DesktopWindowChrome
        title='NetScript Studio'
        actions={['focus', 'reload', 'hide', 'close']}
        onAction={(action) => chrome.performWindowAction(action)}
      />
    </DesktopOnly>
  );
}
```

Use `DesktopTrayMenu`, `DesktopDialog`, and `DesktopNotification` the same way: their callbacks
carry declarations or requests to the host controller, while server render remains side-effect free.

## 6. Render update-ready events exhaustively

Pass the ready event from `@netscript/sdk/auto-update` directly to `DesktopUpdatePrompt`. Automatic
updates say **“Update ready — restart to apply”**. The manual branch uses the event's verified
`manualUpdateUrl` for the Windows installer; do not infer the branch from platform strings.

```tsx
<DesktopUpdatePrompt event={readyEvent} onRestart={requestApplicationRestart} />;
```

## Verify both modes

1. Run the Fresh app in a browser or under Aspire and open `/design/components`. Desktop controls
   render as previews; `DesktopOnly` emits no native-only content and the console stays clean.
2. Test action IDs and controller results with injected structural capabilities—never ambient global
   declarations.
3. Run native packaging and smoke through the desktop smoke workflow. Browser gallery proof is not a
   substitute for native window, tray, dialog, or notification validation.

{{ comp callout { type: "warning", title: "Keep the native smoke claim honest" } }} This recipe
proves composition and browser-safe behavior. The project desktop smoke gate owns the real
packaged-runtime check. {{ /comp }}

## See also

- [Customize Fresh UI](/how-to/customize-fresh-ui/)
- [`@netscript/fresh` reference](/reference/fresh/)
- [`@netscript/sdk` reference](/reference/sdk/)
- [`@netscript/fresh-ui` reference](/reference/fresh-ui/)
