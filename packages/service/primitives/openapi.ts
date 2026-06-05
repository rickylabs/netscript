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

import type { Context } from 'hono';
import { OpenAPIGenerator } from '@orpc/openapi';
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';

// Router type that matches oRPC router structure
// deno-lint-ignore no-explicit-any
type AnyRouter = Record<string, any>;

const scalarJsUrl = new URL('../assets/scalar.min.js', import.meta.url);
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
export function createOpenAPISpec<T extends AnyRouter>(router: T, config: OpenAPIConfig) {
  return async (c: Context): Promise<Response> => {
    const spec = await openApiGenerator.generate(router, {
      info: {
        title: config.title,
        version: config.version,
        description: config.description,
      },
      servers: config.servers ?? [{ url: '/api' }],
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
export function createScalarDocs(options: ScalarDocsOptions) {
  const { specUrl, title = 'API Documentation', theme = 'kepler' } = options;

  return (c: Context): Response => {
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
export function createScalarJs() {
  return async (c: Context): Promise<Response> => {
    const scalarJs = scalarJsCache ?? await Deno.readTextFile(scalarJsUrl);
    scalarJsCache = scalarJs;

    return c.body(scalarJs, 200, {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
  };
}
