import { z } from 'zod';

/**
 * Gateway configuration schema.
 */
export const GatewayConfigSchema: z.ZodType<any> = z
  .object({
    /** Whether gateway is enabled */
    enabled: z.boolean().default(true),
    /** Gateway port */
    port: z.number().default(8080),
  })
  .optional();
