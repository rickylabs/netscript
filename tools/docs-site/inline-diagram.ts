const COLOUR =
  /#[\da-f]{8}\b|#[\da-f]{6}\b|#[\da-f]{4}\b|#[\da-f]{3}\b|\brgba?\([^)]*\)|\b(?:black|white|red)\b/gi;

function semanticPaint(property: string, paint: string): string {
  const value = paint.toLowerCase();
  if (value.startsWith('rgba') && Number(value.match(/[\d.]+/g)?.[3]) === 0) return 'transparent';
  if (property.startsWith('background') || property.startsWith('border')) return 'var(--ns-bg)';
  if (property === 'color') return 'var(--ns-fg)';
  if (property === 'stroke') return 'var(--ns-muted-fg)';
  let channels: number[];
  if (value.startsWith('#')) {
    const hex = value.slice(1);
    const expanded = hex.length < 5 ? [...hex].map((c) => c + c).join('') : hex;
    channels = [0, 2, 4].map((offset) => parseInt(expanded.slice(offset, offset + 2), 16) / 255);
  } else if (value.startsWith('rgb')) {
    channels = (value.match(/[\d.]+/g) ?? []).slice(0, 3).map((n) => Number(n) / 255);
  } else channels = [value === 'white' ? 1 : 0];
  const max = Math.max(...channels);
  const min = Math.min(...channels);
  return max > 0.7 || max - min > 0.08 ? 'var(--ns-fg)' : 'var(--ns-surface)';
}

function escapeAttribute(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

/** Inline renderer-owned SVG with semantic paint, isolated IDs and its authored accessible name. */
export function inlineUtilityDiagram(source: string, alt: string, instance: string): string {
  if (!/^[a-z][\w-]*$/.test(instance)) throw new Error('Invalid diagram instance identifier');
  if (!/<svg\b/.test(source) || !alt.trim()) {
    throw new Error('Diagram needs an SVG and accessible name');
  }
  const ids = new Map(
    [...source.matchAll(/\bid="([^"]+)"/g)].map((match) => [match[1], `${instance}-${match[1]}`]),
  );
  let svg = source.replace(/\bid="([^"]+)"/g, (_, id: string) => `id="${ids.get(id)}"`);
  for (const [id, isolated] of [...ids].sort(([a], [b]) => b.length - a.length)) {
    svg = svg.replaceAll(`#${id}`, `#${isolated}`);
  }
  svg = svg.replace(
    /\b(aria-labelledby|aria-describedby)="([^"]+)"/g,
    (_, attribute: string, refs: string) =>
      `${attribute}="${refs.split(/\s+/).map((id) => ids.get(id) ?? id).join(' ')}"`,
  );
  svg = svg.replace(
    /\b(fill|stroke|color|background(?:-color)?|border(?:-[a-z]+)?)\s*([:=])\s*("[^"]*"|'[^']*'|[^;}"<>]+)/g,
    (_, property: string, separator: string, value: string) =>
      `${property}${separator}${value.replace(COLOUR, (paint) => semanticPaint(property, paint))}`,
  );
  svg = svg.replace(/font-family:[^;]+;/g, 'font-family:var(--ns-font-sans);');
  return svg.replace(
    /<svg\b([^>]*)>/,
    (_, attributes: string) =>
      `<svg${
        attributes.replace(
          /\s(?:role|aria-label|aria-labelledby|aria-roledescription)="[^"]*"/g,
          '',
        )
      } role="img" aria-label="${escapeAttribute(alt)}">`,
  );
}
