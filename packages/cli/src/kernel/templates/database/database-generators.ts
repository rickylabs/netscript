/**
 * @module templates/database
 */

export { generateDatabaseDenoJson } from './generate-db-deno-json.ts';
export type { DatabaseDenoJsonOptions } from './generate-db-deno-json.ts';
export type { PackageSourceMode } from '../../domain/scaffold/scaffold-options.ts';
export { generateDatabaseFacadeMod } from './generate-db-mod.ts';
export { generateDatabaseSeed } from './generate-database-seed.ts';
export type { DatabaseSeedOptions } from './generate-database-seed.ts';
export { generateEngineMod } from './generate-engine-mod.ts';
export type { EngineModOptions } from './generate-engine-mod.ts';
export { generatePrismaConfig } from './generate-prisma-config.ts';
export type { PrismaConfigOptions } from './generate-prisma-config.ts';
