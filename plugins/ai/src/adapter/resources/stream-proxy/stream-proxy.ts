/** AI in-process stream route scaffolder.
 *
 * @module
 */

import {
  type ItemScaffolder,
  type ScaffoldArtifact,
  substituteTokens,
  textArtifact,
} from '@netscript/plugin/adapter';
import { streamProxyStub } from './stream-proxy.stub.ts';

/** Input accepted by the stream route scaffolder (fixed content). */
export type StreamProxyInput = Record<string, never>;

/** Canonical stream route input emitted during AI install. */
export const DEFAULT_STREAM_PROXY_INPUT: StreamProxyInput = {};

/** Emits the app-owned `ai/routes/chat-stream.ts` in-process stream route. */
export const streamProxyScaffolder: ItemScaffolder<StreamProxyInput> = {
  name: 'stream-proxy',
  emit(_input: StreamProxyInput): readonly ScaffoldArtifact[] {
    return [textArtifact('ai/routes/chat-stream.ts', substituteTokens(streamProxyStub, {}))];
  },
};
