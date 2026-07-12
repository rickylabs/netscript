/** Stream schema resource scaffolder. */

import {
  type ItemScaffolder,
  type PluginCliArgs,
  type PluginResource,
  type ScaffoldArtifact,
  substituteTokens,
  textArtifact,
} from '@netscript/plugin/adapter';
import { exportStem, fileStem, requiredResourceId } from '../input.ts';
import { streamSchemaStub } from './schema.stub.ts';

/** One collection requested by `streams add-schema`. */
export interface StreamSchemaCollectionInput {
  readonly name: string;
  readonly type: string;
  readonly primaryKey: string;
}

/** Input accepted by the stream schema scaffolder. */
export interface StreamSchemaInput {
  readonly name: string;
  readonly collections: readonly StreamSchemaCollectionInput[];
}

/** Emit a `defineStreamSchema` module. */
export const streamSchemaScaffolder: ItemScaffolder<StreamSchemaInput> = {
  name: 'schema',
  emit(input: StreamSchemaInput): readonly ScaffoldArtifact[] {
    return [
      textArtifact(
        `streams/${fileStem(input.name)}-schema.ts`,
        substituteTokens(streamSchemaStub, {
          COLLECTIONS: renderCollections(input.collections),
          SCHEMA_EXPORT: `${exportStem(input.name)}StreamSchema`,
        }),
      ),
    ];
  },
};

/** Schema resource exposed through the generic plugin adapter. */
export const streamSchemaResource: PluginResource<StreamSchemaInput> = {
  name: 'schema',
  scaffolder: streamSchemaScaffolder,
  parseInput: parseStreamSchemaInput,
};

/** Parse `add schema <name> --collection name=type:primaryKey`. */
export function parseStreamSchemaInput(args: PluginCliArgs): StreamSchemaInput {
  const name = requiredResourceId(args);
  const raw = args.flags?.collection;
  const values = raw === undefined ? [] : String(raw).split(',').filter(Boolean);
  return {
    name,
    collections: values.length > 0
      ? values.map(parseCollection)
      : [{ name: 'event', type: `${fileStem(name)}.event`, primaryKey: 'id' }],
  };
}

function parseCollection(value: string): StreamSchemaCollectionInput {
  const [name, contract] = value.split('=', 2);
  const [type, primaryKey] = contract?.split(':', 2) ?? [];
  if (!name || !type || !primaryKey) {
    throw new TypeError(`Invalid --collection "${value}"; expected name=type:primaryKey.`);
  }
  return { name: fileStem(name).replaceAll('-', '_'), type, primaryKey };
}

function renderCollections(collections: readonly StreamSchemaCollectionInput[]): string {
  return collections.map((collection) =>
    `  ${collection.name}: {
    schema: z.object({ ${JSON.stringify(collection.primaryKey)}: z.string() }).passthrough(),
    type: ${JSON.stringify(collection.type)},
    primaryKey: ${JSON.stringify(collection.primaryKey)},
  },`
  ).join('\n');
}
