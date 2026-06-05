import { z } from 'zod';

/**
 * Runtime schema generation/config output path entry.
 */
export const RuntimeConfigPathEntrySchema: z.ZodType<any> = z.object({
  /** Output JSON Schema path for a runtime topic */
  schemaPath: z.string(),
  /** Directory containing operator-managed runtime config files */
  configDir: z.string(),
});

/**
 * Runtime schema generation configuration.
 */
export const RuntimeConfigSectionSchema: z.ZodType<any> = z
  .object({
    /** Per-topic schema/config path mapping used by runtime schema generation */
    paths: z.record(z.string(), RuntimeConfigPathEntrySchema).optional(),
  })
  .optional();
