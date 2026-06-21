/**
 * OpenAPI primitives for API documentation generation.
 *
 * @example
 * ```typescript
 * import { createOpenAPISpec, createScalarDocs, createScalarJs } from '@netscript/service';
 *
 * app.get('/api/openapi.json', createOpenAPISpec(router, {
 *   title: 'Users API',
 *   version: '1.0.0',
 * }));
 *
 * app.get('/api/docs', createScalarDocs({ specUrl: '/api/openapi.json' }));
 * app.get('/api/docs/scalar.js', createScalarJs());
 * ```
 *
 * @module
 */

import { OpenAPIGenerator } from '@orpc/openapi';
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';
import type { ServiceHandler, ServiceRouter } from '../types.ts';
import { isOrpcRouter } from './orpc-router.ts';

const DEFAULT_OPENAPI_SERVER_URL = '/api';
const DEFAULT_SCALAR_TITLE = 'API Documentation';
const DEFAULT_SCALAR_THEME = 'kepler';
const SCALAR_JS_CACHE_CONTROL = 'public, max-age=31536000, immutable';
const scalarJsUrl = new URL('../../assets/scalar.min.js', import.meta.url);
let scalarJsCache: string | undefined;

/**
 * Configuration for OpenAPI spec generation.
 */
export interface OpenAPIConfig {
  /** API title */
  title: string;
  /** API version (e.g., '1.0.0') */
  version: string;
  /** API description */
  description?: string;
  /** Server URLs for the API */
  servers?: Array<{ url: string; description?: string }>;
}

/**
 * Configuration for Scalar docs UI.
 */
export interface ScalarDocsOptions {
  /** URL to the OpenAPI spec JSON */
  specUrl: string;
  /** Page title */
  title?: string;
  /** Scalar theme */
  theme?: 'default' | 'kepler' | 'moon' | 'purple' | 'saturn';
}

// Shared OpenAPI generator instance
const openApiGenerator = new OpenAPIGenerator({
  schemaConverters: [new ZodToJsonSchemaConverter()],
});

/**
 * Creates an OpenAPI specification endpoint handler.
 *
 * @example
 * ```typescript
 * app.get('/api/openapi.json', createOpenAPISpec(router, {
 *   title: 'Users API',
 *   version: '1.0.0',
 *   description: 'API for user management',
 * }));
 * ```
 */
export function createOpenAPISpec<T extends ServiceRouter>(
  router: T,
  config: OpenAPIConfig,
): ServiceHandler {
  return async (c): Promise<Response> => {
    if (!isOrpcRouter(router)) {
      return c.json({ error: 'INVALID_ROUTER', message: 'Service router is not an object' }, 500);
    }

    const spec = await openApiGenerator.generate(router, {
      info: {
        title: config.title,
        version: config.version,
        description: config.description,
      },
      servers: config.servers ?? [{ url: DEFAULT_OPENAPI_SERVER_URL }],
    });
    return c.json(spec);
  };
}

/**
 * Creates a Scalar API documentation UI handler.
 * Returns an HTML page with the Scalar UI that loads the OpenAPI spec.
 *
 * @example
 * ```typescript
 * app.get('/api/docs', createScalarDocs({
 *   specUrl: '/api/openapi.json',
 *   title: 'Users API',
 *   theme: 'kepler',
 * }));
 * ```
 */
export function createScalarDocs(options: ScalarDocsOptions): ServiceHandler {
  const {
    specUrl,
    title = DEFAULT_SCALAR_TITLE,
    theme = DEFAULT_SCALAR_THEME,
  } = options;

  return (c): Response => {
    // Serve Scalar UI with locally bundled JS (no CDN dependency)
    const html = `<!doctype html>
<html>
  <head>
    <title>${title}</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <div id="app"></div>
    <!-- Load the locally bundled Scalar JS -->
    <script src="/api/docs/scalar.js"></script>
    <script>
      Scalar.createApiReference('#app', {
        url: '${specUrl}',
        theme: '${theme}',
        layout: 'modern',
        darkMode: true,
      });
    </script>
  </body>
</html>`;

    return c.html(html);
  };
}

/**
 * Creates a handler to serve the bundled Scalar JS file.
 * This allows Scalar to work offline without CDN access.
 *
 * @example
 * ```typescript
 * app.get('/api/docs/scalar.js', createScalarJs());
 * ```
 */
export function createScalarJs(): ServiceHandler {
  return async (c): Promise<Response> => {
    const scalarJs = scalarJsCache ?? await Deno.readTextFile(scalarJsUrl);
    scalarJsCache = scalarJs;

    return c.body(scalarJs, 200, {
      'Content-Type': 'application/javascript',
      'Cache-Control': SCALAR_JS_CACHE_CONTROL,
    });
  };
}
