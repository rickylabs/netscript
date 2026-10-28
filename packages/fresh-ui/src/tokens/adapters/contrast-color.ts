import Color from 'npm:colorjs.io@0.5.2';
import type { TokenContrastPort } from '../domain/contrast-contract.ts';
import type { TokenValue } from '../domain/token-contract.ts';
import { dtcgColor } from './token-values.ts';

function sourceColor(value: TokenValue): Color {
  // Measure the native CSS value, rather than quantizing to its 8-bit fallback first.
  const color = dtcgColor(value).to('srgb');
  color.toGamut({ space: 'srgb', method: 'css' });
  if (!Number.isFinite(color.alpha) || color.alpha < 0 || color.alpha > 1) {
    throw new Error('Invalid contrast color alpha');
  }
  return color;
}

function over(foreground: Color, background: Color): Color {
  const alpha = Number(foreground.alpha);
  const solid = foreground.clone();
  solid.alpha = 1;
  // With an opaque backdrop this is CSS source-over in sRGB, using upstream interpolation.
  return background.range(solid, { space: 'srgb', premultiplied: true })(alpha).to('srgb');
}

/** Measure the actual painted colors, including nested translucent surfaces and text. */
export const tokenContrastColor: TokenContrastPort = {
  measure(foreground, background, ground) {
    let painted = sourceColor(ground);
    if (Number(painted.alpha) !== 1) {
      throw new Error('Contrast needs an explicit opaque preset ground');
    }
    for (const layer of background) painted = over(sourceColor(layer), painted);
    const text = over(sourceColor(foreground), painted);
    return {
      ratio: Color.contrast(painted, text, 'WCAG21'),
      foreground: text.toString({ format: 'hex', collapse: false }),
      background: painted.toString({ format: 'hex', collapse: false }),
    };
  },
};
