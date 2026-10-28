import { z } from 'zod';

/** Paths are relative to the selected Fresh application, never the workspace root. */
export const TOKEN_CONFIG_FILE = 'tokens.config.json';
export const TOKEN_SOURCE_DIR = 'tokens/source';
export const TOKEN_OVERRIDE_FILE = 'tokens/semantic.tokens.json';
export const TOKEN_ASSET_DIR = 'assets';
export const TOKEN_STATIC_DIR = 'static';
export const TOKEN_PREVIEW_PREFIX = 'presets/';
export const TOKEN_PRESET_FILE = 'theme-preset.json';
export const TOKEN_RESOLVER_FILE = 'tokens.resolver.json';
export const TOKEN_CONFIG_VERSION = 1;

/** Small CLI settings boundary; DTCG validation belongs to the token engine. */
export const TokenConfigSchema = z.object({
  version: z.literal(TOKEN_CONFIG_VERSION),
  preset: z.string().min(1),
  sourceRoot: z.string().min(1).optional(),
  override: z.string().min(1).optional(),
}).strict();

/** App-owned configuration created by `tokens init`. */
export type TokenConfig = z.infer<typeof TokenConfigSchema>;
