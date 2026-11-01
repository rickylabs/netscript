import type { ComponentContract } from '../../contracts.ts';
import type { ContractRenderFixture } from './style-provider.ts';
import { privateDataBindings, STRICT_NEW_COMPONENTS } from './strict-render-policy.ts';

/** Parse trusted server-rendered markup; styles are free to change element names and wrappers. */
export function renderedElements(html: string): readonly Readonly<Record<string, string>>[] {
  const elements: Record<string, string>[] = [];
  for (const tag of html.matchAll(/<[A-Za-z][\w:-]*\b(?:"[^"]*"|'[^']*'|[^'">])*>/g)) {
    const attributes: Record<string, string> = {};
    for (
      const attribute of tag[0].matchAll(
        /([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g,
      )
    ) {
      attributes[attribute[1]] = attribute[2] ?? attribute[3] ?? attribute[4] ?? '';
    }
    elements.push(attributes);
  }
  return elements;
}

/** Count independent instances, preserving valid nesting of the same component. */
function independentRoots(html: string, scope: string): number {
  const stack: { tag: string; root: boolean }[] = [];
  let roots = 0;
  for (const token of html.matchAll(/<\/?([A-Za-z][\w:-]*)\b(?:"[^"]*"|'[^']*'|[^'">])*>/g)) {
    const tag = token[1].toLowerCase();
    if (token[0].startsWith('</')) {
      const index = stack.findLastIndex((entry) => entry.tag === tag);
      if (index >= 0) stack.length = index;
      continue;
    }
    const attrs = renderedElements(token[0])[0];
    const root = attrs['data-scope'] === scope && attrs['data-part'] === 'root';
    if (root && !stack.some((entry) => entry.root)) roots++;
    if (
      !token[0].endsWith('/>') &&
      !/^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/.test(tag)
    ) {
      stack.push({ tag, root });
    }
  }
  return roots;
}

/** Return contract violations independently of CSS, tag choices or Utility classes. */
export function renderViolations(
  contract: ComponentContract,
  fixture: ContractRenderFixture,
  html: string,
  strict: boolean = STRICT_NEW_COMPONENTS.includes(contract.name),
): readonly string[] {
  const errors: string[] = [];
  if (fixture.contextOnly) {
    if (strict) errors.push('strict element fixtures cannot bypass rendered attribute checks');
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
  if (independentRoots(html, scope) > 1) {
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
    if (strict) {
      if (!element['data-part']) errors.push('scoped element lacks data-part');
      for (const name of Object.keys(element).filter((name) => name.startsWith('data-'))) {
        if (name === 'data-scope' || name === 'data-part') continue;
        const axis = contract.attributes[name as `data-${string}`];
        if (axis) {
          if (!(axis.parts ?? ['root']).includes(element['data-part'])) {
            errors.push(`${element['data-part']}: ${name} is not allowed on this part`);
          }
        } else if (
          name.startsWith('data-x-') ||
          !privateDataBindings.some((binding) =>
            binding.component === contract.name && binding.part === element['data-part'] &&
            binding.attribute === name && binding.purpose.trim().length > 0
          )
        ) errors.push(`${element['data-part']}: undeclared attribute ${name}`);
      }
    }
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
