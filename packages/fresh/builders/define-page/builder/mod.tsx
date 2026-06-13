// arch:barrel-ok A4-aggregate: defines definePage from role modules under builder/.
import type { ComponentType, JSX } from 'preact';
import { z } from 'zod';
import { render as renderToString } from 'preact-render-to-string';
import { createZodAdapter } from '../../../form/schema-adapter.ts';
import { applyCollectionKeyOperation, applyIntentOperation } from '../../../form/intent.ts';
import { normalizeFormError } from '../../../form/error-normalization.ts';
import { parseFormSubmission } from '../../../form/pipeline.ts';
import { readCsrfToken, setCsrfCookie, verifyCsrfToken } from '../../../form/csrf.ts';
import { generateSubmissionId } from '../../../form/idempotency.ts';
import { replyFor } from '../../../form/reply.ts';
import type { FormConfig } from '../../../form/config.ts';
import type { FormHandlerContext } from '../../../form/handler-context.ts';
import { resolveRuntimeFormState } from '../../../form/state.ts';
import type {
  FormFieldErrors,
  FormIntent,
  FormIntentResult,
  FormSubmissionResult,
  FormValues,
  RuntimeFormState,
} from '../../../form/types.ts';
import { emitFormError, withFormSpan } from '../../../form/telemetry.ts';
import { bindRoutePattern, defineRouteContract } from '../../../route/contract.ts';
import {
  createIncrementalStreamingResponse,
  createStreamingResponse,
} from '../../../server/stream.ts';
import { createDefinePageHooks, createRouteNav, type TypedRouteTarget } from '../navigation.tsx';
import { executePagePipeline, prepareRequestState } from '../runtime/mod.tsx';
import { createDefaultConfig, promoteConfigToRoute, retagConfig } from './factory.ts';
import {
  normalizeLayerComponent,
  resolveConfiguredRoutePattern,
  resolveHeaderDescriptor,
  resolveLayerConfig,
} from './validators.ts';
export type { DefinePageBuilder, DefinePageRootBuilder } from './state.ts';
import type { DefinePageBuilder, DefinePageRootBuilder, FormSchemaInput } from './state.ts';
import type {
  ResourceFactoryMap,
  RuntimeLayerDescriptor,
  RuntimePageConfig,
  RuntimeResourceDescriptor,
} from '../internal.ts';
import type {
  AnyDefinePageTypeState,
  DefinePageBuildOptions,
  DefinePageBuildResultFor,
  DefinePageDefinitionFor,
  DefinePageFormConfigFor,
  DefinePageHandlersFor,
  DefinePageHeaderResolverFor,
  DefinePageLayerConfigFor,
  DefinePageLayerLoaderFor,
  DefinePageLayerProps,
  DefinePageLayoutFor,
  DefinePageMetaResolverFor,
  DefinePageMethod,
  DefinePageMethodHandlerFor,
  DefinePagePathOf,
  DefinePageRenderContext,
  DefinePageRequestContext,
  DefinePageResourceFactoryFor,
  DefinePageRootTypeState,
  DefinePageRoutedDefinitionFor,
  DefinePageRouteFor,
  DefinePageRouteNavFor,
  DefinePageSearchOf,
  DefinePageStateOf,
  DefinePageTelemetryConfig,
  DefinePageWithForm,
  DefinePageWithLayer,
  DefinePageWithParams,
  DefinePageWithPathParams,
  DefinePageWithResource,
  DefinePageWithResources,
  DefinePageWithRoute,
  DefinePageWithSearchParams,
  EmptyRecord,
  PathParamSchema,
  SearchParamSchema,
} from '../types.ts';

function createBuilder<TTypes extends AnyDefinePageTypeState, THasConfiguredRoute extends boolean>(
  config: RuntimePageConfig<TTypes, THasConfiguredRoute>,
): DefinePageBuilder<TTypes, THasConfiguredRoute> {
  const createTypedNav = (routePattern?: string): DefinePageRouteNavFor<TTypes> => {
    if (config.route) {
      resolveConfiguredRoutePattern(config, routePattern);
      return config.route.nav as DefinePageRouteNavFor<TTypes>;
    }

    const resolvedRoutePattern = resolveConfiguredRoutePattern(config, routePattern);
    return createRouteNav<DefinePagePathOf<TTypes>, DefinePageSearchOf<TTypes>>({
      routePattern: resolvedRoutePattern,
      pathSchema: config.pathSchema,
      searchSchema: config.searchSchema,
    });
  };

  function buildDefinition<
    TBuildOptions extends DefinePageBuildOptions | string | undefined = undefined,
  >(
    options?: TBuildOptions,
  ): DefinePageBuildResultFor<TBuildOptions, TTypes> {
    const explicitRoutePattern = typeof options === 'string' ? options : options?.routePattern;
    const routePattern =
      explicitRoutePattern !== undefined || config.defaultRoutePattern !== undefined
        ? resolveConfiguredRoutePattern(config, explicitRoutePattern)
        : undefined;
    const routeContract = !config.route && routePattern
      ? defineRouteContract({
        pathSchema: config.pathSchema as PathParamSchema<DefinePagePathOf<TTypes>> | undefined,
        searchSchema: config.searchSchema as
          | SearchParamSchema<DefinePageSearchOf<TTypes>>
          | undefined,
      })
      : undefined;
    const route = config.route
      ? config.route as DefinePageRouteFor<TTypes>
      : routeContract && routePattern
      ? bindRoutePattern(routeContract, routePattern) as DefinePageRouteFor<TTypes>
      : undefined;
    const runtimeConfig =
      (routePattern ? { ...config, routePattern, route } : config) as RuntimePageConfig<
        TTypes,
        THasConfiguredRoute
      >;
    const page = async (
      ctx: DefinePageRequestContext<DefinePageStateOf<TTypes>>,
    ): Promise<JSX.Element> => {
      const result = await executePagePipeline(runtimeConfig, ctx);
      return result.page;
    };

    const builtHandlers: DefinePageHandlersFor<TTypes> = {};

    for (
      const [method, handler] of Object.entries(config.handlers) as Array<[
        DefinePageMethod,
        NonNullable<RuntimePageConfig<TTypes, THasConfiguredRoute>['handlers'][DefinePageMethod]>,
      ]>
    ) {
      builtHandlers[method] = async (ctx) => {
        const { runtimeCtx } = await prepareRequestState(runtimeConfig, ctx);
        return await handler(runtimeCtx);
      };
    }

    if (config.streaming) {
      if (config.handlers.GET) {
        throw new Error(
          'definePage() cannot combine withHandler("GET") with withStreaming().',
        );
      }

      builtHandlers.GET = async (ctx) => {
        const result = await executePagePipeline(runtimeConfig, ctx);
        const headerEntries = result.headers
          ? Object.fromEntries(result.headers.entries())
          : undefined;

        if (result.streamLayers && result.streamLayers.length > 0) {
          return createIncrementalStreamingResponse(
            result.page,
            result.streamLayers.map((layer) => ({
              slotId: layer.slotId,
              render: async () => {
                const resolvedData = await layer.promise;
                const Component = layer.component as ComponentType<Record<string, unknown>>;
                const vnode = resolvedData ? <Component {...resolvedData} /> : <Component />;
                return renderToString(vnode as JSX.Element);
              },
            })),
            {
              headers: headerEntries,
              status: result.status,
            },
          );
        }

        return createStreamingResponse(result.page, {
          headers: headerEntries,
          status: result.status,
        });
      };
    } else if (config.headers.length > 0 || config.status !== undefined) {
      if (config.handlers.GET) {
        throw new Error(
          'definePage() cannot combine withHandler("GET") with withHeader() or withStatus().',
        );
      }

      builtHandlers.GET = async (ctx) => {
        const renderCtx = ctx as DefinePageRenderContext<DefinePageStateOf<TTypes>>;
        if (typeof renderCtx.render !== 'function') {
          throw new Error(
            'definePage() requires ctx.render() when withHeader() or withStatus() is used.',
          );
        }

        const result = await executePagePipeline(runtimeConfig, renderCtx);
        return renderCtx.render(result.page, {
          headers: result.headers,
          status: result.status,
        });
      };
    }

    const handler = Object.keys(builtHandlers).length > 0 ? builtHandlers : undefined;
    const defaultPage = page;

    if (routePattern) {
      if (!route) {
        throw new Error('definePage() failed to build routed page metadata.');
      }
      const routedDefinition: DefinePageRoutedDefinitionFor<TTypes> = {
        page,
        default: defaultPage,
        handler,
        nav: route.nav,
        route: route as DefinePageRoutedDefinitionFor<TTypes>['route'],
        hooks: createDefinePageHooks<DefinePageRoutedDefinitionFor<TTypes>>(),
      };

      return routedDefinition as DefinePageBuildResultFor<TBuildOptions, TTypes>;
    }

    const definition: DefinePageDefinitionFor<TTypes> = { page, default: defaultPage, handler };
    return definition as DefinePageBuildResultFor<TBuildOptions, TTypes>;
  }

  return {
    withResource<K extends string, TOut>(
      key: K,
      factory: DefinePageResourceFactoryFor<TTypes, TOut, THasConfiguredRoute>,
    ) {
      const descriptor: RuntimeResourceDescriptor<TTypes, THasConfiguredRoute> = {
        key,
        factory,
      };
      return createBuilder<DefinePageWithResource<TTypes, K, TOut>, THasConfiguredRoute>({
        ...retagConfig<TTypes, DefinePageWithResource<TTypes, K, TOut>, THasConfiguredRoute>(
          config,
        ),
        resources: [...config.resources, descriptor],
      }) as DefinePageBuilder<DefinePageWithResource<TTypes, K, TOut>, THasConfiguredRoute>;
    },

    withResources<TFactories extends ResourceFactoryMap<TTypes, THasConfiguredRoute>>(
      factories: TFactories,
    ) {
      const descriptors: RuntimeResourceDescriptor<TTypes, THasConfiguredRoute>[] = Object.entries(
        factories,
      ).map((
        [key, factory],
      ) => ({
        key,
        factory,
      }));
      return createBuilder<DefinePageWithResources<TTypes, TFactories>, THasConfiguredRoute>({
        ...retagConfig<TTypes, DefinePageWithResources<TTypes, TFactories>, THasConfiguredRoute>(
          config,
        ),
        resources: [...config.resources, ...descriptors],
      }) as DefinePageBuilder<DefinePageWithResources<TTypes, TFactories>, THasConfiguredRoute>;
    },

    withParams<TPathSchema, TSearchSchema>(schemas: {
      path?: TPathSchema & PathParamSchema;
      search?: TSearchSchema & SearchParamSchema;
    }) {
      return createBuilder<
        DefinePageWithParams<TTypes, TPathSchema, TSearchSchema>,
        THasConfiguredRoute
      >({
        ...retagConfig<
          TTypes,
          DefinePageWithParams<TTypes, TPathSchema, TSearchSchema>,
          THasConfiguredRoute
        >(config),
        pathSchema: schemas.path as RuntimePageConfig<
          DefinePageWithParams<TTypes, TPathSchema, TSearchSchema>,
          THasConfiguredRoute
        >['pathSchema'],
        searchSchema: schemas.search as RuntimePageConfig<
          DefinePageWithParams<TTypes, TPathSchema, TSearchSchema>,
          THasConfiguredRoute
        >['searchSchema'],
      }) as DefinePageBuilder<
        DefinePageWithParams<TTypes, TPathSchema, TSearchSchema>,
        THasConfiguredRoute
      >;
    },

    withPathParams<TSchema>(schema: TSchema & PathParamSchema) {
      return createBuilder<DefinePageWithPathParams<TTypes, TSchema>, THasConfiguredRoute>({
        ...retagConfig<TTypes, DefinePageWithPathParams<TTypes, TSchema>, THasConfiguredRoute>(
          config,
        ),
        pathSchema: schema as RuntimePageConfig<
          DefinePageWithPathParams<TTypes, TSchema>,
          THasConfiguredRoute
        >['pathSchema'],
      }) as DefinePageBuilder<DefinePageWithPathParams<TTypes, TSchema>, THasConfiguredRoute>;
    },

    withSearchParams<TSchema>(schema: TSchema & SearchParamSchema) {
      return createBuilder<DefinePageWithSearchParams<TTypes, TSchema>, THasConfiguredRoute>({
        ...retagConfig<TTypes, DefinePageWithSearchParams<TTypes, TSchema>, THasConfiguredRoute>(
          config,
        ),
        searchSchema: schema as RuntimePageConfig<
          DefinePageWithSearchParams<TTypes, TSchema>,
          THasConfiguredRoute
        >['searchSchema'],
      }) as DefinePageBuilder<DefinePageWithSearchParams<TTypes, TSchema>, THasConfiguredRoute>;
    },

    withRoute,

    withPolicy(policy) {
      return createBuilder<TTypes, THasConfiguredRoute>({ ...config, policy });
    },

    withTelemetry(telemetry) {
      return createBuilder<TTypes, THasConfiguredRoute>({ ...config, telemetry });
    },

    withLayer<K extends string, TProps extends DefinePageLayerProps = EmptyRecord>(
      id: K,
      component: ComponentType<TProps>,
      layerConfig?:
        | DefinePageLayerConfigFor<TTypes, TProps, THasConfiguredRoute>
        | DefinePageLayerLoaderFor<TTypes, TProps, THasConfiguredRoute>,
    ) {
      const resolvedConfig = resolveLayerConfig(layerConfig);
      const descriptor: RuntimeLayerDescriptor<TTypes, THasConfiguredRoute> = {
        id,
        component: normalizeLayerComponent(component),
        config: resolvedConfig as RuntimeLayerDescriptor<TTypes, THasConfiguredRoute>['config'],
      };
      return createBuilder<DefinePageWithLayer<TTypes, K, TProps>, THasConfiguredRoute>({
        ...retagConfig<TTypes, DefinePageWithLayer<TTypes, K, TProps>, THasConfiguredRoute>(config),
        layers: [...config.layers, descriptor],
      }) as DefinePageBuilder<DefinePageWithLayer<TTypes, K, TProps>, THasConfiguredRoute>;
    },

    withForm<
      K extends string,
      TSchema extends z.ZodTypeAny,
      TOutput = unknown,
    >(
      id: K,
      component: ComponentType<RuntimeFormState<FormSchemaInput<TSchema>>>,
      formConfig: FormConfig<TTypes, THasConfiguredRoute, TSchema, TOutput>,
    ) {
      type TNextTypes = DefinePageWithForm<TTypes, K, TSchema>;

      const method = formConfig.method ?? 'POST';
      const adapter = createZodAdapter(formConfig.schema);
      const nextConfig = retagConfig<TTypes, TNextTypes, THasConfiguredRoute>(config);
      const headerResolver: DefinePageHeaderResolverFor<TNextTypes, THasConfiguredRoute> = (
        ctx,
      ) => {
        if (formConfig.csrf === false) {
          return {};
        }

        const layer = ctx.layerData[id] as RuntimeFormState<FormSchemaInput<TSchema>> | undefined;
        if (!layer?.csrfInputProps.value) {
          return {};
        }

        const headers = new Headers();
        setCsrfCookie(headers, layer.csrfInputProps.value, ctx.url);
        return headers;
      };

      const descriptor: RuntimeLayerDescriptor<TNextTypes, THasConfiguredRoute> = {
        id,
        component: component as ComponentType<DefinePageLayerProps>,
        config: {
          loader: async (ctx) => {
            const result = isWithFormResult<FormSchemaInput<TSchema>, TOutput>(ctx.data)
              ? ctx.data
              : undefined;
            const initialValues = result ? undefined : mergeInitialFormValues(
              adapter.getDefaults(),
              formConfig.initial ? await formConfig.initial(ctx) : undefined,
            );
            const csrfToken = formConfig.csrf === false
              ? undefined
              : result?.csrfToken || readCsrfToken(ctx.req) || crypto.randomUUID();

            return resolveRuntimeFormState<FormSchemaInput<TSchema>, TOutput>(result, {
              id,
              action: ctx.url.pathname,
              initialValues,
              defaultValues: adapter.getDefaults(),
              constraints: adapter.getConstraints(),
              method,
              csrfToken,
            });
          },
        },
      };

      return createBuilder<TNextTypes, THasConfiguredRoute>({
        ...nextConfig,
        layers: [...nextConfig.layers, descriptor],
        handlers: {
          ...nextConfig.handlers,
          [method]: createWithFormHandler<TTypes, THasConfiguredRoute, TSchema, TOutput>(
            id,
            formConfig,
            adapter,
          ) as RuntimePageConfig<TNextTypes, THasConfiguredRoute>['handlers'][typeof method],
        },
        headers: formConfig.csrf === false
          ? nextConfig.headers
          : [...nextConfig.headers, headerResolver],
        form: {
          id,
          config: formConfig as RuntimePageConfig<TNextTypes, THasConfiguredRoute>['form'] extends
            { config: infer TConfig } ? TConfig : never,
        },
      }) as DefinePageBuilder<TNextTypes, THasConfiguredRoute>;
    },

    withHandler(method, handler) {
      return createBuilder<TTypes, THasConfiguredRoute>({
        ...config,
        handlers: {
          ...config.handlers,
          [method]: handler,
        },
      });
    },

    withLayout(layout) {
      return createBuilder<TTypes, THasConfiguredRoute>({ ...config, layout });
    },

    withMeta(resolver) {
      return createBuilder<TTypes, THasConfiguredRoute>({ ...config, meta: resolver });
    },

    withHeader(
      nameOrHeadersOrResolver:
        | string
        | HeadersInit
        | DefinePageHeaderResolverFor<TTypes, THasConfiguredRoute>,
      value?: string,
    ) {
      const descriptor = resolveHeaderDescriptor(nameOrHeadersOrResolver, value);
      return createBuilder<TTypes, THasConfiguredRoute>({
        ...config,
        headers: [...config.headers, descriptor],
      });
    },

    withStatus(status) {
      return createBuilder<TTypes, THasConfiguredRoute>({ ...config, status });
    },

    withStreaming() {
      return createBuilder<TTypes, THasConfiguredRoute>({
        ...config,
        streaming: true,
      });
    },

    createNav(routePattern?) {
      return createTypedNav(routePattern);
    },

    build,
  };

  function build(): THasConfiguredRoute extends true ? DefinePageRoutedDefinitionFor<TTypes>
    : DefinePageDefinitionFor<TTypes>;
  function build(routePattern: string): DefinePageRoutedDefinitionFor<TTypes>;
  function build<TBuildOptions extends DefinePageBuildOptions>(
    options: TBuildOptions,
  ): DefinePageBuildResultFor<TBuildOptions, TTypes>;
  function build(options?: string | DefinePageBuildOptions) {
    if (typeof options === 'string') {
      return buildDefinition(options);
    }

    if (options && typeof options === 'object') {
      return buildDefinition(options);
    }

    if (config.defaultRoutePattern) {
      return buildDefinition(config.defaultRoutePattern);
    }

    return buildDefinition(undefined);
  }

  function withRoute<TRoute extends TypedRouteTarget<object, object>>(
    route: TRoute,
  ): DefinePageBuilder<DefinePageWithRoute<TTypes, TRoute>, true> {
    type TRouteTypes = DefinePageWithRoute<TTypes, TRoute>;

    return createBuilder<TRouteTypes, true>({
      ...promoteConfigToRoute<TTypes, TRouteTypes, THasConfiguredRoute>(config),
      defaultRoutePattern: route.routePattern,
      pathSchema: route.pathSchema as RuntimePageConfig<TRouteTypes, true>['pathSchema'],
      searchSchema: route.searchSchema as RuntimePageConfig<TRouteTypes, true>['searchSchema'],
      route: route as unknown as RuntimePageConfig<TRouteTypes, true>['route'],
    });
  }
}

export function definePage(): DefinePageRootBuilder;
export function definePage<TState>(): DefinePageRootBuilder<TState>;
export function definePage<TState = EmptyRecord>(): DefinePageRootBuilder<TState> {
  return createBuilder<DefinePageRootTypeState<TState>, false>(
    createDefaultConfig<TState>(),
  ) as DefinePageRootBuilder<TState>;
}

function mergeInitialFormValues<TValues extends FormValues>(
  defaults: Partial<TValues>,
  initialValues: Partial<TValues> | undefined,
): Partial<TValues> {
  return {
    ...defaults,
    ...(initialValues ?? {}),
  };
}

function createWithFormHandler<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean,
  TSchema extends z.ZodTypeAny,
  TOutput,
>(
  id: string,
  formConfig: FormConfig<TTypes, THasRoute, TSchema, TOutput>,
  adapter: ReturnType<typeof createZodAdapter<TSchema>>,
): DefinePageMethodHandlerFor<TTypes, THasRoute> {
  return async (ctx) => {
    const spanName = formConfig.spanName ?? `form.${id}`;
    const formData = await withFormSpan(
      spanName,
      'parse',
      {
        'form.id': id,
        'form.route': ctx.url.pathname,
        'form.method': formConfig.method ?? 'POST',
      },
      async () => await ctx.req.formData(),
    );
    const parsed = await parseFormSubmission<FormSchemaInput<TSchema>, z.output<TSchema>>(
      formData,
      adapter,
    );
    const initialValues = mergeInitialFormValues(
      adapter.getDefaults(),
      formConfig.initial ? await formConfig.initial(ctx) : undefined,
    );
    const submissionId = parsed.submissionId ?? generateSubmissionId();
    const cookieToken = readCsrfToken(ctx.req);
    const csrfToken = formConfig.csrf === false
      ? undefined
      : parsed.csrfToken || cookieToken || crypto.randomUUID();
    const reply = replyFor<FormSchemaInput<TSchema>, TOutput>();
    const formCtx = createFormHandlerContext<TTypes, THasRoute, TSchema, TOutput>(
      ctx,
      reply,
      formData,
      parsed.values,
      parsed.intent,
      submissionId,
      csrfToken,
    );

    if (formConfig.csrf !== false && !verifyCsrfToken(cookieToken, parsed.csrfToken)) {
      return {
        data: reply.error({
          values: parsed.values as FormSchemaInput<TSchema>,
          initialValues,
          intent: parsed.intent,
          submissionId,
          csrfToken,
          collectionKeys: parsed.collectionKeys,
          formErrors: ['Your form session expired. Reload the page and try again.'],
        }),
      };
    }

    if (parsed.intent && parsed.intent.type !== 'submit' && formConfig.onIntent) {
      const intentValues = applyIntentOperation(
        parsed.intent,
        parsed.values as FormSchemaInput<TSchema>,
      );
      const intentCollectionKeys = applyCollectionKeyOperation(
        parsed.intent,
        parsed.collectionKeys,
      );
      const intentResult = await withFormSpan(
        spanName,
        'intent',
        {
          'form.id': id,
          'form.intent': parsed.intent.type,
          'form.route': ctx.url.pathname,
        },
        async () => await formConfig.onIntent!(parsed.intent!, intentValues, formCtx),
      );

      return {
        data: createIntentReply(
          reply,
          intentCollectionKeys,
          submissionId,
          csrfToken,
          initialValues,
          parsed.intent,
          intentResult,
        ),
      };
    }

    const validationResult = parsed.result;

    if (!validationResult.success) {
      return {
        data: reply.invalid({
          values: parsed.values as FormSchemaInput<TSchema>,
          initialValues,
          intent: parsed.intent,
          submissionId,
          csrfToken,
          collectionKeys: parsed.collectionKeys,
          fieldErrors: validationResult.fieldErrors,
          formErrors: validationResult.formErrors,
        }),
      };
    }

    try {
      const output = await withFormSpan(
        spanName,
        'mutate',
        {
          'form.id': id,
          'form.route': ctx.url.pathname,
        },
        async () => await formConfig.mutate(validationResult.data, formCtx),
      );

      if (formConfig.invalidate) {
        await withFormSpan(
          spanName,
          'invalidate',
          {
            'form.id': id,
            'form.route': ctx.url.pathname,
          },
          async () => {
            await formConfig.invalidate!(output, formCtx);
          },
        );
      }

      if (formConfig.redirectTo) {
        const target = await withFormSpan(
          spanName,
          'redirect',
          {
            'form.id': id,
            'form.route': ctx.url.pathname,
          },
          async () => await formConfig.redirectTo!(output, formCtx),
        );

        return typeof target === 'string'
          ? createFormRedirectResponse(target)
          : ensureNoStoreHeaders(target);
      }

      const successMeta = formConfig.onSuccess
        ? await formConfig.onSuccess(output, formCtx)
        : undefined;

      return {
        data: reply.success({
          values: parsed.values as FormSchemaInput<TSchema>,
          initialValues,
          intent: parsed.intent,
          submissionId,
          csrfToken,
          collectionKeys: parsed.collectionKeys,
          output,
          message: successMeta?.message,
          nextValues: successMeta?.nextValues,
        }),
      };
    } catch (error: unknown) {
      await emitFormError(
        spanName,
        'mutate',
        {
          'form.id': id,
          'form.route': ctx.url.pathname,
          'form.method': formConfig.method ?? 'POST',
          'form.submission_id': submissionId,
        },
        error,
      );
      console.error('[netscript/fresh] withForm submit failed', {
        formId: id,
        route: ctx.url.pathname,
        submissionId,
        error,
      });

      return {
        data: normalizeFormError(
          error,
          parsed.values as FormSchemaInput<TSchema>,
          submissionId,
          {
            csrfToken,
            initialValues,
            intent: parsed.intent,
            collectionKeys: parsed.collectionKeys,
          },
        ),
      };
    }
  };
}

function createFormHandlerContext<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean,
  TSchema extends z.ZodTypeAny,
  TOutput,
>(
  ctx: Parameters<DefinePageMethodHandlerFor<TTypes, THasRoute>>[0],
  reply: ReturnType<typeof replyFor<FormSchemaInput<TSchema>, TOutput>>,
  formData: FormData,
  values: Partial<FormSchemaInput<TSchema>>,
  intent: FormIntent | null,
  submissionId: string,
  csrfToken: string | undefined,
): FormHandlerContext<TTypes, THasRoute, FormSchemaInput<TSchema>, TOutput> {
  return ({
    ...ctx,
    form: {
      reply,
      intent,
      formData,
      submissionId,
      csrfToken,
      values,
    },
  } as unknown) as FormHandlerContext<TTypes, THasRoute, FormSchemaInput<TSchema>, TOutput>;
}

function createIntentReply<TValues extends FormValues, TOutput>(
  reply: ReturnType<typeof replyFor<TValues, TOutput>>,
  collectionKeys: import('../../../form/types.ts').CollectionKeyMap,
  submissionId: string,
  csrfToken: string | undefined,
  initialValues: Partial<TValues>,
  intent: FormHandlerContext<AnyDefinePageTypeState, boolean, TValues, TOutput>['form']['intent'],
  result: FormIntentResult<TValues>,
) {
  const fieldErrors = createIntentFieldErrors(result);
  const hasFieldErrors = Object.entries(fieldErrors).some(([field, messages]) => {
    if (field === '_form') {
      return false;
    }

    return Array.isArray(messages) && messages.length > 0;
  });
  const hasErrors = fieldErrors._form.length > 0 || hasFieldErrors;

  return hasErrors
    ? reply.invalid({
      values: result.values,
      initialValues,
      intent,
      submissionId,
      csrfToken,
      collectionKeys,
      fieldErrors,
      formErrors: fieldErrors._form,
    })
    : reply.initial({
      values: result.values,
      initialValues,
      intent,
      submissionId,
      csrfToken,
      collectionKeys,
    });
}

function createIntentFieldErrors<TValues extends FormValues>(
  result: FormIntentResult<TValues>,
): FormFieldErrors<TValues> {
  const fieldErrors = { _form: [...(result.formErrors ?? [])] } as FormFieldErrors<TValues>;

  for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
    if (Array.isArray(messages) && messages.length > 0) {
      fieldErrors[field as Extract<keyof TValues, string>] = [...messages] as FormFieldErrors<
        TValues
      >[Extract<keyof TValues, string>];
    }
  }

  return fieldErrors;
}

function createFormRedirectResponse(location: string, status = 303): Response {
  return new Response(null, {
    status,
    headers: new Headers({
      location,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      Pragma: 'no-cache',
    }),
  });
}

function ensureNoStoreHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  headers.set('Pragma', 'no-cache');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function isWithFormResult<TValues extends FormValues, TOutput>(
  value: unknown,
): value is Exclude<
  FormSubmissionResult<TValues, TOutput>,
  { status: 'redirect' }
> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as {
    status?: unknown;
    submissionId?: unknown;
    values?: unknown;
    initialValues?: unknown;
    fieldErrors?: unknown;
    formErrors?: unknown;
    collectionKeys?: unknown;
    csrfToken?: unknown;
  };

  return isWithFormStatus(candidate.status) &&
    typeof candidate.submissionId === 'string' &&
    isPlainObject(candidate.values) &&
    isPlainObject(candidate.initialValues) &&
    isPlainObject(candidate.fieldErrors) &&
    Array.isArray(candidate.formErrors) &&
    isPlainObject(candidate.collectionKeys) &&
    typeof candidate.csrfToken === 'string';
}

function isWithFormStatus(value: unknown): value is 'initial' | 'invalid' | 'success' | 'error' {
  return value === 'initial' || value === 'invalid' || value === 'success' || value === 'error';
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
