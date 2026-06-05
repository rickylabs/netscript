import { z } from 'zod';

/**
 * Aspire orchestration configuration schema.
 */
export const AspireConfigSchema: z.ZodType<any> = z
  .object({
    /** Path to AppHost project */
    appHost: z.string().default('./dotnet/AppHost'),
    /** Dashboard port */
    dashboardPort: z.number().default(18888),
  })
  .optional();
