import { fresh } from '@fresh/plugin-vite';
import type { UserConfig } from 'vite';

const config: UserConfig = {
  root: import.meta.dirname,
  plugins: [fresh({ islandSpecifiers: ['./app.tsx'] })],
};

export default config;
