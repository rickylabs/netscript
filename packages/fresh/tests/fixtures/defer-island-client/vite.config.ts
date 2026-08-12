import { fresh } from 'jsr:@fresh/plugin-vite@1.1.2';
import { resolve } from 'node:path';
import type { UserConfig } from 'vite';

const config: UserConfig = {
  root: import.meta.dirname,
  resolve: {
    alias: {
      '@opentelemetry/api': resolve(import.meta.dirname!, 'otel-api.ts'),
    },
  },
  plugins: [
    fresh({ islandSpecifiers: ['@netscript/fresh/defer/island'] }),
  ],
};

export default config;
