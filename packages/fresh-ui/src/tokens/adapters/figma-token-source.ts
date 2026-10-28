import {
  type DesignToken,
  type FigmaCollection,
  tokenAlias,
  type TokenDocument,
  type TokenPreset,
} from '../domain/token-contract.ts';
import { resolveFigmaValue } from '../domain/figma-aliases.ts';
import { figmaModes, TOKEN_PRESETS } from '../domain/token-presets.ts';
import { PRESET_ROLE_MAPS } from '../domain/preset-role-map.ts';
import { figmaPrimitive, legacyPrimitive } from './token-values.ts';
import { applyLegacyGaps } from '../domain/legacy-role-aliases.ts';
import { nameMigrations } from '../assets/metadata.generated.ts';

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
    if (roles[name] && roles[name].type !== token.$type) {
      throw new Error(`Conflicting exported types for --ns-${name}`);
    }
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
          const originalName = suffix(variable.codeSyntax);
          const migration = nameMigrations.migrations.find((entry) =>
            entry.collection === collection.collection && entry.variable === variable.name
          );
          if (migration && migration.originalCssVar !== `--ns-${originalName}`) {
            throw new Error(`Stale name migration: ${variable.name}`);
          }
          const name = migration ? migration.cssVar.slice('--ns-'.length) : originalName;
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
      for (
        const [name, variable] of Object.entries({
          'border-width': 'border/width',
          'shadow-offset-y': 'shadow/y',
          'shadow-blur': 'shadow/blur',
        })
      ) {
        const resolved = resolveFigmaValue(collections, 'Theme', variable, modes);
        const literal = figmaPrimitive(variable, 'FLOAT', resolved.value);
        values[name] = tokenAlias(lift(literal), literal.$type, {
          figma: { collection: 'Theme', name: variable, mode: preset.themeMode },
        });
        role(name, literal, ['semantic', name]);
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
      for (const speed of ['fast', 'normal', 'slow', 'spring']) {
        const shorthand = legacy.tokens[`ease-${speed}`].value;
        const duration: DesignToken = {
          $type: 'duration',
          $value: { value: Number.parseFloat(shorthand), unit: 'ms' },
        };
        const curve = shorthand.match(/cubic-bezier\(([^)]+)\)/);
        const easing: DesignToken = {
          $type: 'cubicBezier',
          $value: curve ? curve[1].split(',').map(Number) : [0.25, 0.1, 0.25, 1],
        };
        for (
          const [name, literal] of [[`motion-duration-${speed}`, duration], [
            `motion-easing-${speed}`,
            easing,
          ]] as const
        ) {
          values[name] = tokenAlias(lift(literal), literal.$type);
          role(name, literal, ['motion', name]);
        }
      }
      const tabular: DesignToken = {
        $type: 'number',
        $value: 1,
        $description:
          'Tabular data numerals from the design specifications and existing NS One data styles.',
      };
      values['font-tabular'] = tokenAlias(lift(tabular), 'number');
      role('font-tabular', tabular, ['typography', 'features']);
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
        const read = (name: string): string | number | boolean =>
          resolveFigmaValue(collections, 'Theme', name, modes).value;
        const y = Number(read('shadow/y'));
        const blur = Number(read('shadow/blur'));
        const x = preset.language === 'studio'
          ? Number(resolveFigmaValue(collections, 'Studio flavor', 'shadow/x', modes).value)
          : preset.id === 'brutal'
          ? y
          : 0;
        const color = String(read(`shadow/${scheme === 'light' ? 'l' : 'd'}/color`));
        const shadow = legacyPrimitive('shadow', `${x}px ${y}px ${blur}px ${color}`);
        const recipe: DesignToken = {
          ...shadow,
          $extensions: {
            netscript: {
              css: `${x}px var(--ns-shadow-offset-y) var(--ns-shadow-blur) var(--ns-shadow-color)`,
            },
          },
        };
        for (const size of ['xs', 'sm', 'md', 'lg', 'xl']) {
          values[`shadow-${size}`] = tokenAlias(lift(recipe), 'shadow', {
            derive: {
              kind: 'shadow',
              color: `context.${scheme}.shadow-color`,
              offsetY: `context.${scheme}.shadow-offset-y`,
              blur: `context.${scheme}.shadow-blur`,
              offsetX: x,
              spread: 0,
            },
          });
        }
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
      for (const name of ['font-sans', 'font-heading', 'font-kpi', 'font-label', 'font-data']) {
        const literal = figmaPrimitive(name.replace('font-', 'font/'), 'STRING', 'Inter');
        values[name] = tokenAlias(lift(literal), literal.$type);
      }
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
    const transparent = lift(figmaPrimitive('transparent', 'COLOR', '#00000000'));
    values['liquid-success-tint'] = tokenAlias(`context.${scheme}.liquid-tag-green`, 'color', {
      derive: {
        kind: 'mix',
        color: `context.${scheme}.liquid-tag-green`,
        with: transparent,
        weight: 0.12,
        space: 'oklab',
      },
    });
    role('liquid-success-tint', values['liquid-success-tint'] as DesignToken, [
      'semantic',
      'liquid-success-tint',
    ]);
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
        'tonal-radius-extra-small': 8,
        'tonal-radius-tiny': 6,
        'tonal-radius-minimum': 4,
      })
    ) addLiteral(values, name, raw, 'FLOAT');
    for (const size of [2, 14, 15, 18, 20, 21, 22, 24, 26, 28, 30, 32, 40]) {
      addLiteral(values, `bloom-radius-${size}`, size, 'FLOAT', 'bloom');
    }
    for (const size of [12, 13, 14, 15, 16, 17, 18, 22, 24, 28, 30, 32, 40, 48, 60, 92]) {
      addLiteral(values, `bloom-text-${size}`, size, 'FLOAT', 'bloom');
    }
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
