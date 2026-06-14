import type {
  RuntimeLayerDescriptor,
  RuntimePageConfig,
  RuntimeResourceDescriptor,
} from '../internal.ts';
import type { AnyDefinePageTypeState, DefinePageRootTypeState } from '../types.ts';

/** Create the empty runtime configuration used by a new page builder. */
export function createDefaultConfig<TState>(): RuntimePageConfig<
  DefinePageRootTypeState<TState>,
  false
> {
  return { resources: [], layers: [], handlers: {}, headers: [] };
}

/** Retag a runtime configuration after a definition-time type transition. */
export function retagConfig<
  TCurrent extends AnyDefinePageTypeState,
  TNext extends AnyDefinePageTypeState,
  THasConfiguredRoute extends boolean,
>(
  config: RuntimePageConfig<TCurrent, THasConfiguredRoute>,
): RuntimePageConfig<TNext, THasConfiguredRoute> {
  return {
    ...config,
    resources: config.resources.map((descriptor) => ({
      key: descriptor.key,
      factory: descriptor.factory as RuntimeResourceDescriptor<
        TNext,
        THasConfiguredRoute
      >['factory'],
    })),
    layers: config.layers.map((descriptor) => ({
      id: descriptor.id,
      component: descriptor.component,
      config: descriptor.config as RuntimeLayerDescriptor<TNext, THasConfiguredRoute>['config'],
    })),
    handlers: config.handlers as RuntimePageConfig<TNext, THasConfiguredRoute>['handlers'],
    form: config.form as RuntimePageConfig<TNext, THasConfiguredRoute>['form'],
    route: config.route as RuntimePageConfig<TNext, THasConfiguredRoute>['route'],
    pathSchema: config.pathSchema as RuntimePageConfig<TNext, THasConfiguredRoute>['pathSchema'],
    searchSchema: config.searchSchema as RuntimePageConfig<
      TNext,
      THasConfiguredRoute
    >['searchSchema'],
    layout: config.layout as RuntimePageConfig<TNext, THasConfiguredRoute>['layout'],
    meta: config.meta as RuntimePageConfig<TNext, THasConfiguredRoute>['meta'],
    headers: config.headers as RuntimePageConfig<TNext, THasConfiguredRoute>['headers'],
  };
}

/** Retag a runtime configuration when a route becomes mandatory. */
export function promoteConfigToRoute<
  TCurrent extends AnyDefinePageTypeState,
  TNext extends AnyDefinePageTypeState,
  THasConfiguredRoute extends boolean,
>(config: RuntimePageConfig<TCurrent, THasConfiguredRoute>): RuntimePageConfig<TNext, true> {
  const retaggedConfig = retagConfig<TCurrent, TNext, THasConfiguredRoute>(config);

  return {
    ...retaggedConfig,
    resources: retaggedConfig.resources.map((descriptor) => ({
      key: descriptor.key,
      factory: descriptor.factory as RuntimeResourceDescriptor<TNext, true>['factory'],
    })),
    layers: retaggedConfig.layers.map((descriptor) => ({
      id: descriptor.id,
      component: descriptor.component,
      config: descriptor.config as RuntimeLayerDescriptor<TNext, true>['config'],
    })),
    handlers: retaggedConfig.handlers as RuntimePageConfig<TNext, true>['handlers'],
    form: retaggedConfig.form as RuntimePageConfig<TNext, true>['form'],
    route: retaggedConfig.route as RuntimePageConfig<TNext, true>['route'],
    pathSchema: retaggedConfig.pathSchema as RuntimePageConfig<TNext, true>['pathSchema'],
    searchSchema: retaggedConfig.searchSchema as RuntimePageConfig<TNext, true>['searchSchema'],
    layout: retaggedConfig.layout as RuntimePageConfig<TNext, true>['layout'],
    meta: retaggedConfig.meta as RuntimePageConfig<TNext, true>['meta'],
    headers: retaggedConfig.headers as RuntimePageConfig<TNext, true>['headers'],
  };
}
