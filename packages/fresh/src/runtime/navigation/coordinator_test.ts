import { assert, assertEquals, assertNotEquals, assertRejects, assertThrows } from '@std/assert';
import {
  installPartialNavigationCoordinatorForPlatform,
  type NavigationPlatform,
} from './coordinator.ts';

class TestElement {
  readonly attributes = new Map<string, string>();
  attached = false;
  href = '';
  target = '';
  type = '';
  form: unknown = null;
  action = '';
  method = 'get';

  constructor(readonly nodeName: string, private readonly document: TestDocument) {}

  getAttribute(name: string): string | null {
    if (name === 'href' && this.href) return this.href;
    return this.attributes.get(name) ?? null;
  }

  hasAttribute(name: string): boolean {
    return this.attributes.has(name) || (name === 'href' && this.href.length > 0);
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  closest(selector: string): TestElement | null {
    if (selector === 'a' && this.nodeName === 'A') return this;
    if (selector === 'button' && this.nodeName === 'BUTTON') return this;
    if (selector === '[f-client-nav]' && this.attributes.has('f-client-nav')) return this;
    return null;
  }

  click(): void {
    this.document.anchorWasAttached = this.attached;
    this.document.dispatchFrom('click', this, {
      button: 0,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      shiftKey: false,
    });
    this.document.afterAnchorClick?.(this);
  }

  remove(): void {
    this.attached = false;
  }
}

class TestDocument extends EventTarget {
  anchorWasAttached = false;
  afterAnchorClick: ((anchor: TestElement) => void) | undefined;
  readonly body = {
    append: (element: TestElement): void => {
      element.attached = true;
    },
  };
  readonly documentElement = this.body;

  createElement(name: string): TestElement {
    return new TestElement(name.toUpperCase(), this);
  }

  dispatchFrom(type: string, target: TestElement, values: Record<string, unknown> = {}): Event {
    const event = new Event(type, { cancelable: true });
    Object.defineProperty(event, 'target', { value: target });
    for (const [name, value] of Object.entries(values)) {
      Object.defineProperty(event, name, { value });
    }
    this.dispatchEvent(event);
    return event;
  }
}

interface HistoryCall {
  readonly kind: 'push' | 'replace';
  readonly url: string;
  readonly state: unknown;
}

class TestHistory {
  state: unknown = { fClientNav: true, index: 0 };
  readonly calls: HistoryCall[] = [];

  constructor(private readonly location: Location) {}

  pushState(data: unknown, _unused: string, url?: string | URL | null): void {
    this.state = data;
    if (url != null) this.location.href = new URL(url, this.location.href).href;
    this.calls.push({ kind: 'push', url: this.location.href, state: data });
  }

  replaceState(data: unknown, _unused: string, url?: string | URL | null): void {
    this.state = data;
    if (url != null) this.location.href = new URL(url, this.location.href).href;
    this.calls.push({ kind: 'replace', url: this.location.href, state: data });
  }
}

class TestPlatform extends EventTarget implements NavigationPlatform {
  readonly documentValue = new TestDocument();
  readonly location = new URL('https://example.test/') as unknown as Location;
  readonly historyValue = new TestHistory(this.location);
  fetchValue: typeof fetch;

  constructor(fetchValue: typeof fetch) {
    super();
    this.fetchValue = fetchValue;
  }

  get document(): Document {
    return this.documentValue as unknown as Document;
  }

  get history(): History {
    return this.historyValue as unknown as History;
  }

  getFetch(): typeof fetch {
    return this.fetchValue;
  }

  setFetch(value: typeof fetch): void {
    this.fetchValue = value;
  }

  addWindowEventListener(type: string, listener: EventListener, capture?: boolean): void {
    this.addEventListener(type, listener, capture);
  }

  removeWindowEventListener(type: string, listener: EventListener, capture?: boolean): void {
    this.removeEventListener(type, listener, capture);
  }

  anchor(href: string, partial?: string): TestElement {
    const anchor = this.documentValue.createElement('a');
    anchor.href = new URL(href, this.location.href).href;
    anchor.setAttribute('f-client-nav', 'true');
    if (partial !== undefined) anchor.setAttribute('f-partial', partial);
    return anchor;
  }

  stageAnchor(href: string, partial?: string): void {
    this.documentValue.dispatchFrom('click', this.anchor(href, partial), {
      button: 0,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      shiftKey: false,
    });
  }

  stageRegion(partial = '/partials/region'): void {
    const button = this.documentValue.createElement('button');
    button.type = 'button';
    button.setAttribute('f-client-nav', 'true');
    button.setAttribute('f-partial', partial);
    this.documentValue.dispatchFrom('click', button, {
      button: 0,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      shiftKey: false,
    });
  }

  dispatchWindow(type: string, values: Record<string, unknown>): Event {
    const event = new Event(type, { cancelable: true });
    for (const [name, value] of Object.entries(values)) {
      Object.defineProperty(event, name, { value });
    }
    this.dispatchEvent(event);
    return event;
  }
}

interface ControlledResponse {
  readonly response: Response;
  readonly reachedEof: Promise<void>;
  readonly cancelCalls: () => number;
  write(value: string): void;
  close(): void;
}

function controlledResponse(): ControlledResponse {
  let controller: ReadableStreamDefaultController<Uint8Array>;
  let cancellations = 0;
  let resolveEof!: () => void;
  const reachedEof = new Promise<void>((resolve) => {
    resolveEof = resolve;
  });
  const body = new ReadableStream<Uint8Array>({
    start(value) {
      controller = value;
    },
    cancel() {
      cancellations += 1;
    },
  });
  return {
    response: new Response(body, { headers: { 'content-type': 'text/html; charset=utf-8' } }),
    reachedEof,
    cancelCalls: () => cancellations,
    write(value) {
      controller.enqueue(new TextEncoder().encode(value));
    },
    close() {
      controller.close();
      resolveEof();
    },
  };
}

function htmlResponse(body: string, url?: string): Response {
  const response = new Response(body, { headers: { 'content-type': 'text/html; charset=utf-8' } });
  if (url === undefined) return response;
  return new Proxy(response, {
    get(target, property) {
      if (property === 'redirected') return true;
      if (property === 'url') return url;
      const value: unknown = Reflect.get(target, property, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

function partialUrl(path: string): string {
  const url = new URL(path, 'https://example.test');
  url.searchParams.set('fresh-partial', 'true');
  return url.href;
}

Deno.test('public navigation entrypoint imports without browser globals or global mutation', async () => {
  const fetchBefore = globalThis.fetch;
  const module = await import('./mod.ts');

  assertEquals(typeof module.installPartialNavigationCoordinator, 'function');
  assertEquals(typeof module.KeyedPartial, 'function');
  assertEquals(globalThis.fetch, fetchBefore);
});

Deno.test('captured platform fetch preserves its Window receiver on both transport paths', async () => {
  let calls = 0;
  const receiverSensitiveFetch = function (
    this: typeof globalThis,
    _input: RequestInfo | URL,
    _init?: RequestInit,
  ): Promise<Response> {
    if (this !== globalThis) throw new TypeError('detached platform fetch');
    calls += 1;
    return Promise.resolve(htmlResponse('receiver-preserved'));
  } as typeof fetch;
  const platform = new TestPlatform(receiverSensitiveFetch);
  const handle = installPartialNavigationCoordinatorForPlatform(platform);

  platform.stageAnchor('/receiver-preserved');
  const partial = await platform.fetchValue(partialUrl('/receiver-preserved'));
  assertEquals(await partial.text(), 'receiver-preserved');
  assertEquals(await (await platform.fetchValue('/asset.css')).text(), 'receiver-preserved');
  assertEquals(calls, 2);

  await handle.dispose();
  assertEquals(platform.getFetch(), receiverSensitiveFetch);
});

Deno.test('page intents order bodies while sibling regions remain independent', async () => {
  const pageA = controlledResponse();
  const pageB = controlledResponse();
  const responses = [pageA.response, pageB.response];
  const platform = new TestPlatform(
    (() => Promise.resolve(responses.shift() ?? htmlResponse(''))) as typeof fetch,
  );
  const handle = installPartialNavigationCoordinatorForPlatform(platform);

  platform.stageAnchor('/a', '/partials/page-a');
  const a = await platform.fetchValue(partialUrl('/partials/page-a'));
  const aText = a.text();
  platform.stageAnchor('/b');
  const b = await platform.fetchValue(partialUrl('/b'));
  pageB.write('page-b');
  pageB.close();
  assertEquals(await b.text(), 'page-b');
  pageA.write('page-a');
  pageA.close();
  await assertRejects(() => aText, Error, 'drained');
  await pageA.reachedEof;
  assertEquals(pageA.cancelCalls(), 0);

  platform.fetchValue = platform.getFetch();
  platform.stageRegion('/partials/left');
  const left = await platform.fetchValue(partialUrl('/partials/left'));
  platform.stageRegion('/partials/right');
  const right = await platform.fetchValue(partialUrl('/partials/right'));
  assertEquals(await Promise.all([left.text(), right.text()]), ['', '']);
  await handle.dispose();
});

Deno.test('capture tokens expire and stale-at-headers responses drain without cancellation', async () => {
  let resolvePage!: (value: Response) => void;
  const pageHeaders = new Promise<Response>((resolve) => {
    resolvePage = resolve;
  });
  const staleRegion = controlledResponse();
  const platform = new TestPlatform(
    ((input) =>
      String(input).includes('/page')
        ? pageHeaders
        : Promise.resolve(staleRegion.response)) as typeof fetch,
  );
  const handle = installPartialNavigationCoordinatorForPlatform(platform);

  platform.stageAnchor('/page');
  const page = platform.fetchValue(partialUrl('/page'));
  platform.stageAnchor('/unused');
  await Promise.resolve();
  const region = platform.fetchValue(partialUrl('/partials/region'));
  staleRegion.write('stale-region');
  staleRegion.close();
  await assertRejects(() => region, Error, 'drained');
  assertEquals(staleRegion.cancelCalls(), 0);
  resolvePage(htmlResponse('page'));
  assertEquals(await (await page).text(), 'page');
  await handle.dispose();
});

Deno.test('history adapter suppresses stale Fresh replacements and emits accepted mutations', async () => {
  const queue = [htmlResponse('a'), htmlResponse('b', 'https://example.test/b-redirect')];
  const platform = new TestPlatform((() => Promise.resolve(queue.shift()!)) as typeof fetch);
  const handle = installPartialNavigationCoordinatorForPlatform(platform);
  const changes: string[] = [];
  handle.subscribe((change) => changes.push(`${change.kind}:${change.url.pathname}`));

  platform.stageAnchor('/a');
  const a = await platform.fetchValue(partialUrl('/a'));
  assertEquals(await a.text(), 'a');
  platform.stageAnchor('/b');
  platform.history.replaceState({ ...platform.history.state }, '', platform.location.href);
  platform.history.pushState({ fClientNav: true, index: 1 }, '', '/b');
  const b = await platform.fetchValue(partialUrl('/b'));

  platform.history.replaceState(platform.history.state, '', '/a');
  assertEquals(platform.location.pathname, '/b');
  assertEquals(platform.historyValue.calls.at(-1)?.kind, 'push');

  assertEquals(await b.text(), 'b');
  platform.history.replaceState(platform.history.state, '', '/b-redirect');
  assertEquals(platform.location.pathname, '/b-redirect');
  platform.history.replaceState({ app: true }, 'app', '/application-owned');
  assertEquals(platform.location.pathname, '/application-owned');
  assert(changes.includes('push:/b'));
  assert(changes.includes('replace:/b-redirect'));
  assert(!changes.includes('replace:/a'));
  await handle.dispose();
});

Deno.test('caller abort is logical, and final reference disposal awaits response EOF', async () => {
  const callerBody = controlledResponse();
  const pendingBody = controlledResponse();
  const requests = [callerBody.response, pendingBody.response];
  let transportSignal: AbortSignal | null | undefined;
  const originalFetch = ((_input: RequestInfo | URL, init?: RequestInit) => {
    transportSignal = init?.signal;
    return Promise.resolve(requests.shift()!);
  }) as typeof fetch;
  const platform = new TestPlatform(originalFetch);
  const first = installPartialNavigationCoordinatorForPlatform(platform);
  const second = installPartialNavigationCoordinatorForPlatform(platform);
  const wrappedFetch = platform.getFetch();

  const controller = new AbortController();
  platform.stageAnchor('/abort');
  const response = await platform.fetchValue(partialUrl('/abort'), { signal: controller.signal });
  const read = response.text();
  controller.abort(new Error('caller stopped'));
  callerBody.write('complete');
  callerBody.close();
  await assertRejects(() => read, Error, 'caller stopped');
  assertNotEquals(transportSignal, controller.signal);
  assertEquals(callerBody.cancelCalls(), 0);

  await first.dispose();
  assertEquals(platform.getFetch(), wrappedFetch);
  platform.stageAnchor('/pending');
  await platform.fetchValue(partialUrl('/pending'));
  let disposed = false;
  const disposing = second.dispose().then(() => {
    disposed = true;
  });
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  assertEquals(disposed, false);
  pendingBody.write('complete');
  pendingBody.close();
  await disposing;
  assertEquals(pendingBody.cancelCalls(), 0);
  assertEquals(platform.getFetch(), originalFetch);

  const third = installPartialNavigationCoordinatorForPlatform(platform);
  const laterFetch =
    ((_input: RequestInfo | URL) => Promise.resolve(htmlResponse('later'))) as typeof fetch;
  const laterPush = platform.history.pushState.bind(platform.history);
  platform.setFetch(laterFetch);
  platform.history.pushState = laterPush;
  await third.dispose();
  assertEquals(platform.getFetch(), laterFetch);
  assertEquals(platform.history.pushState, laterPush);
});

Deno.test('programmatic navigation attaches its anchor and owned drops alone are suppressed', async () => {
  const response = controlledResponse();
  const responses = [response.response, htmlResponse('newest')];
  const platform = new TestPlatform((() => Promise.resolve(responses.shift()!)) as typeof fetch);
  const handle = installPartialNavigationCoordinatorForPlatform(platform);
  platform.documentValue.afterAnchorClick = (anchor) => {
    platform.history.pushState({ fClientNav: true, index: 1 }, '', anchor.href);
  };
  handle.navigate('/programmatic');
  assertEquals(platform.documentValue.anchorWasAttached, true);
  assertEquals(platform.location.pathname, '/programmatic');
  assertThrows(() => handle.navigate('https://elsewhere.test/'), TypeError, 'same-origin');

  platform.stageAnchor('/newer');
  const stale = platform.fetchValue(partialUrl('/newer'));
  platform.stageAnchor('/newest');
  const newest = await platform.fetchValue(partialUrl('/newest'));
  assertEquals(await newest.text(), 'newest');
  response.close();
  const drop = await stale.catch((error) => error);
  assert(drop instanceof Error);
  assertEquals(drop.message, 'Superseded Fresh partial response was drained');
  const ownedEvent = platform.dispatchWindow('unhandledrejection', { reason: drop });
  assertEquals(ownedEvent.defaultPrevented, true);
  const realEvent = platform.dispatchWindow('unhandledrejection', { reason: new Error('real') });
  assertEquals(realEvent.defaultPrevented, false);
  await handle.dispose();
});
