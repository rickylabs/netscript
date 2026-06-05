import { z } from 'zod';

/**
 * Database configuration schema.
 */
export const DatabaseConfigSchema = z.object({
  /** Optional name to identify this database (e.g., 'netscript', 'mdb') */
  name: z.string().optional(),
  /** Database provider type */
  provider: z.enum(['postgresql', 'postgres', 'mysql', 'sqlite', 'mssql', 'sqlserver']),
  /** Connection URL (can be env:VAR_NAME reference) */
  url: z.string().optional(),
  /** Path to schema directory */
  schema: z.string(),
  /** Path to generated output directory */
  output: z.string().optional(),
  /** Zod schema generator configuration */
  zodGenerator: z
    .object({
      output: z.string(),
      mode: z.enum(['minimal', 'full']).default('full'),
    })
    .optional(),
});
