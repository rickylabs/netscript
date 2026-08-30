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

import type { NetScriptProcedureMeta } from '@netscript/contracts';
import { type OpenAPI, OpenAPIGenerator } from '@orpc/openapi';
import { traverseContractProcedures } from '@orpc/server';
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';
import type { ServiceHandler, ServiceRouter } from '../types.ts';
import { isOrpcRouter, type OrpcRouter } from './orpc-router.ts';
import { SCALAR_MIN_JS } from './scalar.generated.ts';

const DEFAULT_OPENAPI_SERVER_URL = '/api';
const DEFAULT_SCALAR_TITLE = 'API Documentation';
const DEFAULT_SCALAR_THEME = 'kepler';
const SCALAR_JS_CACHE_CONTROL = 'public, max-age=31536000, immutable';
const BEARER_SECURITY_SCHEME = 'bearerAuth';
const OPENAPI_METHODS = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
] as const;

type ProcedureAccess = NonNullable<NetScriptProcedureMeta['access']>;
type NetScriptOpenAPIOperation = OpenAPI.OperationObject & {
  /** Roles are a NetScript extension because OpenAPI security schemes cannot express them. */
  'x-netscript-roles'?: readonly string[];
};

interface ProcedureAccessIndex {
  readonly byOperationId: ReadonlyMap<string, ProcedureAccess>;
  readonly byRoute: ReadonlyMap<string, ProcedureAccess>;
}

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

function routeKey(method: string, path: string): string {
  return `${method.toLowerCase()} ${path}`;
}

function indexProcedureAccess(router: OrpcRouter): ProcedureAccessIndex {
  const byOperationId = new Map<string, ProcedureAccess>();
  const byRoute = new Map<string, ProcedureAccess>();

  traverseContractProcedures({ router, path: [] }, ({ contract, path }) => {
    const meta: NetScriptProcedureMeta = contract['~orpc'].meta;
    const access = meta.access;
    if (!access?.authentication) {
      return;
    }

    const route = contract['~orpc'].route;
    const operationId = route.operationId ?? path.join('.');
    const operationPath = route.path ?? `/${path.join('/')}`;
    const operationMethod = route.method ?? 'POST';

    byOperationId.set(operationId, access);
    byRoute.set(routeKey(operationMethod, operationPath), access);
  });

  return { byOperationId, byRoute };
}

function projectProcedureAccess(
  spec: OpenAPI.Document,
  index: ProcedureAccessIndex,
): void {
  let needsBearerScheme = false;

  for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
    if (!pathItem) {
      continue;
    }

    for (const method of OPENAPI_METHODS) {
      const operation = pathItem[method] as NetScriptOpenAPIOperation | undefined;
      if (!operation) {
        continue;
      }

      const access =
        (operation.operationId ? index.byOperationId.get(operation.operationId) : undefined) ??
          index.byRoute.get(routeKey(method, path));
      if (!access) {
        continue;
      }

      switch (access.authentication) {
        case 'none':
          operation.security = [];
          break;
        case 'optional':
          operation.security = [{}, { [BEARER_SECURITY_SCHEME]: [] }];
          needsBearerScheme = true;
          break;
        case 'required': {
          operation.security = [{
            [BEARER_SECURITY_SCHEME]: [...(access.authorization?.scopes ?? [])],
          }];
          if (access.authorization?.roles) {
            operation['x-netscript-roles'] = [...access.authorization.roles];
          }
          needsBearerScheme = true;
          break;
        }
      }
    }
  }

  if (needsBearerScheme) {
    spec.components = {
      ...spec.components,
      securitySchemes: {
        ...spec.components?.securitySchemes,
        [BEARER_SECURITY_SCHEME]: spec.components?.securitySchemes?.[
          BEARER_SECURITY_SCHEME
        ] ?? { type: 'http', scheme: 'bearer' },
      },
    };
  }
}

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
    projectProcedureAccess(spec, indexProcedureAccess(router));
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
  return (c): Response => {
    return c.body(SCALAR_MIN_JS, 200, {
      'Content-Type': 'application/javascript',
      'Cache-Control': SCALAR_JS_CACHE_CONTROL,
    });
  };
}
