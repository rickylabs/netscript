/**
 * @module infra/templates/app/generate-vite-config
 *
 * Tier 1 generator for the Fresh app's `vite.config.ts`.
 *
 * Mirrors the playground Vite setup so scaffolded apps get the same
 * NetScript plugin wiring, alias entries, and workspace watch paths.
 */

import { TEMPLATE_KEYS } from '../../../assets/manifest.ts';
import { readTemplateAssetSync } from '../../templates/template-asset.ts';

/**
 * Options for generating the app-level `vite.config.ts`.
 */
export interface AppViteConfigOptions {
  /** App name reserved for future path-shape variations. */
  readonly appName: string;
}

/**
 * Generate the contents of `apps/{appName}/vite.config.ts`.
 *
 * The scaffolded app lives at `apps/{appName}`, so the workspace root is always
 * two directories above the file. The generated content intentionally mirrors
 * `apps/playground/vite.config.ts` line-for-line where possible.
 *
 * @param options - App-specific generation options.
 * @returns Rendered Vite config source with trailing newline.
 */
export function generateAppViteConfig({ appName: _appName }: AppViteConfigOptions): string {
  return readTemplateAssetSync(TEMPLATE_KEYS.appViteConfig);
}
