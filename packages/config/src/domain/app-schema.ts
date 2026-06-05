import { z } from 'zod';

/**
 * Frontend/app configuration schema.
 */
export const AppConfigSchema: z.ZodType<any> = z.object({
  /** App runtime type */
  runtime: z.enum(['deno', 'node', 'tauri']).default('deno'),
  /** Port to listen on */
  port: z.number(),
  /** Working directory relative to project root */
  workdir: z.string().optional(),
  /** Entrypoint file relative to workdir */
  entrypoint: z.string().optional(),
  /** Explicit runtime permissions when needed */
  permissions: z.array(z.string()).optional(),
  /** Human-readable description */
  description: z.string().optional(),
});
