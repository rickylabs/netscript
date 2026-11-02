import type { PropDoc } from './catalog.ts';

export function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Deno 2.9's structured type representation, including anonymous unions and intersections. */
export function typeText(value: unknown): string {
  if (!record(value)) return 'unknown';
  if (value.kind === 'literal' && record(value.value)) {
    return value.value.kind === 'string'
      ? JSON.stringify(value.value.string)
      : String(value.value.number ?? value.value.boolean ?? value.repr);
  }
  if (value.kind === 'typeRef' && record(value.value)) {
    const args = Array.isArray(value.value.typeParams) ? value.value.typeParams : [];
    return String(value.value.typeName) +
      (args.length ? `<${args.map(typeText).join(', ')}>` : '');
  }
  if (Array.isArray(value.value)) {
    return value.value.map(typeText).join(value.kind === 'intersection' ? ' & ' : ' | ');
  }
  if (value.kind === 'array') return `${typeText(value.value)}[]`;
  if (value.kind === 'typeLiteral' && record(value.value)) {
    const props = Array.isArray(value.value.properties) ? value.value.properties : [];
    return `{ ${
      props.filter(record).map((p) => `${p.name}${p.optional ? '?' : ''}: ${typeText(p.tsType)}`)
        .join('; ')
    } }`;
  }
  if (value.kind === 'fnOrConstructor' && record(value.value)) {
    const params = Array.isArray(value.value.params) ? value.value.params : [];
    return `(${
      params.filter(record).map((p) => `${p.name ?? 'value'}: ${typeText(p.tsType)}`).join(', ')
    }) => ${typeText(value.value.tsType)}`;
  }
  return typeof value.repr === 'string' ? value.repr : String(value.value ?? 'unknown');
}

/** Read all locally declared prop interfaces, including compound-component subcomponent props. */
export function implementationProps(node: unknown): PropDoc[] {
  if (!record(node) || !Array.isArray(node.symbols)) throw new Error('Invalid deno doc node');
  const output: PropDoc[] = [];
  const visit = (value: unknown, owner: string): void => {
    if (!record(value)) return;
    if (Array.isArray(value.properties)) {
      for (const prop of value.properties.filter(record)) {
        if (typeof prop.name !== 'string') continue;
        output.push({
          owner,
          name: prop.name,
          type: typeText(prop.tsType),
          optional: prop.optional === true,
          description: record(prop.jsDoc) ? String(prop.jsDoc.doc ?? '') : '',
        });
      }
    }
    visit(value.tsType, owner);
    if (Array.isArray(value.value)) { for (const child of value.value) visit(child, owner); }
    else visit(value.value, owner);
  };
  for (const symbol of node.symbols.filter(record)) {
    if (typeof symbol.name !== 'string' || !/Props$/.test(symbol.name)) continue;
    if (!Array.isArray(symbol.declarations)) continue;
    for (const declaration of symbol.declarations.filter(record)) {
      visit(declaration.def, symbol.name);
    }
  }
  return output;
}
