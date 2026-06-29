/**
 * @module @netscript/plugin/service
 *
 * Plugin service factory over `@netscript/service`.
 *
 * Connectors describe their service as data and call `.serve()`; the factory
 * applies the mandated builder chain so the order (and the context→rpc→health
 * invariant) cannot be expressed incorrectly.
 *
 * @example
 * ```ts
 * import { createPluginService } from '@netscript/plugin/service';
 *
 * const running = await createPluginService(router, { name: 'workers' }).serve({ port: 3000 });
 * await running.stop();
 * ```
 */

export {
  createPluginService,
  type PluginDatabaseConfig,
  type PluginServiceConfig,
} from './presentation/create-plugin-service.ts';

// Re-export the leaf `@netscript/service` contracts this surface names directly
// so the documented public API is self-complete for the JSR `private-type-ref`
// doc rule. `ServiceBuilder` is intentionally not re-exported here: it is the
// factory's return type and is documented by `@netscript/service` itself, and
// re-exposing it would drag that package's internal builder option types into
// this surface.
export type {
  ContextFactory,
  CorsOptions,
  DbContext,
  HealthCheck,
  ServiceConfig,
  ServiceMiddleware,
  ServiceRouter,
} from '@netscript/service';
