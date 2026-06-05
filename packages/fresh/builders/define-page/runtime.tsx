import { Head } from 'fresh/runtime';
import { getTracer, withSpan } from '@netscript/telemetry/tracer';
import type { CachedEntry } from '@netscript/sdk';
import type { ComponentChildren, ComponentType, JSX } from 'preact';
import { DeferPage } from '../../defer/DeferPage.tsx';
import { Deferred } from '../../defer/Deferred.tsx';
import { isCacheEntryStale } from '../../utils/cache-entry.ts';
import { createRouteNav, wrapWithNavigationContext } from './navigation.tsx';
import type {
  AnyDefinePageTypeState,
  DefinePageLayerDataOf,
  DefinePageLayoutContextBase,
  DefinePageMetaDescriptor,
  DefinePagePathOf,
  DefinePageRenderContext,
  DefinePageRequestContext,
  DefinePageResourcesOf,
  DefinePageRouteFor,
  DefinePageSearchOf,
  DefinePageSlot,
  DefinePageSlotsFor,
  DefinePageStateOf,
  PathParamSchema,
  SearchParamInput,
  SearchParamSchema,
  UnknownRecord,
} from './types.ts';
import type {
  RuntimeLayerResolution,
  RuntimePageConfig,
  RuntimeStreamLayerResolution,
} from './internal.ts';

type AnyRuntimePageConfig = RuntimePageConfig<AnyDefinePageTypeState>;

const definePageTracer = getTracer('@netscript/fresh/define-page');

function telemetryEnabled(config: AnyRuntimePageConfig): boolean {
  return config.telemetry?.enabled !== false;
}

async function withOptionalSpan<T>(
  config: AnyRuntimePageConfig,
  name: string,
  attributes: Record<string, string | number | boolean | undefined>,
  run: () => Promise<T>,
): Promise<T> {
  if (!telemetryEnabled(config)) {
    return await run();
  }

  return await withSpan(definePageTracer, name, async (span) => {
    for (const [key, value] of Object.entries(attributes)) {
      if (value !== undefined) {
        span.setAttribute(key, value);
      }
    }

    return await run();
  });
}

function searchParamsToObject(searchParams: URLSearchParams): SearchParamInput {
  const entries = new Map<string, string[]>();

  for (const [key, value] of searchParams.entries()) {
    const current = entries.get(key);
    if (current) {
      current.push(value);
    } else {
      entries.set(key, [value]);
    }
  }

  return Object.fromEntries(
    Array.from(entries.entries()).map((
      [key, values],
    ) => [key, values.length > 1 ? values : values[0]]),
  );
}

function isCacheEntryLike(value: unknown): value is CachedEntry<UnknownRecord> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<CachedEntry<UnknownRecord>>;
  return typeof candidate.cachedAt === 'number' && 'data' in candidate;
}

function defaultFallback(label: string): JSX.Element {
  return (
    <section aria-live='polite' aria-busy='true'>
      <p>Loading {label}…</p>
    </section>
  );
}

function resolveFallback(
  fallback: JSX.Element | ComponentType<Record<string, never>> | undefined,
  label: string,
): JSX.Element {
  if (!fallback) {
    return defaultFallback(label);
  }

  if (typeof fallback === 'function') {
    const FallbackComponent = fallback;
    return <FallbackComponent />;
  }

  return fallback;
}

function resolveLayerPartialSearchParams(
  searchParams: URLSearchParams,
  params: Record<string, string> | undefined,
): string | undefined {
  const resolved = new URLSearchParams(searchParams);

  for (const [key, value] of Object.entries(params ?? {})) {
    resolved.set(key, value);
  }

  const serialized = resolved.toString();
  return serialized.length > 0 ? serialized : undefined;
}

function buildLayerMemoKey(
  descriptorId: string,
  pathname: string,
  path: object,
  search: object,
  deps: unknown,
): string {
  return JSON.stringify({
    descriptorId,
    pathname,
    path,
    search,
    deps,
  });
}

function resolvePathParams<TPath extends object>(
  schema: PathParamSchema<TPath> | undefined,
  params: Record<string, string | undefined>,
): TPath {
  if (!schema) {
    return {} as TPath;
  }

  const result = schema.safeParse(params);
  if (!result.success) {
    throw new Response(null, { status: 404 });
  }

  return result.data;
}

function resolveSearchParams<TSearch extends object>(
  schema: SearchParamSchema<TSearch> | undefined,
  searchParams: URLSearchParams,
): TSearch {
  if (!schema) {
    return {} as TSearch;
  }

  const result = schema.safeParse(searchParamsToObject(searchParams));
  if (!result.success) {
    const fallbackResult = schema.safeParse({});
    if (!fallbackResult.success) {
      throw new Response(null, { status: 400 });
    }

    return fallbackResult.data;
  }

  return result.data;
}

function renderLayerComponent(
  component: ComponentType<UnknownRecord>,
  data: UnknownRecord | undefined,
): JSX.Element | null {
  const Component = component;

  if (data) {
    return <Component {...data} />;
  }

  return <Component />;
}

function createStreamSlotId(id: string): string {
  const normalized = id.replace(/[^a-zA-Z0-9_-]/g, '-');
  return `ns-stream-slot-${normalized}`;
}

function createLayerSlot(
  data: UnknownRecord | undefined,
  element: JSX.Element | null,
): DefinePageSlot<UnknownRecord> {
  const slot = (() => element) as DefinePageSlot<UnknownRecord>;
  if (data) {
    slot.data = data;
  }
  return slot;
}

function toElement(node: ComponentChildren): JSX.Element {
  if (typeof node === 'object' && node !== null && 'type' in node) {
    return node as JSX.Element;
  }

  return <>{node}</>;
}

function renderHead(meta: DefinePageMetaDescriptor): JSX.Element {
  const jsonLdEntries = Array.isArray(meta.jsonLd) ? meta.jsonLd : meta.jsonLd ? [meta.jsonLd] : [];

  return (
    <Head>
      {meta.title ? <title>{meta.title}</title> : null}
      {meta.description ? <meta name='description' content={meta.description} /> : null}
      {meta.robots ? <meta name='robots' content={meta.robots} /> : null}
      {meta.canonicalUrl ? <link rel='canonical' href={meta.canonicalUrl} /> : null}
      {meta.meta?.map((entry) => (
        <meta
          key={`${entry.name ?? entry.property ?? 'meta'}:${entry.content}`}
          name={entry.name}
          property={entry.property}
          content={entry.content}
        />
      ))}
      {meta.links?.map((entry) => (
        <link
          key={`${entry.rel}:${entry.href}`}
          rel={entry.rel}
          href={entry.href}
          title={entry.title}
          type={entry.type}
        />
      ))}
      {jsonLdEntries.map((entry, index) => (
        <script key={`jsonld:${index}`} type='application/ld+json'>
          {JSON.stringify(entry)}
        </script>
      ))}
    </Head>
  );
}

function mergeHeaders(values: HeadersInit[]): Headers {
  const headers = new Headers();
  for (const value of values) {
    const next = new Headers(value);
    for (const [key, entry] of next.entries()) {
      headers.set(key, entry);
    }
  }
  return headers;
}

function resolveResource(resources: UnknownRecord, key: string): unknown {
  if (!(key in resources)) {
    throw new Error(`definePage() could not resolve resource "${key}"`);
  }

  return resources[key];
}

function createRuntimeContextBase<TTypes extends AnyDefinePageTypeState>(
  ctx:
    | DefinePageRequestContext<DefinePageStateOf<TTypes>>
    | DefinePageRenderContext<DefinePageStateOf<TTypes>>,
  config: RuntimePageConfig<TTypes, boolean>,
  resources: DefinePageResourcesOf<TTypes>,
  signal: AbortSignal,
  path: DefinePagePathOf<TTypes>,
  search: DefinePageSearchOf<TTypes>,
): Omit<DefinePageLayoutContextBase<TTypes, true>, 'route'> {
  return {
    ...ctx,
    routePattern: config.routePattern ?? '',
    pathSchema: config.pathSchema,
    searchSchema: config.searchSchema,
    nav: config.route?.nav ?? createRouteNav({
      routePattern: config.routePattern ?? '',
      pathSchema: config.pathSchema,
      searchSchema: config.searchSchema,
    }),
    path,
    search,
    signal,
    resources,
    layerData: {} as Partial<DefinePageLayerDataOf<TTypes>>,
    resource: <K extends keyof DefinePageResourcesOf<TTypes> & string>(key: K) => {
      return resolveResource(resources, key) as DefinePageResourcesOf<TTypes>[K];
    },
  };
}

function withRouteContext<TTypes extends AnyDefinePageTypeState>(
  context: Omit<DefinePageLayoutContextBase<TTypes, true>, 'route'>,
  route: DefinePageRouteFor<TTypes>,
): DefinePageLayoutContextBase<TTypes, true> {
  return { ...context, route };
}

function withoutRouteContext<TTypes extends AnyDefinePageTypeState>(
  context: Omit<DefinePageLayoutContextBase<TTypes, true>, 'route'>,
): DefinePageLayoutContextBase<TTypes, false> {
  return context as DefinePageLayoutContextBase<TTypes, false>;
}

export async function prepareRequestState<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean,
>(
  config: RuntimePageConfig<TTypes, THasRoute>,
  ctx:
    | DefinePageRequestContext<DefinePageStateOf<TTypes>>
    | DefinePageRenderContext<DefinePageStateOf<TTypes>>,
): Promise<{
  runtimeCtx: DefinePageLayoutContextBase<TTypes, THasRoute>;
  resources: DefinePageResourcesOf<TTypes>;
}> {
  const path = resolvePathParams(config.pathSchema, ctx.params);
  const search = resolveSearchParams(config.searchSchema, ctx.url.searchParams);
  const controller = new AbortController();
  const resourceStore: Record<string, unknown> = {};
  const resources = resourceStore as DefinePageResourcesOf<TTypes>;

  const baseRuntimeCtx = createRuntimeContextBase(
    ctx,
    config,
    resources,
    controller.signal,
    path as DefinePagePathOf<TTypes>,
    search as DefinePageSearchOf<TTypes>,
  );
  const runtimeCtx =
    (config.route
      ? withRouteContext(baseRuntimeCtx, config.route)
      : withoutRouteContext(baseRuntimeCtx)) as DefinePageLayoutContextBase<TTypes, THasRoute>;

  for (const descriptor of config.resources) {
    resourceStore[descriptor.key] = await withOptionalSpan(
      config as AnyRuntimePageConfig,
      `page.resource.${descriptor.key}`,
      {
        'page.route': ctx.url.pathname,
        'page.resource.key': descriptor.key,
      },
      async () => await descriptor.factory(runtimeCtx),
    );
  }

  return { runtimeCtx, resources };
}

export async function executePagePipeline<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean,
>(
  config: RuntimePageConfig<TTypes, THasRoute>,
  ctx:
    | DefinePageRequestContext<DefinePageStateOf<TTypes>>
    | DefinePageRenderContext<DefinePageStateOf<TTypes>>,
): Promise<{
  page: JSX.Element;
  layerData: Partial<DefinePageLayerDataOf<TTypes>>;
  headers?: Headers;
  status?: number;
  streamLayers?: RuntimeStreamLayerResolution[];
}> {
  return await withOptionalSpan(
    config as AnyRuntimePageConfig,
    config.telemetry?.spanName ?? 'page.render',
    {
      'page.route': ctx.url.pathname,
      'page.layer_count': config.layers.length,
      'page.resource_count': config.resources.length,
      'page.has_layout': !!config.layout,
      'page.has_meta': !!config.meta,
    },
    async () => {
      const { runtimeCtx, resources } = await prepareRequestState(config, ctx);
      const layerMemo = new Map<string, Promise<RuntimeLayerResolution>>();

      const layers = await Promise.all(
        config.layers.map((descriptor): Promise<RuntimeLayerResolution> => {
          const layerDepsContext = {
            path: runtimeCtx.path,
            search: runtimeCtx.search,
          } as Pick<DefinePageLayoutContextBase<TTypes, THasRoute>, 'path' | 'search'>;
          const deps = descriptor.config.layerDeps?.(layerDepsContext);
          const memoKey = buildLayerMemoKey(
            descriptor.id,
            ctx.url.pathname,
            runtimeCtx.path,
            runtimeCtx.search,
            deps,
          );

          const cached = layerMemo.get(memoKey);
          if (cached) {
            return cached;
          }

          const pending = withOptionalSpan(
            config as AnyRuntimePageConfig,
            `page.layer.${descriptor.id}`,
            {
              'page.route': ctx.url.pathname,
              'page.layer.id': descriptor.id,
              'page.layer.has_partial': !!descriptor.config.partial,
              'page.layer.has_loader': !!descriptor.config.loader,
              'page.layer.delivery': descriptor.config.delivery ?? 'blocking',
            },
            async () => {
              const shouldReload = typeof descriptor.config.shouldReload === 'function'
                ? descriptor.config.shouldReload(runtimeCtx)
                : descriptor.config.shouldReload ?? true;
              const shouldStream = config.streaming && descriptor.config.delivery === 'stream';

              if (shouldStream) {
                const loaderPromise = descriptor.config.loader
                  ? Promise.resolve(descriptor.config.loader(runtimeCtx))
                  : Promise.resolve(undefined);
                const slotId = createStreamSlotId(descriptor.id);

                const streamElement = (
                  <div id={slotId} data-ns-stream-slot={descriptor.id}>
                    {resolveFallback(descriptor.config.fallback, descriptor.id)}
                  </div>
                );

                return {
                  id: descriptor.id,
                  data: undefined,
                  element: streamElement,
                  stream: {
                    slotId,
                    promise: loaderPromise as Promise<UnknownRecord | undefined>,
                    component: descriptor.component,
                  },
                };
              }

              const result = descriptor.config.loader
                ? await descriptor.config.loader(runtimeCtx)
                : undefined;
              const isCachedEntry = isCacheEntryLike(result);
              const isBlockingStale = isCachedEntry &&
                descriptor.config.staleReloadMode === 'blocking' &&
                isCacheEntryStale(result, descriptor.config.staleTime);
              const data = isBlockingStale
                ? undefined
                : isCachedEntry
                ? result.data
                : (result as UnknownRecord | null | undefined) ?? undefined;
              const component = data ? renderLayerComponent(descriptor.component, data) : null;
              const shouldDefer = !shouldStream && !!descriptor.config.partial &&
                (descriptor.config.delivery ?? 'defer') === 'defer';

              if (shouldDefer && shouldReload) {
                const partial = typeof descriptor.config.partial === 'function'
                  ? descriptor.config.partial(runtimeCtx)
                  : descriptor.config.partial;
                const partialName = typeof descriptor.config.partialName === 'function'
                  ? descriptor.config.partialName(runtimeCtx)
                  : descriptor.config.partialName;
                if (!partial) {
                  return {
                    id: descriptor.id,
                    data,
                    element: component ??
                      (descriptor.config.fallback
                        ? resolveFallback(descriptor.config.fallback, descriptor.id)
                        : null),
                  };
                }
                const partialSearchParams = resolveLayerPartialSearchParams(
                  ctx.url.searchParams,
                  descriptor.config.params?.(runtimeCtx),
                );

                return {
                  id: descriptor.id,
                  data,
                  element: (
                    <DeferPage
                      action={ctx.url.pathname}
                      partial={partial}
                      partialSearchParams={partialSearchParams}
                      name={partialName ?? descriptor.id}
                      component={component ?? undefined}
                      fallback={resolveFallback(descriptor.config.fallback, descriptor.id)}
                      cachedAt={isBlockingStale || !isCachedEntry ? undefined : result.cachedAt}
                      staleTime={descriptor.config.staleTime}
                      staleStrategy={descriptor.config.staleReloadMode === 'background'
                        ? 'server-prewarm'
                        : 'none'}
                      policy={descriptor.config.policy ?? config.policy}
                      ctx={ctx}
                    />
                  ),
                };
              }

              return {
                id: descriptor.id,
                data,
                element: component ??
                  (descriptor.config.fallback
                    ? resolveFallback(descriptor.config.fallback, descriptor.id)
                    : null),
              };
            },
          );

          layerMemo.set(memoKey, pending);
          return pending;
        }),
      );

      const layerData: Partial<Record<string, UnknownRecord>> = {};
      const slots: Record<string, DefinePageSlot<UnknownRecord>> = {};
      const streamLayers: RuntimeStreamLayerResolution[] = [];

      for (const layer of layers) {
        layerData[layer.id] = layer.data;
        if (layer.stream) {
          streamLayers.push(layer.stream);
        }
        slots[layer.id] = createLayerSlot(layer.data, layer.element);
      }

      runtimeCtx.layerData = layerData as Partial<DefinePageLayerDataOf<TTypes>>;

      const pageBody = config.layout
        ? config.layout(slots as DefinePageSlotsFor<TTypes>, runtimeCtx)
        : layers.map((layer) => layer.element);
      const resolvedBody = wrapWithNavigationContext(
        pageBody,
        runtimeCtx.routePattern,
        config.pathSchema as PathParamSchema<object> | undefined,
        config.searchSchema,
        runtimeCtx as DefinePageLayoutContextBase<AnyDefinePageTypeState, boolean>,
        slots,
      );

      const meta = config.meta ? await config.meta(runtimeCtx) : undefined;
      const resolvedHeaders = config.headers.length === 0 ? undefined : mergeHeaders(
        await Promise.all(config.headers.map(async (descriptor) => {
          if (typeof descriptor === 'function') {
            return await descriptor(runtimeCtx);
          }
          return descriptor;
        })),
      );

      return {
        page: meta ? toElement(<>{renderHead(meta)}{resolvedBody}</>) : toElement(resolvedBody),
        layerData: layerData as Partial<DefinePageLayerDataOf<TTypes>>,
        headers: resolvedHeaders,
        status: config.status,
        streamLayers,
      };
    },
  );
}
