import { tokenAlias, type TokenDocument } from './token-contract.ts';
import { LEGACY_ROLE_MAP } from './preset-role-map.ts';

const PACKS = ['studio', 'bloom', 'liquid', 'cupertino', 'tactile', 'fluent', 'pixel', 'terminal'];

/** Fill new NS One roles from its existing values without changing legacy declarations. */
export function applyLegacyGaps(
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
