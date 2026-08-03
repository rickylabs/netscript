/**
 * Native desktop chrome (tray + auto-update), gated so the SAME app runs
 * unchanged as a plain web server under `deno task dev` / Aspire.
 *
 * `deno desktop` (Deno 2.9+) exposes desktop-only globals — `Deno.BrowserWindow`,
 * `Deno.Tray`, `Deno.dock`, `Deno.autoUpdate`, `Deno.desktopVersion`, `Notification`
 * — that DO NOT exist under `deno run`. We feature-detect `Deno.BrowserWindow`
 * (the documented idiom, per resources/deno-desktop/notifications.md) and no-op in
 * the web/Aspire build. Nothing here runs unless the process is a packaged desktop
 * app, so importing + calling `initDesktopChrome()` from main.ts is safe everywhere.
 *
 * These globals are not in the stable Deno type lib, so we describe just the slice
 * we use via a local structural type and read them off `Deno` through it — no
 * `any`, no ambient global augmentation, gate stays lint-clean.
 */

interface TrayMenuItem {
  item: { label: string; id: string; enabled?: boolean; accelerator?: string };
}

interface DesktopTray {
  setTooltip(text: string | null): void;
  setMenu(items: (TrayMenuItem | 'separator')[] | null): void;
  addEventListener(
    type: 'menuclick',
    handler: (e: { detail: { id: string } }) => void,
  ): void;
  readonly trayId: number;
}

interface DesktopApi {
  BrowserWindow?: unknown;
  desktopVersion?: string | null;
  Tray?: new () => DesktopTray;
  autoUpdate?: (options: { url?: string; interval?: number }) => void;
}

/** The desktop-only surface of `Deno`, all optional (undefined under `deno run`). */
const desktop = Deno as unknown as DesktopApi;

/** True only inside a packaged `deno desktop` binary. */
export function isDesktopRuntime(): boolean {
  return typeof desktop.BrowserWindow !== 'undefined';
}

/**
 * Install tray + auto-update. No-op (and cheap) under the web/Aspire build.
 * Call once, after the Fresh app is defined in main.ts.
 */
export function initDesktopChrome(): void {
  if (!isDesktopRuntime() || !desktop.Tray) return;

  const tray = new desktop.Tray();
  // trayId === 0 → the platform could not create a status-area icon; bail quietly.
  if (tray.trayId === 0) return;

  tray.setTooltip('eis-chat');
  tray.setMenu([
    { item: { label: 'eis-chat', id: 'about', enabled: false } },
    'separator',
    { item: { label: 'Quit', id: 'quit', enabled: true, accelerator: 'CmdOrCtrl+Q' } },
  ]);
  tray.addEventListener('menuclick', (e) => {
    if (e.detail.id === 'quit') Deno.exit(0);
  });

  // Auto-update: a no-op unless compiled with a `version` + `desktop.release.baseUrl`
  // (`Deno.desktopVersion` is null under `deno run`). NOTE: on Windows the runtime
  // STAGES but does not APPLY updates yet (macOS/Linux only) — safe to leave in; it
  // just won't self-update on Windows. Only wire it once a release baseUrl exists.
  const releaseBaseUrl = Deno.env.get('EISCHAT_RELEASE_BASE_URL');
  if (releaseBaseUrl && desktop.autoUpdate) {
    desktop.autoUpdate({ url: releaseBaseUrl });
  }
}
