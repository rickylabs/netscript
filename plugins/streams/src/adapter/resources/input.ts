/** Shared input helpers for streams adapter resources.
 *
 * @module
 */

import type { PluginCliArgs } from '@netscript/plugin/adapter';

/** Input accepted by the streams stream resource. */
export interface StreamInput {
  /** Stable stream identifier supplied by the user. */
  readonly id: string;
  /** Optional output directory relative to the project root. */
  readonly directory?: string;
  /** Durable stream event type. */
  readonly eventType?: string;
  /** Durable Streams route used by the producer. */
  readonly streamPath?: string;
  /** Stable producer id used by the generated producer. */
  readonly producerId?: string;
}

/** Convert a stream identifier into a stable file stem. */
export function fileStem(id: string): string {
  return id.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Convert a stream identifier into a PascalCase exported symbol stem. */
export function exportStem(id: string): string {
  const pascal = fileStem(id)
    .split('-')
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join('');
  return pascal.length > 0 ? pascal : 'Generated';
}

/** Convert a stream identifier into a lower camelCase exported symbol stem. */
export function camelStem(id: string): string {
  const pascal = exportStem(id);
  return `${pascal.slice(0, 1).toLowerCase()}${pascal.slice(1)}`;
}

/** Parse stream resource input from adapter CLI args. */
export function parseStreamInput(args: PluginCliArgs): StreamInput {
  return {
    id: requiredResourceId(args),
    directory: stringFlag(args, 'dir') ?? stringFlag(args, 'directory'),
    eventType: stringFlag(args, 'event-type'),
    streamPath: stringFlag(args, 'stream-path'),
    producerId: stringFlag(args, 'producer-id'),
  };
}

/** Read the resource id from either adapter-form or legacy command-form args. */
export function requiredResourceId(args: PluginCliArgs): string {
  const [, adapterId] = args.values ?? [];
  const legacyId = args.values?.[0];
  const id = args.command === 'add' || args.command === 'generate' ? adapterId : legacyId;
  if (!id || id.trim().length === 0) {
    throw new Error('Missing streams resource id.');
  }
  return id;
}

/** Resolve the directory where stream userland files are emitted. */
export function streamDirectory(input: StreamInput): string {
  return input.directory?.replace(/\\/g, '/') ?? 'streams';
}

/** Resolve the stream event type for generated source. */
export function streamEventType(input: StreamInput): string {
  return input.eventType?.trim() || `${fileStem(input.id)}.event`;
}

/** Resolve the route path used by the generated stream producer. */
export function durableStreamPath(input: StreamInput): string {
  return input.streamPath?.trim() || `/v1/streams/${fileStem(input.id)}/events`;
}

/** Resolve the producer id used by the generated stream producer. */
export function streamProducerId(input: StreamInput): string {
  return input.producerId?.trim() || `${fileStem(input.id)}-producer`;
}

function stringFlag(args: PluginCliArgs, name: string): string | undefined {
  const value = args.flags?.[name];
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return undefined;
}
