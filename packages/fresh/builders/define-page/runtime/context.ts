import { getTracer, withSpan } from '@netscript/telemetry/tracer';
import { createRouteNav } from '../navigation.tsx';
import type {
  AnyDefinePageTypeState,
  DefinePageLayerDataOf,
  DefinePageLayoutContextBase,
  DefinePagePathOf,
  DefinePageRenderContext,
  DefinePageRequestContext,
  DefinePageResourcesOf,
  DefinePageRouteFor,
  DefinePageSearchOf,
  DefinePageStateOf,
  PathParamSchema,
  SearchParamInput,
  SearchParamSchema,
  UnknownRecord,
} from '../types.ts';
import type { RuntimePageConfig } from '../internal.ts';

/** Runtime page config with erased type-state for telemetry helpers. */
export type AnyRuntimePageConfig = RuntimePageConfig<AnyDefinePageTypeState>;

const definePageTracer = getTracer('@netscript/fresh/define-page');

function telemetryEnabled(config: AnyRuntimePageConfig): boolean {
  return config.telemetry?.enabled !== false;
}

/** Run a callback inside a page telemetry span when telemetry is enabled. */
export async function withOptionalSpan<T>(
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

/** Convert URL search params into the object shape consumed by page schemas. */
export function searchParamsToObject(searchParams: URLSearchParams): SearchParamInput {
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

/** Resolve typed path params or throw the route-level 404 response. */
export function resolvePathParams<TPath extends object>(
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

/** Resolve typed search params with an empty-object fallback. */
export function resolveSearchParams<TSearch extends object>(
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

/** Resolve a named resource from the request resource store. */
export function resolveResource(resources: UnknownRecord, key: string): unknown {
  if (!(key in resources)) {
    throw new Error(`definePage() could not resolve resource "${key}"`);
  }

  return resources[key];
}

/** Create the runtime context shared by layers, layouts, and metadata. */
export function createRuntimeContextBase<TTypes extends AnyDefinePageTypeState>(
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

/** Attach typed route metadata to a runtime context. */
export function withRouteContext<TTypes extends AnyDefinePageTypeState>(
  context: Omit<DefinePageLayoutContextBase<TTypes, true>, 'route'>,
  route: DefinePageRouteFor<TTypes>,
): DefinePageLayoutContextBase<TTypes, true> {
  return { ...context, route };
}

/** Use a runtime context without route metadata. */
export function withoutRouteContext<TTypes extends AnyDefinePageTypeState>(
  context: Omit<DefinePageLayoutContextBase<TTypes, true>, 'route'>,
): DefinePageLayoutContextBase<TTypes, false> {
  return context as DefinePageLayoutContextBase<TTypes, false>;
}
