import type { ComponentContract } from '../../contracts.ts';
import type { ContractRenderFixture } from './style-provider.ts';

/** Parse trusted server-rendered markup; styles are free to change element names and wrappers. */
export function renderedElements(html: string): readonly Readonly<Record<string, string>>[] {
  const elements: Record<string, string>[] = [];
  for (const tag of html.matchAll(/<[A-Za-z][\w:-]*\b(?:"[^"]*"|'[^']*'|[^'">])*>/g)) {
    const attributes: Record<string, string> = {};
    for (const attribute of tag[0].matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
      attributes[attribute[1]] = attribute[2] ?? attribute[3];
    }
    elements.push(attributes);
  }
  return elements;
}

/** Return contract violations independently of CSS, tag choices or Utility classes. */
export function renderViolations(
  contract: ComponentContract,
  fixture: ContractRenderFixture,
  html: string,
): readonly string[] {
  const errors: string[] = [];
  if (fixture.contextOnly) {
    if (contract.parts.find((part) => part.name === 'root')?.representation !== 'context') {
      errors.push('context-only fixture requires a context contract root');
    }
    if (fixture.expectedHtml === undefined || html !== fixture.expectedHtml) {
      errors.push('context-only output differs from its declared fixture expectation');
    }
    return errors;
  }
  const scope = fixture.scope ?? contract.name;
  const all = renderedElements(html);
  const elements = all.filter((element) => element['data-scope'] === scope);
  if (!elements.length) errors.push(`missing component scope ${scope}`);
  if (elements.filter((element) => element['data-part'] === 'root').length > 1) {
    errors.push('duplicate root part');
  }
  const parts = new Set(elements.map((element) => element['data-part']).filter(Boolean));
  const required = contract.parts.filter((part) =>
    !part.when && !part.planned && (!part.representation || part.representation === 'element')
  ).map((part) => part.name);
  for (const name of new Set([...required, ...fixture.parts ?? []])) {
    if (!parts.has(name)) errors.push(`missing part ${name}`);
  }
  for (const part of parts) {
    if (!contract.parts.some((expected) => expected.name === part)) {
      errors.push(`unknown part ${part}`);
    }
  }
  for (const element of elements) {
    for (const [name, axis] of Object.entries(contract.attributes)) {
      const value = element[name];
      if (
        value !== undefined && (axis.parts ?? ['root']).includes(element['data-part']) &&
        ![...axis.values, ...axis.compatibilityValues ?? []].includes(value)
      ) errors.push(`${element['data-part']}: invalid ${name}=${value}`);
    }
  }
  for (const name of fixture.attributes ?? []) {
    if (!contract.attributes[name as `data-${string}`]) {
      errors.push(`fixture requires undeclared attribute ${name}`);
    }
    if (!elements.some((element) => element[name] !== undefined)) {
      errors.push(`missing attribute ${name}`);
    }
  }
  return errors;
}
