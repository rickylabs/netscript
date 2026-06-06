import { z } from 'zod';
import type { RuntimeConfigPathEntry, RuntimeConfigSection } from '../config-section-types.ts';

/**
 * Runtime schema generation/config output path entry.
 */
export const RuntimeConfigPathEntrySchema: z.ZodType<RuntimeConfigPathEntry> = z.object({
  /** Output JSON Schema path for a runtime topic */
  schemaPath: z.string(),
  /** Directory containing operator-managed runtime config files */
  configDir: z.string(),
});

/**
 * Runtime schema generation configuration.
 */
export const RuntimeConfigSectionSchema: z.ZodType<RuntimeConfigSection | undefined> = z
  .object({
    /** Per-topic schema/config path mapping used by runtime schema generation */
    paths: z.record(z.string(), RuntimeConfigPathEntrySchema).optional(),
  })
  .optional();
