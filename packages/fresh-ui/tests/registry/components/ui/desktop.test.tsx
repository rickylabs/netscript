import { assertEquals, assertStringIncludes } from '@std/assert';
import { render } from 'npm:preact-render-to-string@^6.7.0';
import { FRESH_UI_REGISTRY_CONTENT } from '../../../../registry.generated.ts';
import { freshUiRegistryManifest } from '../../../../registry.manifest.ts';
import { DesktopUpdatePrompt } from '../../../../registry/components/ui/desktop-update-prompt.tsx';
import { DesktopWindowChrome } from '../../../../registry/components/ui/desktop-window-chrome.tsx';
import { DesktopTrayMenu } from '../../../../registry/components/ui/desktop-tray-menu.tsx';
import { DesktopDialog } from '../../../../registry/components/ui/desktop-dialog.tsx';
import { DesktopNotification } from '../../../../registry/components/ui/desktop-notification.tsx';

Deno.test('DesktopTrayMenu renders the D3 declaration union and stable action IDs', () => {
  const html = render(
    DesktopTrayMenu({
      source: 'application-menu',
      items: [
        { type: 'action', id: 'open-settings', label: 'Settings', accelerator: 'CmdOrCtrl+,' },
        { type: 'separator' },
        {
          type: 'submenu',
          label: 'Edit',
          items: [{ type: 'role', role: 'copy' }],
        },
      ],
    }),
  );

  assertStringIncludes(html, 'data-source="application-menu"');
  assertStringIncludes(html, 'data-action-id="open-settings"');
  assertStringIncludes(html, 'CmdOrCtrl+,');
  assertStringIncludes(html, 'role="separator"');
  assertStringIncludes(html, 'copy');
});

Deno.test('DesktopDialog renders explicit alert/confirm/prompt intents without native side effects', () => {
  const html = render(DesktopDialog({ message: 'Continue?', defaultValue: 'yes' }));

  assertStringIncludes(html, 'data-dialog-kind="alert"');
  assertStringIncludes(html, 'data-dialog-kind="confirm"');
  assertStringIncludes(html, 'data-dialog-kind="prompt"');
  assertStringIncludes(html, 'Continue?');
});

Deno.test('DesktopNotification renders a request preview without requesting permission', () => {
  const html = render(
    DesktopNotification({
      notification: { title: 'Build complete', body: 'Ready for review.' },
      disabled: true,
    }),
  );

  assertStringIncludes(html, 'data-part="desktop-notification"');
  assertStringIncludes(html, 'data-state="disabled"');
  assertStringIncludes(html, 'Build complete');
  assertStringIncludes(html, 'Ready for review.');
  assertStringIncludes(html, 'disabled');
});

Deno.test('DesktopWindowChrome renders only declared documented actions and state', () => {
  const html = render(
    DesktopWindowChrome({
      title: 'NetScript Studio',
      actions: ['show', 'focus', 'reload', 'hide', 'close'],
      disabled: true,
    }),
  );

  assertStringIncludes(html, 'data-part="window-chrome"');
  assertStringIncludes(html, 'data-state="disabled"');
  assertStringIncludes(html, 'data-desktop-action="show"');
  assertStringIncludes(html, 'data-desktop-action="focus"');
  assertStringIncludes(html, 'data-desktop-action="reload"');
  assertStringIncludes(html, 'data-desktop-action="hide"');
  assertStringIncludes(html, 'data-desktop-action="close"');
  assertEquals(html.includes('minimize'), false);
  assertEquals(html.includes('maximize'), false);
});

Deno.test('DesktopUpdatePrompt renders the automatic ready-event branch exhaustively', () => {
  const html = render(
    DesktopUpdatePrompt({
      event: { applyMode: 'automatic', version: '0.0.1-beta.11' },
      onRestart() {},
    }),
  );

  assertStringIncludes(html, 'data-state="automatic"');
  assertStringIncludes(html, 'Update ready — restart to apply');
  assertStringIncludes(html, 'Version 0.0.1-beta.11 has been verified and staged.');
  assertStringIncludes(html, 'Restart now');
  assertEquals(html.includes('Open installer'), false);
});

Deno.test('DesktopUpdatePrompt renders the manual Windows installer branch from the event URL', () => {
  const html = render(
    DesktopUpdatePrompt({
      event: {
        applyMode: 'manual',
        version: '0.0.1-beta.11',
        manualUpdateUrl: 'https://updates.example.test/windows',
      },
    }),
  );

  assertStringIncludes(html, 'data-state="manual"');
  assertStringIncludes(html, 'Update ready — install manually');
  assertStringIncludes(html, 'requires the Windows installer');
  assertStringIncludes(html, 'href="https://updates.example.test/windows"');
  assertStringIncludes(html, 'rel="noreferrer noopener"');
  assertEquals(html.includes('Restart now'), false);
});

Deno.test('desktop registry items obey the L2 authority chain and form a desktop collection', async () => {
  const itemNames = [
    'desktop-tray-menu',
    'desktop-dialog',
    'desktop-notification',
    'desktop-window-chrome',
    'desktop-update-prompt',
    'desktop-only',
  ];
  const items = freshUiRegistryManifest.items.filter((item) => itemNames.includes(item.name));
  assertEquals(items.map((item) => item.name), itemNames);
  assertEquals(items.map((item) => item.layer), itemNames.map(() => 2 as const));
  assertEquals(
    items.map((item) => item.copyOwnership),
    itemNames.map(() => 'app-owned-after-copy'),
  );

  const desktopCollection = freshUiRegistryManifest.collections.find((item) =>
    item.name === 'desktop'
  );
  assertEquals(desktopCollection?.items, ['theme-seed', ...itemNames]);

  for (const item of items) {
    for (const file of item.files.filter((file) => file.source.endsWith('.tsx'))) {
      const source = await Deno.readTextFile(
        new URL(`../../../../${file.source}`, import.meta.url),
      );
      assertEquals(
        /from ['"]\.\.?\//.test(source),
        false,
        `${file.source} must not import another copy-source module`,
      );
      assertEquals(
        FRESH_UI_REGISTRY_CONTENT[file.source],
        source,
        `${file.source} must be content-identical in the generated registry`,
      );
    }
  }
});
