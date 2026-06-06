import { z } from 'zod';
import type { PathsConfig } from '../config-section-types.ts';

/**
 * Project path conventions used by the CLI and generators.
 */
const DEFAULT_PATHS_CONFIG = {
  services: 'services',
  packages: 'packages',
  apps: 'apps',
  workers: 'workers',
  sagas: 'sagas',
  triggers: 'triggers',
  plugins: 'plugins',
  contracts: 'contracts',
  database: 'database',
  tasks: 'tasks',
  deploy: '.deploy/windows',
} as const;

export const PathsConfigSchema: z.ZodType<PathsConfig> = z
  .object({
    services: z.string().default(DEFAULT_PATHS_CONFIG.services),
    packages: z.string().default(DEFAULT_PATHS_CONFIG.packages),
    apps: z.string().default(DEFAULT_PATHS_CONFIG.apps),
    workers: z.string().default(DEFAULT_PATHS_CONFIG.workers),
    sagas: z.string().default(DEFAULT_PATHS_CONFIG.sagas),
    triggers: z.string().default(DEFAULT_PATHS_CONFIG.triggers),
    plugins: z.string().default(DEFAULT_PATHS_CONFIG.plugins),
    contracts: z.string().default(DEFAULT_PATHS_CONFIG.contracts),
    database: z.string().default(DEFAULT_PATHS_CONFIG.database),
    tasks: z.string().default(DEFAULT_PATHS_CONFIG.tasks),
    deploy: z.string().default(DEFAULT_PATHS_CONFIG.deploy),
  })
  .default(DEFAULT_PATHS_CONFIG);
