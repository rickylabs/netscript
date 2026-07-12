/**
 * Shared oRPC error map fragment that every NetScript feature plugin contract
 * carries.
 *
 * The fragment reuses the canonical error data schemas published by
 * `@netscript/contracts` for `NOT_FOUND` and `VALIDATION_ERROR`, and adds the
 * `INTERNAL` server-error entry that plugin services need but that the shared
 * contract vocabulary does not yet expose. The object is shaped so it can be
 * spread directly into an `os.errors({...})` / contract `.errors(...)` call.
 *
 * @module
 */

import { z } from 'zod';
import { NotFoundErrorSchema, ValidationErrorSchema } from '@netscript/contracts';

/** Error data payload reported for unexpected internal failures. */
export interface InternalErrorData {
  /** Optional opaque trace identifier for correlating server logs. */
  readonly traceId?: string;
}

/**
 * oRPC data schema for the `INTERNAL` error.
 *
 * Declared here (not in `@netscript/contracts`) because the shared contract
 * vocabulary does not export an internal-error shape; the plugin base seam owns
 * it so every plugin reports unexpected failures identically.
 */
const internalErrorSchema: z.ZodType<InternalErrorData> = z.object({
  traceId: z.string().optional().describe('Opaque trace identifier for server-side correlation'),
});

/**
 * Single entry in an oRPC errors map: an HTTP status, a default human message,
 * and the data schema validated for the error payload.
 */
export interface BasePluginErrorDefinition {
  /** HTTP status code associated with the error. */
  readonly status: number;
  /** Default human-readable message for the error. */
  readonly message: string;
  /** Standard-schema describing the error `data` payload. */
  readonly data: PluginErrorDataSchema;
}

interface ParseSchema<TOutput> {
  parse(value: unknown): TOutput;
}

/** Package-owned Standard Schema surface used for oRPC error data. */
export interface PluginErrorDataSchema<TOutput = unknown> {
  /** Standard Schema metadata and validator consumed by oRPC. */
  readonly '~standard': {
    readonly version: 1;
    readonly vendor: string;
    validate(value: unknown):
      | { readonly value: TOutput }
      | { readonly issues: readonly { readonly message: string }[] }
      | Promise<
        | { readonly value: TOutput }
        | { readonly issues: readonly { readonly message: string }[] }
      >;
  };
}

function toStandardSchema<TOutput>(schema: ParseSchema<TOutput>): PluginErrorDataSchema<TOutput> {
  return {
    '~standard': {
      version: 1,
      vendor: '@netscript/plugin',
      validate(value: unknown) {
        try {
          return { value: schema.parse(value) };
        } catch (error: unknown) {
          return {
            issues: [{ message: error instanceof Error ? error.message : String(error) }],
          };
        }
      },
    },
  };
}

/**
 * The base oRPC errors-map fragment shared by every plugin contract.
 *
 * Spread this into a contract's error map so that `NOT_FOUND`,
 * `VALIDATION_ERROR`, and `INTERNAL` are reported with identical status codes,
 * messages, and payload shapes across all plugins.
 *
 * @example Apply to a plugin contract
 * ```ts
 * import { os } from '@orpc/server';
 * import { BASE_PLUGIN_ERRORS } from '@netscript/plugin/contract-base';
 *
 * const contract = os.errors({ ...BASE_PLUGIN_ERRORS });
 * ```
 */
export const BASE_PLUGIN_ERRORS: Readonly<{
  NOT_FOUND: BasePluginErrorDefinition;
  VALIDATION_ERROR: BasePluginErrorDefinition;
  INTERNAL: BasePluginErrorDefinition;
}> = Object.freeze({
  NOT_FOUND: {
    status: 404,
    message: 'Resource not found',
    data: toStandardSchema(NotFoundErrorSchema),
  },
  VALIDATION_ERROR: {
    status: 422,
    message: 'Validation failed',
    data: toStandardSchema(ValidationErrorSchema),
  },
  INTERNAL: {
    status: 500,
    message: 'Internal server error',
    data: internalErrorSchema,
  },
});

/** The literal error codes guaranteed by {@link BASE_PLUGIN_ERRORS}. */
export type BasePluginErrorCode = keyof typeof BASE_PLUGIN_ERRORS;
