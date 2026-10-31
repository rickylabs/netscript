/** WCAG AA text threshold, including small syntax text. */
export const AA_TEXT_CONTRAST = 4.5;

/** Relative luminance in sRGB; callers pass opaque RGB channels in the 0–255 range. */
function luminance(channels: readonly number[]): number {
  const linear = channels.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

/** Accept the export's opaque hex or the browser's computed opaque rgb paint. */
function rgb(colour: string): number[] {
  const hex = colour.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  if (hex) return hex.slice(1).map((channel) => parseInt(channel, 16));
  const match = colour.match(/^rgb\(\s*(\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)\s*\)$/);
  if (match) return match.slice(1).map(Number);
  throw new Error(`Expected opaque sRGB colour: ${colour}`);
}

/** Compute the WCAG contrast ratio without rounding an AA failure up to a pass. */
export function contrastRatio(foreground: string, background: string): number {
  const first = luminance(rgb(foreground));
  const second = luminance(rgb(background));
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}
