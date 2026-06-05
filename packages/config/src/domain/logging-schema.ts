import { z } from 'zod';

/**
 * Logging configuration schema.
 */
export const LoggingConfigSchema: z.ZodType<any> = z
  .object({
    /** Minimum log level */
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    /** Output format */
    format: z.enum(['text', 'json']).default('text'),
    /** Include timestamps in output */
    timestamps: z.boolean().default(true),
    /** Enable colored output (text format only) */
    colors: z.boolean().optional(),
  })
  .optional();
