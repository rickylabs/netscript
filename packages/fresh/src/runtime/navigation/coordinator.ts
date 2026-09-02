import type { PartialNavigationCoordinator, RouteChange } from './types.ts';
type NavigationListener = (change: RouteChange) => void;
type HistoryUrl = string | URL | null | undefined;
interface NavigationElement {
  readonly nodeName?: string;
  readonly href?: string;
  readonly target?: string;
  readonly type?: string;
  readonly form?: unknown;
  readonly action?: string;
  readonly method?: string;
  getAttribute(name: string): string | null;
  closest(selector: string): NavigationElement | null;
}

type NavigationIntent = { readonly kind: 'page' | 'region'; readonly actualUrl?: URL };

interface NavigationLease {
  readonly kind: 'page' | 'region';
  readonly generation: number;
  readonly actualUrl: URL;
  readonly signal?: AbortSignal | null;
}

type ReplacementCorrelation = { readonly generation: number; readonly url: string };

/** Browser ownership seam used by focused tests. Not part of the package export map. */
export interface NavigationPlatform {
  readonly document: Document;
  readonly history: History;
  readonly location: Location;
  getFetch(): typeof fetch;
  setFetch(value: typeof fetch): void;
  addWindowEventListener(type: string, listener: EventListener, capture?: boolean): void;
  removeWindowEventListener(type: string, listener: EventListener, capture?: boolean): void;
}

class LogicalNavigationDrop extends Error {}

class ManagedPartialBody {
  readonly response: Response;
  #task: Promise<unknown> | undefined;
  #mode: 'text' | 'drain' | undefined;

  constructor(
    private readonly owner: NavigationRuntime,
    private readonly original: Response,
    private readonly lease: NavigationLease,
  ) {
    owner.bodies.add(this);
    this.response = new Proxy(original, {
      get: (target, property) => {
        if (property === 'text') return this.text.bind(this);
        const value: unknown = Reflect.get(target, property, target);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
  }

  text(): Promise<string> {
    if (this.#mode === 'drain') {
      return this.#task!.then(() => {
        throw this.owner.dropReason(this.lease);
      });
    }
    if (this.#task !== undefined) {
      return this.#task as Promise<string>;
    }
    this.#mode = 'text';
    const task = this.original.text().then((text) => {
      const reason = this.owner.invalidReason(this.lease);
      if (reason !== undefined) throw reason;
      this.owner.accept(this.lease, this.original);
      return text;
    });
    this.#task = task;
    this.owner.trackBody(this, task);
    return task;
  }

  drain(): Promise<void> {
    if (this.#task !== undefined) {
      return this.#task.then(() => undefined);
    }
    this.#mode = 'drain';
    const task = this.original.arrayBuffer().then(() => undefined);
    this.#task = task;
    this.owner.trackBody(this, task);
    return task;
  }

  async drainAndDrop(): Promise<never> {
    await this.drain();
    throw this.owner.dropReason(this.lease);
  }
}

class NavigationRuntime {
  readonly listeners = new Set<NavigationListener>();
  readonly bodies = new Set<ManagedPartialBody>();
  readonly fetches = new Set<Promise<Response>>();
  readonly ownedDrops = new WeakSet<object>();
  readonly replacements: ReplacementCorrelation[] = [];
  requestedGeneration = 0;
  renderedGeneration = 0;
  intent: NavigationIntent | undefined;
  disposed = false;

  readonly originalFetch: typeof fetch;
  readonly platformFetch: typeof fetch;
  readonly originalPushState: History['pushState'];
  readonly originalReplaceState: History['replaceState'];
  readonly wrappedFetch: typeof fetch;
  readonly wrappedPushState: History['pushState'];
  readonly wrappedReplaceState: History['replaceState'];

  constructor(readonly platform: NavigationPlatform) {
    this.originalFetch = platform.getFetch();
    this.platformFetch = this.originalFetch.bind(globalThis);
    this.originalPushState = platform.history.pushState;
    this.originalReplaceState = platform.history.replaceState;
    this.wrappedFetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      const task = this.interceptFetch(input, init);
      this.fetches.add(task);
      task.then(() => this.fetches.delete(task), () => this.fetches.delete(task));
      return task;
    }) as typeof fetch;
    this.wrappedPushState = ((data: unknown, unused: string, url?: HistoryUrl) => {
      this.originalPushState.call(this.platform.history, data, unused, url);
      this.emit('push', data);
    }) as History['pushState'];
    this.wrappedReplaceState = ((data: unknown, unused: string, url?: HistoryUrl) => {
      const target = this.resolveUrl(url);
      const isFreshApply = unused === '' && data === this.platform.history.state && url != null;
      const correlation = isFreshApply ? this.latestCorrelation(target.href) : undefined;
      if (correlation !== undefined && correlation.generation < this.requestedGeneration) {
        this.removeCorrelation(correlation);
        return;
      }
      this.originalReplaceState.call(this.platform.history, data, unused, url);
      if (correlation !== undefined) this.removeCorrelation(correlation);
      this.emit('replace', data);
    }) as History['replaceState'];
  }

  install(): void {
    this.platform.setFetch(this.wrappedFetch);
    this.platform.history.pushState = this.wrappedPushState;
    this.platform.history.replaceState = this.wrappedReplaceState;
    this.platform.document.addEventListener('click', this.onClick, true);
    this.platform.document.addEventListener('submit', this.onSubmit, true);
    this.platform.addWindowEventListener('popstate', this.onPopState, true);
    this.platform.addWindowEventListener('unhandledrejection', this.onUnhandledRejection, true);
  }

  readonly onClick: EventListener = (rawEvent) => {
    const event = rawEvent as MouseEvent;
    if (
      event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey ||
      event.altKey || event.shiftKey
    ) return;
    const target = asElement(event.target);
    if (target === null) return;
    const anchor = target.nodeName === 'A' ? target : target.closest('a');
    if (anchor !== null && anchor.href) {
      const url = new URL(anchor.href, this.platform.location.href);
      if (
        (!anchor.target || anchor.target === '_self') &&
        url.origin === this.platform.location.origin &&
        !anchor.getAttribute('href')?.startsWith('#') && clientNavigationEnabled(anchor)
      ) {
        this.stage({ kind: 'page', actualUrl: url });
      }
      return;
    }
    const button = target.nodeName === 'BUTTON' ? target : target.closest('button');
    if (
      button !== null && (button.type !== 'submit' || button.form == null) &&
      button.getAttribute('f-partial') !== null && clientNavigationEnabled(button)
    ) {
      this.stage({ kind: 'region' });
    }
  };

  readonly onSubmit: EventListener = (rawEvent) => {
    const event = rawEvent as SubmitEvent;
    const form = asElement(event.target);
    const submitter = asElement(event.submitter);
    if (
      form === null || form.nodeName !== 'FORM' || event.defaultPrevented ||
      !clientNavigationEnabled(form) || (submitter !== null && !clientNavigationEnabled(submitter))
    ) return;
    const method = (submitter?.getAttribute('formmethod') ?? form.method ?? 'get').toLowerCase();
    if (method !== 'get') return;
    const namedPartial = submitter?.getAttribute('f-partial') ?? form.getAttribute('f-partial');
    const rawPartial = namedPartial ?? submitter?.getAttribute('formaction') ??
      form.getAttribute('action') ?? form.action;
    const rawAction = submitter?.getAttribute('formaction') ?? form.action;
    if (!rawPartial || !rawAction) return;
    const partialUrl = new URL(rawPartial, this.platform.location.href);
    const actionUrl = new URL(rawAction, this.platform.location.href);
    const current = new URL(this.platform.location.href);
    const isNamedRegion = namedPartial !== null && isPartialPath(partialUrl) &&
      actionUrl.origin === current.origin && actionUrl.pathname === current.pathname;
    this.stage(isNamedRegion ? { kind: 'region' } : { kind: 'page', actualUrl: actionUrl });
  };

  readonly onPopState: EventListener = (rawEvent) => {
    const event = rawEvent as PopStateEvent;
    if (event.state === null || !isFreshHistoryState(event.state)) return;
    this.stage({ kind: 'page', actualUrl: new URL(this.platform.location.href) });
    this.emit('pop', event.state);
  };

  readonly onUnhandledRejection: EventListener = (rawEvent) => {
    const event = rawEvent as PromiseRejectionEvent;
    if (
      typeof event.reason === 'object' && event.reason !== null && this.ownedDrops.has(event.reason)
    ) {
      event.preventDefault();
    }
  };

  stage(intent: NavigationIntent): void {
    this.intent = intent;
    queueMicrotask(() => {
      if (this.intent === intent) this.intent = undefined;
    });
  }

  async interceptFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = requestUrl(input, this.platform.location.href);
    const method = requestMethod(input, init);
    if (
      method !== 'GET' || url.origin !== this.platform.location.origin ||
      url.searchParams.get('fresh-partial') !== 'true'
    ) {
      return await this.platformFetch(input, init);
    }
    const signal = requestSignal(input, init);
    const staged = this.intent;
    this.intent = undefined;
    const kind = staged?.kind ?? (isPartialPath(url) ? 'region' : 'page');
    const generation = kind === 'page' ? ++this.requestedGeneration : this.renderedGeneration;
    const actualUrl = staged?.actualUrl ?? withoutPartialFlag(url);
    const lease: NavigationLease = { kind, generation, actualUrl, signal };
    const [safeInput, safeInit] = insulateSignal(input, init);
    const response = await this.platformFetch(safeInput, safeInit);
    const body = new ManagedPartialBody(this, response, lease);
    if (this.invalidReason(lease) !== undefined) return await body.drainAndDrop();
    return body.response;
  }

  invalidReason(lease: NavigationLease): unknown | undefined {
    if (lease.signal?.aborted) return abortReason(lease.signal);
    if (this.disposed) return this.newDrop();
    const current = lease.kind === 'page'
      ? lease.generation === this.requestedGeneration
      : lease.generation === this.renderedGeneration &&
        this.requestedGeneration === this.renderedGeneration;
    return current ? undefined : this.newDrop();
  }

  dropReason(lease: NavigationLease): unknown {
    return lease.signal?.aborted ? abortReason(lease.signal) : this.newDrop();
  }

  newDrop(): LogicalNavigationDrop {
    const error = new LogicalNavigationDrop('Superseded Fresh partial response was drained');
    this.ownedDrops.add(error);
    return error;
  }

  accept(lease: NavigationLease, response: Response): void {
    if (lease.kind !== 'page') return;
    this.renderedGeneration = lease.generation;
    const actual = response.redirected && new URL(response.url).origin === lease.actualUrl.origin
      ? withoutPartialFlag(new URL(response.url))
      : lease.actualUrl;
    this.replacements.push({ generation: lease.generation, url: actual.href });
  }

  trackBody(body: ManagedPartialBody, task: Promise<unknown>): void {
    task.then(() => this.bodies.delete(body), () => this.bodies.delete(body));
  }

  subscribe(listener: NavigationListener): () => void {
    this.listeners.add(listener);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      this.listeners.delete(listener);
    };
  }

  navigate(href: string | URL): void {
    const url = new URL(href, this.platform.location.href);
    if (url.origin !== this.platform.location.origin) {
      throw new TypeError('Partial navigation requires a same-origin URL');
    }
    const anchor = this.platform.document.createElement('a');
    anchor.href = url.href;
    anchor.setAttribute('f-client-nav', 'true');
    const parent = this.platform.document.body ?? this.platform.document.documentElement;
    parent.append(anchor);
    try {
      anchor.click();
    } finally {
      anchor.remove();
    }
  }

  async dispose(): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;
    this.intent = undefined;
    this.listeners.clear();
    this.platform.document.removeEventListener('click', this.onClick, true);
    this.platform.document.removeEventListener('submit', this.onSubmit, true);
    this.platform.removeWindowEventListener('popstate', this.onPopState, true);
    this.platform.removeWindowEventListener('unhandledrejection', this.onUnhandledRejection, true);
    if (this.platform.getFetch() === this.wrappedFetch) this.platform.setFetch(this.originalFetch);
    if (this.platform.history.pushState === this.wrappedPushState) {
      this.platform.history.pushState = this.originalPushState;
    }
    if (this.platform.history.replaceState === this.wrappedReplaceState) {
      this.platform.history.replaceState = this.originalReplaceState;
    }
    while (this.fetches.size > 0 || this.bodies.size > 0) {
      const fetches = [...this.fetches];
      const drains = [...this.bodies].map((body) => body.drain());
      await Promise.allSettled([...fetches, ...drains]);
    }
  }

  private emit(kind: RouteChange['kind'], state: unknown): void {
    if (this.disposed) return;
    const change: RouteChange = { kind, url: new URL(this.platform.location.href), state };
    for (const listener of [...this.listeners]) listener(change);
  }

  private resolveUrl(url: HistoryUrl): URL {
    return url == null
      ? new URL(this.platform.location.href)
      : new URL(url, this.platform.location.href);
  }

  private latestCorrelation(url: string): ReplacementCorrelation | undefined {
    return this.replacements.findLast((entry) => entry.url === url);
  }

  private removeCorrelation(correlation: ReplacementCorrelation): void {
    const index = this.replacements.indexOf(correlation);
    if (index >= 0) this.replacements.splice(index, 1);
  }
}

type SharedInstallation = { readonly runtime: NavigationRuntime; references: number };

const installations = new WeakMap<Document, SharedInstallation>();

export function installPartialNavigationCoordinatorForPlatform(
  platform: NavigationPlatform,
): PartialNavigationCoordinator {
  let shared = installations.get(platform.document);
  if (shared === undefined) {
    shared = { runtime: new NavigationRuntime(platform), references: 0 };
    shared.runtime.install();
    installations.set(platform.document, shared);
  }
  shared.references += 1;
  const subscriptions = new Set<() => void>();
  let released = false;
  return {
    navigate(href): void {
      if (released) throw new Error('Partial navigation handle is disposed');
      shared!.runtime.navigate(href);
    },
    subscribe(listener): () => void {
      if (released) throw new Error('Partial navigation handle is disposed');
      const unsubscribe = shared!.runtime.subscribe(listener);
      subscriptions.add(unsubscribe);
      return () => {
        subscriptions.delete(unsubscribe);
        unsubscribe();
      };
    },
    async dispose(): Promise<void> {
      if (released) return;
      released = true;
      for (const unsubscribe of subscriptions) unsubscribe();
      subscriptions.clear();
      shared!.references -= 1;
      if (shared!.references === 0) {
        installations.delete(platform.document);
        await shared!.runtime.dispose();
      }
    },
  };
}

/**
 * Install the document-scoped Fresh partial-navigation coordinator.
 *
 * Repeated installation shares one adapter. Final disposal restores wrappers
 * still owned by the package and waits for finite partial bodies to reach EOF.
 *
 * @returns A reference-counted navigation lifecycle handle.
 * @throws {TypeError} When called outside a browser document.
 *
 * @example
 * ```ts
 * const navigation = installPartialNavigationCoordinator();
 * navigation.navigate('/dashboard');
 * await navigation.dispose();
 * ```
 */
export function installPartialNavigationCoordinator(): PartialNavigationCoordinator {
  const documentValue: unknown = Reflect.get(globalThis, 'document');
  const historyValue: unknown = Reflect.get(globalThis, 'history');
  const locationValue: unknown = Reflect.get(globalThis, 'location');
  if (
    typeof documentValue !== 'object' || documentValue === null ||
    typeof historyValue !== 'object' || historyValue === null ||
    typeof locationValue !== 'object' || locationValue === null
  ) {
    throw new TypeError('Partial navigation requires a browser document');
  }
  return installPartialNavigationCoordinatorForPlatform({
    document: documentValue as Document,
    history: historyValue as History,
    location: locationValue as Location,
    getFetch: () => globalThis.fetch,
    setFetch: (value) => {
      globalThis.fetch = value;
    },
    addWindowEventListener: (type, listener, capture) =>
      globalThis.addEventListener(type, listener, capture),
    removeWindowEventListener: (type, listener, capture) =>
      globalThis.removeEventListener(type, listener, capture),
  });
}

function asElement(value: unknown): NavigationElement | null {
  return value !== null && typeof value === 'object' &&
      typeof Reflect.get(value, 'closest') === 'function'
    ? value as NavigationElement
    : null;
}

function clientNavigationEnabled(element: NavigationElement): boolean {
  const setting = element.closest('[f-client-nav]');
  return setting !== null && setting.getAttribute('f-client-nav') !== 'false';
}

function isFreshHistoryState(value: unknown): value is { readonly fClientNav: true } {
  return value !== null && typeof value === 'object' && Reflect.get(value, 'fClientNav') === true;
}

function isPartialPath(url: URL): boolean {
  return url.pathname === '/partials' || url.pathname.startsWith('/partials/');
}

function withoutPartialFlag(url: URL): URL {
  const copy = new URL(url);
  copy.searchParams.delete('fresh-partial');
  return copy;
}

function requestUrl(input: RequestInfo | URL, base: string): URL {
  return new URL(input instanceof Request ? input.url : String(input), base);
}

function requestMethod(input: RequestInfo | URL, init?: RequestInit): string {
  return (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
}

function requestSignal(
  input: RequestInfo | URL,
  init?: RequestInit,
): AbortSignal | null | undefined {
  return init?.signal ?? (input instanceof Request ? input.signal : undefined);
}

function insulateSignal(
  input: RequestInfo | URL,
  init?: RequestInit,
): readonly [RequestInfo | URL, RequestInit | undefined] {
  if (input instanceof Request) {
    return [new Request(input, { ...init, signal: null }), undefined];
  }
  if (init === undefined || init.signal == null) return [input, init];
  const { signal: _signal, ...safeInit } = init;
  return [input, safeInit];
}

function abortReason(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException('The operation was aborted', 'AbortError');
}
