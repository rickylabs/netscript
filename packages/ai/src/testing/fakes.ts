/**
 * Fake port implementations for downstream unit tests.
 *
 * These are deterministic, dependency-free doubles that satisfy the port
 * contracts so slices E2–E10 (and host apps) can unit-test wiring without a
 * real provider. They live in the published `@netscript/ai/testing` surface.
 *
 * @module
 */

import type { AgentChunk } from '../contracts/chunk.ts';
import type { ModelDescriptor, ModelHandle } from '../contracts/model.ts';
import type { ToolDescriptor } from '../contracts/tool.ts';
import type {
  AgentLoopPort,
  AgentMemoryPort,
  EmbeddingProviderPort,
  MemoryRecord,
  ModelProviderPort,
  TelemetryAttributes,
  TelemetryPort,
  TelemetrySpan,
  ToolHandler,
  ToolRegistryPort,
  VisionProviderPort,
} from '../ports/mod.ts';
import type { EmbeddingResponse } from '../ports/embedding.ts';
import type { RecallResult } from '../ports/memory.ts';
import type { VisionResponse } from '../ports/vision.ts';

/** A telemetry call captured by {@linkcode createFakeTelemetryPort}. */
export interface RecordedTelemetry {
  /** Whether a span or an event was recorded. */
  readonly kind: 'span' | 'event';
  /** Name passed to the telemetry call. */
  readonly name: string;
  /** Attributes passed to the telemetry call, when any. */
  readonly attributes?: TelemetryAttributes;
}

/** A {@linkcode TelemetryPort} that records every call for assertions. */
export interface FakeTelemetryPort extends TelemetryPort {
  /** Every span/event recorded, in call order. */
  readonly records: readonly RecordedTelemetry[];
}

/**
 * Create a telemetry port that records spans and events into `records`.
 */
export function createFakeTelemetryPort(): FakeTelemetryPort {
  const records: RecordedTelemetry[] = [];
  const span: TelemetrySpan = {
    setAttribute(): void {},
    recordException(): void {},
    end(): void {},
  };
  return {
    records,
    startSpan(name: string, attributes?: TelemetryAttributes): TelemetrySpan {
      records.push({ kind: 'span', name, attributes });
      return span;
    },
    recordEvent(name: string, attributes?: TelemetryAttributes): void {
      records.push({ kind: 'event', name, attributes });
    },
  };
}

/**
 * Create a real in-memory {@linkcode ToolRegistryPort} for tests.
 */
export function createInMemoryToolRegistry(): ToolRegistryPort {
  const tools = new Map<string, { descriptor: ToolDescriptor; handler?: ToolHandler }>();
  return {
    register(tool: ToolDescriptor, handler?: ToolHandler): void {
      tools.set(tool.name, { descriptor: tool, handler });
    },
    has(name: string): boolean {
      return tools.has(name);
    },
    get(name: string): ToolDescriptor | undefined {
      return tools.get(name)?.descriptor;
    },
    list(): readonly ToolDescriptor[] {
      return [...tools.values()].map((entry) => entry.descriptor);
    },
    resolveHandler(name: string): ToolHandler | undefined {
      return tools.get(name)?.handler;
    },
  };
}

/**
 * Create a fake {@linkcode ModelProviderPort} exposing the given descriptors.
 */
export function createFakeModelProvider(
  id: string,
  models: readonly ModelDescriptor[] = [],
): ModelProviderPort {
  const byId = new Map(models.map((model) => [model.id, model] as const));
  return {
    id,
    listModels(): Promise<readonly ModelDescriptor[]> {
      return Promise.resolve(models);
    },
    getModel(modelId: string): Promise<ModelHandle> {
      const descriptor = byId.get(modelId) ?? { id: modelId, provider: id };
      return Promise.resolve({ providerId: id, descriptor });
    },
    supports(modelId: string): boolean {
      return byId.has(modelId);
    },
  };
}

/**
 * Create a fake {@linkcode AgentLoopPort} that streams the given chunks in order.
 */
export function createFakeAgentLoop(chunks: readonly AgentChunk[]): AgentLoopPort {
  return {
    run(): AsyncIterable<AgentChunk> {
      async function* stream(): AsyncGenerator<AgentChunk> {
        for (const chunk of chunks) {
          yield chunk;
        }
      }
      return stream();
    },
  };
}

/**
 * Create a fake in-memory {@linkcode AgentMemoryPort}. Pass `{ recall: true }`
 * to include a trivial (non-semantic) recall implementation for exercising the
 * optional recall seam.
 */
export function createFakeAgentMemory(options: { readonly recall?: boolean } = {}): AgentMemoryPort {
  const threads = new Map<string, MemoryRecord[]>();
  let sequence = 0;
  const base: AgentMemoryPort = {
    append(threadId, message): Promise<void> {
      const list = threads.get(threadId) ?? [];
      list.push({ id: `mem-${sequence++}`, message, createdAt: Date.now() });
      threads.set(threadId, list);
      return Promise.resolve();
    },
    load(threadId): Promise<readonly MemoryRecord[]> {
      return Promise.resolve(threads.get(threadId) ?? []);
    },
  };
  if (!options.recall) {
    return base;
  }
  return {
    ...base,
    recall(threadId, query): Promise<readonly RecallResult[]> {
      const list = threads.get(threadId) ?? [];
      const limit = query.limit ?? list.length;
      return Promise.resolve(list.slice(0, limit).map((record) => ({ record, score: 1 })));
    },
  };
}

/**
 * Create a fake {@linkcode EmbeddingProviderPort} that returns a fixed vector
 * per input.
 */
export function createFakeEmbeddingProvider(vector: readonly number[] = [0, 0, 0]): EmbeddingProviderPort {
  return {
    embed(request): Promise<EmbeddingResponse> {
      const inputs = typeof request.input === 'string' ? [request.input] : request.input;
      return Promise.resolve({
        model: request.model,
        vectors: inputs.map((_, index) => ({ index, embedding: vector })),
      });
    },
  };
}

/**
 * Create a fake {@linkcode VisionProviderPort} that echoes a fixed answer.
 */
export function createFakeVisionProvider(text: string = 'fake vision result'): VisionProviderPort {
  return {
    analyze(): Promise<VisionResponse> {
      return Promise.resolve({ text });
    },
  };
}
