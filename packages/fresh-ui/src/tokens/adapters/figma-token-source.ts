import {
  type DesignToken,
  type FigmaCollection,
  tokenAlias,
  type TokenDocument,
  type TokenPreset,
} from '../domain/token-contract.ts';
import { resolveFigmaValue } from '../domain/figma-aliases.ts';
import { figmaModes, TOKEN_PRESETS } from '../domain/token-presets.ts';
import { LEGACY_ROLE_MAP, PRESET_ROLE_MAPS } from '../domain/preset-role-map.ts';
import { figmaPrimitive, legacyPrimitive } from './token-values.ts';

/** The pre-S1 manifest is evidence and the value source for NS One. */
export interface LegacyTokenSource {
  readonly tokens: Record<string, { type: string; value: string; path: string[] }>;
  readonly themes: { dark: Record<string, { type: string; value: string; path: string[] }> };
}

/** Source import returns DTCG documents rather than writing output CSS itself. */
export interface ImportedTokenSources {
  readonly primitives: TokenDocument;
  readonly presets: TokenDocument;
  readonly schemes: Record<'light' | 'dark', TokenDocument>;
  readonly roles: Readonly<Record<string, { type: string; category: readonly string[] }>>;
}

const PACKS = ['studio', 'bloom', 'liquid', 'cupertino', 'tactile', 'fluent', 'pixel', 'terminal'];
const suffix = (css: string): string => css.replace(/^var\(--ns-/, '').replace(/\)$/, '');

/** Import Figma's value contract and the compatibility seed into three-tier inputs. */
export function importFigmaTokens(
  collections: readonly FigmaCollection[],
  legacy: LegacyTokenSource,
): ImportedTokenSources {
  const primitive: TokenDocument = {};
  const presets: TokenDocument = {};
  const roles: Record<string, { type: string; category: readonly string[] }> = {};
  const literals = new Map<string, string>();
  function lift(token: DesignToken): string {
    const key = JSON.stringify(token);
    const existing = literals.get(key);
    if (existing) return existing;
    const id = `v${String(literals.size + 1).padStart(4, '0')}`;
    primitive[id] = token;
    const path = `primitive.${id}`;
    literals.set(key, path);
    return path;
  }
  function role(name: string, token: DesignToken, category: readonly string[]): void {
    roles[name] ??= { type: token.$type, category };
  }
  for (const preset of TOKEN_PRESETS) {
    const contexts: TokenDocument = {};
    for (const scheme of ['light', 'dark'] as const) {
      const values: TokenDocument = {};
      const modes = figmaModes(preset, scheme);
      // Every language receives the complete core and declared role vocabulary.
      for (const collection of collections) {
        for (const variable of collection.variables) {
          if (!variable.codeSyntax || collection.collection === 'Primitives') continue;
          const name = suffix(variable.codeSyntax);
          const resolved = resolveFigmaValue(
            collections,
            collection.collection,
            variable.name,
            modes,
          );
          const literal = figmaPrimitive(variable.name, variable.type, resolved.value);
          values[name] = tokenAlias(lift(literal), literal.$type, {
            figma: {
              collection: collection.collection,
              name: variable.name,
              mode: modes[collection.collection],
            },
          });
          role(name, literal, category(name));
        }
      }
      // Ramps are output data, so design routes never hard-code their inventory.
      const ramps = collections.find((collection) => collection.collection === 'Primitives');
      for (const variable of ramps?.variables ?? []) {
        const match = variable.name.match(/^color\/([^/]+)\/(l|d)\/(\d+)$/);
        const band = variable.name.match(/^color\/band\/(\d+)$/);
        if ((!match || match[2] !== (scheme === 'light' ? 'l' : 'd')) && !band) continue;
        const name = match ? `${match[1]}-${match[3]}` : `band-${band![1]}`;
        const resolved = resolveFigmaValue(collections, 'Primitives', variable.name, modes);
        const literal = figmaPrimitive(variable.name, 'COLOR', resolved.value);
        values[name] = tokenAlias(lift(literal), literal.$type);
        role(name, literal, match ? ['color', match[1], match[3]] : ['color', 'band', band![1]]);
      }
      // Missing compatibility names retain an NS One source until explicitly mapped.
      const old = { ...legacy.tokens, ...(scheme === 'dark' ? legacy.themes.dark : {}) };
      for (const [name, token] of Object.entries(old)) {
        if (preset.id !== 'ns-one' && values[name]) continue;
        const ref = token.value.match(/^var\(--ns-(.+)\)$/);
        if (ref) values[name] = tokenAlias(`context.${scheme}.${ref[1]}`, token.type);
        else {
          const literal = legacyPrimitive(token.type, token.value);
          values[name] = tokenAlias(lift(literal), literal.$type);
          role(name, literal, token.path);
        }
        role(name, values[name] as DesignToken, token.path);
      }
      addNodeRoles(values, scheme, preset);
      if (preset.id === 'ns-one') {
        const weights: Record<string, string> = {};
        for (
          const [name, weight] of Object.entries({
            body: 400,
            caption: 400,
            display: 600,
            heading: 600,
            kpi: 500,
            label: 500,
            small: 400,
            strong: 600,
            title: 600,
          })
        ) {
          weights[`weight-${name}`] = lift({
            $type: 'fontWeight',
            $value: weight,
            $description: 'NS One font weights from the pre-S1 app font import and component CSS.',
          });
        }
        applyLegacyGaps(values, scheme, roles, new Set(Object.keys(old)), weights);
      } else {
        applyPresetOverlay(values, preset, scheme);
        for (
          const [name, target] of Object.entries({
            'radius-sm': 'radius-control',
            'radius-md': 'radius-input',
            'radius-lg': 'radius-card',
            'radius-xl': 'radius-card',
            'radius-2xl': 'radius-card',
            'text-base': 'text-body',
            'text-xs': 'text-caption',
            'text-sm': 'text-small',
            'text-lg': 'text-heading',
            'text-xl': 'text-title',
            'text-2xl': 'text-display',
            'text-3xl': 'text-display',
            'text-4xl': 'text-display',
          })
        ) alias(values, scheme, name, target);
      }
      contexts[scheme] = values;
    }
    presets[preset.id] = { context: contexts };
  }
  const schemes = { light: {}, dark: {} } as Record<'light' | 'dark', TokenDocument>;
  for (const scheme of ['light', 'dark'] as const) {
    schemes[scheme] = {
      semantic: Object.fromEntries(
        Object.entries(roles).map(([name, info]) => [
          name,
          tokenAlias(`context.${scheme}.${name}`, info.type, {
            cssVar: `--ns-${name}`,
            category: info.category,
          }),
        ]),
      ),
    };
  }
  return { primitives: { primitive }, presets, schemes, roles };

  function category(name: string): readonly string[] {
    for (
      const group of [
        'font',
        'text',
        'leading',
        'tracking',
        'radius',
        'shadow',
        'space',
        'ease',
        'z',
      ]
    ) {
      if (name.startsWith(`${group}-`)) return [group, name.slice(group.length + 1)];
    }
    return ['semantic', name];
  }

  function addLiteral(
    values: TokenDocument,
    name: string,
    raw: string | number,
    type: string,
    language?: string,
  ): void {
    const literal = figmaPrimitive(name, type, raw);
    values[name] = {
      ...tokenAlias(lift(literal), literal.$type),
      $description: `Node value from docs/design-system/themes/${
        language ?? name.split('-')[0]
      }/DESIGN.md and the matching Figma node map.`,
    };
    role(name, literal, category(name));
  }

  function alias(values: TokenDocument, scheme: string, name: string, target: string): void {
    if (!roles[name]) throw new Error(`Unregistered overlay role: ${name}`);
    const token = values[target];
    if (!token || typeof token === 'string' || !('$value' in token)) {
      throw new Error(`Missing role mapping ${name} → ${target}`);
    }
    values[name] = tokenAlias(`context.${scheme}.${target}`, String(token.$type));
  }

  function applyPresetOverlay(values: TokenDocument, preset: TokenPreset, scheme: string): void {
    for (const [name, target] of Object.entries(PRESET_ROLE_MAPS[preset.id] ?? {})) {
      alias(values, scheme, name, target);
    }
    if (preset.language === 'studio') {
      for (
        const [name, target] of Object.entries({
          primary: 'studio-primary-bg',
          'primary-hover': 'studio-primary-bg-hover',
          'primary-fg': 'studio-primary-fg',
        })
      ) alias(values, scheme, name, target);
    }
    if (preset.id === 'liquid' && scheme === 'dark') {
      // The approved dark delta binds the core value, not the unused pack value.
      const resolved = resolveFigmaValue(
        collections,
        'Scheme',
        'success/text',
        figmaModes(preset, 'dark'),
      );
      const literal = figmaPrimitive('success/text', 'COLOR', resolved.value);
      values['liquid-success-text'] = tokenAlias(lift(literal), 'color', {
        figma: { collection: 'Scheme', name: 'success/text', mode: 'Dark' },
      });
    }
    if (preset.id === 'bloom') {
      // Font roles use the names registered by the Theme collection.
      for (
        const [name, family] of Object.entries({
          'font-sans': 'Funnel Sans',
          'font-label': 'Funnel Sans',
          'font-data': 'Funnel Sans',
          'font-heading': 'Funnel Display',
          'font-kpi': 'Funnel Display',
        })
      ) {
        const literal = figmaPrimitive(name.replace('font-', 'font/'), 'STRING', family);
        values[name] = tokenAlias(lift(literal), literal.$type);
      }
      for (
        const [name, size] of Object.entries({
          'radius-control': 28,
          'radius-input': 28,
          'radius-card': 22,
          'text-body': 15,
          'leading-body': 20,
          'text-caption': 12,
          'leading-caption': 16,
          'text-display': 92,
          'leading-display': 96,
          'text-heading': 40,
          'leading-heading': 48,
          'text-title': 28,
          'leading-title': 32,
          'text-label': 16,
          'leading-label': 21,
          'text-small': 13,
          'leading-small': 17,
          'text-strong': 15,
          'leading-strong': 20,
          'text-kpi': 60,
          'leading-kpi': 64,
          'text-kpi-sm': 48,
          'leading-kpi-sm': 52,
        })
      ) addLiteral(values, name, size, 'FLOAT', 'bloom');
    }
    if (preset.id === 'liquid') {
      for (
        const [name, size] of Object.entries({
          'text-display': 40,
          'leading-display': 48,
          'text-kpi': 26,
          'leading-kpi': 32,
          'text-body': 13,
          'leading-body': 17,
          'text-caption': 11,
          'leading-caption': 14,
          'radius-input': 7,
          'radius-control': 10,
          'radius-card': 16,
        })
      ) addLiteral(values, name, size, 'FLOAT', 'liquid');
    }
    // Shared, newly named roles have a value in every preset, not a partial map.
  }

  function addNodeRoles(values: TokenDocument, scheme: string, preset: TokenPreset): void {
    const dark = scheme === 'dark';
    for (
      const [name, raw] of Object.entries({
        'liquid-tag-pink': dark ? '#ff375f' : '#ff2d55',
        'liquid-avatar-fg': '#000000',
        'liquid-on-accent-rim': '#ffffff4d',
        'liquid-on-accent-rim-strong': '#ffffff59',
        'liquid-avatar-ring': '#ffffffe5',
        'liquid-hairline-subtle': dark ? '#ffffff1a' : '#0000000f',
        'liquid-hairline-strong': dark ? '#ffffff47' : '#0000002e',
      })
    ) addLiteral(values, name, raw, 'COLOR');
    for (
      const [name, raw] of Object.entries({
        'cupertino-radius-container': 24,
        'cupertino-radius-sheet': 26,
        'liquid-radius-window': 16,
        'liquid-radius-sheet': 22,
        'liquid-radius-field': 7,
        'liquid-radius-row': 8,
        'liquid-radius-item': 10,
        'liquid-radius-group': 12,
        'liquid-radius-platter': 14,
        'bloom-radius-capsule': 28,
        'bloom-radius-card': 22,
        'bloom-radius-card-large': 24,
        'bloom-radius-widget': 32,
        'bloom-radius-small': 2,
        'tonal-radius-full': 999,
        'tonal-radius-extra-large': 32,
        'tonal-radius-large': 28,
        'tonal-radius-medium': 24,
        'tonal-radius-small': 20,
      })
    ) addLiteral(values, name, raw, 'FLOAT');
    values['cupertino-switch-thumb'] = tokenAlias(`context.${scheme}.primary-fg`, 'color');
    role('cupertino-switch-thumb', values['cupertino-switch-thumb'] as DesignToken, [
      'semantic',
      'cupertino-switch-thumb',
    ]);
    for (let i = 1; i <= 5; i++) {
      values[`pixel-band-${i}`] = tokenAlias(`context.${scheme}.band-${i}`, 'color');
      role(`pixel-band-${i}`, values[`pixel-band-${i}`] as DesignToken, [
        'semantic',
        `pixel-band-${i}`,
      ]);
    }
    for (
      const [part, target] of Object.entries({
        bg: preset.id === 'terminal' && dark ? 'muted' : 'primary',
        fg: preset.id === 'terminal' && dark ? 'primary-text' : 'primary-fg',
        border: 'input-border',
      })
    ) {
      const name = `terminal-key-${part}`;
      values[name] = tokenAlias(`context.${scheme}.${target}`, 'color');
      role(name, values[name] as DesignToken, ['semantic', name]);
    }
  }
}

function applyLegacyGaps(
  values: TokenDocument,
  scheme: string,
  roles: Readonly<Record<string, { type: string }>>,
  legacyNames: ReadonlySet<string>,
  weights: Readonly<Record<string, string>>,
): void {
  for (const name of Object.keys(roles)) {
    if (PACKS.some((pack) => name.startsWith(`${pack}-`))) continue;
    if (legacyNames.has(name)) continue;
    if (weights[name]) {
      values[name] = tokenAlias(weights[name], 'fontWeight');
      continue;
    }
    let target = LEGACY_ROLE_MAP[name];
    if (name.startsWith('text-')) {
      const sizes: Readonly<Record<string, string>> = {
        body: 'base',
        caption: 'xs',
        display: '4xl',
        heading: 'xl',
        kpi: '3xl',
        'kpi-sm': 'xl',
        label: 'sm',
        small: 'sm',
        strong: 'base',
        title: '2xl',
      };
      target = `text-${sizes[name.slice(5)] ?? 'base'}`;
    } else if (name.startsWith('leading-')) {
      const lines: Readonly<Record<string, string>> = {
        caption: 'text-lg',
        small: 'space-5',
        label: 'space-5',
        body: 'text-2xl',
        strong: 'text-2xl',
        heading: 'text-2xl',
        'kpi-sm': 'text-2xl',
        title: 'space-8',
        kpi: 'space-9',
        display: 'space-10',
      };
      target = lines[name.slice('leading-'.length)] ?? 'text-2xl';
    } else if (name.startsWith('tracking-')) target = 'tracking-normal';
    if (target) {
      values[name] = tokenAlias(`context.${scheme}.${target}`, roles[name].type);
      continue;
    }
    if (
      /^(info|accent|secondary|primary|success|warning|destructive)-(hover|text)$/.test(name) &&
      !Object.hasOwn(LEGACY_ROLE_MAP, name)
    ) {
      const intent = name.split('-')[0];
      values[name] = tokenAlias(
        `context.${scheme}.${intent === 'info' ? 'secondary' : intent}`,
        'color',
      );
    }
    if (name.startsWith('info-')) {
      const target = name.replace('info-', 'secondary-');
      values[name] = tokenAlias(`context.${scheme}.${target}`, 'color');
    }
  }
  values.info = tokenAlias(`context.${scheme}.secondary`, 'color');
  values['primary-container'] = tokenAlias(`context.${scheme}.primary-subtle`, 'color');
  values['primary-on-container'] = tokenAlias(`context.${scheme}.fg`, 'color');
}
