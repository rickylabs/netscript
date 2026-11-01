import { z } from 'npm:zod@^4.6.5';
import type { ComponentContractCatalog } from '../../../packages/fresh-ui/contracts.ts';
import { expandTokenRole } from './token-bindings.ts';

const identifier = z.string().regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/);
const value = z.string().min(1).regex(/^[^,=\r\n]+$/).refine(
  (v) => v.trim() === v,
  'Untrimmed variant value',
);
const values = z.array(value).min(1).refine(
  (v) => new Set(v).size === v.length,
  'Duplicate values',
);
const prop = z.object({
  kind: z.enum(['text', 'boolean', 'number', 'enum', 'slot', 'callback', 'collection']),
  required: z.boolean().optional(),
  values: values.optional(),
  default: z.union([z.string(), z.number().finite(), z.boolean(), z.null()]).optional(),
  description: z.string().optional(),
}).strict();
const part = z.object({
  name: identifier,
  when: z.string().min(1).optional(),
  representation: z.enum(['element', 'native', 'pseudo', 'context']).optional(),
  planned: z.boolean().optional(),
}).strict();
const attribute = z.object({
  values,
  default: value.optional(),
  parts: z.array(identifier).optional(),
  compatibilityValues: values.optional(),
  plannedValues: values.optional(),
  description: z.string().optional(),
}).strict();
const catalogSchema: z.ZodType<ComponentContractCatalog> = z.object({
  schemaVersion: z.literal(1),
  components: z.array(
    z.object({
      name: identifier,
      specId: z.string().min(1),
      category: z.string().min(1),
      priority: z.enum(['P0', 'P1', 'P2']),
      shipped: z.boolean(),
      props: z.record(z.string().min(1), prop),
      parts: z.array(part).min(1),
      attributes: z.record(z.string().regex(/^data-[a-z][a-z0-9-]*$/), attribute),
      booleans: z.array(z.string().min(1)),
      slots: z.array(z.object({ name: z.string().min(1), part: identifier }).strict()),
      apg: z.string().min(1),
      keyboard: z.array(z.object({ key: z.string().min(1), action: z.string().min(1) }).strict()),
      tokenRoles: z.array(z.string().min(1)),
      notes: z.array(z.string()),
    }).strict(),
  ).min(1),
}).strict();

function unique(values: readonly string[], location: string): void {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${location}`);
}

/** Validate anatomy references and all source contracts, including contracts outside a selection. */
export function validateContracts(input: unknown): ComponentContractCatalog {
  const catalog = catalogSchema.parse(input);
  unique(catalog.components.map((c) => c.name), 'contract name');
  unique(catalog.components.map((c) => c.specId), 'contract specId');
  for (const c of catalog.components) {
    const parts = new Set(c.parts.map((p) => p.name));
    if (!parts.has('root')) throw new Error(`Missing root part: ${c.name}`);
    unique([...c.parts.map((p) => p.name)], `${c.name} part`);
    unique(c.booleans, `${c.name} boolean`);
    unique(c.slots.map((s) => s.name), `${c.name} slot`);
    unique(c.tokenRoles, `${c.name} token role`);
    for (const role of c.tokenRoles) expandTokenRole(role);
    for (const [name, a] of Object.entries(c.attributes)) {
      if (a.default !== undefined && !a.values.includes(a.default)) {
        throw new Error(`Unknown default: ${c.name}/${name}`);
      }
      if (a.plannedValues?.some((v) => !a.values.includes(v))) {
        throw new Error(`Unknown planned value: ${c.name}/${name}`);
      }
      unique(a.parts ?? [], `${c.name}/${name} part`);
      for (const part of a.parts ?? []) {
        if (!parts.has(part)) throw new Error(`Unknown part: ${c.name}/${name}/${part}`);
      }
    }
    for (const slot of c.slots) {
      if (!parts.has(slot.part)) throw new Error(`Unknown slot part: ${c.name}/${slot.part}`);
    }
    for (const name of c.booleans) {
      // Visibility can be driven by a slot's presence or an enum as well as a boolean prop.
      if (!Object.hasOwn(c.props, name)) {
        throw new Error(`Unknown visibility prop: ${c.name}/${name}`);
      }
    }
  }
  return catalog;
}
