import { Ajv } from 'npm:ajv@8.20.0';
import { itemSchema, registrySchema } from './assets/registry.generated.ts';
import type { Registry, RegistryItem } from './registry-contract.ts';

/** Upstream schema URI used by authoring registries and static catalogs. */
export const REGISTRY_SCHEMA_URL = 'https://ui.shadcn.com/schema/registry.json';
/** Upstream schema URI used by static item payloads. */
export const REGISTRY_ITEM_SCHEMA_URL = 'https://ui.shadcn.com/schema/registry-item.json';

/** Compile the pinned published schema snapshot, with no network schema resolution. */
function registryValidator() {
  const ajv = new Ajv({ allErrors: true, strict: false, validateFormats: false });
  // Ajv bundles draft-07 under HTTP; upstream uses its equivalent HTTPS dialect URI.
  const dialect = 'http://json-schema.org/draft-07/schema#';
  const item = { ...itemSchema, $schema: dialect };
  ajv.addSchema(item, REGISTRY_ITEM_SCHEMA_URL);
  return {
    registry: ajv.compile<Registry>({ ...registrySchema, $schema: dialect }),
    item: ajv.compile<RegistryItem>(item),
    ajv,
  };
}

const validators = registryValidator();

/** Validate an untrusted registry against the published schema and reject duplicate names. */
export function validateRegistry(value: unknown): Registry {
  const { registry: validate, ajv } = validators;
  if (!validate(value)) throw new Error(`Invalid registry: ${ajv.errorsText(validate.errors)}`);
  const items = value.items ?? [];
  const seen = new Set<string>();
  for (const item of items) {
    assertRegistryName(item.name);
    if (seen.has(item.name)) throw new Error(`Duplicate registry item: ${item.name}`);
    seen.add(item.name);
  }
  return { ...value, items };
}

/** Validate one untrusted item against the pinned published item schema. */
export function validateRegistryItem(value: unknown): RegistryItem {
  const { item: validate, ajv } = validators;
  if (!validate(value)) {
    throw new Error(`Invalid registry item: ${ajv.errorsText(validate.errors)}`);
  }
  assertRegistryName(value.name);
  return value;
}

/** Keep static item filenames and item references unambiguous and path-safe. */
export function assertRegistryName(name: string): void {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name) || name === '.' || name === '..') {
    throw new Error('Registry item names must be simple ids without path separators');
  }
}
