import { z } from 'zod';
import type { SdkConfig } from '../config-section-types.ts';

/**
 * SDK generation configuration schema.
 */
export const SdkConfigSchema: z.ZodType<SdkConfig | undefined> = z
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
