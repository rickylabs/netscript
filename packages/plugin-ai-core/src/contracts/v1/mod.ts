/**
 * Version 1 AI plugin contract: the `/v1/ai` route surface, its streamed-chunk
 * IO schemas, and the engine-derived vocabulary types.
 *
 * This subpath is the full contract surface (Zod validators + types + the oRPC
 * contract handles). The package root (`@netscript/plugin-ai-core`) re-exports a
 * curated, ≤20-symbol subset of it.
 *
 * @module
 */

export {
  aiContract,
  aiContractV1,
  ChatChunkSchema,
  ChatInputSchema,
  EmbedInputSchema,
  EmbedResponseSchema,
  ModelsInputSchema,
  ModelsResponseSchema,
  ToolInvokeInputSchema,
  ToolInvokeResponseSchema,
  TranscribeInputSchema,
  TranscribeResponseSchema,
} from './ai.contract.ts';
export type {
  AgentChunk,
  AiCapabilities,
  AiContract,
  AiContractDefinition,
  AiContractV1,
  AiRouter,
  ChatChunk,
  ChatInput,
  ContentPart,
  ContentSource,
  EmbedInput,
  EmbedResponse,
  Message,
  MessageContent,
  MessageRole,
  ModelCapabilities,
  ModelDescriptor,
  ModelRef,
  ModelSelector,
  ModelsInput,
  ModelsResponse,
  ToolCall,
  ToolDescriptor,
  ToolInvokeInput,
  ToolInvokeResponse,
  ToolResult,
  ToolResultState,
  TranscribeInput,
  TranscribeResponse,
  Usage,
} from './ai.contract.ts';
