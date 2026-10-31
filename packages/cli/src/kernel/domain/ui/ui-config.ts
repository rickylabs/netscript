import { z } from 'zod';

/** App-owned registry settings, separate from the DTCG token configuration. */
export const UI_CONFIG_FILE = 'components.json';
/** Install provenance and byte baselines for copied registry items. */
export const UI_LOCK_FILE = 'fresh-ui.lock.json';
/** Default component sources, shared by all token-only Utility presets. */
export const UI_DEFAULT_STYLE = 'style-utility';
/** Path aliases resolve to local directories inside the selected Fresh application. */
export const UI_DEFAULT_ALIASES = {
  components: 'components',
  ui: 'components/ui',
  lib: 'lib',
  hooks: 'hooks',
  assets: 'assets',
  islands: 'islands/ui',
} as const;

/** Accept only portable, relative paths without traversal or control characters. */
export function isUiRelativePath(path: string): boolean {
  return path.length > 0 && !/[\\:]/.test(path) &&
    [...path].every((part) => part.charCodeAt(0) >= 32) && !path.startsWith('/') &&
    path.split('/').every((part) => part !== '..' && part !== '' && part.toLowerCase() !== '.git');
}

const localPath = z.string().refine(isUiRelativePath, 'Registry paths must remain inside the app');
const HTTP_LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
const registryUrl = z.string().min(1).refine(
  (value) => {
    try {
      uiRegistryUrl(value.replaceAll('{name}', '__item__'));
      return true;
    } catch {
      return false;
    }
  },
  'Registry URLs require HTTPS or public GitHub sources without embedded credentials (HTTP is allowed only for loopback)',
);
/** A static item URL template or a source registry catalog, with unresolved header templates. */
export const UiRegistrySourceSchema = z.union([
  registryUrl,
  z.object({
    url: registryUrl,
    index: registryUrl.optional(),
    headers: z.record(z.string(), z.string()).default({}),
  }).strict(),
]);
/** Validate config before resolving any network requests or install destinations. */
export const UiConfigSchema = z.object({
  version: z.literal(1).default(1),
  style: z.string().min(1).default(UI_DEFAULT_STYLE),
  iconLibrary: z.string().min(1).default('lucide'),
  aliases: z.object({
    components: localPath.default(UI_DEFAULT_ALIASES.components),
    ui: localPath.default(UI_DEFAULT_ALIASES.ui),
    lib: localPath.default(UI_DEFAULT_ALIASES.lib),
    hooks: localPath.default(UI_DEFAULT_ALIASES.hooks),
    assets: localPath.default(UI_DEFAULT_ALIASES.assets),
    islands: localPath.default(UI_DEFAULT_ALIASES.islands),
  }).strict().default(UI_DEFAULT_ALIASES),
  registries: z.record(z.string().regex(/^@[a-zA-Z0-9][a-zA-Z0-9_.-]*$/), UiRegistrySourceSchema)
    .default({}),
}).strict();

/** Validated local application registry settings. */
export type UiConfig = z.infer<typeof UiConfigSchema>;
/** One configured namespace source, preserving environment placeholders. */
export type UiRegistrySource = z.infer<typeof UiRegistrySourceSchema>;

/** Normalize public GitHub sources and require HTTPS, except HTTP on exact loopback hosts. */
export function uiRegistryUrl(input: string): string {
  let value = input;
  if (value.startsWith('github:')) {
    const repository = value.slice('github:'.length);
    if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) {
      throw new Error('Invalid public GitHub registry reference');
    }
    value = `https://raw.githubusercontent.com/${repository}/HEAD/registry.json`;
  }
  const url = new URL(value);
  if (url.username || url.password || url.search || url.hash) {
    throw new Error('Registry credentials belong in environment-backed headers, not URLs');
  }
  if (
    url.protocol !== 'https:' &&
    !(url.protocol === 'http:' && HTTP_LOOPBACK_HOSTS.has(url.hostname))
  ) {
    throw new Error(`Registry URLs require HTTPS (HTTP is allowed only for loopback): ${input}`);
  }
  if (url.hostname === 'github.com') {
    const [owner, repo, marker, ref, ...path] = url.pathname.split('/').filter(Boolean);
    if (!owner || !repo || (marker && marker !== 'tree' && marker !== 'blob')) {
      throw new Error('Invalid public GitHub registry URL');
    }
    const source = path.length
      ? path.join('/') + (marker === 'tree' ? '/registry.json' : '')
      : 'registry.json';
    return `https://raw.githubusercontent.com/${owner}/${repo}/${ref ?? 'HEAD'}/${source}`;
  }
  return url.href;
}

/** Keep malformed metadata from reflecting authentication values in error diagnostics. */
export function parseUiRegistryJson(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    throw new Error('Registry metadata is not valid JSON');
  }
}
