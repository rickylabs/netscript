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

/** Published plugin connectors that generated projects may install after scaffolding. */
export const SCAFFOLD_CONNECTOR_PACKAGES = [
  'plugin-ai',
  'plugin-auth',
  'plugin-sagas',
  'plugin-streams',
  'plugin-triggers',
  'plugin-workers',
] as const;

/** Complete NetScript release-train inventory used by generated JSR workspaces. */
export const SCAFFOLD_JSR_RELEASE_PACKAGES: readonly string[] = [
  ...SCAFFOLD_WORKSPACE_PACKAGES,
  ...Object.values(SCAFFOLD_ENGINE_WORKSPACE_PACKAGES).flat(),
  ...SCAFFOLD_CONNECTOR_PACKAGES,
];

export type ScaffoldLocalPackage = (typeof SCAFFOLD_WORKSPACE_PACKAGES)[number];
