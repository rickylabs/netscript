/**
 * OpenAPI Helpers
 *
 * Utilities for generating OpenAPI specifications.
 *
 * @module
 */

import { OpenAPIGenerator } from '@orpc/openapi';
import { ZodToJsonSchemaConverter } from '@orpc/zod';

/**
 * Public OpenAPI document shape returned by the SDK.
 */
export type OpenAPIDocument = Record<string, unknown>;

/**
 * Minimal generator contract exposed by the SDK.
 */
export interface OpenAPIGeneratorLike {
  /**
   * Generate an OpenAPI document for a contract router.
   *
   * @param router - Contract router object.
   * @param document - Partial document definition.
   * @returns Generated OpenAPI document.
   */
  generate(router: object, document?: Record<string, unknown>): Promise<OpenAPIDocument>;
}

/**
 * Shared OpenAPI configuration contract used by higher-level packages.
 */
export interface OpenAPIConfig {
  /** API title. */
  title: string;
  /** API version string. */
  version: string;
  /** Optional API description. */
  description?: string;
  /** Optional server definitions. */
  servers?: Array<{ url: string; description?: string }>;
}

/**
 * Create an OpenAPI generator configured for Zod-backed oRPC contracts.
 *
 * @returns OpenAPI generator.
 */
export function createOpenAPIGenerator(): OpenAPIGeneratorLike {
  return new OpenAPIGenerator({
    schemaConverters: [
      new ZodToJsonSchemaConverter(),
    ],
  }) as OpenAPIGeneratorLike;
}

/**
 * Generate an OpenAPI document from a contract router.
 *
 * @param router - Contract router object.
 * @param generator - OpenAPI generator.
 * @param config - OpenAPI document metadata.
 * @returns Generated OpenAPI document.
 */
export async function generateOpenAPISpec(
  router: object,
  generator: OpenAPIGeneratorLike,
  config: OpenAPIConfig,
): Promise<OpenAPIDocument> {
  return await generator.generate(router, {
    info: {
      title: config.title,
      version: config.version,
      description: config.description,
    },
    servers: config.servers ?? [{ url: '/api' }],
  });
}
