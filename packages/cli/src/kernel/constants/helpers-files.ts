/**
 * File names generated into the `.helpers/` directory.
 */
export const HELPERS_FILES = {
  INDEX: 'index.mts',
  CONFIG_SCHEMA: 'config-schema.mts',
  REGISTER_INFRASTRUCTURE: 'register-infrastructure.mts',
  REGISTER_SERVICES: 'register-services.mts',
  REGISTER_PLUGINS: 'register-plugins.mts',
  REGISTER_BACKGROUND: 'register-background.mts',
  REGISTER_APPS: 'register-apps.mts',
  REGISTER_TOOLS: 'register-tools.mts',
  DB_CLI_MODE: 'db-cli-mode.mts',
  CONFIGURE_DASHBOARD: 'configure-dashboard.mts',
} as const;

export type HelpersFileKey = keyof typeof HELPERS_FILES;
