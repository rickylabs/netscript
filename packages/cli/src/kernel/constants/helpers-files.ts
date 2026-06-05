/**
 * File names generated into the `.helpers/` directory.
 */
export const HELPERS_FILES = {
  INDEX: 'index.ts',
  CONFIG_SCHEMA: 'config-schema.ts',
  REGISTER_INFRASTRUCTURE: 'register-infrastructure.ts',
  REGISTER_SERVICES: 'register-services.ts',
  REGISTER_PLUGINS: 'register-plugins.ts',
  REGISTER_BACKGROUND: 'register-background.ts',
  REGISTER_APPS: 'register-apps.ts',
  REGISTER_TOOLS: 'register-tools.ts',
  DB_CLI_MODE: 'db-cli-mode.ts',
  CONFIGURE_DASHBOARD: 'configure-dashboard.ts',
} as const;

export type HelpersFileKey = keyof typeof HELPERS_FILES;
