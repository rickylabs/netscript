import type { CachedEntry } from '@netscript/sdk';
import type { ComponentType, JSX } from 'preact';
import { DeferPage } from '../../defer/DeferPage.tsx';
import { Deferred } from '../../defer/Deferred.tsx';
import { isCacheEntryStale } from '../../utils/cache-entry.ts';
import { wrapWithNavigationContext } from './navigation.tsx';
import {
  type AnyRuntimePageConfig,
  createRuntimeContextBase,
  resolvePathParams,
  resolveSearchParams,
  withOptionalSpan,
  withoutRouteContext,
  withRouteContext,
} from './runtime/context.ts';
import {
  createLayerSlot,
  createStreamSlotId,
  mergeHeaders,
  renderHead,
  renderLayerComponent,
  resolveFallback,
  toElement,
} from './runtime/render.tsx';
import type {
  AnyDefinePageTypeState,
  DefinePageLayerDataOf,
  DefinePageLayoutContextBase,
  DefinePagePathOf,
  DefinePageRenderContext,
  DefinePageRequestContext,
  DefinePageResourcesOf,
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

function isCacheEntryLike(value: unknown): value is CachedEntry<UnknownRecord> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<CachedEntry<UnknownRecord>>;
  return typeof candidate.cachedAt === 'number' && 'data' in candidate;
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
