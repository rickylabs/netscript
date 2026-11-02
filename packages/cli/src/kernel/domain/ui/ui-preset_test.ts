import { assertEquals, assertThrows } from '@std/assert';
import {
  decodeUiPreset,
  encodeUiPreset,
  UI_PRESET_MAX_INPUT_LENGTH,
  UI_PRESET_PREFIX,
  UiPresetMalformedError,
  UiPresetTooLargeError,
  uiPresetUrl,
  UnsupportedUiPresetVersionError,
} from './ui-preset.ts';

function rawCode(value: unknown): string {
  return UI_PRESET_PREFIX + new TextEncoder().encode(JSON.stringify(value))
    .toBase64({ alphabet: 'base64url', omitPadding: true });
}

Deno.test('preset codes, shared URLs and plain ids preserve supported choices', () => {
  const preset = { version: 1 as const, theme: 'studio-cloud', style: 'style-utility' };
  assertEquals(decodeUiPreset(encodeUiPreset(preset)), preset);
  assertEquals(decodeUiPreset(uiPresetUrl(preset)), preset);
  assertEquals(decodeUiPreset('studio-utility'), { version: 1, theme: 'studio-utility' });
});

Deno.test('preset input limit rejects valid oversized payloads and all other oversized forms', () => {
  const oversized = rawCode({ version: 1, theme: 'x'.repeat(1_000_000) });
  for (
    const input of [
      oversized,
      'x'.repeat(UI_PRESET_MAX_INPUT_LENGTH + 1),
      'https://themes.test/create/?preset=' + oversized,
      'https://' + 'x'.repeat(UI_PRESET_MAX_INPUT_LENGTH),
    ]
  ) {
    const error = assertThrows(() => decodeUiPreset(input), UiPresetTooLargeError);
    assertEquals(error.name, 'UiPresetTooLargeError');
  }
  // Plain identifiers make the exact boundary observable without base64 padding ambiguity.
  const boundary = 'x'.repeat(UI_PRESET_MAX_INPUT_LENGTH);
  assertEquals(decodeUiPreset(boundary), { version: 1, theme: boundary });
  assertThrows(
    () => encodeUiPreset({ version: 1, theme: boundary }),
    UiPresetTooLargeError,
  );
  const nearLimit = { version: 1 as const, theme: 'x'.repeat(3_015) };
  assertEquals(decodeUiPreset(encodeUiPreset(nearLimit)), nearLimit);
  assertThrows(() => uiPresetUrl(nearLimit), UiPresetTooLargeError);
});

Deno.test('malformed URL, base64, UTF-8, JSON and schema inputs have one named parse error', () => {
  for (
    const input of [
      '',
      'bad_id',
      'https://',
      'https://themes.test/create/',
      'ns1_%%%%',
      UI_PRESET_PREFIX + new Uint8Array([255]).toBase64({ alphabet: 'base64url' }),
      UI_PRESET_PREFIX + new TextEncoder().encode('{').toBase64({ alphabet: 'base64url' }),
      rawCode(null),
      rawCode({ theme: 'studio-utility' }),
      rawCode({ version: 1, theme: 17 }),
      rawCode({ version: 1, extra: true }),
    ]
  ) {
    const error = assertThrows(() => decodeUiPreset(input), UiPresetMalformedError);
    assertEquals(error.name, 'UiPresetMalformedError');
    assertEquals(error.message, 'Invalid UI preset code');
  }
});

Deno.test('unknown envelope and payload versions retain their named error through URL decoding', () => {
  for (const code of ['ns2_e30', rawCode({ version: 2, theme: 'studio-utility' })]) {
    for (const input of [code, 'https://themes.test/create/?preset=' + code]) {
      const error = assertThrows(() => decodeUiPreset(input), UnsupportedUiPresetVersionError);
      assertEquals(error.name, 'UnsupportedUiPresetVersionError');
    }
  }
});
