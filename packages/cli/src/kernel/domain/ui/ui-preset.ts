import { z } from 'zod';

/** Versioned preset identifiers remain independent of token source and semantic overrides. */
export const UiPresetSchema = z.object({
  version: z.literal(1),
  theme: z.string().min(1).optional(),
  style: z.string().min(1).optional(),
  font: z.string().min(1).optional(),
  iconLibrary: z.string().min(1).optional(),
}).strict();
/** Portable setup-time choices encoded by ui:preset and consumed by ui:init/ui:apply. */
export type UiPreset = z.infer<typeof UiPresetSchema>;
/** Prefix distinguishes encoded payloads from plain token preset ids. */
export const UI_PRESET_PREFIX = 'ns1_';
/** Public builder URL; this helper constructs a link without fetching a site or executing code. */
export const UI_PRESET_BASE_URL = 'https://rickylabs.github.io/netscript/create/';

/** Decode a versioned code, shared URL, or simple token preset id. */
export function decodeUiPreset(input: string): UiPreset {
  let code = input;
  if (/^https?:/.test(code)) code = new URL(code).searchParams.get('preset') ?? '';
  if (!code.startsWith(UI_PRESET_PREFIX)) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*$/.test(code)) throw new Error('Invalid UI preset code');
    return { version: 1, theme: code };
  }
  try {
    const bytes = Uint8Array.fromBase64(code.slice(UI_PRESET_PREFIX.length), {
      alphabet: 'base64url',
    });
    return UiPresetSchema.parse(
      JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)),
    );
  } catch {
    throw new Error('Invalid UI preset code');
  }
}

/** Encode only the declared registry/preset choices as stable base64url JSON. */
export function encodeUiPreset(preset: UiPreset): string {
  return UI_PRESET_PREFIX + new TextEncoder().encode(JSON.stringify(UiPresetSchema.parse(preset)))
    .toBase64({ alphabet: 'base64url', omitPadding: true });
}

/** Construct a shareable preset URL without adding private application metadata. */
export function uiPresetUrl(preset: UiPreset): string {
  const url = new URL(UI_PRESET_BASE_URL);
  url.searchParams.set('preset', encodeUiPreset(preset));
  return url.href;
}
