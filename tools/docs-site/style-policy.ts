/// <reference lib="dom" />

/** Authored UI sources and the exact generated semantic-layer serializations. */
export interface StyleSource {
  path: string;
  kind: 'css' | 'html' | 'js';
  source: string;
  tokenLayer?: boolean;
  /** Generated third-party CSS still must resolve every shared role. Maintained UI gets all checks. */
  roleCheckOnly?: boolean;
}
export interface StyleFinding {
  path: string;
  line: number;
  kind: 'raw-colour' | 'red-outside-state' | 'undefined-role';
  selector: string;
  property: string;
  value: string;
}

/** Check actual CSS grammar in a browser, including named colours and alias chains. */
export function analyzeStylePolicy(sources: StyleSource[]): StyleFinding[] {
  const declarations: Array<
    { file: StyleSource; selector: string; property: string; value: string }
  > = [];
  const variables = new Map<string, Set<string>>();
  const findings: StyleFinding[] = [];
  const colourProperty =
    /^(?:color|background(?:-color|-image)?|border(?:-(?:top|right|bottom|left|block(?:-start|-end)?|inline(?:-start|-end)?))?(?:-color)?|outline(?:-color)?|fill|stroke|(?:stop|flood|lighting)-color|(?:backdrop-)?filter|(?:box|text)-shadow|text-decoration(?:-color)?|text-emphasis(?:-color)?|-webkit-text-(?:fill-color|stroke(?:-color)?)|caret-color|accent-color|column-rule(?:-color)?|scrollbar-color)$/;
  const paintFunction = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\s*\(/i;
  const hex = /#[\da-f]{3,8}\b/i;
  const permitted = new Set([
    'currentcolor',
    'transparent',
    'inherit',
    'initial',
    'unset',
    'revert',
    'revert-layer',
    'none',
  ]);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  function add(file: StyleSource, selector: string, style: CSSStyleDeclaration): void {
    // CSSOM expands var() shorthands into empty longhands. Its canonical cssText
    // retains their own property names; read those values as well as longhands.
    const properties = new Set([
      ...style,
      ...[...style.cssText.matchAll(/(?:^|;)\s*([\w-]+)\s*:/g)].map((match) => match[1]),
    ]);
    for (const property of properties) {
      const value = style.getPropertyValue(property);
      if (!value) continue;
      declarations.push({ file, selector, property, value });
      if (property.startsWith('--')) {
        const values = variables.get(property) ?? new Set<string>();
        values.add(value);
        variables.set(property, values);
      }
    }
  }
  function css(file: StyleSource, source: string): void {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(source);
    function visit(rules: CSSRuleList): void {
      for (const rule of rules) {
        if (rule instanceof CSSStyleRule) add(file, rule.selectorText, rule.style);
        if ('cssRules' in rule) visit((rule as CSSGroupingRule).cssRules);
      }
    }
    visit(sheet.cssRules);
  }
  for (const file of sources) {
    if (file.kind === 'css') css(file, file.source);
    if (file.kind === 'html') {
      const document = new DOMParser().parseFromString(
        file.source.replace(/\{\{#[\s\S]*?#\}\}|\{\{[\s\S]*?\}\}/g, ''),
        'text/html',
      );
      for (const style of document.querySelectorAll('style')) css(file, style.textContent ?? '');
      for (const element of document.querySelectorAll('[style],[fill],[stroke],[color]')) {
        const ancestry: string[] = [];
        for (let node: Element | null = element; node; node = node.parentElement) {
          ancestry.push(
            `${node.tagName.toLowerCase()}.${
              (node.getAttribute('class') ?? '').replaceAll(' ', '.')
            }[data-state="${node.getAttribute('data-state') ?? ''}"][data-variant="${
              node.getAttribute('data-variant') ?? ''
            }"][data-tone="${node.getAttribute('data-tone') ?? ''}"]`,
          );
        }
        const style = globalThis.document.createElement('span').style;
        style.cssText = element.getAttribute('style') ?? '';
        for (const property of ['fill', 'stroke', 'color']) {
          const value = element.getAttribute(property);
          if (value) style.setProperty(property, value);
        }
        add(file, ancestry.reverse().join(' '), style);
      }
    }
    if (file.kind === 'js') {
      for (const match of file.source.matchAll(/\.style\.([\w]+)\s*=\s*(['"`])([\s\S]*?)\2/g)) {
        const style = document.createElement('span').style;
        style.setProperty(
          match[1].replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`),
          match[3],
        );
        add(file, 'script assignment', style);
      }
      for (
        const match of file.source.matchAll(
          /\.style\.setProperty\(\s*['"]([^'"]+)['"]\s*,\s*(['"`])([\s\S]*?)\2/g,
        )
      ) {
        const style = document.createElement('span').style;
        style.setProperty(match[1], match[3]);
        add(file, 'script assignment', style);
      }
    }
  }
  function references(value: string): string[] {
    return [...value.matchAll(/var\(\s*(--[\w-]+)/g)].map((match) => match[1]);
  }
  function literalRed(value: string): boolean {
    if (value.includes('var(')) return false;
    if (!context || !CSS.supports('color', value) || permitted.has(value.trim().toLowerCase())) {
      return false;
    }
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = value;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b, alpha] = context.getImageData(0, 0, 1, 1).data;
    const delta = Math.max(r, g, b) - Math.min(r, g, b);
    if (alpha === 0 || r < 26 || delta < 16 || r < g || r < b) return false;
    const hue = (((g - b) / delta * 60) + 360) % 360;
    return hue <= 18 || hue >= 340;
  }
  function red(value: string, trail: string[] = []): boolean {
    if (literalRed(value)) return true;
    return references(value).some((name) =>
      !trail.includes(name) &&
      [...(variables.get(name) ?? [])].some((next) => red(next, [...trail, name]))
    );
  }
  function raw(value: string): boolean {
    const withoutUrls = value.replace(/url\([^)]*\)/gi, '');
    if (hex.test(withoutUrls) || paintFunction.test(withoutUrls)) return true;
    const withoutReferences = withoutUrls.replace(/var\(\s*--[\w-]+\s*,?/g, '');
    return [...withoutReferences.matchAll(/[a-z][\w-]*/gi)].some(([word]) =>
      !permitted.has(word.toLowerCase()) && CSS.supports('color', word)
    );
  }
  function finding(entry: typeof declarations[number], kind: StyleFinding['kind']): void {
    findings.push({
      path: entry.file.path,
      line:
        entry.file.source.slice(0, Math.max(0, entry.file.source.indexOf(entry.value))).split('\n')
          .length,
      kind,
      selector: entry.selector,
      property: entry.property,
      value: entry.value,
    });
  }
  for (const entry of declarations) {
    const { file, selector, property, value } = entry;
    const custom = property.startsWith('--');
    for (const name of references(value)) {
      if (name.startsWith('--ns-') && !variables.has(name)) finding(entry, 'undefined-role');
    }
    if (file.roleCheckOnly) continue;
    if (custom || colourProperty.test(property)) {
      if (raw(value) && !(custom && file.tokenLayer)) finding(entry, 'raw-colour');
    }
    if (custom) continue; // Definition is not a use; resolve it through consuming declarations.
    const selectors = selector.split(',');
    const logo = file.path === 'favicon.svg' ||
      selectors.every((part) => /\.docs-logo\b/.test(part));
    const error = selectors.every((part) =>
      /\[data-(?:state|variant|intent|tone)\s*=\s*(?:"(?:error|destructive)"|'(?:error|destructive)'|(?:error|destructive))\s*\]/
        .test(part) ||
      /\[aria-invalid\s*=\s*(?:"true"|'true'|true)\s*\]/.test(part) || /\.ns-error\b/.test(part)
    );
    if (red(value) && !logo && !error) finding(entry, 'red-outside-state');
  }
  return findings;
}
