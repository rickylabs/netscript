/**
 * Zod Schema Generation Script
 *
 * Generic Zod schema generator that works with any Prisma database.
 * Generates Zod schemas from Prisma models and post-processes for Deno compatibility.
 *
 * Usage:
 *   import { generateZodSchemas } from '@netscript/database/scripts';
 *   await generateZodSchemas({ zodOutputDir: './schema/.generated/zod' });
 *
 * @module
 */

import { fixZodImports } from './fix-zod-imports.ts';

const PRISMA_ZOD_GENERATOR_ENTRYPOINT = 'npm:prisma-zod-generator@2.1.4/lib/generator.js';

export interface GenerateZodOptions {
  /** Path to the generated Zod output directory */
  zodOutputDir: string;
  /** Path to prisma.config.ts (relative to working directory) */
  configPath?: string;
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Generate Zod schemas from Prisma models
 *
 * @param options - Generation configuration
 * @returns Exit code from Prisma CLI (0 = success)
 */
export async function generateZodSchemas(options: GenerateZodOptions): Promise<number> {
  const { zodOutputDir, configPath = 'prisma.config.ts', verbose = true } = options;
  const log = verbose ? console.log.bind(console) : () => {};

  log('🔷 Generating Zod schemas from Prisma models...');
  log('');

  log('📦 Ensuring prisma-zod-generator is available...');
  const cache = new Deno.Command('deno', {
    args: ['cache', PRISMA_ZOD_GENERATOR_ENTRYPOINT],
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });

  const cacheResult = await cache.output();
  if (cacheResult.code !== 0) {
    return cacheResult.code;
  }

  // Run prisma generate which triggers all generators including zod
  const command = new Deno.Command('deno', {
    args: ['run', '-A', 'npm:prisma', 'generate', '--config', configPath],
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });

  const { code } = await command.output();

  if (code !== 0) {
    return code;
  }

  log('');

  // Post-process: fix imports for Deno
  await fixZodImports(zodOutputDir, { verbose });

  return 0;
}

/**
 * CLI runner for Zod generation
 * Exits with the command's exit code
 */
export async function generateZodSchemasCli(options: GenerateZodOptions): Promise<never> {
  const code = await generateZodSchemas(options);
  Deno.exit(code);
}
