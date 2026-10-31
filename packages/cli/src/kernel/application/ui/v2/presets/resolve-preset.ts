import { decodeUiPreset, type UiPreset, UiPresetSchema } from '../../../../domain/ui/ui-preset.ts';
import { parseUiRegistryJson, uiRegistryUrl } from '../../../../domain/ui/ui-config.ts';
import type { UiRegistryDependencies } from '../registry-client.ts';

/** Validated selection retains fetched bytes for application without a second request. */
export type ResolvedUiPreset =
  | { readonly kind: 'preset'; readonly preset: UiPreset }
  | { readonly kind: 'remote'; readonly url: string; readonly deps: UiRegistryDependencies };

const HTTP_LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/** Distinguish local share links from fetched preset JSON and portable registry items. */
export async function resolveUiPreset(
  input: string,
  deps: UiRegistryDependencies,
): Promise<ResolvedUiPreset> {
  if (!/^[a-z][a-z0-9+.-]*:/i.test(input)) return { kind: 'preset', preset: decodeUiPreset(input) };
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error('Invalid UI preset URL');
  }
  if (url.username || url.password) throw new Error('UI preset URLs cannot contain credentials');
  if (
    url.protocol !== 'https:' &&
    !(url.protocol === 'http:' && HTTP_LOOPBACK_HOSTS.has(url.hostname))
  ) {
    throw new Error(`UI preset URLs require HTTPS (HTTP is allowed only for loopback): ${input}`);
  }
  if (url.searchParams.has('preset')) {
    if (!url.searchParams.get('preset')) {
      throw new Error('UI share URL has an empty preset parameter');
    }
    return { kind: 'preset', preset: decodeUiPreset(input) };
  }
  const target = uiRegistryUrl(input);
  if (!deps.transport) throw new Error('Remote UI preset transport is not configured');
  let content: string;
  try {
    content = await deps.transport.read(target, {}, AbortSignal.timeout(30_000));
  } catch {
    throw new Error('Could not fetch UI preset URL; check the URL and HTTP access');
  }
  const payload = parseUiRegistryJson(content);
  if (payload && typeof payload === 'object' && 'version' in payload && !('type' in payload)) {
    const preset = UiPresetSchema.safeParse(payload);
    if (!preset.success) throw new Error(`Invalid UI preset JSON: ${preset.error.message}`);
    if (
      preset.data.theme &&
      !(await deps.tokenEngine?.defaults())?.presets.includes(preset.data.theme)
    ) {
      throw new Error('URL preset JSON theme must name a registered built-in token preset');
    }
    return { kind: 'preset', preset: preset.data };
  }
  const { validateRegistryItem } = await import('@netscript/fresh-ui/registry-v2');
  const item = validateRegistryItem(payload);
  if (!['registry:theme', 'registry:base'].includes(item.type)) {
    throw new Error('URL preset must be a registry:theme or registry:base item');
  }
  const transport = deps.transport;
  return {
    kind: 'remote',
    url: target,
    deps: {
      ...deps,
      transport: {
        read: (url, headers, signal) =>
          url === target ? Promise.resolve(content) : transport.read(url, headers, signal),
      },
    },
  };
}
