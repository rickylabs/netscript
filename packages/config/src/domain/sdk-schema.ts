import { z } from 'zod';

/**
 * SDK generation configuration schema.
 */
export const SdkConfigSchema: z.ZodType<any> = z
  .object({
    /** TypeScript SDK configuration */
    typescript: z
      .object({
        enabled: z.boolean().default(false),
        output: z.string().default('sdk/typescript'),
      })
      .optional(),
    /** .NET SDK configuration */
    dotnet: z
      .object({
        enabled: z.boolean().default(false),
        output: z.string().default('sdk/dotnet'),
      })
      .optional(),
  })
  .optional();

// ============================================================================
// TRIGGERS CONFIGURATION
// ============================================================================
