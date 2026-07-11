/**
 * Internal bridge: wrap a `@tanstack/ai` text adapter as an **owned**
 * {@linkcode ChatClientPort}.
 *
 * This is the single anti-corruption boundary between the framework's owned
 * chat vocabulary and TanStack AI. The E2 provider adapters call
 * {@linkcode toTanstackChatClient} so their `createChatClient` returns a
 * `ChatClientPort` — no TanStack adapter class ever reaches the published
 * `deno doc --lint` surface (closing the D3 `private-type-ref` leak).
 *
 * **Bundle isolation:** this module imports `@tanstack/ai` and must be imported
 * *only* by the provider adapter files (each already pulls a provider SDK).
 * `src/agent/*` and the base `@netscript/ai` graph never import it, so those
 * graphs stay TanStack-free.
 *
 * **Client-tool design:** owned {@linkcode ToolDescriptor}s are converted to
 * TanStack tools **without** an `execute` (client tools). `chat()` therefore
 * surfaces `TOOL_CALL_*` events and ends the turn (`finishReason: tool_calls`)
 * *without* auto-executing — the agent loop (E3) owns execution via the injected
 * `ToolRegistryPort` and resumes with a fresh turn carrying tool-result messages.
 *
 * @module
 */

import { chat, EventType } from '@tanstack/ai';
import type {
  AnyTextAdapter,
  AnyTool,
  ContentPart as TanstackContentPart,
  JSONSchema as TanstackJsonSchema,
  ModelMessage,
  StreamChunk,
  ToolCall as TanstackToolCall,
} from '@tanstack/ai';

import type { ContentPart, MessageContent } from '../contracts/content.ts';
import type { GenerationOptions } from '../contracts/generation.ts';
import type { ToolCall, ToolDescriptor, ToolParameters } from '../contracts/tool.ts';
import type { Usage } from '../contracts/usage.ts';
import type {
  ChatClientCallOptions,
  ChatClientEvent,
  ChatClientPort,
  ChatClientRequest,
  ChatFinishReason,
} from '../ports/chat-client.ts';

/** Identifying metadata for the wrapped client, surfaced on the owned port. */
export interface ChatClientMeta {
  /** Provider name (e.g. `"anthropic"`). */
  readonly name: string;
  /** Adapter kind (e.g. `"text"`). */
  readonly kind: string;
  /**
   * Static provider-specific request options forwarded to the TanStack
   * `chat()` call on every turn (its `modelOptions` passthrough). Providers
   * that carry a fixed wire override — e.g. OpenRouter's top-level
   * `{ reasoning: { effort } }` — normalize it once and pass it here. The
   * OpenAI-compatible provider options type is an open `Record`, so the value
   * is threaded into the request body without a provider SDK type escaping the
   * owned surface. Omit for providers with no override (Anthropic, Ollama).
   */
  readonly modelOptions?: Readonly<Record<string, unknown>>;
  /**
   * Provider-native mapper for per-turn {@linkcode GenerationOptions}. Each E2
   * adapter supplies the pure function that maps the owned neutral options
   * (reasoning effort, output-token cap) to that provider's request-body keys
   * (Anthropic `output_config.effort`/`thinking`, OpenAI `reasoning_effort`,
   * OpenRouter `reasoning:{effort}`; Ollama maps only `max_tokens`). The result
   * is merged over the static {@linkcode ChatClientMeta.modelOptions}, followed
   * by the request escape hatch and the call's `modelOptions` (highest priority).
   * Omit for providers that ignore per-turn options entirely.
   */
  readonly mapModelOptions?: (
    options: GenerationOptions,
  ) => Readonly<Record<string, unknown>> | undefined;
  /** Validate provider-native per-call options before starting transport IO. */
  readonly validateModelOptions?: (
    options: Readonly<Record<string, unknown>>,
  ) => void;
}

/**
 * Merge model-option layers left-to-right (later wins), returning `undefined`
 * when every layer is empty so no `modelOptions` key is sent for a default turn.
 */
export function mergeModelOptions(
  ...layers: readonly (Readonly<Record<string, unknown>> | undefined)[]
): Readonly<Record<string, unknown>> | undefined {
  const merged: Record<string, unknown> = {};
  let seen = false;
  for (const layer of layers) {
    if (layer === undefined) {
      continue;
    }
    for (const [key, value] of Object.entries(layer)) {
      merged[key] = value;
      seen = true;
    }
  }
  return seen ? merged : undefined;
}

/**
 * Resolve the exact model-options bag handed to the provider transport.
 * Layers are static defaults, neutral mapping, request escape hatch, then the
 * per-call bag; later layers override earlier ones.
 */
export function resolveModelOptions(
  meta: ChatClientMeta,
  request: ChatClientRequest,
  options?: ChatClientCallOptions,
): Readonly<Record<string, unknown>> | undefined {
  if (options?.modelOptions !== undefined) {
    meta.validateModelOptions?.(options.modelOptions);
  }
  const perTurn = request.options !== undefined
    ? meta.mapModelOptions?.(request.options)
    : undefined;
  return mergeModelOptions(
    meta.modelOptions,
    perTurn,
    request.options?.providerOptions,
    options?.modelOptions,
  );
}

/**
 * Wrap a TanStack text adapter as an owned {@linkcode ChatClientPort}.
 *
 * @param adapter - A TanStack text adapter (from a provider factory).
 * @param meta - Owned `name`/`kind` (+ optional `modelOptions`) to expose.
 * @returns A provider-neutral chat client that translates to/from TanStack.
 */
export function toTanstackChatClient(
  adapter: AnyTextAdapter,
  meta: ChatClientMeta,
): ChatClientPort {
  return {
    kind: meta.kind,
    name: meta.name,
    async *stream(
      request: ChatClientRequest,
      options?: ChatClientCallOptions,
    ): AsyncIterable<ChatClientEvent> {
      const external = options?.signal;
      if (external?.aborted) {
        return;
      }
      const controller = new AbortController();
      const forwardAbort = () => controller.abort();
      external?.addEventListener('abort', forwardAbort, { once: true });

      const { systemPrompts, messages } = toTanstackMessages(request);
      const tools = toTanstackTools(request.tools);

      const modelOptions = resolveModelOptions(meta, request, options);

      // Accumulate streamed tool-call fragments keyed by call id.
      const pending = new Map<string, { name: string; args: string }>();

      try {
        const streamed = chat({
          adapter,
          messages,
          systemPrompts,
          tools,
          abortController: controller,
          // `AnyTextAdapter` erases the provider-options type to `any`, so this
          // owned `Record` threads into `modelOptions` without a cast (D3-safe).
          modelOptions,
        });
        for await (const chunk of streamed) {
          if (external?.aborted) {
            return;
          }
          const event = translateChunk(chunk, pending);
          if (event) {
            yield event;
          }
        }
      } catch (cause) {
        if (external?.aborted) {
          return;
        }
        yield { type: 'error', message: errorMessage(cause), cause };
      } finally {
        external?.removeEventListener('abort', forwardAbort);
      }
    },
  };
}

/** Translate one TanStack stream chunk into an owned event (or `null` to skip). */
function translateChunk(
  chunk: StreamChunk,
  pending: Map<string, { name: string; args: string }>,
): ChatClientEvent | null {
  switch (chunk.type) {
    case EventType.TEXT_MESSAGE_CONTENT: {
      return { type: 'text', delta: chunk.delta };
    }
    case EventType.REASONING_MESSAGE_CONTENT: {
      // The ag-ui reasoning-content event (the current, non-deprecated
      // chain-of-thought delta) becomes the owned reasoning event.
      return { type: 'reasoning', delta: chunk.delta };
    }
    case EventType.TOOL_CALL_START: {
      pending.set(chunk.toolCallId, {
        name: chunk.toolCallName ?? chunk.toolName ?? '',
        args: '',
      });
      return null;
    }
    case EventType.TOOL_CALL_ARGS: {
      const entry = pending.get(chunk.toolCallId);
      if (entry) {
        entry.args += chunk.delta;
      }
      return null;
    }
    case EventType.TOOL_CALL_END: {
      const entry = pending.get(chunk.toolCallId);
      pending.delete(chunk.toolCallId);
      const name = entry?.name || chunk.toolCallName || chunk.toolName || '';
      const args = entry && entry.args.length > 0
        ? entry.args
        : chunk.input !== undefined
        ? JSON.stringify(chunk.input)
        : '{}';
      const toolCall: ToolCall = { id: chunk.toolCallId, name, arguments: args };
      return { type: 'tool-call', toolCall };
    }
    case EventType.RUN_FINISHED: {
      return {
        type: 'finish',
        usage: toOwnedUsage(chunk.usage),
        finishReason: toFinishReason(chunk.finishReason),
      };
    }
    case EventType.RUN_ERROR: {
      return { type: 'error', message: chunk.message, cause: chunk.code };
    }
    default: {
      return null;
    }
  }
}

/** Split owned messages into TanStack system prompts + model messages. */
function toTanstackMessages(
  request: ChatClientRequest,
): { systemPrompts: string[]; messages: ModelMessage[] } {
  const systemPrompts: string[] = [];
  if (request.system !== undefined) {
    systemPrompts.push(request.system);
  }
  const messages: ModelMessage[] = [];
  for (const message of request.messages) {
    if (message.role === 'system') {
      systemPrompts.push(extractText(message.content));
      continue;
    }
    messages.push({
      role: message.role,
      content: toTanstackContent(message.content),
      name: message.name,
      toolCallId: message.toolCallId,
      toolCalls: message.toolCalls?.map(toTanstackToolCall),
    });
  }
  return { systemPrompts, messages };
}

/** Convert an owned tool call into a TanStack `ToolCall`. */
function toTanstackToolCall(call: ToolCall): TanstackToolCall {
  return {
    id: call.id,
    type: 'function',
    function: { name: call.name, arguments: call.arguments },
  };
}

/** Convert owned message content into TanStack message content. */
function toTanstackContent(content: MessageContent): string | Array<TanstackContentPart> {
  if (typeof content === 'string') {
    return content;
  }
  return content.map(toTanstackPart);
}

/** Convert a single owned content part into a TanStack content part. */
function toTanstackPart(part: ContentPart): TanstackContentPart {
  if (part.type === 'text') {
    return { type: 'text', content: part.text };
  }
  return { type: part.type, source: part.source };
}

/** Convert owned tool descriptors into TanStack client tools (no `execute`). */
function toTanstackTools(
  descriptors: readonly ToolDescriptor[] | undefined,
): Array<AnyTool> | undefined {
  if (!descriptors || descriptors.length === 0) {
    return undefined;
  }
  return descriptors.map((descriptor): AnyTool => ({
    name: descriptor.name,
    description: descriptor.description ?? '',
    inputSchema: toInputSchema(descriptor.parameters),
  }));
}

/**
 * Deep-clone the owned (open, `unknown`-valued) JSON-schema parameters into a
 * TanStack `JSONSchema`. `JSON.parse` yields `any`, which flows into the
 * structured `JSONSchema` target without an `as` cast or `any` annotation —
 * the localized impedance match at this anti-corruption boundary.
 */
function toInputSchema(parameters: ToolParameters): TanstackJsonSchema {
  const schema: TanstackJsonSchema = JSON.parse(JSON.stringify(parameters));
  return schema;
}

/** Map a TanStack finish reason onto the owned {@linkcode ChatFinishReason}. */
function toFinishReason(
  reason: 'stop' | 'length' | 'content_filter' | 'tool_calls' | null | undefined,
): ChatFinishReason | undefined {
  switch (reason) {
    case 'stop':
      return 'stop';
    case 'length':
      return 'length';
    case 'content_filter':
      return 'content-filter';
    case 'tool_calls':
      return 'tool-calls';
    default:
      return undefined;
  }
}

/** Map TanStack real token usage onto the owned {@linkcode Usage} core fields. */
function toOwnedUsage(
  usage: { promptTokens: number; completionTokens: number; totalTokens: number } | undefined,
): Usage | undefined {
  if (!usage) {
    return undefined;
  }
  return {
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    totalTokens: usage.totalTokens,
  };
}

/** Extract a plain-text projection of message content (system prompts). */
function extractText(content: MessageContent): string {
  if (typeof content === 'string') {
    return content;
  }
  return content
    .filter((part): part is Extract<ContentPart, { type: 'text' }> => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

/** Reduce an unknown thrown value to a message string. */
function errorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}
