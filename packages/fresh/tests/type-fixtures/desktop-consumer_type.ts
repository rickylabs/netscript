import {
  bindDesktopRpcWindow,
  DESKTOP_RPC_BINDING_STATUSES,
  type DesktopBindableWindow,
  type DesktopRpcBindingStatus,
  type DesktopRpcWindowBinding,
} from '@netscript/fresh/desktop';
import { os } from '@orpc/server';

interface WindowContext {
  readonly windowId: string;
}

declare const desktopWindow: DesktopBindableWindow;

const contextOs = os.$context<WindowContext>();
const router = contextOs.router({
  identify: contextOs.handler(({ context }) => context.windowId),
});

const binding: DesktopRpcWindowBinding = bindDesktopRpcWindow({
  window: desktopWindow,
  router,
  context: { windowId: 'window-1' },
  runtime: { BrowserWindow: class BrowserWindow {} },
});

const status: DesktopRpcBindingStatus = binding.status;
if (binding.status === DESKTOP_RPC_BINDING_STATUSES.BOUND) {
  const bindingName: string = binding.bindingName;
  void bindingName;
}

void status;
void binding.close();
