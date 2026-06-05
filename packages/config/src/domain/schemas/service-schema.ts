import { z } from 'zod';

/**
 * Service configuration schema.
 */
export const ServiceConfigSchema = z.object({
  /** Service runtime type */
  runtime: z.enum(['deno', 'node', 'dotnet']).default('deno'),
  /** Port to listen on */
  port: z.number(),
  /** Working directory relative to project root */
  workdir: z.string().optional(),
  /** Entrypoint file relative to workdir */
  entrypoint: z.string().optional(),
  /** Services this service depends on */
  dependsOn: z.array(z.string()).optional(),
});
