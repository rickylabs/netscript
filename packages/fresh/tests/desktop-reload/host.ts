import { bindDesktopRpcWindow } from '@netscript/fresh/desktop';
import { reloadRouter } from './contract.ts';

interface NativeWindow {
  bind(name: string, handler: (...args: unknown[]) => Promise<unknown>): void;
  reload(): void;
  close(): void;
}
function isNativeWindow(value: unknown): value is NativeWindow {
  return value !== null && typeof value === 'object' &&
    typeof Reflect.get(value, 'bind') === 'function' &&
    typeof Reflect.get(value, 'reload') === 'function' &&
    typeof Reflect.get(value, 'close') === 'function';
}
function isClosed(value: unknown): boolean {
  return value !== null && typeof value === 'object' && Reflect.get(value, 'status') === 'closed';
}
const ctor: unknown = Reflect.get(Deno, 'BrowserWindow');
if (typeof ctor !== 'function') throw new Error('Real native BrowserWindow is required');
const native: unknown = Reflect.construct(ctor, [{
  title: 'Desktop document reconnect regression',
}]);
if (!isNativeWindow(native)) throw new Error('Native window does not support real reload');
const rendererPath = Deno.env.get('NETSCRIPT_RELOAD_RENDERER');
const receiptPath = Deno.env.get('NETSCRIPT_RELOAD_RECEIPT');
if (!rendererPath || !receiptPath) throw new Error('Native regression targets are required');
const renderer = await Deno.readTextFile(rendererPath);
let bindCalls = 0;
let unbindCalls = 0;
let pending = 0;
let retiredClosed = 0;
let currentEpoch = 0;
const firstPending = Promise.withResolvers<void>();
const done = Promise.withResolvers<void>();
const documents: { epoch: number; value: string }[] = [];
const binding = bindDesktopRpcWindow({
  router: reloadRouter,
  context: {},
  window: {
    bind(name, handler) {
      bindCalls++;
      native.bind(name, async (operation, payload, epoch) => {
        if (typeof epoch !== 'number') throw new Error('SDK omitted native document epoch');
        currentEpoch = Math.max(currentEpoch, epoch);
        if (operation === 'receive') pending++;
        const result = handler(operation, payload, epoch);
        // The second RECEIVE from the first document is the parked post-RPC poll.
        if (operation === 'receive' && documents.length === 1) firstPending.resolve();
        try {
          const value = await result;
          if (operation === 'receive' && epoch < currentEpoch && isClosed(value)) retiredClosed++;
          return value;
        } finally {
          if (operation === 'receive') pending--;
        }
      });
    },
    async unbind(name) {
      unbindCalls++;
      const unbind: unknown = Reflect.get(native, 'unbind');
      if (typeof unbind === 'function') await Reflect.apply(unbind, native, [name]);
    },
  },
});
const timeout = setTimeout(
  () => done.reject(new Error('Actual native document reload timed out')),
  15000,
);
const server = Deno.serve({ port: 0, onListen() {} }, async (request) => {
  try {
    const path = new URL(request.url).pathname;
    if (path === '/renderer.js') {
      return new Response(renderer, { headers: { 'content-type': 'text/javascript' } });
    }
    if (path === '/error') throw new Error(await request.text());
    if (path === '/ack') {
      const value: unknown = await request.json();
      if (value === null || typeof value !== 'object') throw new Error('Invalid document receipt');
      const epoch: unknown = Reflect.get(value, 'epoch');
      const typedValue: unknown = Reflect.get(value, 'value');
      if (typeof epoch !== 'number' || typedValue !== 'native-pong') {
        throw new Error('Typed native RPC failed');
      }
      documents.push({ epoch, value: typedValue });
      if (documents.length === 1) {
        // The receive loop can park before the acknowledgement reaches the host.
        if (pending > 0) firstPending.resolve();
        await firstPending.promise;
        setTimeout(() => native.reload(), 20);
      } else {
        if (documents.length !== 2 || epoch <= documents[0].epoch || retiredClosed !== 1) {
          throw new Error('Reload did not retire and replace the previous native document');
        }
        done.resolve();
      }
      return new Response('ok');
    }
    return new Response('<script type="module" src="/renderer.js"></script>', {
      headers: { 'content-type': 'text/html' },
    });
  } catch (error) {
    done.reject(error);
    return new Response('Native regression failed', { status: 500 });
  }
});
try {
  await done.promise;
  await binding.close();
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  if (bindCalls !== 1 || unbindCalls !== 1 || pending !== 0) {
    throw new Error('Native cleanup failed');
  }
  await Deno.writeTextFile(
    receiptPath,
    JSON.stringify({ documents, retiredClosed, bindCalls, unbindCalls, pending }),
  );
} finally {
  clearTimeout(timeout);
  await binding.close();
  await server.shutdown();
  native.close();
}
