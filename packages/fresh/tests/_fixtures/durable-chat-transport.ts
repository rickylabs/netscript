/**
 * Upstream durable chat writer, re-exported through `@netscript/fresh`'s own import map so
 * out-of-package regressions can compare the unfenced path against it byte for byte. @module
 */
export { toDurableChatSessionResponse } from '@durable-streams/tanstack-ai-transport';
