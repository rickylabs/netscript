/**
 * @module
 *
 * JSON Schema generation from Zod schemas via `z.toJSONSchema()`.
 *
 * Generates a JSON Schema (draft-7) for `appsettings.json` that inherits
 * from the official ASP.NET Core schema. The Zod schemas in `config.ts`
 * are the single source of truth — this module produces the derived JSON
 * Schema used by editors for validation and autocompletion.
 *
 * @example
 * ```ts
 * import { generateAppSettingsJsonSchema } from '@netscript/aspire/schema';
 *
 * const schema = generateAppSettingsJsonSchema();
 * await Deno.writeTextFile('appsettings.schema.json', JSON.stringify(schema, null, 2));
 * ```
 */

import { z } from 'zod';
import { type AppSettings, AppSettingsSchema } from './config.ts';

/**
 * Generates a JSON Schema (draft-7) from the Zod `AppSettingsSchema`.
 *
 * The generated schema:
 * - Uses `z.toJSONSchema()` to convert Zod schemas to JSON Schema
 * - Targets `draft-7` for VS Code and JetBrains IDE support
 * - Wraps output with `allOf` referencing the official ASP.NET Core schema
 * - Propagates `.meta({ title, description })` annotations
 *
 * @returns A JSON Schema object suitable for writing to `appsettings.schema.json`
 */
export function generateAppSettingsJsonSchema(): Record<string, unknown> {
  const base = z.toJSONSchema(AppSettingsSchema as z.ZodType<AppSettings>, {
    target: 'draft-7',
  });

  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: 'netscript-appsettings',
    title: 'NetScript AppHost Configuration',
    description: 'Generated from @netscript/aspire Zod schemas. ' +
      'Extends the official ASP.NET Core appsettings schema.',
    allOf: [
      {
        $ref: 'https://json.schemastore.org/appsettings.json',
        description: 'Inherits Logging, Kestrel, AllowedHosts from ASP.NET Core.',
      },
      base,
    ],
  };
}
