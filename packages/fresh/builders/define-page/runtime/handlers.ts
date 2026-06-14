import type {
  AnyDefinePageTypeState,
  DefinePageLayoutContextBase,
  DefinePageRenderContext,
  DefinePageRequestContext,
  DefinePageResourcesOf,
  DefinePageStateOf,
} from '../types.ts';
import type { RuntimePageConfig } from '../internal.ts';
import {
  type AnyRuntimePageConfig,
  createRuntimeContextBase,
  resolvePathParams,
  resolveSearchParams,
  withOptionalSpan,
  withoutRouteContext,
  withRouteContext,
} from './context.ts';

/** Prepare the runtime context and request resources for a page request. */
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
    path,
    search,
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
