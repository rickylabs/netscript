import { z } from 'zod';
import type { AspireConfig } from '../config-section-types.ts';

/**
 * Aspire orchestration configuration schema.
 */
export const AspireConfigSchema: z.ZodType<AspireConfig | undefined> = z
  .object({
    /** TypeScript AppHost entrypoint path. Defaults to the generated NetScript AppHost. */
    appHost: z.string().default('./aspire/apphost.mts'),
    /** Dashboard port */
    dashboardPort: z.number().default(18888),
  })
  .optional();
