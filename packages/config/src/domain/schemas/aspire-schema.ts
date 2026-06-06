import { z } from 'zod';
import type { AspireConfig } from '../config-section-types.ts';

/**
 * Aspire orchestration configuration schema.
 */
export const AspireConfigSchema: z.ZodType<AspireConfig | undefined> = z
  .object({
    /** Path to AppHost project */
    appHost: z.string().default('./dotnet/AppHost'),
    /** Dashboard port */
    dashboardPort: z.number().default(18888),
  })
  .optional();
