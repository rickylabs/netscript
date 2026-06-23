---
layout: layouts/base.vto
title: '@netscript/fresh'
---

# `@netscript/fresh`

Fresh runtime extensions, builders, forms, defer primitives, and route contracts for NetScript. This
page is generated from the public surface of the package with `deno doc` (US-2). For the full index
of packages and plugins return to the [reference overview](/reference/).

The root entrypoint (`@netscript/fresh`) exposes only the cross-cutting page-loader cache helpers.
Every other capability lives on an explicit sub-path export. The sub-paths and their reference
sections are:

| Export                         | Entrypoint                          | Purpose                                       |
| ------------------------------ | ----------------------------------- | --------------------------------------------- |
| `@netscript/fresh`             | `./mod.ts`                          | Page-loader cache helpers (documented below). |
| `@netscript/fresh/server`      | `./src/runtime/server/mod.ts`       | Fresh app factory and streaming SSR.          |
| `@netscript/fresh/builders`    | `./src/application/builders/mod.ts` | Fluent page and partial builders.             |
| `@netscript/fresh/route`       | `./src/application/route/mod.ts`    | Typed route contracts and navigation.         |
| `@netscript/fresh/defer`       | `./src/application/defer/mod.ts`    | Deferred rendering primitives.                |
| `@netscript/fresh/form`        | `./src/application/form/mod.ts`     | Managed forms and validation.                 |
| `@netscript/fresh/error`       | `./src/diagnostics/error/mod.ts`    | Error normalization and display.              |
| `@netscript/fresh/streams`     | `./src/runtime/streams/mod.ts`      | Durable streams client SDK.                   |
| `@netscript/fresh/query`       | `./src/application/query/mod.ts`    | Island TanStack Query hooks.                  |
| `@netscript/fresh/interactive` | `./src/runtime/interactive/mod.ts`  | Suspense promise helpers.                     |
| `@netscript/fresh/vite`        | `./src/application/vite/vite.ts`    | NetScript Fresh Vite plugin.                  |
| `@netscript/fresh/testing`     | `./src/testing/mod.ts`              | Test fixtures.                                |

## Root entrypoint

Cross-cutting page-loader cache helpers. Every other capability lives on an explicit sub-path export
listed below.

### Functions and components

| Symbol                      | Signature                                             | Description                                                                                   |
| --------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `hasAllCacheEntries`        | `hasAllCacheEntries(entries: ReadonlyArray): boolean` | Return `true` when every supplied entry is present.                                           |
| `minCachedAt`               | `minCachedAt(entries: ReadonlyArray)`                 | Return the oldest `cachedAt` timestamp across the supplied entries.                           |
| `projectCachedItemFromList` | `projectCachedItemFromList(listEntry, predicate)`     | Project a single cached item from a cached list response while preserving the list timestamp. |

### Types

| Symbol                | Kind      | Description                                                          |
| --------------------- | --------- | -------------------------------------------------------------------- |
| `CacheEntryLike`      | interface | Cached-entry shape shared by page loaders and partial orchestration. |
| `CachedListEntryLike` | interface | Cached list-entry shape used when projecting a single list item.     |

## `@netscript/fresh/server`

Server-only utilities: the NetScript-managed Fresh app factory and Preact streaming SSR primitives.

### Functions and components

| Symbol                    | Signature                                                           | Description                                                                |
| ------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `StreamErrorBoundary`     | `StreamErrorBoundary(props: StreamErrorBoundaryProps): object`      | Preact class component that catches rendering errors within its subtree.   |
| `createStreamingResponse` | `createStreamingResponse(vnode: StreamingRenderable, _): Response`  | Create a streaming HTTP `Response` from a Preact VNode tree.               |
| `defineFreshApp`          | `defineFreshApp(_): App`                                            | Create a NetScript-managed Fresh app with the baseline bootstrap defaults. |
| `renderToStream`          | `renderToStream(vnode: StreamingRenderable, _): StreamRenderResult` | Render a Preact VNode tree to a `ReadableStream` with Suspense streaming.  |

### Types

| Symbol                       | Kind      | Description                                                               |
| ---------------------------- | --------- | ------------------------------------------------------------------------- |
| `App`                        | class     | Create an application instance that passes the incoming `Request`         |
| `DefineFreshAppOptions`      | interface | Contract for NetScript-managed Fresh app bootstrap.                       |
| `FreshAppFactory`            | typeAlias | Factory callback that constructs the Fresh app instance.                  |
| `FreshAppFsRoutes`           | typeAlias | Adapter callback that registers file-system routes on a Fresh app.        |
| `FreshAppTelemetryAttribute` | typeAlias | Attribute value accepted by Fresh app telemetry bootstrap options.        |
| `FreshAppTelemetryOptions`   | interface | Telemetry bootstrap options reserved for `defineFreshApp` defaults.       |
| `FreshConfig`                | interface |                                                                           |
| `Middleware`                 | typeAlias | A middleware function is the basic building block of Fresh. It allows you |
| `StreamBoundaryRenderable`   | typeAlias | Renderable content accepted by streaming error boundaries.                |
| `StreamErrorBoundaryProps`   | interface | Props for {@link StreamErrorBoundary}.                                    |
| `StreamRenderOptions`        | interface | Options for streaming HTML rendering.                                     |
| `StreamRenderResult`         | interface | Result of a streaming render operation.                                   |
| `StreamingRenderStream`      | interface | Readable stream returned by the Preact streaming renderer.                |
| `StreamingRenderable`        | typeAlias | Renderable Preact tree accepted by Fresh streaming helpers.               |
| `StreamingRenderer`          | typeAlias | Renderer port used by `renderToStream` to create an HTML byte stream.     |

## `@netscript/fresh/builders`

Fluent, typed page and partial builder surface (definePage, definePartial).

### Functions and components

| Symbol               | Signature                                                                     | Description                                                                |
| -------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `definePage`         | `definePage(): PageRootBuilder`                                               | Start a new typed page builder chain.                                      |
| `definePartial`      | `definePartial(options: DefinePartialOptions): DefinedPartialRoute`           | Define a framework-owned partial route backed by an async loader.          |
| `defineStatsPartial` | `defineStatsPartial(options: DefineStatsPartialOptions): DefinedPartialRoute` | Define a stats-only partial route backed by a context-free query function. |

### Types

| Symbol                            | Kind      | Description                                                                   |
| --------------------------------- | --------- | ----------------------------------------------------------------------------- |
| `CollectionDescriptor`            | interface | Descriptor for a collection field and its item intent buttons.                |
| `CollectionItem`                  | interface | Descriptor for one item in a collection field.                                |
| `CollectionKeyInputProps`         | interface | Props for a hidden collection-key input.                                      |
| `CollectionKeyMap`                | typeAlias | Stable collection item keys by collection field path.                         |
| `ComponentLike`                   | interface | Minimal component contract accepted by page and partial builders.             |
| `ControlProps`                    | interface | Props applied to an input, select, textarea, or compatible control.           |
| `DefinePartialOptions`            | interface | Options for creating a framework-owned partial route.                         |
| `DefineStatsPartialOptions`       | interface | Options for creating a stats-only partial route.                              |
| `DefinedPartialRoute`             | interface | Materialized partial route contract returned by `definePartial()`.            |
| `DescriptionProps`                | interface | Props applied to a field description element.                                 |
| `EmptyRecord`                     | typeAlias | Empty object shape used by page builders without typed state.                 |
| `ErrorFormReplyInit`              | interface | Input used to construct an errored form reply.                                |
| `ErrorProps`                      | interface | Props applied to a field error element.                                       |
| `FieldConstraints`                | interface | HTML constraint attributes derived from a schema field.                       |
| `FieldDescriptor`                 | interface | Descriptor for one form field and its generated props.                        |
| `FieldDescriptorMap`              | typeAlias | Field descriptors keyed by form value path.                                   |
| `FormCsrfInputProps`              | interface | Props for the hidden CSRF token input.                                        |
| `FormElementProps`                | interface | Props applied to the root form element.                                       |
| `FormErrorMessages`               | typeAlias | Ordered validation messages for a field or form.                              |
| `FormFieldErrors`                 | typeAlias | Canonical field and form error map for submitted values.                      |
| `FormFieldPath`                   | typeAlias | Dot-path name for a field in nested form values.                              |
| `FormIntent`                      | interface | Structured representation of an encoded form intent.                          |
| `FormIntentResult`                | interface | Result returned after applying an encoded form intent.                        |
| `FormReplyHelpers`                | interface | Factory helpers for constructing typed form submission results.               |
| `FormReplyInit`                   | interface | Base input used to construct a form reply state.                              |
| `FormSubmissionErrorResult`       | interface | Errored form submission state.                                                |
| `FormSubmissionInitialResult`     | interface | Initial form submission state.                                                |
| `FormSubmissionInvalidResult`     | interface | Invalid form submission state.                                                |
| `FormSubmissionRedirectResult`    | interface | Redirect form submission state.                                               |
| `FormSubmissionResult`            | typeAlias | Union of all form submission result states.                                   |
| `FormSubmissionSuccessResult`     | interface | Successful form submission state.                                             |
| `FormValues`                      | typeAlias | Generic constraint for form value objects.                                    |
| `InferDefinePageLayerLoaderProps` | typeAlias |                                                                               |
| `IntentButtonProps`               | interface | Props for an intent submit button generated by a form field helper.           |
| `InvalidFormReplyInit`            | interface | Input used to construct an invalid form reply.                                |
| `LabelProps`                      | interface | Props applied to a field label.                                               |
| `PageBuildOptions`                | interface | Build options accepted by `page.build(...)`.                                  |
| `PageBuilder`                     | interface | Public fluent page builder surface.                                           |
| `PageCacheEntry`                  | interface | Minimal cache-entry shape accepted by page layer loaders.                     |
| `PageContext`                     | interface | Runtime context shared by loaders, handlers, layouts, and metadata resolvers. |
| `PageDeferPolicyInput`            | interface | Typed defer policy override accepted by `withPolicy()`.                       |
| `PageDeferPolicyProfile`          | typeAlias | Typed defer policy profile accepted by `withPolicy()`.                        |
| `PageDefinition`                  | interface | Unrouted page definition returned by `build()` without a route.               |
| `PageErrorPrimitives`             | interface | Minimal error payload accepted by builder-owned partial error components.     |
| `PageFormConfig`                  | interface | Configuration for the `withForm()` builder method (legacy `PageBuilder`       |
| `PageFormHandlerContext`          | interface | Extended context exposed to `withForm()` callbacks.                           |
| `PageHandlers`                    | typeAlias | Built page handlers returned by `build()`.                                    |
| `PageHeaderResolver`              | typeAlias | Header resolver accepted by `withHeader()`.                                   |
| `PageHooks`                       | interface | Hook bundle returned on routed page definitions.                              |
| `PageLayerConfig`                 | interface | Config object accepted by `withLayer()`.                                      |
| `PageLayerDelivery`               | typeAlias | Delivery mode for a deferred page layer.                                      |
| `PageLayerLoader`                 | typeAlias | Async loader accepted by `withLayer()`.                                       |
| `PageLayerMap`                    | typeAlias | Layer props keyed by layer id.                                                |
| `PageLayout`                      | typeAlias | Layout function accepted by `withLayout()`.                                   |
| `PageLayoutContext`               | interface | Runtime context variant used for page layouts and metadata.                   |
| `PageLinkProps`                   | interface | Link props returned by builder-owned route helpers.                           |
| `PageMetaDescriptor`              | interface | Metadata descriptor accepted by `withMeta()`.                                 |
| `PageMetaResolver`                | typeAlias | Metadata resolver accepted by `withMeta()`.                                   |
| `PageMethod`                      | typeAlias | HTTP methods accepted by `withHandler()`.                                     |
| `PageMethodHandler`               | typeAlias | Handler function accepted by `withHandler()`.                                 |
| `PagePairedRouteHrefInput`        | typeAlias | Input accepted by paired page/partial route helpers.                          |
| `PagePairedRouteTarget`           | interface | Combined page/partial route helper returned by `route.withPartial(...)`.      |
| `PagePartialLinkProps`            | interface | Link props produced by paired page/partial route helpers.                     |
| `PagePathParamInput`              | typeAlias | Raw path input keyed by dynamic segment name.                                 |
| `PagePathSchema`                  | interface | Minimal path schema contract accepted by `definePage()`.                      |
| `PageRenderContext`               | interface | Request context variant used when a page can call `ctx.render()`.             |
| `PageRenderable`                  | typeAlias | Renderable content accepted by builder-owned components, layouts, and slots.  |
| `PageRequestContext`              | interface | Typed request context exposed to page builders.                               |
| `PageResourceFactory`             | typeAlias | Resource factory accepted by `withResource()` and `withResources()`.          |
| `PageRootBuilder`                 | interface | Root page builder returned by `definePage()`.                                 |
| `PageRouteGetLinkPropsInput`      | typeAlias | Input accepted by builder-owned bound route link-prop helpers.                |
| `PageRouteHrefInput`              | typeAlias | Input accepted by builder-owned route href helpers.                           |
| `PageRouteLinkComponentProps`     | typeAlias | Props accepted by builder-owned route link components.                        |
| `PageRouteNavigation`             | interface | Typed route navigation surface exposed by routed pages.                       |
| `PageRoutePath`                   | typeAlias | Infer the typed path state from a route target.                               |
| `PageRouteReference`              | interface | Minimal route reference accepted by `withRoute()`.                            |
| `PageRouteSearch`                 | typeAlias | Infer the typed search state from a route target.                             |
| `PageRouteTarget`                 | interface | Minimal route target accepted by `withRoute()`.                               |
| `PageSchemaParseFailure`          | interface | Failure result returned by page-owned schemas.                                |
| `PageSchemaParseResult`           | typeAlias | Result returned by page-owned path and search schemas.                        |
| `PageSchemaParseSuccess`          | interface | Success result returned by page-owned schemas.                                |
| `PageSearchParamInput`            | typeAlias | Raw search input keyed by query param name.                                   |
| `PageSearchParamValue`            | typeAlias | Raw search-param value accepted by route helpers.                             |
| `PageSearchSchema`                | interface | Minimal search schema contract accepted by `definePage()`.                    |
| `PageSlot`                        | typeAlias | Slot function exposed to layouts for a resolved layer.                        |
| `PageSlots`                       | typeAlias | Slot map exposed to layouts.                                                  |
| `PageTelemetryConfig`             | interface | Typed telemetry configuration accepted by `withTelemetry()`.                  |
| `PartialRouteConfig`              | interface | Minimal route config surface emitted by framework partial routes.             |
| `RedirectFormReplyInit`           | interface | Input used to construct a redirect form reply.                                |
| `RoutedPageDefinition`            | interface | Routed page definition returned by `build()` with route metadata.             |
| `RuntimeFormState`                | interface | Runtime state passed to a form layer component.                               |
| `SchemaInput`                     | typeAlias | Infer the input object accepted by a schema-like value.                       |
| `SchemaOutput`                    | typeAlias | Infer the output object carried by a schema-like value.                       |
| `Simplify`                        | typeAlias | Flatten mapped and intersected object types for cleaner IntelliSense.         |
| `SuccessFormReplyInit`            | interface | Input used to construct a successful form reply.                              |
| `UnknownRecord`                   | typeAlias | Generic object map used by resources and layer registries.                    |

## `@netscript/fresh/route`

Explicit, typed route-contract surface: route contracts, path and search schemas, and navigation
helpers.

### Functions and components

| Symbol                   | Signature                                                                                                                     | Description                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `bindRoutePattern`       | `bindRoutePattern(contract: DefineRouteContract, routePattern: string, metadata?: RouteReferenceOptions): BoundRouteContract` | Bind a route contract to a concrete Fresh route pattern.               |
| `createRouteReference`   | `createRouteReference(routePattern: TRoutePattern, metadata?: RouteReferenceOptions): RouteReference`                         | Build a route reference directly from a Fresh route pattern.           |
| `defineEnumPathParam`    | `defineEnumPathParam(paramName: TParamName, values: TValues): EnumPathParamDefinition`                                        | Create a reusable enum-backed path param helper.                       |
| `defineRouteContract`    | `defineRouteContract(_): DefineRouteContract`                                                                                 | Define a typed route contract around optional path and search schemas. |
| `enumPathParamSchema`    | `enumPathParamSchema(paramName: TParamName, values: TValues): PathParamSchema`                                                | Create an enum-backed path schema for a single dynamic route segment.  |
| `fallback`               | `fallback(schema: TSchema, defaultValue: SchemaFieldOutput): TSchema`                                                         | Apply a fallback value to a Zod search-param field.                    |
| `paginationSearchSchema` | `paginationSearchSchema(_): PaginationSearchSchema`                                                                           | Create a pagination-aware search schema with typed defaults.           |

### Types

| Symbol                          | Kind      | Description                                                                     |
| ------------------------------- | --------- | ------------------------------------------------------------------------------- |
| `BoundRouteContract`            | typeAlias | Bound route reference created from a route contract and concrete route pattern. |
| `DefineRouteContract`           | interface | Public route contract produced by `defineRouteContract()`.                      |
| `DefineRouteContractOptions`    | interface | Contract options for defining typed route path and search schemas.              |
| `EmptyRecord`                   | typeAlias | Empty object shape used by route helpers without typed params.                  |
| `EnumPathParamDefinition`       | interface | Enum-backed path param definition returned by `defineEnumPathParam()`.          |
| `FreshLinkAttributes`           | interface | Fresh-compatible anchor attributes returned by route helpers.                   |
| `FreshPartialLinkAttributes`    | interface | Fresh-compatible partial link attributes returned by paired routes.             |
| `InferRouteContractPath`        | typeAlias | Infer the typed path state carried by a route contract or route reference.      |
| `InferRouteContractSearch`      | typeAlias | Infer the typed search state carried by a route contract or route reference.    |
| `InferRoutePatternPath`         | typeAlias | Infer typed path params directly from a Fresh route pattern.                    |
| `InferRoutePatternPathSegments` | typeAlias | Infer typed path params from the stripped Fresh route pattern.                  |
| `InferRoutePatternSegment`      | typeAlias | Infer one typed path segment from a Fresh route pattern segment.                |
| `PaginationSearchBaseShape`     | interface | Base schema shape returned by `paginationSearchSchema()`.                       |
| `PaginationSearchSchema`        | interface | Public facade for pagination-aware query string parsing.                        |
| `PaginationSearchSchemaOptions` | interface | Options for the default pagination search schema.                               |
| `PaginationSearchState`         | interface | Typed output produced by pagination search schemas.                             |
| `PairedRouteHrefArgs`           | typeAlias | Variadic args accepted by paired route href builders.                           |
| `PairedRouteHrefInput`          | typeAlias | Input accepted by paired page/partial route helpers.                            |
| `PairedRouteLinkPropsInput`     | typeAlias | Input accepted by paired-route `getLinkProps()`.                                |
| `PairedRouteTarget`             | interface | Combined page/partial route helper returned by `route.withPartial(...)`.        |
| `PathParamInput`                | typeAlias | Raw path input keyed by dynamic segment name.                                   |
| `PathParamSchema`               | interface | Minimal schema contract accepted for route path params.                         |
| `RouteContractTypeCarrier`      | interface | Public type carrier used by route contracts and route references.               |
| `RouteHrefArgs`                 | typeAlias | Variadic args accepted by route href builders.                                  |
| `RouteHrefInput`                | typeAlias | Input accepted by `route.nav.makeHref()`.                                       |
| `RouteLinkComponentProps`       | typeAlias | Props accepted by the route-bound Fresh link component.                         |
| `RouteLinkPropsInput`           | typeAlias | Input accepted by `route.getLinkProps()`.                                       |
| `RouteNavigation`               | interface | Minimal typed route navigation API exposed to consumers.                        |
| `RoutePathInput`                | typeAlias | Path input accepted by route href builders.                                     |
| `RouteReference`                | interface | Stable route reference returned by route contracts and generated manifests.     |
| `RouteReferenceKind`            | typeAlias | Route metadata classification used by generated route manifests.                |
| `RouteReferenceOptions`         | interface | Optional metadata attached to generated route references.                       |
| `RouteSearchUpdate`             | typeAlias | Input used when partially updating typed search state.                          |
| `SchemaField`                   | interface | Structural schema contract accepted by pagination search helpers.               |
| `SchemaFieldOutput`             | typeAlias | Infer the output carried by a schema-like field.                                |
| `SchemaOutput`                  | typeAlias | Infer the output object carried by a route schema.                              |
| `SchemaParseFailure`            | interface | Failed schema parse result.                                                     |
| `SchemaParseResult`             | typeAlias | Result returned by route path and search schemas.                               |
| `SchemaParseSuccess`            | interface | Successful schema parse result.                                                 |
| `SearchParamInput`              | typeAlias | Raw search input keyed by query param name.                                     |
| `SearchParamSchema`             | interface | Minimal schema contract accepted for route search params.                       |
| `SearchParamValue`              | typeAlias | Primitive search-param value accepted by route helpers.                         |
| `ShapeOutput`                   | typeAlias | Infer the resolved object output carried by a pagination schema shape.          |
| `StripLeadingSlash`             | typeAlias | Strip a leading slash from a Fresh route pattern.                               |
| `ValidatedRouteHref`            | typeAlias | Stable href string returned by validated route navigation helpers.              |

## `@netscript/fresh/defer`

Deferred rendering primitives: server and island defer wrappers, policy resolution, and telemetry
spans.

### Functions and components

| Symbol                         | Signature                                                                             | Description                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `DeferComponent`               | `DeferComponent(props: DeferComponentProps): object`                                  | Hidden client-side form that revalidates deferred regions when policy allows it.        |
| `DeferPage`                    | `DeferPage(props: DeferPageProps): object`                                            | Render a deferred region with optional server prewarm and telemetry hooks.              |
| `Deferred`                     | `Deferred(props: DeferredProps): DeferredRenderable`                                  | Promise-prop consumer for RFC-style deferred data.                                      |
| `buildDeferFormState`          | `buildDeferFormState(searchParams?: string, partialSearchParams?: string)`            | Build the hidden form state used by the defer island.                                   |
| `decideDeferClientAction`      | `decideDeferClientAction(input: DeferClientDecisionInput): DeferClientDecision`       | Decide whether the client island should submit or skip its deferred refresh form.       |
| `emitDeferCacheReadSpan`       | `emitDeferCacheReadSpan(input: DeferCacheReadSpanInput): Promise`                     | Emit a span for reading a defer region from cache.                                      |
| `emitDeferClientDecisionSpan`  | `emitDeferClientDecisionSpan(attributes: FreshDeferTelemetryAttributes): Promise`     | Emit a span for a client-side defer decision.                                           |
| `emitDeferPrewarmDispatchSpan` | `emitDeferPrewarmDispatchSpan(input: DeferPrewarmSpanInput, run): Promise`            | Emit a span that wraps a defer prewarm dispatch operation.                              |
| `emitStreamRenderSpan`         | `emitStreamRenderSpan(input: StreamRenderSpanInput, run): Promise`                    | Emit an OpenTelemetry span that wraps a streaming SSR render.                           |
| `resolveDeferPolicy`           | `resolveDeferPolicy(policy, staleTimeOverrideMs, staleStrategy): DeferPolicyResolved` | Resolve user policy input, stale overrides, and legacy strategy into a complete policy. |
| `resolveDetailDeferConfig`     | `resolveDetailDeferConfig(hasCompleteCache: boolean)`                                 | Resolve the detail-page stale window and defer policy for the current cache state.      |
| `sanitizeDeferSearchParams`    | `sanitizeDeferSearchParams(searchParams?: string)`                                    | Remove Fresh transport-only query parameters from a serialized query string.            |

### Constants

| Symbol                        | Type               | Description                                                               |
| ----------------------------- | ------------------ | ------------------------------------------------------------------------- |
| `DEFER_POLICY`                |                    | Conventional defer policy profiles used by generated pages.               |
| `DEFER_STALE_MS`              |                    | Conventional stale windows used by generated CRUD pages.                  |
| `DETAIL_FORCE_REFRESH_POLICY` | `DeferPolicyInput` | Detail-page policy that preserves immediate consistency after navigation. |

### Types

| Symbol                          | Kind      | Description                                                                            |
| ------------------------------- | --------- | -------------------------------------------------------------------------------------- |
| `DeferCacheReadSpanInput`       | interface | Input attributes used by a defer cache-read span.                                      |
| `DeferClientDecision`           | interface | Client-side deferred refresh decision.                                                 |
| `DeferClientDecisionInput`      | interface | Inputs used to decide whether a deferred region should refresh on the client.          |
| `DeferClientDecisionReason`     | typeAlias | Reasons the client island can choose to submit or skip a deferred refresh.             |
| `DeferComponentProps`           | interface | Props consumed by the hidden client-side defer form.                                   |
| `DeferPagePolicyInput`          | interface | Policy overrides accepted by the page wrapper.                                         |
| `DeferPagePolicyProfile`        | typeAlias | Named defer policy profiles accepted by the page wrapper.                              |
| `DeferPageProps`                | interface | Props for the `DeferPage` server wrapper.                                              |
| `DeferPageRenderable`           | typeAlias | Renderable content accepted by deferred page slots.                                    |
| `DeferPageRequestContextLike`   | interface | Fresh request fields consumed by `DeferPage` without depending on app-local ctx types. |
| `DeferPolicyInput`              | interface | Policy overrides that tune when deferred regions refresh.                              |
| `DeferPolicyProfile`            | typeAlias | Named policy profiles for deferred rendering freshness behavior.                       |
| `DeferPolicyResolved`           | interface | Fully resolved defer policy used by server and island renderers.                       |
| `DeferPrewarmResult`            | interface | Result metrics captured by a defer prewarm dispatch.                                   |
| `DeferPrewarmSpanInput`         | interface | Input attributes used by a defer prewarm dispatch span.                                |
| `DeferredProps`                 | interface | Props for the `Deferred` Suspense helper.                                              |
| `DeferredRenderFunction`        | typeAlias | Render function used to turn resolved deferred data into content.                      |
| `DeferredRenderable`            | typeAlias | Renderable content accepted by deferred Suspense slots.                                |
| `FreshDeferTelemetryAttributes` | typeAlias | Attribute map accepted by Fresh defer telemetry helpers.                               |
| `LegacyStaleStrategy`           | typeAlias | Legacy stale strategy accepted by older defer call sites.                              |
| `StreamRenderSpanInput`         | interface | Input for a streaming render telemetry span.                                           |
| `StreamRenderSpanResult`        | interface | Result metrics captured after the streaming render completes.                          |

## `@netscript/fresh/form`

Managed forms: CSRF, intents, progressive enhancement, pagination, and Standard Schema validation.

### Functions and components

| Symbol                          | Signature                                                                                                                     | Description                                                                    |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `Form`                          | `Form(props: FormProps): object`                                                                                              | Render a managed form element with submission and CSRF hidden inputs.          |
| `FormRegion`                    | `FormRegion(props: FormRegionProps): object`                                                                                  | Render a Fresh partial boundary for form-driven updates.                       |
| `applyCollectionStrategy`       | `applyCollectionStrategy(props: TProps, strategy)`                                                                            | Apply collection update navigation metadata to intent button props.            |
| `applyIntentOperation`          | `applyIntentOperation(intent, values: TValues): TValues`                                                                      | Apply a collection intent to the submitted values.                             |
| `buildPaginationState`          | `buildPaginationState(searchParams: URLSearchParams, total: number, hasMore: boolean, defaultLimit: number): PaginationState` | Build a complete pagination state from URLSearchParams and query results.      |
| `collectionIntent`              | `collectionIntent(action, name: string, _): string`                                                                           | Serialize a collection intent into the native field value shape.               |
| `createEmptyFormErrors`         | `createEmptyFormErrors(): FormErrors`                                                                                         | Create an empty form error map.                                                |
| `createFormEnhancementSnapshot` | `createFormEnhancementSnapshot(state: RuntimeFormState): FormEnhancementSnapshot`                                             | Create a serializable client enhancement snapshot from runtime form state.     |
| `createStandardSchemaAdapter`   | `createStandardSchemaAdapter(schema: TSchema): FormSchemaAdapter`                                                             | Create a form schema adapter from any Standard Schema v1 compatible schema.    |
| `firstFieldError`               | `firstFieldError(errors: FormErrors, field: Extract)`                                                                         | Return the first error message for a field, if present.                        |
| `formDataToRawValues`           | `formDataToRawValues(formData: FormData): Record`                                                                             | Parse a `FormData` instance into a nested object.                              |
| `generateCsrfToken`             | `generateCsrfToken(): string`                                                                                                 | Generate a new CSRF token for a rendered form.                                 |
| `generateSubmissionId`          | `generateSubmissionId(): string`                                                                                              | Create a new form submission identifier.                                       |
| `getSubmissionHiddenInputProps` | `getSubmissionHiddenInputProps(submissionId: string)`                                                                         | Return the hidden input props for carrying an idempotent submission id.        |
| `normalizeFormValues`           | `normalizeFormValues(rawValues: Record): Partial`                                                                             | Normalize raw form values by converting empty strings to `undefined`.          |
| `parseFormIntent`               | `parseFormIntent(rawValues: Record)`                                                                                          | Parse an encoded form intent from raw posted values.                           |
| `readCsrfToken`                 | `readCsrfToken(request: Request)`                                                                                             | Read the current CSRF token from a request cookie header.                      |
| `resolveFormState`              | `resolveFormState(data: unknown, _): FormState`                                                                               | Resolve form state from route handler data.                                    |
| `resolvePagination`             | `resolvePagination(searchParams: URLSearchParams, defaultLimit: number): PaginationInput`                                     | Resolve pagination input from URLSearchParams.                                 |
| `setCsrfCookie`                 | `setCsrfCookie(headers: Headers, token: string, requestUrl?: URL): void`                                                      | Set the CSRF cookie on response headers.                                       |
| `submitIntent`                  | `submitIntent(_): string`                                                                                                     | Serialize a submit intent into the native field value shape.                   |
| `toFormErrors`                  | `toFormErrors(error: FormSchemaValidationError): FormErrors`                                                                  | Convert a Zod-like validation error into the canonical `FormErrors<T>` shape.  |
| `useFormEnhancement`            | `useFormEnhancement(snapshot: FormEnhancementSnapshot, _): FormEnhancementState`                                              | Manage progressive form enhancement state and client-side validation handlers. |
| `verifyCsrfToken`               | `verifyCsrfToken(cookieToken, formToken): boolean`                                                                            | Verify that the submitted token matches the cookie token.                      |

### Constants

| Symbol                     | Type                | Description                                                                 |
| -------------------------- | ------------------- | --------------------------------------------------------------------------- |
| `CSRF_COOKIE_NAME`         | `ns_form_csrf`      | Cookie used to persist the current CSRF token between GET and POST.         |
| `CSRF_FIELD_NAME`          | `__csrf__`          | Hidden input field used to submit the CSRF token with the form payload.     |
| `INTENT_FIELD_NAME`        | `__intent__`        | Field name reserved for encoded form intents.                               |
| `SUBMISSION_ID_FIELD_NAME` | `__submission_id__` | Hidden field used to round-trip a submission identifier through form POSTs. |

### Types

| Symbol                         | Kind      | Description                                                                |
| ------------------------------ | --------- | -------------------------------------------------------------------------- |
| `CollectionDescriptor`         | interface | Descriptor for a collection field and its item intent buttons.             |
| `CollectionItem`               | interface | Descriptor for one item in a collection field.                             |
| `CollectionKeyInputProps`      | interface | Props for a hidden collection-key input.                                   |
| `CollectionKeyMap`             | typeAlias | Stable collection item keys by collection field path.                      |
| `ControlProps`                 | interface | Props applied to an input, select, textarea, or compatible control.        |
| `DescriptionProps`             | interface | Props applied to a field description element.                              |
| `EnhancedFormProps`            | interface | Form element props after progressive enhancement handlers are attached.    |
| `ErrorFormReplyInit`           | interface | Input used to construct an errored form reply.                             |
| `ErrorProps`                   | interface | Props applied to a field error element.                                    |
| `FieldConstraints`             | interface | HTML constraint attributes derived from a schema field.                    |
| `FieldDescriptor`              | interface | Descriptor for one form field and its generated props.                     |
| `FieldDescriptorMap`           | typeAlias | Field descriptors keyed by form value path.                                |
| `FormCollectionStrategy`       | interface | Client/server ownership policy for a collection field.                     |
| `FormCollectionStrategyMode`   | typeAlias | Progressive enhancement strategy for collection fields.                    |
| `FormContent`                  | typeAlias | Renderable content accepted by form helper components.                     |
| `FormCsrfInputProps`           | interface | Props for the hidden CSRF token input.                                     |
| `FormElementProps`             | interface | Props applied to the root form element.                                    |
| `FormEnhancementOptions`       | interface | Options used to progressively enhance a rendered form.                     |
| `FormEnhancementSnapshot`      | interface | Snapshot consumed by progressive enhancement code for one form.            |
| `FormEnhancementState`         | interface | Runtime state returned by the progressive form enhancement hook.           |
| `FormErrorMessages`            | typeAlias | Ordered validation messages for a field or form.                           |
| `FormErrors`                   | typeAlias | Field-level error map produced by validation or error normalization.       |
| `FormFieldErrors`              | typeAlias | Canonical field and form error map for submitted values.                   |
| `FormFieldPath`                | typeAlias | Dot-path name for a field in nested form values.                           |
| `FormIntent`                   | interface | Structured representation of an encoded form intent.                       |
| `FormIntentResult`             | interface | Result returned after applying an encoded form intent.                     |
| `FormPageInvalidateContext`    | interface | Invalidation context passed to app-owned cache invalidators after a        |
| `FormPageMode`                 | typeAlias | Mode used by page-owned create/edit forms in the playground consumer.      |
| `FormPageProps`                | interface | Transitional page-form props still consumed by the playground routes while |
| `FormProps`                    | interface | Props accepted by the managed form component.                              |
| `FormRegionProps`              | interface | Props accepted by the form partial-region helper.                          |
| `FormReplyHelpers`             | interface | Factory helpers for constructing typed form submission results.            |
| `FormReplyInit`                | interface | Base input used to construct a form reply state.                           |
| `FormSchemaAdapter`            | interface | Validation boundary abstraction for forms.                                 |
| `FormSchemaParseFailure`       | interface | Failed schema parse result normalized for the form runtime.                |
| `FormSchemaParseResult`        | typeAlias | Adapter-safe parse result used by the canonical form runtime.              |
| `FormSchemaParseSuccess`       | interface | Successful schema parse result.                                            |
| `FormSchemaValidationError`    | interface | Minimal contract for a validation error that can be flattened into         |
| `FormState`                    | interface | Lightweight form state used by the currently shipped helper surface.       |
| `FormStateLike`                | typeAlias | Server or client snapshot state accepted by the managed form component.    |
| `FormSubmissionErrorResult`    | interface | Errored form submission state.                                             |
| `FormSubmissionInitialResult`  | interface | Initial form submission state.                                             |
| `FormSubmissionInvalidResult`  | interface | Invalid form submission state.                                             |
| `FormSubmissionRedirectResult` | interface | Redirect form submission state.                                            |
| `FormSubmissionResult`         | typeAlias | Union of all form submission result states.                                |
| `FormSubmissionSuccessResult`  | interface | Successful form submission state.                                          |
| `FormValues`                   | typeAlias | Generic constraint for form value objects.                                 |
| `IntentButtonProps`            | interface | Props for an intent submit button generated by a form field helper.        |
| `InvalidFormReplyInit`         | interface | Input used to construct an invalid form reply.                             |
| `LabelProps`                   | interface | Props applied to a field label.                                            |
| `PaginationInput`              | interface | Parsed pagination input derived from URLSearchParams.                      |
| `PaginationState`              | interface | Full pagination state including total count and original search params.    |
| `RedirectFormReplyInit`        | interface | Input used to construct a redirect form reply.                             |
| `RuntimeFormState`             | interface | Runtime state passed to a form layer component.                            |
| `SchemaIntrospector`           | interface | Vendor-specific schema metadata extractor.                                 |
| `StandardSchemaInput`          | typeAlias | Infer the input value type from a Standard Schema.                         |
| `StandardSchemaIssue`          | interface | Validation issue reported by a Standard Schema compatible library.         |
| `StandardSchemaOutput`         | typeAlias | Infer the output value type from a Standard Schema.                        |
| `StandardSchemaPathSegment`    | typeAlias | Path segment shape accepted by Standard Schema issues.                     |
| `StandardSchemaResult`         | typeAlias | Validation result returned by a Standard Schema compatible schema.         |
| `StandardSchemaV1`             | interface | Structural Standard Schema v1 contract consumed by the form adapter.       |
| `SuccessFormReplyInit`         | interface | Input used to construct a successful form reply.                           |

## `@netscript/fresh/error`

Explicit error-handling surface: normalized error payloads, loader fallbacks, and error display
components.

### Functions and components

| Symbol                      | Signature                                                     | Description                                                                      |
| --------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `ErrorDisplay`              | `ErrorDisplay(props: ErrorDisplayProps): ErrorDisplayContent` | Render normalized Fresh error data with an overridable presentation slot.        |
| `InlineError`               | `InlineError(props): ErrorDisplayContent`                     | Render normalized Fresh error data in a compact inline layout.                   |
| `classifyErrorType`         | `classifyErrorType(status: number): ErrorType`                | Classify an HTTP status code into the Fresh error taxonomy.                      |
| `errorHandler`              | `errorHandler(loader, fallback: T)`                           | Wrap a loader and return fallback data when it throws.                           |
| `extractData`               | `extractData(result: LoaderResult): T`                        | Extract success data after the caller has checked `hasError()`.                  |
| `extractDataWithFallback`   | `extractDataWithFallback(result: LoaderResult): T`            | Extract fallback data from an errored loader result.                             |
| `extractErrorData`          | `extractErrorData(error: unknown): ErrorData`                 | Extract a normalized Fresh error payload from any thrown value.                  |
| `extractErrorWithFallback`  | `extractErrorWithFallback(result: LoaderResult)`              | Extract normalized error data and fallback data from an errored loader result.   |
| `getDefaultMessage`         | `getDefaultMessage(status: number): string`                   | Return the default user-facing message for a known HTTP status code.             |
| `hasError`                  | `hasError(result: LoaderResult): result is`                   | Return whether a loader result contains normalized error data and fallback data. |
| `isRetryable`               | `isRetryable(status: number, type: ErrorType): boolean`       | Return whether a status and type combination should offer retry affordances.     |
| `safeParseData`             | `safeParseData(result: LoaderResult)`                         | Return success data or `null` when the loader result contains an error.          |
| `safeParseDataWithFallback` | `safeParseDataWithFallback(result: LoaderResult): T`          | Return success data or fallback data from a loader result.                       |

### Types

| Symbol                | Kind      | Description                                                                   |
| --------------------- | --------- | ----------------------------------------------------------------------------- |
| `ErrorData`           | interface | Normalized error payload for loaders, handlers, and error displays.           |
| `ErrorDisplayContent` | typeAlias | Renderable content accepted and returned by Fresh error display helpers.      |
| `ErrorDisplayProps`   | interface | Props accepted by the default Fresh error display component.                  |
| `ErrorPrimitives`     | interface | Shared error-display payload used by package-owned and app-owned error views. |
| `ErrorType`           | typeAlias | HTTP-derived error category used by Fresh error rendering helpers.            |
| `LoaderResult`        | typeAlias | Loader result returned by `errorHandler()`.                                   |

## `@netscript/fresh/streams`

Client SDK for end-to-end durable streams backed by a TanStack DB StreamDB.

### Functions and components

| Symbol                    | Signature                                                                                        | Description                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `createNetScriptStreamDB` | `createNetScriptStreamDB(options: NetScriptStreamDBOptions): NetScriptStreamDB`                  | Create a NetScript-configured TanStack DB-backed StreamDB.                         |
| `useLiveQuery`            | `useLiveQuery(queryFactory: NetScriptLiveQueryFactory, deps?): NetScriptLiveQueryResult`         | Run a TanStack DB live query through the NetScript Fresh streams surface.          |
| `useLiveSuspenseQuery`    | `useLiveSuspenseQuery(queryFactory: NetScriptLiveQueryFactory, deps?): NetScriptLiveQueryResult` | Run a TanStack DB suspense live query through the NetScript Fresh streams surface. |

### Types

| Symbol                           | Kind      | Description                                                        |
| -------------------------------- | --------- | ------------------------------------------------------------------ |
| `NetScriptLiveQueryFactory`      | typeAlias | Function that builds a live query from the upstream query builder. |
| `NetScriptLiveQueryResult`       | interface | Result returned by NetScript live-query wrappers.                  |
| `NetScriptStateSchema`           | typeAlias | NetScript-owned state schema accepted by the stream DB factory.    |
| `NetScriptStreamDB`              | interface | NetScript-owned stream database handle returned by the factory.    |
| `NetScriptStreamDBFactory`       | typeAlias | Factory port used to create a durable stream DB handle.            |
| `NetScriptStreamDBFactoryInput`  | interface | Input passed to the underlying stream DB factory port.             |
| `NetScriptStreamDBOptions`       | interface | Options for `createNetScriptStreamDB`.                             |
| `NetScriptStreamStateDefinition` | typeAlias | NetScript-owned durable stream state definition.                   |

## `@netscript/fresh/query`

TanStack Query hooks and hydration helpers scoped to Fresh islands.

### Functions and components

| Symbol                           | Signature                                                                                        | Description                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `HydrationBoundary`              | `HydrationBoundary(props: HydrationBoundaryProps): object`                                       | Hydrate the island QueryClient from direct state or a JSON script tag.                     |
| `QueryHydrationScript`           | `QueryHydrationScript(props: QueryHydrationScriptProps): object`                                 | Render a JSON script tag containing dehydrated query state.                                |
| `QueryIsland`                    | `QueryIsland(props: QueryIslandProps): object`                                                   | Island-level TanStack Query provider.                                                      |
| `dehydrateQueryClient`           | `dehydrateQueryClient(queryClient: IslandQueryClient): DehydratedState`                          | Dehydrate a QueryClient into a serializable state object.                                  |
| `getIslandQueryClient`           | `getIslandQueryClient(): IslandQueryClient`                                                      | Get (or create) the shared island `QueryClient`.                                           |
| `hydrateFromDehydrated`          | `hydrateFromDehydrated(queryClient: IslandQueryClient, dehydratedState: DehydratedState): void`  | Hydrate a client-side QueryClient from a server-dehydrated state.                          |
| `resetIslandQueryClient`         | `resetIslandQueryClient(): void`                                                                 | Reset the island QueryClient singleton.                                                    |
| `useInfiniteQuery`               | `useInfiniteQuery(options: IslandInfiniteQueryOptions): IslandInfiniteQueryResult`               | Run an island infinite query through the canonical NetScript Fresh query surface.          |
| `useIsFetching`                  | `useIsFetching(filters?: IslandQueryFilters): number`                                            | Count active island queries matching the optional filters.                                 |
| `useIsMutating`                  | `useIsMutating(filters?: IslandQueryFilters): number`                                            | Count active island mutations matching the optional filters.                               |
| `useIslandInfiniteQuery`         | `useIslandInfiniteQuery(options: IslandInfiniteQueryOptions): IslandInfiniteQueryResult`         | Run an island infinite query through the shared NetScript Fresh QueryClient.               |
| `useIslandMutation`              | `useIslandMutation(options: IslandMutationOptions): IslandMutationResult`                        | Run an island mutation through the shared NetScript Fresh QueryClient.                     |
| `useIslandQuery`                 | `useIslandQuery(options: IslandQueryOptions): IslandQueryResult`                                 | Run an island query through the shared NetScript Fresh QueryClient.                        |
| `useIslandSuspenseInfiniteQuery` | `useIslandSuspenseInfiniteQuery(options: IslandInfiniteQueryOptions): IslandInfiniteQueryResult` | Run a suspense island infinite query through the shared NetScript Fresh QueryClient.       |
| `useIslandSuspenseQuery`         | `useIslandSuspenseQuery(options: IslandQueryOptions): IslandSuspenseQueryResult`                 | Run a suspense island query through the shared NetScript Fresh QueryClient.                |
| `useLiveQuery`                   | `useLiveQuery(queryFactory: IslandLiveQueryFactory, deps?): IslandLiveQueryResult`               | Run an island live query through the NetScript Fresh query surface.                        |
| `useLiveSuspenseQuery`           | `useLiveSuspenseQuery(queryFactory: IslandLiveQueryFactory, deps?): IslandLiveQueryResult`       | Run an island suspense live query through the NetScript Fresh query surface.               |
| `useMutation`                    | `useMutation(options: IslandMutationOptions): IslandMutationResult`                              | Run an island mutation through the canonical NetScript Fresh query surface.                |
| `useQuery`                       | `useQuery(options: IslandQueryOptions): IslandQueryResult`                                       | Run an island query through the canonical NetScript Fresh query surface.                   |
| `useQueryClient`                 | `useQueryClient(): IslandQueryClient`                                                            | Return the active island QueryClient handle.                                               |
| `useSuspenseInfiniteQuery`       | `useSuspenseInfiniteQuery(options: IslandInfiniteQueryOptions): IslandInfiniteQueryResult`       | Run an island suspense infinite query through the canonical NetScript Fresh query surface. |
| `useSuspenseQuery`               | `useSuspenseQuery(options: IslandQueryOptions): IslandSuspenseQueryResult`                       | Run an island suspense query through the canonical NetScript Fresh query surface.          |

### Constants

| Symbol                              | Type                        | Description                                                  |
| ----------------------------------- | --------------------------- | ------------------------------------------------------------ |
| `DEFAULT_QUERY_HYDRATION_SCRIPT_ID` | `__netscript_query_state__` | Default script id used for serialized NetScript query state. |

### Types

| Symbol                       | Kind      | Description                                                        |
| ---------------------------- | --------- | ------------------------------------------------------------------ |
| `DehydratedState`            | interface | State produced by server-side query dehydration.                   |
| `HydrationBoundaryProps`     | interface | Props for `HydrationBoundary`.                                     |
| `InitialDataFor`             | typeAlias | Extract initial data from a query-options object.                  |
| `IslandInfiniteQueryOptions` | interface | Options accepted by `useIslandInfiniteQuery`.                      |
| `IslandInfiniteQueryResult`  | interface | Result of an island infinite query hook call.                      |
| `IslandLiveQueryFactory`     | typeAlias | Function that builds a live query from the upstream query builder. |
| `IslandLiveQueryResult`      | interface | Result returned by NetScript live-query wrappers.                  |
| `IslandMutationOptions`      | interface | Options accepted by `useIslandMutation`.                           |
| `IslandMutationResult`       | interface | Result of an island mutation hook call.                            |
| `IslandQueryClient`          | interface | Client handle returned by the island query-client factory.         |
| `IslandQueryFilters`         | interface | Filters accepted by query/mutation activity counters.              |
| `IslandQueryOptions`         | interface | Options accepted by `useIslandQuery`.                              |
| `IslandQueryResult`          | interface | Result of an island query hook call.                               |
| `IslandSuspenseQueryResult`  | interface | Result of a suspense island query hook call.                       |
| `LoaderData`                 | typeAlias | Resolve the awaited return value from a Fresh route loader.        |
| `QueryHydrationScriptProps`  | interface | Props for `QueryHydrationScript`.                                  |
| `QueryIslandChildren`        | typeAlias | Renderable children accepted by the query island provider.         |
| `QueryIslandProps`           | interface | Props for the `QueryIsland` wrapper.                               |
| `QueryJsonValue`             | typeAlias | JSON-compatible value accepted by island query hydration helpers.  |
| `QueryKey`                   | typeAlias | Stable query key shape used by NetScript Fresh query wrappers.     |

## `@netscript/fresh/interactive`

Browser-facing interactive helpers using the Suspense throw-promise protocol.

### Functions and components

| Symbol            | Signature                            | Description                                                      |
| ----------------- | ------------------------------------ | ---------------------------------------------------------------- |
| `resolvedPromise` | `resolvedPromise(value: T): Promise` | Create a promise already primed as fulfilled for `usePromise()`. |
| `usePromise`      | `usePromise(promise: Promise): T`    | Read a promise using the Suspense throw-promise protocol.        |

## `@netscript/fresh/vite`

The NetScript Fresh Vite plugin for aliases, env mapping, and route manifest generation.

### Functions and components

| Symbol                      | Signature                                           | Description                                                                           |
| --------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `createNetScriptVitePlugin` | `createNetScriptVitePlugin(_): NetScriptVitePlugin` | Create the NetScript Fresh Vite plugin for aliases, env mapping, and route manifests. |

### Types

| Symbol                          | Kind      | Description                                                                   |
| ------------------------------- | --------- | ----------------------------------------------------------------------------- |
| `NetScriptRouteManifestOptions` | interface | Options controlling the NetScript route manifest generator.                   |
| `NetScriptViteAlias`            | interface | Resolved Vite alias entry generated or accepted by the NetScript Vite plugin. |
| `NetScriptViteEnvMapping`       | interface | Environment variable mapping injected into `import.meta.env`.                 |
| `NetScriptVitePlugin`           | interface | Package-owned view of the Vite plugin hooks used by NetScript Fresh.          |
| `NetScriptVitePluginOptions`    | interface | Options accepted by the NetScript Fresh Vite plugin.                          |

## `@netscript/fresh/testing`

Testing fixtures: mock route contexts and defer policies for consumer tests.

### Functions and components

| Symbol                   | Signature                                     | Description                                                                |
| ------------------------ | --------------------------------------------- | -------------------------------------------------------------------------- |
| `createMockDeferPolicy`  | `createMockDeferPolicy(_)`                    | Create a defer policy fixture accepted by defer-region helpers.            |
| `createMockRouteContext` | `createMockRouteContext(_): MockRouteContext` | Create a minimal page context fixture for route, loader, and layout tests. |

### Types

| Symbol                    | Kind      | Description                                                      |
| ------------------------- | --------- | ---------------------------------------------------------------- |
| `MockDeferPolicyInput`    | interface | Mock defer policy override accepted by defer test fixtures.      |
| `MockDeferPolicyProfile`  | typeAlias | Mock defer policy profile names accepted by defer test fixtures. |
| `MockRouteContext`        | interface | Mock route context returned by `createMockRouteContext()`.       |
| `MockRouteContextOptions` | interface | Options used to construct a route context fixture.               |

---

Back to the [reference overview](/reference/).
