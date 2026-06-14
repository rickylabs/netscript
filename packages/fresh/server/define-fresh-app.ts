import { App, type FreshConfig, type Middleware, staticFiles } from 'fresh';
// Server-only: register the KV-backed cache provider so that SDK
// query-factory and composite-query cache methods work automatically.
// This import is safe here because defineFreshApp is never bundled for
// the client environment.
import '@netscript/sdk/cache';

/**
 * Contract for NetScript-managed Fresh app bootstrap.
 */
export interface DefineFreshAppOptions<State> {
  /**
   * Stable app identifier reserved for future logger/telemetry defaults.
   */
  name?: string;
  /**
   * Reuse an existing Fresh app instance instead of constructing a new one.
   */
  app?: App<State>;
  /**
   * Fresh app constructor configuration.
   */
  freshConfig?: FreshConfig;
  /**
   * Enable Fresh static file serving. Defaults to true.
   */
  serveStaticFiles?: boolean;
  /**
   * App-level middleware registered before file-system routes.
   */
  middleware?: Middleware<State>[];
  /**
   * Final bootstrap customization hook for advanced app setup.
   */
  configure?: (app: App<State>) => void;
  /**
   * Register Fresh file-system routes. Defaults to true and accepts an
   * optional mount pattern.
   */
  registerFsRoutes?: boolean | string;
}

/**
 * Create a NetScript-managed Fresh app with the baseline bootstrap defaults.
 *
 * This slice intentionally focuses on the app/runtime seam: static files,
 * middleware registration, optional configuration hooks, and file-system route
 * registration. Logger, OTEL, and richer runtime defaults land in later WI
 * slices on top of this stable contract.
 */
export function defineFreshApp<State>(options: DefineFreshAppOptions<State> = {}): App<State> {
  const app = options.app ?? new App<State>(options.freshConfig);

  if (options.serveStaticFiles !== false) {
    app.use(staticFiles());
  }

  if (options.middleware && options.middleware.length > 0) {
    app.use(...options.middleware);
  }

  options.configure?.(app);

  if (options.registerFsRoutes !== false) {
    if (typeof options.registerFsRoutes === 'string') {
      app.fsRoutes(options.registerFsRoutes);
    } else {
      app.fsRoutes();
    }
  }

  return app;
}
