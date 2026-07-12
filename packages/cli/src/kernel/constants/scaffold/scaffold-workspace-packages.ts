export const SCAFFOLD_WORKSPACE_PACKAGES = [
  'ai',
  'aspire',
  'cli',
  'config',
  'cron',
  'database',
  'fresh',
  'fresh-ui',
  'kv',
  'logger',
  'mcp',
  'plugin',
  'plugin-ai-core',
  'plugin-auth-core',
  'auth-workos',
  'auth-better-auth',
  'auth-kv-oauth',
  'plugin-sagas-core',
  'queue',
  'runtime-config',
  'sdk',
  'service',
  'contracts',
  'plugin-workers-core',
  'plugin-streams-core',
  'plugin-triggers-core',
  'telemetry',
  'watchers',
] as const;

export const SCAFFOLD_ENGINE_WORKSPACE_PACKAGES: Readonly<Record<string, readonly string[]>> = {
  mysql: ['prisma-adapter-mysql'],
} as const;

export type ScaffoldLocalPackage = (typeof SCAFFOLD_WORKSPACE_PACKAGES)[number];
