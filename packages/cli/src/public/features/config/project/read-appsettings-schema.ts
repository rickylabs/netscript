/**
 * @module public/features/config/project/read-appsettings-schema
 *
 * Reads the appsettings JSON Schema that the Aspire generator's own parser is
 * built from, and exposes it as a walkable tree.
 *
 * `@netscript/aspire` generates this schema from the same Zod definitions
 * `parseAppSettings()` validates with, so it is the authority on which keys the
 * generator reads. Nothing here hardcodes a key name: every field name the CLI
 * offers, canonicalizes, or rejects comes from this tree at call time.
 *
 * Two node kinds matter, and the JSON Schema distinguishes them:
 *
 * - a **closed object** (`properties` + `additionalProperties: false`) holds
 *   schema-declared field names;
 * - a **record** (`additionalProperties: <schema>`) holds user-chosen keys
 *   (`postgres`, `deno-kv`, a service name), which are data, not schema.
 */

import { generateAppSettingsJsonSchema } from '@netscript/aspire/schema';

/** A JSON Schema node from the generated appsettings schema. */
export type SchemaNode = Readonly<Record<string, unknown>>;

/** The children of one schema node, split by the two node kinds that matter. */
export interface SchemaChildren {
  /** Schema-declared property name → child node. Empty for a record node. */
  readonly fields: Readonly<Record<string, SchemaNode>>;
  /** Child schema for arbitrary user-chosen keys, when the node is a record. */
  readonly record?: SchemaNode;
}

/** The generated appsettings JSON Schema, the authority on which keys exist. */
export function appsettingsSchemaRoot(): SchemaNode {
  return generateAppSettingsJsonSchema();
}

/** Split one schema node into its declared fields and its record child, if any. */
export function schemaChildren(node: SchemaNode): SchemaChildren {
  const fields: Record<string, SchemaNode> = {};
  let record: SchemaNode | undefined;
  for (const member of schemaMembers(node)) {
    if (isObject(member.properties)) {
      for (const [name, child] of Object.entries(member.properties)) {
        if (isObject(child)) fields[name] = child;
      }
    }
    if (isObject(member.additionalProperties)) record = member.additionalProperties;
  }
  return record ? { fields, record } : { fields };
}

/** Read one key from a JSON-like value, or `undefined` when it is not an object. */
export function step(target: unknown, key: string): unknown {
  return isObject(target) ? target[key] : undefined;
}

/** Whether a value is a plain JSON object (and so has addressable keys). */
export function isObject(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Flatten `allOf` wrappers so one node's children are visible in a single pass. */
function schemaMembers(node: SchemaNode): SchemaNode[] {
  const members: SchemaNode[] = [node];
  if (Array.isArray(node.allOf)) {
    for (const member of node.allOf) {
      if (isObject(member)) members.push(...schemaMembers(member));
    }
  }
  return members;
}
