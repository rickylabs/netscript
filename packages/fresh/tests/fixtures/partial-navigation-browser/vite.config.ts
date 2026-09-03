import { fresh } from '@fresh/plugin-vite';
import type { UserConfig } from 'vite';

const config: UserConfig = {
  root: import.meta.dirname,
  plugins: [fresh()],
};

export default config;
