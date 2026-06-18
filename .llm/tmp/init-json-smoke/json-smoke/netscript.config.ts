import { defineConfig } from '@netscript/config';

export default defineConfig({
  name: 'json-smoke',
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
