// Copyright (c) 2023 Pavel Laptev. MIT; see ../LICENSE and ../NOTICE.
export const normalizeRGBAColor = (rgba: {
  r: number;
  g: number;
  b: number;
  /** Figma may hand back an `RGB` without an alpha channel: treat it as opaque. */
  a?: number;
}): { r: number; g: number; b: number; a: number } => {
  const alpha = typeof rgba.a === 'number' ? rgba.a : 1;

  const normalizedRGBA = {
    r: Math.round(rgba.r * 255),
    g: Math.round(rgba.g * 255),
    b: Math.round(rgba.b * 255),
    a: alpha,
  };

  return normalizedRGBA;
};
