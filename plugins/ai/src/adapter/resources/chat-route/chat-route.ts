/** AI chat island scaffolder.
 *
 * @module
 */

import {
  type ItemScaffolder,
  type ScaffoldArtifact,
  substituteTokens,
  textArtifact,
} from '@netscript/plugin/adapter';
import { chatRouteStub } from './chat-route.stub.ts';

/** Input accepted by the chat island scaffolder (fixed content). */
export type ChatRouteInput = Record<string, never>;

/** Canonical chat island input emitted during AI install. */
export const DEFAULT_CHAT_ROUTE_INPUT: ChatRouteInput = {};

/** Emits the app-owned `ai/routes/chat.tsx` TanStack-backed chat island. */
export const chatRouteScaffolder: ItemScaffolder<ChatRouteInput> = {
  name: 'chat-route',
  emit(_input: ChatRouteInput): readonly ScaffoldArtifact[] {
    return [textArtifact('ai/routes/chat.tsx', substituteTokens(chatRouteStub, {}))];
  },
};
