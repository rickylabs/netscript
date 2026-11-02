import { z } from 'zod';

/** Portable setup-time choices encoded by ui:preset and consumed by ui:init/ui:apply. */
export interface UiPreset {
  version: 1;
  theme?: string;
  style?: string;
  font?: string;
  iconLibrary?: string;
}

/** Versioned preset identifiers remain independent of token source and semantic overrides. */
export const UiPresetSchema: z.ZodType<UiPreset> = z.object({
  version: z.literal(1),
  theme: z.string().min(1).optional(),
  style: z.string().min(1).optional(),
  font: z.string().min(1).optional(),
  iconLibrary: z.string().min(1).optional(),
}).strict();
/** Prefix distinguishes encoded payloads from plain token preset ids. */
export const UI_PRESET_PREFIX = 'ns1_';
/** Public builder URL; this helper constructs a link without fetching a site or executing code. */
export const UI_PRESET_BASE_URL = 'https://rickylabs.github.io/netscript/create/';
/** Bound untrusted codes, plain ids and shared URLs before URL/base64/JSON parsing. */
export const UI_PRESET_MAX_INPUT_LENGTH = 4_096;

/** Input exceeds the setup-time preset protocol's allocation budget. */
export class UiPresetTooLargeError extends Error {
  constructor() {
    super(`Invalid UI preset code: exceeds ${UI_PRESET_MAX_INPUT_LENGTH} characters`);
    this.name = 'UiPresetTooLargeError';
  }
}

/** Input cannot be parsed as a declared preset code, URL or identifier. */
export class UiPresetMalformedError extends Error {
  constructor() {
    super('Invalid UI preset code');
    this.name = 'UiPresetMalformedError';
  }
}

/** A versioned envelope or payload requires a decoder this release does not implement. */
export class UnsupportedUiPresetVersionError extends Error {
  constructor() {
    super('Unsupported UI preset version');
    this.name = 'UnsupportedUiPresetVersionError';
  }
}

/** Decode a versioned code, shared URL, or simple token preset id. */
export function decodeUiPreset(input: string): UiPreset {
  if (input.length > UI_PRESET_MAX_INPUT_LENGTH) throw new UiPresetTooLargeError();
  try {
    let code = input;
    if (/^https?:/.test(code)) code = new URL(code).searchParams.get('preset') ?? '';
    if (!code.startsWith(UI_PRESET_PREFIX)) {
      if (/^ns\d+_/.test(code)) throw new UnsupportedUiPresetVersionError();
      if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*$/.test(code)) throw new UiPresetMalformedError();
      return { version: 1, theme: code };
    }
    const bytes = Uint8Array.fromBase64(code.slice(UI_PRESET_PREFIX.length), {
      alphabet: 'base64url',
    });
    const value: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (typeof value === 'object' && value !== null && 'version' in value && value.version !== 1) {
      throw new UnsupportedUiPresetVersionError();
    }
    return UiPresetSchema.parse(value);
  } catch (error) {
    if (error instanceof UnsupportedUiPresetVersionError) throw error;
    throw new UiPresetMalformedError();
  }
}

/** Encode only the declared registry/preset choices as stable base64url JSON. */
export function encodeUiPreset(preset: UiPreset): string {
  const code = UI_PRESET_PREFIX +
    new TextEncoder().encode(JSON.stringify(UiPresetSchema.parse(preset)))
      .toBase64({ alphabet: 'base64url', omitPadding: true });
  if (code.length > UI_PRESET_MAX_INPUT_LENGTH) throw new UiPresetTooLargeError();
  return code;
}

/** Construct a shareable preset URL without adding private application metadata. */
export function uiPresetUrl(preset: UiPreset): string {
  const url = new URL(UI_PRESET_BASE_URL);
  url.searchParams.set('preset', encodeUiPreset(preset));
  if (url.href.length > UI_PRESET_MAX_INPUT_LENGTH) throw new UiPresetTooLargeError();
  return url.href;
}
