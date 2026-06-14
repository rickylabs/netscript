import type { ComponentType, JSX } from 'preact';
import type {
  AnyDefinePageTypeState,
  DefinePageFormConfigFor,
  DefinePageHeaderResolverFor,
  DefinePageLayerConfigFor,
  DefinePageLayerProps,
  DefinePageLayoutFor,
  DefinePageMetaResolverFor,
  DefinePageMethod,
  DefinePageMethodHandlerFor,
  DefinePagePathOf,
  DefinePageResourceFactoryFor,
  DefinePageRouteFor,
  DefinePageSearchOf,
  DefinePageTelemetryConfig,
  PathParamSchema,
  SearchParamSchema,
  UnknownRecord,
} from './types.ts';
import type { DeferPolicyInput, DeferPolicyProfile } from '../../defer/policy.ts';

export type ResourceFactoryMap<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean = false,
> = Record<
  string,
  DefinePageResourceFactoryFor<TTypes, unknown, THasRoute>
>;

export type InferResourceOutputs<TFactories extends Record<string, (...args: never[]) => unknown>> =
  {
    [K in keyof TFactories]: Awaited<ReturnType<TFactories[K]>>;
  };

export interface RuntimeResourceDescriptor<
  TTypes extends AnyDefinePageTypeState = AnyDefinePageTypeState,
  THasRoute extends boolean = boolean,
> {
  key: string;
  factory: DefinePageResourceFactoryFor<TTypes, unknown, THasRoute>;
}

export interface RuntimeLayerDescriptor<
  TTypes extends AnyDefinePageTypeState = AnyDefinePageTypeState,
  THasRoute extends boolean = boolean,
> {
  id: string;
  component: ComponentType<DefinePageLayerProps>;
  config: DefinePageLayerConfigFor<TTypes, DefinePageLayerProps, THasRoute>;
}

export interface RuntimePageConfig<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean = false,
> {
  resources: RuntimeResourceDescriptor<TTypes, THasRoute>[];
  layers: RuntimeLayerDescriptor<TTypes, THasRoute>[];
  handlers: Partial<Record<DefinePageMethod, DefinePageMethodHandlerFor<TTypes, THasRoute>>>;
  form?: RuntimeFormDescriptor<TTypes, THasRoute>;
  routePattern?: string;
  defaultRoutePattern?: string;
  route?: DefinePageRouteFor<TTypes>;
  pathSchema?: PathParamSchema<DefinePagePathOf<TTypes>>;
  searchSchema?: SearchParamSchema<DefinePageSearchOf<TTypes>>;
  policy?: DeferPolicyInput | DeferPolicyProfile;
  telemetry?: DefinePageTelemetryConfig;
  layout?: DefinePageLayoutFor<TTypes, THasRoute>;
  meta?: DefinePageMetaResolverFor<TTypes, THasRoute>;
  headers: Array<HeadersInit | DefinePageHeaderResolverFor<TTypes, THasRoute>>;
  status?: number;
  /**
   * When true, the page renderer may use `renderToReadableStream` for
   * progressive HTML delivery.  Layers with `delivery: 'stream'` are
   * wrapped in Suspense boundaries whose resolved content is streamed
   * inline rather than loaded via partial refresh.
   */
  streaming?: boolean;
}

export interface RuntimeFormDescriptor<
  TTypes extends AnyDefinePageTypeState = AnyDefinePageTypeState,
  THasRoute extends boolean = boolean,
> {
  id: string;
  config: DefinePageFormConfigFor<TTypes, THasRoute>;
}

export interface RuntimeLayerResolution {
  id: string;
  data?: UnknownRecord;
  element: JSX.Element | null;
  stream?: RuntimeStreamLayerResolution;
}

export interface RuntimeStreamLayerResolution {
  slotId: string;
  promise: Promise<UnknownRecord | undefined>;
  component: ComponentType<DefinePageLayerProps>;
}
