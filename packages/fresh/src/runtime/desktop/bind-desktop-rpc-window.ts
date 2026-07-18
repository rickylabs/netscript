import { RPCHandler } from '@orpc/server/message-port';
import type { AnyRouter } from '@orpc/server';
import {
  createDesktopBindServerPort,
  DEFAULT_DESKTOP_RPC_BINDING,
  DESKTOP_RPC_JSON_SERIALIZERS,
} from '@netscript/sdk/desktop';
import { DESKTOP_RPC_BINDING_STATUSES, DESKTOP_RPC_DISABLED_REASONS } from './constants.ts';
import type {
  BindDesktopRpcWindowOptions,
  DesktopRpcRouter,
  DesktopRpcWindowBinding,
  DesktopRuntimeCapability,
  DisabledDesktopRpcWindowBinding,
} from './types.ts';

function isRecord(value: unknown): value is Readonly<Record<PropertyKey, unknown>> {
  return value !== null && typeof value === 'object';
}

function isOrpcRouter(value: unknown): value is DesktopRpcRouter & AnyRouter {
  if (!isRecord(value)) {
    return false;
  }
  if (Reflect.has(value, '~orpc')) {
    return true;
  }
  const children = Object.values(value);
  return children.length > 0 && children.every(isOrpcRouter);
}

function resolveDesktopRuntime(): DesktopRuntimeCapability | null {
  const deno: unknown = Reflect.get(globalThis, 'Deno');
  return deno !== null && typeof deno === 'object' ? deno : null;
}

function disabled(
  reason: DisabledDesktopRpcWindowBinding['reason'],
): DisabledDesktopRpcWindowBinding {
  return {
    status: DESKTOP_RPC_BINDING_STATUSES.DISABLED,
    reason,
    close: () => Promise.resolve(),
  };
}

/** Bind an existing oRPC router to one Deno Desktop window, or return an inert no-op. */
export function bindDesktopRpcWindow(
  options: BindDesktopRpcWindowOptions,
): DesktopRpcWindowBinding {
  const runtime = options.runtime === undefined ? resolveDesktopRuntime() : options.runtime;
  if (runtime === null || typeof runtime.BrowserWindow !== 'function') {
    return disabled(DESKTOP_RPC_DISABLED_REASONS.NOT_DESKTOP);
  }
  if (options.window === undefined || typeof options.window.bind !== 'function') {
    return disabled(DESKTOP_RPC_DISABLED_REASONS.MISSING_WINDOW);
  }
  if (!isOrpcRouter(options.router)) {
    throw new TypeError('Desktop RPC requires an oRPC router');
  }

  const bindingName = options.bindingName ?? DEFAULT_DESKTOP_RPC_BINDING;
  if (bindingName.trim().length === 0) {
    throw new TypeError('Desktop binding name must not be empty');
  }
  const server = createDesktopBindServerPort();
  const handler = new RPCHandler<Record<PropertyKey, unknown>>(options.router, {
    customJsonSerializers: DESKTOP_RPC_JSON_SERIALIZERS,
  });
  handler.upgrade(server.port, { context: options.context });

  try {
    options.window.bind(bindingName, server.handler);
  } catch (error) {
    server.close();
    throw error;
  }

  let closePromise: Promise<void> | undefined;
  return {
    status: DESKTOP_RPC_BINDING_STATUSES.BOUND,
    bindingName,
    close(): Promise<void> {
      if (closePromise !== undefined) {
        return closePromise;
      }
      server.close();
      closePromise = Promise.resolve(options.window?.unbind?.(bindingName)).then(() => undefined);
      return closePromise;
    },
  };
}
