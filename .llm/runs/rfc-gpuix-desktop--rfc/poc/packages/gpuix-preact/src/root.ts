/**
 * Preact root for GPUIX: owns one native window's element tree, batches
 * mutations once per Preact commit, and dispatches native events back into
 * Preact's event proxy.
 *
 * @module
 */
import { type ComponentChildren, createContext, h, options, render as preactRender } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';
import { GpuixRenderer } from '@gpuix/native';
import type { EventPayload, WindowOptions } from '@gpuix/native';
import {
  createMutationQueue,
  createRendererState,
  observeWindowSize,
  unregisterEventHandlers,
} from '@gpuix/native/host';
import type {
  EventHandlerMap,
  NativeRenderer,
  RootEventHandlers,
  WindowSize,
} from '@gpuix/native/host';
import { startFrameLoop } from '@gpuix/native/runtime';
import { GDocument, type GElement, type HostScope, mountTree } from './dom.ts';

/** One document per process. Preact 11 reaches it via `ownerDocument`. */
export const gpuixDocument: GDocument = new GDocument();

// Preact 10 creates nodes through the global `document`. Install the facade
// only when no real DOM exists, so a browser bundle is never affected.
if (typeof (globalThis as { document?: unknown }).document === 'undefined') {
  Object.defineProperty(globalThis, 'document', {
    value: gpuixDocument,
    configurable: true,
    writable: true,
  });
}

const liveRoots = new Set<{ flush(): void }>();
let commitHookInstalled = false;

/** Flush every root synchronously at the end of each Preact commit (`options._commit`). */
function installCommitHook(): void {
  if (commitHookInstalled) return;
  commitHookInstalled = true;
  const hooks = options as unknown as Record<string, ((...args: unknown[]) => void) | undefined>;
  const previous = hooks.__c;
  hooks.__c = (...args: unknown[]) => {
    for (const root of liveRoots) root.flush();
    previous?.(...args);
  };
}

/** Values exposed to components through `useGpuix()`. */
export interface GpuixContextValue {
  readonly renderer: NativeRenderer;
}

const GpuixContext = createContext<GpuixContextValue | null>(null);

/** Access the native renderer (window title, clipboard, notifications, file picker...). */
export function useGpuix(): GpuixContextValue {
  const value = useContext(GpuixContext);
  if (!value) throw new Error('useGpuix() must be used inside a gpuix-preact root');
  return value;
}

/** Live window size, polled like the upstream React hook. */
export function useWindowSize(): WindowSize {
  const { renderer } = useGpuix();
  const [size, setSize] = useState<WindowSize>({ width: 0, height: 0 });
  useEffect(() => observeWindowSize(renderer, setSize), [renderer]);
  return size;
}

/** A mounted Preact tree bound to one GPUIX window. */
export interface GpuixPreactRoot {
  readonly renderer: NativeRenderer;
  readonly container: GElement;
  render(children: ComponentChildren): void;
  flush(): void;
  unmount(): void;
}

/** Root-level window event handlers (keyboard shortcuts, tab navigation). */
export type RootOptions = RootEventHandlers;

/** Bind a Preact tree to an already-initialized renderer. */
export function createRoot(renderer: NativeRenderer, handlers: RootOptions = {}): GpuixPreactRoot {
  installCommitHook();
  const state = createRendererState(renderer);
  const eventHandlers: EventHandlerMap = new Map();
  const mutations = createMutationQueue(renderer, (ids) => {
    for (const id of ids) unregisterEventHandlers(eventHandlers, id);
  });
  const dirtyStyles = new Set<GElement>();
  let scheduled = false;

  const flush = () => {
    scheduled = false;
    for (const element of dirtyStyles) {
      if (element.__mounted) mutations.setStyle(element.__gid, { ...element.__style });
    }
    dirtyStyles.clear();
    mutations.flushMutations();
  };

  const scope: HostScope = {
    mutations,
    renderer,
    eventHandlers,
    allocateId: () => ++state.ids.nextElementId,
    markStyleDirty(element) {
      dirtyStyles.add(element);
      scope.requestFlush();
    },
    requestFlush() {
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(flush);
    },
  };

  const binding = state.attach({
    eventHandlers,
    onWindowKeyDown: handlers.onKeyDown,
    onWindowKeyUp: handlers.onKeyUp,
    onSelectionChange: handlers.onSelectionChange,
    tabNavigation: handlers.tabNavigation,
    onEvent: handlers.onEvent,
  });
  renderer.setWindowKeyEvents?.(true, Boolean(handlers.onKeyUp), binding.windowKeyEventId);
  mutations.setKeyboardFocusDim(handlers.keyboardFocusDim !== false);

  // The container is a real native root div; Preact renders into it.
  const container = gpuixDocument.createElement('div');
  container.__style = { display: 'flex', flexDirection: 'column', width: '100%', height: '100%' };
  mountTree(scope, container);
  mutations.setRoot(container.__gid);

  const root: GpuixPreactRoot = {
    renderer,
    container,
    render(children) {
      preactRender(
        h(GpuixContext.Provider, { value: { renderer } }, children),
        container as unknown as Element,
      );
      flush();
    },
    flush,
    unmount() {
      preactRender(null, container as unknown as Element);
      flush();
      binding.detach();
      liveRoots.delete(root);
    },
  };
  liveRoots.add(root);
  return root;
}

/** Window options plus root event handlers accepted by {@link render}. */
export interface RenderOptions extends WindowOptions, RootOptions {
  /** Inject an existing renderer (tests, multi-window hosts). */
  renderer?: NativeRenderer;
  /** Called when the last window closes. Defaults to exiting the process. */
  onClose?: () => void;
  /** Fixed frame pump interval; default lets GPUIX pick (display-link on macOS, 8 ms polling elsewhere). */
  frameMs?: number;
  onError?: (error: unknown) => void;
}

/** Handle returned by {@link render}. */
export interface GpuixApp {
  readonly root: GpuixPreactRoot;
  readonly renderer: NativeRenderer;
  stop(): void;
}

/**
 * Open a native window and mount a Preact tree into it.
 *
 * Works on any runtime that loads Node-API addons: Deno (`--allow-ffi`,
 * `nodeModulesDir`), Bun and Node.
 */
export function render(children: ComponentChildren, opts: RenderOptions = {}): GpuixApp {
  const {
    renderer: injected,
    onClose,
    frameMs,
    onError = (error: unknown) => console.error('[gpuix-preact]', error),
    onKeyDown,
    onKeyUp,
    onSelectionChange,
    tabNavigation,
    keyboardFocusDim,
    onEvent,
    ...windowOptions
  } = opts;
  let renderer: NativeRenderer;
  if (injected) {
    renderer = injected;
  } else {
    let native!: GpuixRenderer;
    native = new GpuixRenderer((error: Error | null, event: EventPayload) => {
      if (error) return onError(error);
      try {
        createRendererState(native).dispatch(event);
      } catch (dispatchError) {
        onError(dispatchError);
      }
    });
    native.init(windowOptions);
    renderer = native;
  }
  const root = createRoot(renderer, {
    onKeyDown,
    onKeyUp,
    onSelectionChange,
    tabNavigation,
    keyboardFocusDim,
    onEvent,
  });
  root.render(children);
  const loop = injected ? { stop() {} } : startFrameLoop(renderer as GpuixRenderer, {
    frameMs,
    onError,
    onTerminated: () => {
      if (onClose) onClose();
      else exitProcess(0);
    },
  });
  return {
    root,
    renderer,
    stop() {
      loop.stop();
      root.unmount();
    },
  };
}

function exitProcess(code: number): void {
  const deno = (globalThis as { Deno?: { exit(code: number): never } }).Deno;
  if (deno) deno.exit(code);
  const proc = (globalThis as { process?: { exit(code: number): never } }).process;
  proc?.exit(code);
}
