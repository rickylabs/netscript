import Color from 'npm:colorjs.io@0.5.2';
import type { DesignToken, TokenValue } from '../domain/token-contract.ts';
import { normalizeFontStyle, roundTokenNumber } from '../domain/figma-aliases.ts';

const WEIGHTS: Readonly<Record<string, number>> = {
  thin: 100,
  extralight: 200,
  light: 300,
  regular: 400,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
};

/** Convert a source color using the same Color.js dependency as SD 5.7.1. */
export function tokenColor(value: string): TokenValue {
  const color = new Color(value);
  const rgb = color.to('srgb');
  rgb.alpha = 1;
  return {
    colorSpace: 'oklch',
    components: color.to('oklch').coords.map((entry) =>
      entry === null || !Number.isFinite(Number(entry)) ? 0 : roundTokenNumber(Number(entry))
    ),
    alpha: roundTokenNumber(Number(color.alpha)),
    hex: rgb.toString({ format: 'hex', collapse: false }),
  };
}

function dimension(value: number, unit = 'px'): TokenValue {
  return { value: roundTokenNumber(value), unit };
}

function shadowValue(css: string): TokenValue {
  const layers = css.split(/,(?![^()]*\))/).map((layer) => {
    const match = layer.trim().match(
      /^(inset\s+)?(-?[\d.]+)(?:px)?\s+(-?[\d.]+)(?:px)?\s+(-?[\d.]+)(?:px)?(?:\s+(-?[\d.]+)px)?\s+(.+)$/,
    );
    if (!match) throw new Error(`Invalid source shadow: ${layer}`);
    return {
      color: tokenColor(match[6]),
      offsetX: dimension(Number(match[2])),
      offsetY: dimension(Number(match[3])),
      blur: dimension(Number(match[4])),
      spread: dimension(Number(match[5] ?? 0)),
      ...(match[1] ? { inset: true } : {}),
    };
  });
  return layers.length === 1 ? layers[0] : layers;
}

/** Lift legacy CSS into real DTCG objects, retaining its exact CSS spelling. */
export function legacyPrimitive(type: string, css: string): DesignToken {
  let value: TokenValue;
  if (type === 'color') value = tokenColor(css);
  else if (type === 'dimension') {
    const match = css.match(/^(-?[\d.]+)(px|rem|em)?$/);
    if (!match) throw new Error(`Invalid source dimension: ${css}`);
    value = dimension(
      Number(match[1]) * (match[2] === 'em' ? 16 : 1),
      match[2] === 'rem' ? 'rem' : 'px',
    );
  } else if (type === 'duration') {
    type = 'transition';
    const bezier = css.match(/cubic-bezier\(([^)]+)\)/);
    value = {
      duration: { value: Number.parseFloat(css), unit: 'ms' },
      delay: { value: 0, unit: 'ms' },
      timingFunction: bezier ? bezier[1].split(',').map(Number) : [0.25, 0.1, 0.25, 1],
    };
  } else if (type === 'fontFamily') {
    value = css.split(',').map((entry) => entry.trim().replace(/^'|'$/g, ''));
  } else if (type === 'shadow' || /^-?\d.*rgba\(/.test(css)) {
    type = 'shadow';
    value = shadowValue(css);
  } else if (type === 'number') value = Number(css);
  else throw new Error(`Unsupported legacy token type: ${type}`);
  return { $type: type, $value: value, $extensions: { netscript: { css } } };
}

/** Type a Figma scalar by its role rather than emitting invalid unit strings. */
export function figmaPrimitive(
  name: string,
  sourceType: string,
  raw: string | number | boolean,
): DesignToken {
  if (sourceType === 'COLOR') return { $type: 'color', $value: tokenColor(String(raw)) };
  if (sourceType === 'BOOLEAN') return { $type: 'number', $value: raw ? 1 : 0 };
  if (typeof raw === 'number') return { $type: 'dimension', $value: dimension(raw) };
  if (/font\//.test(name)) return { $type: 'fontFamily', $value: String(raw) };
  if (name.endsWith('/style') || name.includes('/weight')) {
    const key = normalizeFontStyle(String(raw)).replaceAll(' ', '').toLowerCase();
    const weight = WEIGHTS[key];
    if (!weight) throw new Error(`Unknown font style: ${raw}`);
    return { $type: 'fontWeight', $value: weight };
  }
  throw new Error(`No DTCG type for Figma string ${name}: ${raw}`);
}

/** Read DTCG color coordinates without depending on its optional hex hint. */
export function dtcgColor(value: TokenValue): Color {
  if (typeof value === 'string') return new Color(value);
  if (
    !value || Array.isArray(value) || typeof value !== 'object' ||
    typeof value.colorSpace !== 'string' || !Array.isArray(value.components) ||
    value.components.length !== 3
  ) throw new Error('Expected a DTCG color object');
  const spaces: Readonly<Record<string, string>> = {
    'display-p3': 'p3',
    'a98-rgb': 'a98rgb',
    'prophoto-rgb': 'prophoto',
  };
  const coordinate = (component: TokenValue): number =>
    component === 'none' ? NaN : Number(component);
  return new Color(
    spaces[value.colorSpace] ?? value.colorSpace,
    [
      coordinate(value.components[0]),
      coordinate(value.components[1]),
      coordinate(value.components[2]),
    ],
    Number(value.alpha ?? 1),
  );
}

/** Convert resolved DTCG colors back to Figma's sRGB hex shape. */
export function colorHex(value: TokenValue): string {
  if (typeof value === 'string') return new Color(value).to('srgb').toString({ format: 'hex' });
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    throw new Error('Expected a color object');
  }
  if (typeof value.hex === 'string') {
    const alpha = typeof value.alpha === 'number' ? value.alpha : 1;
    return value.hex + (alpha < 1 ? Math.round(alpha * 255).toString(16).padStart(2, '0') : '');
  }
  return dtcgColor(value).to('srgb').toString({ format: 'hex', collapse: false });
}
