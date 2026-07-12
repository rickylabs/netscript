/**
 * AI plugin v1 oRPC contract definition.
 *
 * A thin, contract-only surface: it declares the `/v1/ai` route shapes (`chat`,
 * `models`, `tools/:name`, `embed`, `transcribe`) and the mandatory `describe`
 * base-seam route, with zero service implementation. The `chat` route is
 * SSE-framed — its output is an `eventIterator` of streamed chat chunks, so a
 * connector (P2) cannot silently degrade the durable-CHAT stream to a single
 * buffered response.
 *
 * Route paths are relative (`/chat`, `/models`, …); the `/v1/ai` prefix is
 * applied where the service host mounts the router.
 *
 * @module
 */

import { oc } from '@orpc/contract';
import type {
  AnySchema,
  ContractProcedureBuilderWithInputOutput,
  ErrorMap,
  MergedErrorMap,
} from '@orpc/contract';
import { eventIterator, implement, type Implementer } from '@orpc/server';
import { z } from 'zod';
import {
  BASE_PLUGIN_CONTRACT_ROUTES,
  BASE_PLUGIN_ERRORS,
  type BasePluginContract,
  type BasePluginDescribeRoute,
} from '@netscript/plugin/contract-base';
import type {
  AgentChunk,
  ContentSource,
  Message,
  MessageContent,
  ModelDescriptor,
  ModelRef,
  ToolDescriptor,
  ToolResultState,
  Usage,
} from '@netscript/ai/contracts';
import {
  chatChunkZodSchema,
  contentSourceZodSchema,
  messageContentZodSchema,
  messageZodSchema,
  modelDescriptorZodSchema,
  modelRefZodSchema,
  toolDescriptorZodSchema,
  toolResultStateZodSchema,
  usageZodSchema,
} from './ai.contract-schemas.ts';

// --- Message-body type re-exports --------------------------------------------
// Plugin IO derives from the engine vocabulary rather than redeclaring it.

export type {
  BasePluginContract,
  BasePluginDescribeRoute,
  PluginCapabilities,
} from '@netscript/plugin/contract-base';

export type {
  AgentChunk,
  AudioContentPart,
  CompletionTokensDetails,
  ContentModality,
  ContentPart,
  ContentSource,
  DataContentSource,
  DocumentContentPart,
  DoneChunk,
  ErrorChunk,
  ImageContentPart,
  JsonSchema,
  Message,
  MessageChunk,
  MessageContent,
  MessageRole,
  ModelCapabilities,
  ModelDescriptor,
  ModelId,
  ModelRef,
  ModelSelector,
  PromptTokensDetails,
  ProviderUsageDetails,
  ReasoningChunk,
  TextChunk,
  TextContentPart,
  ToolCall,
  ToolCallChunk,
  ToolCallState,
  ToolDescriptor,
  ToolParameters,
  ToolResult,
  ToolResultChunk,
  ToolResultState,
  UrlContentSource,
  Usage,
  UsageChunk,
  UsageCostBreakdown,
  VideoContentPart,
} from '@netscript/ai/contracts';

/**
 * Public, capability-document shape returned by the mandatory `describe` route.
 *
 * Named public alias of {@link PluginCapabilities} so consumers can reference
 * the AI describe-output type without reaching into `@netscript/plugin`.
 */
export interface AiCapabilities {
  /** Canonical plugin package name, for example `@netscript/plugin-ai`. */
  readonly pluginName: string;
  /** Contract version identifiers served by the plugin. */
  readonly contractVersions: readonly string[];
  /** Route group names exposed by the plugin. */
  readonly routeGroups: readonly string[];
  /** Capability tags advertised by the plugin. */
  readonly capabilities: readonly string[];
}

// --- Base contract vocabulary ------------------------------------------------
// Converge onto the shared plugin error vocabulary (NOT_FOUND, VALIDATION_ERROR,
// INTERNAL). `BASE_PLUGIN_ERRORS` types each `data` field as `unknown` (a plain
// error vocabulary, not a builder fragment), so it crosses into the oRPC
// contract builder via the single sanctioned centralized-contract boundary cast
// — the same pattern `BASE_PLUGIN_CONTRACT_ROUTES` uses. Everything downstream
// (routes, schemas, the contract type, `implement`) is genuinely typed.
const baseContract: ReturnType<typeof oc.errors> = oc.errors(
  { ...BASE_PLUGIN_ERRORS } as unknown as Parameters<typeof oc.errors>[0], // quality-allow: oRPC's invariant error-map input rejects the shared package-owned error vocabulary despite matching its runtime schema.
);

/**
 * Error map carried by every non-streaming route built from {@link baseContract}.
 */
type BaseErrors = MergedErrorMap<Record<never, never>, ErrorMap>;

/**
 * Precise type of a route built via `baseContract.route(...).input(...).output(...)`.
 *
 * Parameterized on the input and output schemas so `typeof <inputConst>` and
 * `typeof <outputConst>` (each an explicitly-annotated Zod schema) flow through
 * to {@link implement}, keeping every handler's input/output precisely typed.
 */
type Route<TIn extends AnySchema, TOut extends AnySchema> = ContractProcedureBuilderWithInputOutput<
  TIn,
  TOut,
  BaseErrors,
  Record<never, never>
>;

// --- Route IO types ----------------------------------------------------------

/** Input accepted by the `chat` streaming endpoint. */
export type ChatInput = Readonly<{
  model: ModelRef;
  messages: readonly Message[];
  tools?: readonly ToolDescriptor[];
  system?: string;
  temperature?: number;
  maxTokens?: number;
  metadata?: Record<string, unknown>;
}>;

/** A single streamed chat frame. Alias of the engine {@link AgentChunk} union. */
export type ChatChunk = AgentChunk;

/** Optional filter accepted by the `models` endpoint. */
export type ModelsInput = Readonly<{ provider?: string }> | undefined;

/** Response returned by the `models` endpoint. */
export type ModelsResponse = Readonly<{ models: readonly ModelDescriptor[] }>;

/** Input accepted by the `tools/:name` invocation endpoint. */
export type ToolInvokeInput = Readonly<{ name: string; arguments?: Record<string, unknown> }>;

/** Response returned by the `tools/:name` invocation endpoint. */
export type ToolInvokeResponse = Readonly<{
  toolCallId?: string;
  content: MessageContent;
  state?: ToolResultState;
  error?: string;
}>;

/** Input accepted by the `embed` endpoint. */
export type EmbedInput = Readonly<{ model: ModelRef; input: string | readonly string[] }>;

/** Response returned by the `embed` endpoint. */
export type EmbedResponse = Readonly<{
  model?: string;
  embeddings: readonly (readonly number[])[];
  usage?: Usage;
}>;

/** Input accepted by the `transcribe` endpoint. */
export type TranscribeInput = Readonly<{
  model?: ModelRef;
  audio: ContentSource;
  language?: string;
}>;

/** Response returned by the `transcribe` endpoint. */
export type TranscribeResponse = Readonly<{ text: string; usage?: Usage }>;

// --- Route IO schemas --------------------------------------------------------
// Each schema is named and explicitly annotated with concrete Zod constructor
// types so its `typeof` can feed the `Route<...>` / `eventIterator(...)` builders
// under `--isolatedDeclarations`, never upcasting to `z.ZodType<T>`.

const chatInputZodSchema: z.ZodObject<{
  model: typeof modelRefZodSchema;
  messages: z.ZodArray<typeof messageZodSchema>;
  tools: z.ZodOptional<z.ZodArray<typeof toolDescriptorZodSchema>>;
  system: z.ZodOptional<z.ZodString>;
  temperature: z.ZodOptional<z.ZodNumber>;
  maxTokens: z.ZodOptional<z.ZodNumber>;
  metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}> = z.object({
  model: modelRefZodSchema,
  messages: z.array(messageZodSchema),
  tools: z.array(toolDescriptorZodSchema).optional(),
  system: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/** Schema for `chat` endpoint input. */
export const ChatInputSchema: z.ZodType<ChatInput> = chatInputZodSchema;

/** Schema for a single streamed `chat` chunk. */
export const ChatChunkSchema: z.ZodType<ChatChunk> = chatChunkZodSchema;

const modelsInputZodSchema: z.ZodOptional<z.ZodObject<{ provider: z.ZodOptional<z.ZodString> }>> = z
  .object({ provider: z.string().optional() }).optional();

/** Schema for `models` endpoint input. */
export const ModelsInputSchema: z.ZodType<ModelsInput> = modelsInputZodSchema;

const modelsResponseZodSchema: z.ZodObject<{
  models: z.ZodArray<typeof modelDescriptorZodSchema>;
}> = z.object({ models: z.array(modelDescriptorZodSchema) });

/** Schema for `models` endpoint responses. */
export const ModelsResponseSchema: z.ZodType<ModelsResponse> = modelsResponseZodSchema;

const toolInvokeInputZodSchema: z.ZodObject<{
  name: z.ZodString;
  arguments: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}> = z.object({ name: z.string(), arguments: z.record(z.string(), z.unknown()).optional() });

/** Schema for `tools/:name` endpoint input. */
export const ToolInvokeInputSchema: z.ZodType<ToolInvokeInput> = toolInvokeInputZodSchema;

const toolInvokeResponseZodSchema: z.ZodObject<{
  toolCallId: z.ZodOptional<z.ZodString>;
  content: typeof messageContentZodSchema;
  state: z.ZodOptional<typeof toolResultStateZodSchema>;
  error: z.ZodOptional<z.ZodString>;
}> = z.object({
  toolCallId: z.string().optional(),
  content: messageContentZodSchema,
  state: toolResultStateZodSchema.optional(),
  error: z.string().optional(),
});

/** Schema for `tools/:name` endpoint responses. */
export const ToolInvokeResponseSchema: z.ZodType<ToolInvokeResponse> = toolInvokeResponseZodSchema;

const embedInputZodSchema: z.ZodObject<{
  model: typeof modelRefZodSchema;
  input: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
}> = z.object({ model: modelRefZodSchema, input: z.union([z.string(), z.array(z.string())]) });

/** Schema for `embed` endpoint input. */
export const EmbedInputSchema: z.ZodType<EmbedInput> = embedInputZodSchema;

const embedResponseZodSchema: z.ZodObject<{
  model: z.ZodOptional<z.ZodString>;
  embeddings: z.ZodArray<z.ZodArray<z.ZodNumber>>;
  usage: z.ZodOptional<typeof usageZodSchema>;
}> = z.object({
  model: z.string().optional(),
  embeddings: z.array(z.array(z.number())),
  usage: usageZodSchema.optional(),
});

/** Schema for `embed` endpoint responses. */
export const EmbedResponseSchema: z.ZodType<EmbedResponse> = embedResponseZodSchema;

const transcribeInputZodSchema: z.ZodObject<{
  model: z.ZodOptional<typeof modelRefZodSchema>;
  audio: typeof contentSourceZodSchema;
  language: z.ZodOptional<z.ZodString>;
}> = z.object({
  model: modelRefZodSchema.optional(),
  audio: contentSourceZodSchema,
  language: z.string().optional(),
});

/** Schema for `transcribe` endpoint input. */
export const TranscribeInputSchema: z.ZodType<TranscribeInput> = transcribeInputZodSchema;

const transcribeResponseZodSchema: z.ZodObject<{
  text: z.ZodString;
  usage: z.ZodOptional<typeof usageZodSchema>;
}> = z.object({ text: z.string(), usage: usageZodSchema.optional() });

/** Schema for `transcribe` endpoint responses. */
export const TranscribeResponseSchema: z.ZodType<TranscribeResponse> = transcribeResponseZodSchema;

// --- chat route (SSE) --------------------------------------------------------
// Built via `oc.route` (not `baseContract`), so its error map is an empty
// `Record<never, never>` — recoverable/terminal errors surface in-stream as the
// `error` chunk of {@link ChatChunk}. Its output is an `eventIterator` whose type
// derives from the chat-chunk schema's input/output: the contract output type is
// an async event-iterator of chunks, so a connector's handler must stream frames
// and cannot type-check against a single buffered response (F-13).

/** Output type produced by `eventIterator(chatChunkZodSchema)`. */
type ChatChunkOutput = ReturnType<
  typeof eventIterator<z.input<typeof chatChunkZodSchema>, z.output<typeof chatChunkZodSchema>>
>;

/** Precise type of the `chat` streaming route. */
type ChatRoute = ContractProcedureBuilderWithInputOutput<
  typeof chatInputZodSchema,
  ChatChunkOutput,
  Record<never, never>,
  Record<never, never>
>;

/**
 * Concrete, precise interface for the AI v1 contract definition.
 *
 * Every member is a real oRPC contract procedure typed against its input and
 * output Zod schemas. The interface `extends BasePluginContract`, so the
 * mandatory `describe` route is enforced by the seam and any additional route
 * must be a real contract router. Spelling the type explicitly is required by
 * `--isolatedDeclarations` (the JSR slow-types bar); because each member derives
 * from a named, annotated schema via `typeof`, the contract type can never
 * silently drift from the schemas.
 *
 * Kept module-private: its members reference internal oRPC builder and Zod
 * schema types, so exporting the interface directly would drag those private
 * types into the documented surface (a `deno doc --lint` `private-type-ref`
 * cascade). The public, documented name is re-exposed as the thin type alias
 * {@link AiContractDefinitionShape} below.
 */
interface AiContractDefinitionShapeInternal extends BasePluginContract {
  /** Mandatory plugin capability-document route shared by all feature plugins. */
  readonly describe: BasePluginDescribeRoute;
  /** Streaming chat-completion route. */
  readonly chat: ChatRoute;
  /** Model-listing route. */
  readonly models: Route<typeof modelsInputZodSchema, typeof modelsResponseZodSchema>;
  /** Tool invocation route keyed by tool name. */
  readonly invokeTool: Route<typeof toolInvokeInputZodSchema, typeof toolInvokeResponseZodSchema>;
  /** Embedding generation route. */
  readonly embed: Route<typeof embedInputZodSchema, typeof embedResponseZodSchema>;
  /** Audio transcription route. */
  readonly transcribe: Route<typeof transcribeInputZodSchema, typeof transcribeResponseZodSchema>;
}

/**
 * The AI v1 contract definition object.
 *
 * Spreads the mandatory base seam `describe` route (GET `/describe`, returning a
 * {@link PluginCapabilities} document, shape unchanged) and layers the five
 * plugin-specific routes. Because the base seam `describe` is a real oRPC
 * `ContractProcedure` (no phantom marker) and every route is precisely typed,
 * this object is handed to `implement()` WITHOUT any erasure cast and every
 * `router.<route>.handler(...)` is checked against the contract's IO.
 */
const aiContractDefinition: AiContractDefinitionShapeInternal = {
  ...BASE_PLUGIN_CONTRACT_ROUTES,

  chat: oc
    .route({ method: 'POST', path: '/chat' })
    .input(chatInputZodSchema)
    .output(eventIterator(chatChunkZodSchema)),

  models: baseContract
    .route({ method: 'GET', path: '/models' })
    .input(modelsInputZodSchema)
    .output(modelsResponseZodSchema),

  invokeTool: baseContract
    .route({ method: 'POST', path: '/tools/{name}' })
    .input(toolInvokeInputZodSchema)
    .output(toolInvokeResponseZodSchema),

  embed: baseContract
    .route({ method: 'POST', path: '/embed' })
    .input(embedInputZodSchema)
    .output(embedResponseZodSchema),

  transcribe: baseContract
    .route({ method: 'POST', path: '/transcribe' })
    .input(transcribeInputZodSchema)
    .output(transcribeResponseZodSchema),
};

/**
 * Explicit, precise structural type of the AI v1 contract definition.
 *
 * Public, documented surface of the `/contracts/v1` subpath (restored after the
 * enterprise surface sweep). A thin alias over the module-private
 * {@link AiContractDefinitionShapeInternal} interface, so consumers keep the
 * exact same structural type — every member a real oRPC contract procedure
 * typed against its Zod schemas — while the interface's internal builder/schema
 * member types stay out of the documented surface.
 */
export type AiContractDefinitionShape = AiContractDefinitionShapeInternal;

/**
 * AI service contract definition for client generation.
 *
 * Carries the real, precise oRPC contract router type — no erasure cast.
 */
export const aiContract: AiContractDefinitionShape = aiContractDefinition;

/**
 * The fully-typed AI v1 contract definition type.
 *
 * Derived from the exported {@link aiContract} value so consumers see the same
 * contract shape used for client generation.
 */
export type AiContractDefinition = typeof aiContract;

/**
 * The implemented (context-bindable) AI v1 contract.
 *
 * `implement(definition)` precisely types the implementer against the contract,
 * so every `router.<route>.handler(...)` is checked for input/output/error
 * conformance. The type is the real `implement` return type — no erasure cast.
 */
export const aiContractV1: Implementer<
  AiContractDefinition,
  Record<never, never>,
  Record<never, never>
> = implement(aiContractDefinition);

/**
 * Public contract shape for AI service clients.
 *
 * Derived directly from {@link AiContractDefinition} — the real, fully-inferred
 * oRPC contract router. Carries the precise per-route input/output/error types,
 * so client generation and `implement(...)` stay sound and can never drift from
 * the Zod schemas.
 */
export type AiContract = AiContractDefinition;

/**
 * Context-binding implementer for the v1 AI contract.
 *
 * Derived from the {@link aiContractV1} value (`implement(definition)`), so
 * `AiContractV1['$context']<Ctx>()` returns the precisely-typed router
 * implementer whose `<route>.handler(...)` calls are checked against the
 * contract IO.
 */
export type AiContractV1 = typeof aiContractV1;

/**
 * The context-bound AI router implementer.
 *
 * Derived from {@link AiContractV1} by binding an opaque request context, so
 * each `AiRouter[route]` is the real oRPC procedure implementer. Connectors bind
 * their own concrete context via `aiContractV1.$context<TheirContext>()`.
 */
export type AiRouter = ReturnType<typeof aiContractV1.$context<Record<never, never>>>;
