import { z } from 'zod';
import type { GatewayConfig } from '../config-section-types.ts';

/**
 * Gateway configuration schema.
 */
export const GatewayConfigSchema: z.ZodType<GatewayConfig | undefined> = z
  .object({
    /** Whether gateway is enabled */
    enabled: z.boolean().default(true),
    /** Gateway port */
    port: z.number().default(8080),
  })
  .optional();
