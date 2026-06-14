import type { ComponentType } from 'preact';
import type { RuntimePageConfig } from '../internal.ts';
import type {
  AnyDefinePageTypeState,
  DefinePageHeaderResolverFor,
  DefinePageLayerConfigFor,
  DefinePageLayerLoaderFor,
  DefinePageLayerProps,
} from '../types.ts';

/** Resolve and validate the route pattern used for navigation or build output. */
export function resolveConfiguredRoutePattern<
  TTypes extends AnyDefinePageTypeState,
  THasConfiguredRoute extends boolean,
>(
  config: RuntimePageConfig<TTypes, THasConfiguredRoute>,
  routePattern?: string,
): string {
  const resolvedRoutePattern = routePattern ?? config.defaultRoutePattern;
  if (!resolvedRoutePattern) {
    throw new Error(
      'definePage() requires a route pattern. Pass one explicitly or provide a generated route via withRoute(...).',
    );
  }

  if (config.route && resolvedRoutePattern !== config.route.routePattern) {
    throw new Error(
      `definePage().withRoute(...) already configured the route pattern "${config.route.routePattern}". ` +
        'Do not override it in createNav() or build().',
    );
  }

  return resolvedRoutePattern;
}

/** Normalize a layer loader or config object into a runtime layer config. */
export function resolveLayerConfig<
  TTypes extends AnyDefinePageTypeState,
  TProps extends DefinePageLayerProps,
  THasConfiguredRoute extends boolean,
>(
  layerConfig?:
    | DefinePageLayerConfigFor<TTypes, TProps, THasConfiguredRoute>
    | DefinePageLayerLoaderFor<TTypes, TProps, THasConfiguredRoute>,
): DefinePageLayerConfigFor<TTypes, TProps, THasConfiguredRoute> {
  return typeof layerConfig === 'function' ? { loader: layerConfig } : (layerConfig ?? {});
}

/** Normalize a header overload into the descriptor stored by the builder. */
export function resolveHeaderDescriptor<
  TTypes extends AnyDefinePageTypeState,
  THasConfiguredRoute extends boolean,
>(
  nameOrHeadersOrResolver:
    | string
    | HeadersInit
    | DefinePageHeaderResolverFor<TTypes, THasConfiguredRoute>,
  value?: string,
): HeadersInit | DefinePageHeaderResolverFor<TTypes, THasConfiguredRoute> {
  return typeof nameOrHeadersOrResolver === 'string'
    ? { [nameOrHeadersOrResolver]: value ?? '' }
    : nameOrHeadersOrResolver;
}

/** Assert that a component can be stored in a runtime layer descriptor. */
export function normalizeLayerComponent<TProps extends DefinePageLayerProps>(
  component: ComponentType<TProps>,
): ComponentType<DefinePageLayerProps> {
  return component as ComponentType<DefinePageLayerProps>;
}
