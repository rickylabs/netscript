import { App } from 'fresh';
import { Partial } from 'fresh/runtime';
import { KeyedPartial } from '../../../src/runtime/navigation/mod.ts';

type PageName = 'a' | 'b';
type RegionName = 'region-a' | 'region-b';
type BarrierName = 'old-region' | 'stale-b';

interface BarrierSnapshot {
  readonly arrived: number;
  readonly released: boolean;
  readonly completed: number;
  readonly cancelled: number;
}

interface MutableBarrier {
  arrived: number;
  released: boolean;
  completed: number;
  cancelled: number;
  readonly promise: Promise<void>;
  resolve(): void;
}

const barriers = new Map<BarrierName, MutableBarrier>([
  ['old-region', createBarrier()],
  ['stale-b', createBarrier()],
]);

function createBarrier(): MutableBarrier {
  let resolvePromise = () => {};
  const promise = new Promise<void>((resolve) => {
    resolvePromise = resolve;
  });
  return {
    arrived: 0,
    released: false,
    completed: 0,
    cancelled: 0,
    promise,
    resolve() {
      if (this.released) return;
      this.released = true;
      resolvePromise();
    },
  };
}

function page(name: PageName, phase: string) {
  const upper = name.toUpperCase();
  const region: RegionName = `region-${name}`;

  return (
    <html>
      <head>
        <title>{`${upper} ${phase}`}</title>
      </head>
      <body f-client-nav>
        <Partial name='page-shell'>
          <main>
            <h1>{`Page ${upper} ${phase}`}</h1>
            <nav>
              {name === 'a'
                ? (
                  <>
                    <a id='to-b' href='/b?phase=mount'>Navigate to B</a>
                    <a id='to-b-race' href='/b?phase=race&hold=stale-b'>
                      Start stale B
                    </a>
                  </>
                )
                : <a id='to-a' href='/a?phase=mount'>Navigate to A</a>}
            </nav>
            <KeyedPartial name={region}>
              <section id='region-content'>{`${upper} region ${phase}`}</section>
            </KeyedPartial>
            <button
              id='update-region'
              type='button'
              f-partial={`/partials/region?name=${region}&value=${name}-${phase}-updated`}
            >
              Update current region
            </button>
            {name === 'a' && (
              <button
                id='delay-region'
                type='button'
                f-partial='/partials/region?name=region-a&value=stale-a&hold=old-region'
              >
                Start stale A region
              </button>
            )}
          </main>
        </Partial>
      </body>
    </html>
  );
}

function region(name: RegionName, value: string) {
  return (
    <KeyedPartial name={name}>
      <section id='region-content'>{value}</section>
    </KeyedPartial>
  );
}

async function waitForBarrier(name: BarrierName, signal: AbortSignal): Promise<void> {
  const barrier = barriers.get(name)!;
  barrier.arrived += 1;
  if (signal.aborted) throw signal.reason;

  let onAbort = () => {};
  const aborted = new Promise<never>((_resolve, reject) => {
    onAbort = () => reject(signal.reason);
    signal.addEventListener('abort', onAbort, { once: true });
  });
  try {
    await Promise.race([barrier.promise, aborted]);
  } finally {
    signal.removeEventListener('abort', onAbort);
  }
}

function gatedResponse(
  response: Response,
  name: BarrierName,
  signal: AbortSignal,
): Response {
  const source = response.body;
  if (source === null) return response;
  const barrier = barriers.get(name)!;
  const reader = source.getReader();
  const prefix = new TextEncoder().encode(`<!-- barrier:${name} -->`);
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(prefix);
      try {
        await waitForBarrier(name, signal);
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          controller.enqueue(chunk.value);
        }
        barrier.completed += 1;
        controller.close();
      } catch (error) {
        controller.error(error);
        throw error;
      } finally {
        reader.releaseLock();
      }
    },
    cancel() {
      barrier.cancelled += 1;
    },
  });
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function snapshot(): Record<BarrierName, BarrierSnapshot> {
  const oldRegion = barriers.get('old-region')!;
  const staleB = barriers.get('stale-b')!;
  return {
    'old-region': {
      arrived: oldRegion.arrived,
      released: oldRegion.released,
      completed: oldRegion.completed,
      cancelled: oldRegion.cancelled,
    },
    'stale-b': {
      arrived: staleB.arrived,
      released: staleB.released,
      completed: staleB.completed,
      cancelled: staleB.cancelled,
    },
  };
}

function parseRegionName(value: string | null): RegionName | null {
  return value === 'region-a' || value === 'region-b' ? value : null;
}

/** Create the Fresh app used by the ordered partial-navigation browser proof. */
export function createPartialNavigationBrowserApp(): App<unknown> {
  const app = new App();

  app.get('/control/health', () => new Response('ok'));
  app.get('/control/state', () => Response.json(snapshot()));
  app.post('/control/release/:name', (ctx) => {
    const name = ctx.params.name as BarrierName;
    const barrier = barriers.get(name);
    if (barrier === undefined) return new Response('unknown barrier', { status: 404 });
    barrier.resolve();
    return Response.json(snapshot());
  });
  app.get('/colon-marker', (ctx) =>
    ctx.render(
      <KeyedPartial name='colon:probe'>
        <span>colon marker probe</span>
      </KeyedPartial>,
    ));
  app.get('/partials/region', async (ctx) => {
    const name = parseRegionName(ctx.url.searchParams.get('name'));
    if (name === null) return new Response('invalid region', { status: 400 });
    const value = ctx.url.searchParams.get('value') ?? 'missing';
    const response = await ctx.render(region(name, value));
    return ctx.url.searchParams.get('hold') === 'old-region'
      ? gatedResponse(response, 'old-region', ctx.req.signal)
      : response;
  });
  app.get('/a', (ctx) => ctx.render(page('a', ctx.url.searchParams.get('phase') ?? 'initial')));
  app.get('/b', async (ctx) => {
    const response = await ctx.render(page('b', ctx.url.searchParams.get('phase') ?? 'initial'));
    return ctx.url.searchParams.get('hold') === 'stale-b'
      ? gatedResponse(response, 'stale-b', ctx.req.signal)
      : response;
  });
  app.get('/', (ctx) => ctx.redirect('/a'));

  return app;
}

/** Fresh application exported for the Vite browser fixture. */
export const app: App<unknown> = createPartialNavigationBrowserApp();
