import type { PluginPayloadSchema } from '../domain/mod.ts';
import { PluginContribution } from './plugin-contribution.ts';

/** Base class for stream topic contribution implementations. */
export abstract class PluginStreamTopicContribution<TPayload = never> extends PluginContribution {
  readonly axis = 'stream-topic' as const;
  abstract readonly name: string;
  abstract readonly subject: string;
  abstract readonly schema: PluginPayloadSchema<TPayload>;
}
