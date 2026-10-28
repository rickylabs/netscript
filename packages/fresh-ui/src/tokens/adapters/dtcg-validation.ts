import { Ajv } from 'npm:ajv@8.20.0';
import formatSchema from '../../../tokens/schemas/format.json' with { type: 'json' };
import resolverSchema from '../../../tokens/schemas/resolver.json' with { type: 'json' };
import { assertSemanticSourceAliases, type TokenSources } from '../domain/resolve-tokens.ts';

/** Validate with the unchanged, upstream DTCG schemas rather than an importer mirror. */
export function validateDtcgSources(sources: TokenSources): void {
  const ajv = new Ajv({ allErrors: true, strict: false, validateFormats: false });
  const format = ajv.compile(formatSchema);
  // Each official bundle contains the format IDs; isolate their registries.
  const resolver = new Ajv({ allErrors: true, strict: false, validateFormats: false })
    .compile(resolverSchema);
  if (!resolver(sources.resolver)) {
    throw new Error(`Invalid DTCG resolver: ${ajv.errorsText(resolver.errors)}`);
  }
  for (const [name, document] of Object.entries(sources.documents)) {
    if (!format(document)) {
      const errors = format.errors?.slice(0, 8);
      throw new Error(`Invalid DTCG document ${name}: ${ajv.errorsText(errors)}`);
    }
    assertSemanticSourceAliases(document);
  }
  const inline = [
    ...Object.values(sources.resolver.sets).flatMap((set) => set.sources),
    ...Object.values(sources.resolver.modifiers).flatMap((modifier) =>
      Object.values(modifier.contexts).flat()
    ),
  ];
  for (const source of inline) if (!('$ref' in source)) assertSemanticSourceAliases(source);
}
