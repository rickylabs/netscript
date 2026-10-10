import { z } from 'zod';
import type { PluginManifestParser } from '../../domain/mod.ts';
import { CONTRIBUTION_IDENTITY_RULES } from '../domain/contribution-identity.ts';

/** Contribution keys come from the identity table; an unknown key is a parse failure. */
const ContributionsSchema = z.object(
  Object.fromEntries(
    Object.keys(CONTRIBUTION_IDENTITY_RULES).map((key) => [key, z.unknown().optional()]),
  ),
).strict();

/**
 * Zod schema for plugin manifests.
 *
 * Contribution keys are closed: a key the manifest model does not define is rejected.
 */
export const PluginManifestSchema: PluginManifestParser = z.object({
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
  contributions: ContributionsSchema,
  hooks: z.record(z.string(), z.unknown()).optional(),
  dependencies: z.record(
    z.string(),
    z.object({
      name: z.string().min(1),
      version: z.string().min(1),
    }).passthrough(),
  ).optional(),
}).strict();
