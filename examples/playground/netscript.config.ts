// TODO: When @netscript packages are published to JSR, this import will resolve.
// For local monorepo development, re-run with: netscript init workspace-source
import { defineConfig } from '@netscript/config';

export default defineConfig({
  name: 'playground',
  version: '1.0.0',
  paths: {
    services: 'services',
    apps: 'apps',
    contracts: 'contracts',
    plugins: 'plugins',
  },
  logging: {
    level: 'info',
    format: 'text',
  },
  aspire: {
    appHost: 'dotnet/AppHost',
  },
  databases: {
    config: [],
  },
  plugins: [],
  gateway: { enabled: false },
  sdk: {},
  deploy: {},
});
