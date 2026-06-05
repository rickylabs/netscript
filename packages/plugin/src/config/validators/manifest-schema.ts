import { z } from 'zod';

/** Zod schema for plugin manifests. */
export const PluginManifestSchema: z.ZodType = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  description: z.string().optional(),
  displayName: z.string().optional(),
  type: z.enum(['background-processor', 'api', 'frontend', 'utility']).optional(),
  author: z.string().optional(),
  license: z.string().optional(),
  tags: z.array(z.string()).readonly().optional(),
  permissions: z.array(z.string()).readonly().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  contributions: z.record(z.string(), z.unknown()),
  hooks: z.record(z.string(), z.unknown()).optional(),
  dependencies: z.record(
    z.string(),
    z.object({
      name: z.string().min(1),
      version: z.string().min(1),
    }).passthrough(),
  ).optional(),
}).strict();
