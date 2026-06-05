import { z } from 'zod';

/**
 * Permission flags schema for jobs and tasks.
 * Supports both simple boolean flags and granular string array patterns.
 * Aligned with the workers runtime permission object shape.
 */
export const PermissionsSchema = z
  .object({
    /** Allow network access (true = all, string[] = specific hosts) */
    net: z.union([z.boolean(), z.array(z.string())]).optional(),
    /** Allow file read access (true = all, string[] = specific paths) */
    read: z.union([z.boolean(), z.array(z.string())]).optional(),
    /** Allow file write access (true = all, string[] = specific paths) */
    write: z.union([z.boolean(), z.array(z.string())]).optional(),
    /** Allow environment variable access (true = all, string[] = specific vars) */
    env: z.union([z.boolean(), z.array(z.string())]).optional(),
    /** Allow subprocess execution (true = all, string[] = specific commands) */
    run: z.union([z.boolean(), z.array(z.string())]).optional(),
    /** Allow FFI (foreign function interface) */
    ffi: z.boolean().optional(),
    /** Allow dynamic imports from specific URLs */
    import: z.array(z.string()).optional(),
  })
  .optional();
