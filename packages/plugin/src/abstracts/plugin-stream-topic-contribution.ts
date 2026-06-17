import type { PluginPayloadSchema } from '../domain/mod.ts';
import { PluginContribution } from './plugin-contribution.ts';

/** Base class for stream topic contribution implementations. */
export abstract class PluginStreamTopicContribution<TPayload = never> extends PluginContribution {
  /** Contribution axis for stream topics. */
  readonly axis = 'stream-topic' as const;
  /** Stable stream topic name. */
  abstract readonly name: string;
  /** Transport subject or topic identifier. */
  abstract readonly subject: string;
  /** Payload schema accepted for this stream topic. */
  abstract readonly schema: PluginPayloadSchema<TPayload>;
}
