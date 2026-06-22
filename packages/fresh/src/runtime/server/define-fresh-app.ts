import { App, type FreshConfig, type Middleware, staticFiles as freshStaticFiles } from 'fresh';
// Server-only: register the KV-backed cache provider so that SDK
// query-factory and composite-query cache methods work automatically.
// This import is safe here because defineFreshApp is never bundled for
// the client environment.
import '@netscript/sdk/cache';

/** Attribute value accepted by Fresh app telemetry bootstrap options. */
export type FreshAppTelemetryAttribute = string | number | boolean;

/** Backward-compatible telemetry bootstrap options for `defineFreshApp`. */
export interface FreshAppTelemetryOptions {
  /** Service name used by future Fresh app telemetry defaults. */
  serviceName?: string;
  /** Static attributes attached to future Fresh app bootstrap spans. */
  attributes?: Record<string, FreshAppTelemetryAttribute>;
}

/** Adapter callback that registers file-system routes on a Fresh app. */
export type FreshAppFsRoutes<State> = (app: App<State>, pattern?: string) => void;

/** Factory callback that constructs the Fresh app instance. */
export type FreshAppFactory<State> = (freshConfig?: FreshConfig) => App<State>;

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
   * Adapter seam for replacing Fresh app construction.
   */
  createApp?: FreshAppFactory<State>;
  /**
   * Adapter seam for static-file middleware. `false` disables static files.
   */
  staticFiles?: Middleware<State> | false;
  /**
   * App-level middleware registered before file-system routes.
   */
  middleware?: Middleware<State>[];
  /**
   * Lifecycle hook called before static files, middleware, and routes.
   */
  preConfigure?: (app: App<State>) => void;
  /**
   * Final bootstrap customization hook for advanced app setup.
   */
  configure?: (app: App<State>) => void;
  /**
   * Adapter seam for file-system route registration. `false` disables it; a
   * string mounts default file-system routes at that pattern.
   */
  fsRoutes?: FreshAppFsRoutes<State> | false | string;
  /**
   * Reserved telemetry bootstrap seam for NetScript Fresh adapters.
   */
  telemetry?: boolean | FreshAppTelemetryOptions;
}

/**
 * Create a NetScript-managed Fresh app with the baseline bootstrap defaults.
 *
 * This function keeps the default Fresh bootstrap unchanged while exposing
 * optional adapter seams for app construction, static middleware, lifecycle
 * setup, file-system routes, and future telemetry defaults.
 */
export function defineFreshApp<State>(options: DefineFreshAppOptions<State> = {}): App<State> {
  const app = options.app ?? options.createApp?.(options.freshConfig) ??
    new App<State>(options.freshConfig);

  options.preConfigure?.(app);

  if (shouldRegisterStaticFiles(options)) {
    const staticMiddleware = options.staticFiles === undefined
      ? freshStaticFiles()
      : options.staticFiles;
    app.use(staticMiddleware as never);
  }

  if (options.middleware && options.middleware.length > 0) {
    app.use(...options.middleware);
  }

  options.configure?.(app);
  registerFsRoutes(app, options);

  return app;
}

function shouldRegisterStaticFiles<State>(options: DefineFreshAppOptions<State>): boolean {
  return options.staticFiles !== false;
}

function registerFsRoutes<State>(app: App<State>, options: DefineFreshAppOptions<State>): void {
  if (options.fsRoutes === false) {
    return;
  }

  const pattern = typeof options.fsRoutes === 'string' ? options.fsRoutes : undefined;

  if (typeof options.fsRoutes === 'function') {
    options.fsRoutes(app, pattern);
    return;
  }

  if (pattern) {
    app.fsRoutes(pattern);
  } else {
    app.fsRoutes();
  }
}
