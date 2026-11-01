import type { Dictionary } from 'npm:style-dictionary@5.7.1/types';
import Color from 'npm:colorjs.io@0.5.2';
import { FIGMA_THEME_SET } from '../domain/token-presets.ts';
import { isTokenAlias } from '../domain/resolve-tokens.ts';
import {
  type DesignToken,
  type TokenDocument,
  tokenEntries,
  type TokenValue,
} from '../domain/token-contract.ts';
import type { BuiltToken, TokenContextOutput } from '../domain/token-output.ts';
import { colorHex, dtcgColor, tokenColor } from './token-values.ts';

/** Serialize the DTCG types that occur in the shipped three-tier contract. */
export function tokenCssValue(type: string, value: TokenValue, mono = false): string {
  if (type === 'fontFamily') {
    const families = Array.isArray(value) ? value : [value];
    const css = families.map((family) =>
      /^(system-ui|ui-monospace|sans-serif|monospace|-apple-system)$/.test(String(family))
        ? String(family)
        : `'${String(family).replaceAll("'", "\\'")}'`
    ).join(', ');
    return families.length === 1
      ? `${css}, ${mono ? 'ui-monospace, monospace' : 'system-ui, sans-serif'}`
      : css;
  }
  if (type === 'cubicBezier' && Array.isArray(value)) return `cubic-bezier(${value.join(', ')})`;
  if (type === 'shadow' && Array.isArray(value)) {
    return value.map((layer) => tokenCssValue(type, layer)).join(', ');
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if (type === 'color' && Array.isArray(value.components)) {
      const color = dtcgColor(value).to('oklch');
      const components = color.coords.map((component) => Number(component ?? 0));
      const round = (number: number): string =>
        Number.isNaN(number) ? 'none' : String(Math.round(number * 1e6) / 1e6);
      const alpha = Number(color.alpha);
      return `oklch(${round(components[0] * 100)}% ${round(components[1])} ${round(components[2])}${
        alpha < 1 ? ` / ${round(alpha)}` : ''
      })`;
    }
    if (type === 'dimension' || type === 'duration') return `${value.value}${value.unit}`;
    if (type === 'shadow') {
      return `${value.inset ? 'inset ' : ''}${tokenCssValue('dimension', value.offsetX)} ${
        tokenCssValue('dimension', value.offsetY)
      } ${tokenCssValue('dimension', value.blur)} ${tokenCssValue('dimension', value.spread)} ${
        tokenCssValue('color', value.color)
      }`;
    }
    if (type === 'transition') {
      return `${tokenCssValue('duration', value.duration)} ${
        tokenCssValue('cubicBezier', value.timingFunction)
      } ${tokenCssValue('duration', value.delay)}`;
    }
  }
  if (typeof value === 'number' || typeof value === 'string') return String(value);
  throw new Error(`Cannot emit ${type} as CSS`);
}

/** SD resolves values; this format retains live CSS references and computes vendor mixes. */
export function formatTokenContext(
  dictionary: Dictionary,
  source: TokenDocument,
  context: Omit<TokenContextOutput, 'tokens'>,
): TokenContextOutput {
  const originals = new Map(tokenEntries(source).map(({ path, token }) => [path, token]));
  const resolved = new Map<string, TokenValue>(
    dictionary.allTokens.map((token) => [token.path.join('.'), token.$value]),
  );
  const cache = new Map<string, TokenValue>();
  const deriving = new Set<string>();
  function value(path: string): TokenValue {
    if (cache.has(path)) return cache.get(path)!;
    if (deriving.has(path)) throw new Error(`Derived token cycle: ${path}`);
    deriving.add(path);
    let original = originals.get(path);
    while (original && !original.$extensions?.netscript?.derive && isTokenAlias(original.$value)) {
      original = originals.get(original.$value.slice(1, -1));
    }
    const derive = original?.$extensions?.netscript?.derive;
    let result = resolved.get(path);
    if (derive?.kind === 'mix') {
      const left = new Color(colorHex(value(derive.color)));
      const right = new Color(colorHex(value(derive.with)));
      const mixed = left.range(right, { space: derive.space, premultiplied: true })(
        1 - derive.weight,
      );
      result = tokenColor(mixed.to('srgb').toString({ precision: 12 }));
    } else if (derive?.kind === 'shadow') {
      result = {
        color: value(derive.color),
        offsetX: { value: derive.offsetX, unit: 'px' },
        offsetY: value(derive.offsetY),
        blur: value(derive.blur),
        spread: { value: derive.spread, unit: 'px' },
      };
    }
    if (result === undefined) throw new Error(`SD did not resolve ${path}`);
    deriving.delete(path);
    cache.set(path, result);
    return result;
  }
  function reference(path: string, current: string): string | undefined {
    let name: string | undefined;
    if (path.startsWith('semantic.')) name = path.slice('semantic.'.length);
    else if (/^context\.(light|dark)\./.test(path)) name = path.split('.').slice(2).join('.');
    const cssVar = name
      ? originals.get(`semantic.${name}`)?.$extensions?.netscript?.cssVar
      : undefined;
    return cssVar && cssVar !== current ? `var(${cssVar})` : undefined;
  }
  function css(path: string, current: string): string {
    const original = originals.get(path);
    if (!original) throw new Error(`Unknown CSS reference ${path}`);
    const metadata = original.$extensions?.netscript;
    if (metadata?.derive) {
      const derive = metadata.derive;
      const operand = (target: string): string =>
        reference(target, current) ?? css(target, current);
      return derive.kind === 'mix'
        ? `color-mix(in ${derive.space}, ${operand(derive.color)} ${derive.weight * 100}%, ${
          operand(derive.with)
        })`
        : `${derive.offsetX}px ${operand(derive.offsetY)} ${
          operand(derive.blur)
        } ${derive.spread}px ${operand(derive.color)}`;
    }
    if (metadata?.css !== undefined) return metadata.css;
    if (isTokenAlias(original.$value)) {
      const target = original.$value.slice(1, -1);
      return reference(target, current) ?? css(target, current);
    }
    return tokenCssValue(original.$type, value(path), current.includes('mono'));
  }
  function fallback(path: string): string | undefined {
    let original: DesignToken | undefined = originals.get(path);
    while (original && isTokenAlias(original.$value) && !original.$extensions?.netscript?.derive) {
      original = originals.get(original.$value.slice(1, -1));
    }
    if (original?.$type === 'color' && !original.$extensions?.netscript?.css) {
      return colorHex(value(path));
    }
    return undefined;
  }
  const tokens: Record<string, BuiltToken> = {};
  for (const { path, token } of tokenEntries(source)) {
    const metadata = token.$extensions?.netscript;
    if (!metadata?.cssVar) continue;
    const name = metadata.cssVar.slice('--ns-'.length);
    const raw = value(path);
    let origin = token;
    while (isTokenAlias(origin.$value)) origin = originals.get(origin.$value.slice(1, -1))!;
    const sourceStyle = origin.$extensions?.netscript?.figmaStyle;
    tokens[name] = {
      type: token.$type,
      value: css(path, metadata.cssVar),
      cssVar: metadata.cssVar,
      path: metadata.category ?? path.split('.'),
      resolved: raw,
      ...(sourceStyle ? { sourceStyle } : {}),
      ...(originals.get(`context.${context.scheme}.${name}`)?.$extensions?.netscript?.figma
          ?.collection === FIGMA_THEME_SET
        ? { sourceOnly: true }
        : {}),
      ...(token.$type === 'color' ? { hex: colorHex(raw), fallback: fallback(path) } : {}),
    };
  }
  return { ...context, tokens };
}
