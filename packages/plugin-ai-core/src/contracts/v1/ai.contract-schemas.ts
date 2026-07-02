/**
 * Named, explicitly-annotated Zod schemas mirroring the `@netscript/ai/contracts`
 * streaming vocabulary. Every schema is annotated with a concrete Zod constructor
 * type so its `typeof` can feed the oRPC contract builder under
 * `--isolatedDeclarations` (the JSR no-slow-types bar) without upcasting to
 * `z.ZodType<T>` (which erases `_output` and reopens the handler-IO soundness
 * hole). The exported `*Schema` values are additionally annotated
 * `z.ZodType<EngineType>`, so this module fails to compile if a schema ever drifts
 * from the engine contract type it mirrors.
 *
 * @module
 */

import { z } from 'zod';
import type {
  AgentChunk,
  ContentPart,
  ContentSource,
  Message,
  ModelDescriptor,
  ToolCall,
  ToolDescriptor,
  ToolResult,
  Usage,
} from '@netscript/ai/contracts';

const dataContentSourceZodSchema: z.ZodObject<{
  type: z.ZodLiteral<'data'>;
  value: z.ZodString;
  mimeType: z.ZodString;
}> = z.object({ type: z.literal('data'), value: z.string(), mimeType: z.string() });

const urlContentSourceZodSchema: z.ZodObject<{
  type: z.ZodLiteral<'url'>;
  value: z.ZodString;
  mimeType: z.ZodOptional<z.ZodString>;
}> = z.object({ type: z.literal('url'), value: z.string(), mimeType: z.string().optional() });

/** Concrete schema for a {@link ContentSource} (inline data or URL reference). */
export const contentSourceZodSchema: z.ZodUnion<
  readonly [typeof dataContentSourceZodSchema, typeof urlContentSourceZodSchema]
> = z.union([dataContentSourceZodSchema, urlContentSourceZodSchema]);

const textContentPartZodSchema: z.ZodObject<{ type: z.ZodLiteral<'text'>; text: z.ZodString }> = z
  .object({ type: z.literal('text'), text: z.string() });

const imageContentPartZodSchema: z.ZodObject<{
  type: z.ZodLiteral<'image'>;
  source: typeof contentSourceZodSchema;
}> = z.object({ type: z.literal('image'), source: contentSourceZodSchema });

const audioContentPartZodSchema: z.ZodObject<{
  type: z.ZodLiteral<'audio'>;
  source: typeof contentSourceZodSchema;
}> = z.object({ type: z.literal('audio'), source: contentSourceZodSchema });

const videoContentPartZodSchema: z.ZodObject<{
  type: z.ZodLiteral<'video'>;
  source: typeof contentSourceZodSchema;
}> = z.object({ type: z.literal('video'), source: contentSourceZodSchema });

const documentContentPartZodSchema: z.ZodObject<{
  type: z.ZodLiteral<'document'>;
  source: typeof contentSourceZodSchema;
}> = z.object({ type: z.literal('document'), source: contentSourceZodSchema });

const contentPartZodSchema: z.ZodUnion<
  readonly [
    typeof textContentPartZodSchema,
    typeof imageContentPartZodSchema,
    typeof audioContentPartZodSchema,
    typeof videoContentPartZodSchema,
    typeof documentContentPartZodSchema,
  ]
> = z.union([
  textContentPartZodSchema,
  imageContentPartZodSchema,
  audioContentPartZodSchema,
  videoContentPartZodSchema,
  documentContentPartZodSchema,
]);

const messageContentZodSchema: z.ZodUnion<
  readonly [z.ZodString, z.ZodArray<typeof contentPartZodSchema>]
> = z.union([z.string(), z.array(contentPartZodSchema)]);

const toolCallStateZodSchema: z.ZodEnum<{
  'input-streaming': 'input-streaming';
  'input-complete': 'input-complete';
  'approval-requested': 'approval-requested';
  complete: 'complete';
  error: 'error';
}> = z.enum([
  'input-streaming',
  'input-complete',
  'approval-requested',
  'complete',
  'error',
]);

const toolCallZodSchema: z.ZodObject<{
  id: z.ZodString;
  name: z.ZodString;
  arguments: z.ZodString;
  state: z.ZodOptional<typeof toolCallStateZodSchema>;
}> = z.object({
  id: z.string(),
  name: z.string(),
  arguments: z.string(),
  state: toolCallStateZodSchema.optional(),
});

const toolResultStateZodSchema: z.ZodEnum<{ complete: 'complete'; error: 'error' }> = z.enum([
  'complete',
  'error',
]);

const toolResultZodSchema: z.ZodObject<{
  toolCallId: z.ZodString;
  content: typeof messageContentZodSchema;
  state: z.ZodOptional<typeof toolResultStateZodSchema>;
  error: z.ZodOptional<z.ZodString>;
}> = z.object({
  toolCallId: z.string(),
  content: messageContentZodSchema,
  state: toolResultStateZodSchema.optional(),
  error: z.string().optional(),
});

const messageZodSchema: z.ZodObject<{
  role: z.ZodEnum<{ system: 'system'; user: 'user'; assistant: 'assistant'; tool: 'tool' }>;
  content: typeof messageContentZodSchema;
  name: z.ZodOptional<z.ZodString>;
  toolCallId: z.ZodOptional<z.ZodString>;
  toolCalls: z.ZodOptional<z.ZodArray<typeof toolCallZodSchema>>;
}> = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: messageContentZodSchema,
  name: z.string().optional(),
  toolCallId: z.string().optional(),
  toolCalls: z.array(toolCallZodSchema).optional(),
});

// Core token fields only; the engine's optional per-category detail objects are omitted
// (all optional on `Usage`, so this stays assignable to `z.ZodType<Usage>`).
const usageZodSchema: z.ZodObject<{
  promptTokens: z.ZodNumber;
  completionTokens: z.ZodNumber;
  totalTokens: z.ZodNumber;
  cost: z.ZodOptional<z.ZodNumber>;
}> = z.object({
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
  cost: z.number().optional(),
});
const modelCapabilitiesZodSchema: z.ZodObject<{
  streaming: z.ZodOptional<z.ZodBoolean>;
  tools: z.ZodOptional<z.ZodBoolean>;
  vision: z.ZodOptional<z.ZodBoolean>;
  embeddings: z.ZodOptional<z.ZodBoolean>;
  maxInputTokens: z.ZodOptional<z.ZodNumber>;
  maxOutputTokens: z.ZodOptional<z.ZodNumber>;
}> = z.object({
  streaming: z.boolean().optional(),
  tools: z.boolean().optional(),
  vision: z.boolean().optional(),
  embeddings: z.boolean().optional(),
  maxInputTokens: z.number().int().positive().optional(),
  maxOutputTokens: z.number().int().positive().optional(),
});

/** Concrete schema for a {@link ModelDescriptor}. */
export const modelDescriptorZodSchema: z.ZodObject<{
  id: z.ZodString;
  provider: z.ZodString;
  displayName: z.ZodOptional<z.ZodString>;
  capabilities: z.ZodOptional<typeof modelCapabilitiesZodSchema>;
}> = z.object({
  id: z.string(),
  provider: z.string(),
  displayName: z.string().optional(),
  capabilities: modelCapabilitiesZodSchema.optional(),
});

const modelSelectorZodSchema: z.ZodObject<{ provider: z.ZodString; model: z.ZodString }> = z.object(
  {
    provider: z.string(),
    model: z.string(),
  },
);

/** Concrete schema for a `ModelRef` (`"provider:model"` string or selector). */
export const modelRefZodSchema: z.ZodUnion<
  readonly [z.ZodString, typeof modelSelectorZodSchema]
> = z.union([z.string(), modelSelectorZodSchema]);

const jsonSchemaZodSchema: z.ZodRecord<z.ZodString, z.ZodUnknown> = z.record(
  z.string(),
  z.unknown(),
);

const toolParametersZodSchema: z.ZodObject<{
  type: z.ZodLiteral<'object'>;
  properties: z.ZodOptional<z.ZodRecord<z.ZodString, typeof jsonSchemaZodSchema>>;
  required: z.ZodOptional<z.ZodArray<z.ZodString>>;
}> = z.object({
  type: z.literal('object'),
  properties: z.record(z.string(), jsonSchemaZodSchema).optional(),
  required: z.array(z.string()).optional(),
});

/** Concrete schema for a {@link ToolDescriptor} (provider-agnostic tool). */
export const toolDescriptorZodSchema: z.ZodObject<{
  name: z.ZodString;
  description: z.ZodOptional<z.ZodString>;
  parameters: typeof toolParametersZodSchema;
}> = z.object({
  name: z.string(),
  description: z.string().optional(),
  parameters: toolParametersZodSchema,
});

// Streamed chat chunk (SSE frame vocabulary): mirrors the engine `AgentChunk`
// union verbatim so a connector cannot silently buffer the durable-CHAT stream.
const textChunkZodSchema: z.ZodObject<{ type: z.ZodLiteral<'text'>; delta: z.ZodString }> = z
  .object(
    { type: z.literal('text'), delta: z.string() },
  );

const toolCallChunkZodSchema: z.ZodObject<{
  type: z.ZodLiteral<'tool-call'>;
  toolCall: typeof toolCallZodSchema;
}> = z.object({ type: z.literal('tool-call'), toolCall: toolCallZodSchema });

const toolResultChunkZodSchema: z.ZodObject<{
  type: z.ZodLiteral<'tool-result'>;
  result: typeof toolResultZodSchema;
}> = z.object({ type: z.literal('tool-result'), result: toolResultZodSchema });

const messageChunkZodSchema: z.ZodObject<{
  type: z.ZodLiteral<'message'>;
  message: typeof messageZodSchema;
}> = z.object({ type: z.literal('message'), message: messageZodSchema });

const usageChunkZodSchema: z.ZodObject<{
  type: z.ZodLiteral<'usage'>;
  usage: typeof usageZodSchema;
}> = z.object({ type: z.literal('usage'), usage: usageZodSchema });

const errorChunkZodSchema: z.ZodObject<{
  type: z.ZodLiteral<'error'>;
  error: z.ZodString;
  cause: z.ZodOptional<z.ZodUnknown>;
}> = z.object({ type: z.literal('error'), error: z.string(), cause: z.unknown().optional() });

const doneChunkZodSchema: z.ZodObject<{
  type: z.ZodLiteral<'done'>;
  usage: z.ZodOptional<typeof usageZodSchema>;
}> = z.object({ type: z.literal('done'), usage: usageZodSchema.optional() });

/**
 * Concrete schema for a single streamed chat chunk.
 *
 * A `z.ZodUnion` of the seven discriminated frame shapes. Feeds
 * `eventIterator(...)` in the contract so the `chat` route's output type is an
 * async event-iterator of these frames — never a bare response object (F-13).
 */
export const chatChunkZodSchema: z.ZodUnion<
  readonly [
    typeof textChunkZodSchema,
    typeof toolCallChunkZodSchema,
    typeof toolResultChunkZodSchema,
    typeof messageChunkZodSchema,
    typeof usageChunkZodSchema,
    typeof errorChunkZodSchema,
    typeof doneChunkZodSchema,
  ]
> = z.union([
  textChunkZodSchema,
  toolCallChunkZodSchema,
  toolResultChunkZodSchema,
  messageChunkZodSchema,
  usageChunkZodSchema,
  errorChunkZodSchema,
  doneChunkZodSchema,
]);
// Engine-derived drift guards: each fails to compile if a schema drifts from the engine type it mirrors.
const _contentSourceMatches: z.ZodType<ContentSource> = contentSourceZodSchema;
const _contentPartMatches: z.ZodType<ContentPart> = contentPartZodSchema;
const _toolCallMatches: z.ZodType<ToolCall> = toolCallZodSchema;
const _toolResultMatches: z.ZodType<ToolResult> = toolResultZodSchema;
const _messageMatches: z.ZodType<Message> = messageZodSchema;
const _usageMatches: z.ZodType<Usage> = usageZodSchema;
const _modelDescriptorMatches: z.ZodType<ModelDescriptor> = modelDescriptorZodSchema;
const _toolDescriptorMatches: z.ZodType<ToolDescriptor> = toolDescriptorZodSchema;
const _agentChunkMatches: z.ZodType<AgentChunk> = chatChunkZodSchema;

export { messageContentZodSchema, messageZodSchema, toolResultStateZodSchema, usageZodSchema };
