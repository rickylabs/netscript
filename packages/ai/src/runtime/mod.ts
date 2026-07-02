/**
 * AI runtime composition root (Axiom A10 — constructor/factory injection).
 *
 * {@linkcode createAiRuntime} wires the capability ports, defaulting each to its
 * no-op/throwing default when not supplied. {@linkcode getAiRuntime} exposes a
 * process singleton shaped exactly like `@netscript/kv`'s `getKv()` (lazy
 * first-call construction, reusable thereafter, resettable for tests).
 *
 * Model providers are resolved through the global model registry
 * (`../ports/model-provider.ts`), not stored on the runtime, so provider
 * packages self-register independently of runtime construction.
 *
 * @module
 */

import type { ModelHandle, ModelRef } from '../contracts/model.ts';
import { AiNotConfiguredError } from '../contracts/errors.ts';
import {
  type AgentLoopPort,
  type AgentMemoryPort,
  createNoopAgentMemory,
  createNoopSkillLoader,
  createNoopTelemetryPort,
  createNoopToolRegistry,
  createUnconfiguredAgentLoop,
  createUnconfiguredEmbeddingProvider,
  createUnconfiguredMcpTransport,
  createUnconfiguredVisionProvider,
  type EmbeddingProviderPort,
  getModel,
  getModelProvider,
  type McpTransportPort,
  type ModelProviderConfig,
  type ModelProviderPort,
  type SkillLoaderPort,
  type TelemetryPort,
  type ToolRegistryPort,
  type VisionProviderPort,
} from '../ports/mod.ts';

/**
 * Ports and defaults injected into {@linkcode createAiRuntime}. Every field is
 * optional; omitted capabilities fall back to their no-op/throwing default.
 */
export interface AiRuntimeConfig {
  /** Telemetry port; defaults to a no-op. */
  readonly telemetry?: TelemetryPort;
  /** Tool registry port; defaults to a no-op. */
  readonly tools?: ToolRegistryPort;
  /** Embedding provider; defaults to a throwing unconfigured port. */
  readonly embeddings?: EmbeddingProviderPort;
  /** Vision provider; defaults to a throwing unconfigured port. */
  readonly vision?: VisionProviderPort;
  /** MCP transport; defaults to a throwing unconfigured port. */
  readonly mcp?: McpTransportPort;
  /** Skill loader; defaults to a no-op returning no skills. */
  readonly skills?: SkillLoaderPort;
  /** Agent loop; defaults to a throwing unconfigured port. */
  readonly agentLoop?: AgentLoopPort;
  /** Agent memory; defaults to a no-op store. */
  readonly memory?: AgentMemoryPort;
  /** Provider id used by {@linkcode AiRuntime.getModelProvider} when none is passed. */
  readonly defaultModelProvider?: string;
}

/**
 * The composed AI runtime: resolved capability ports plus model-registry
 * accessors bound to this runtime's default provider.
 */
export interface AiRuntime {
  /** Resolved telemetry port. */
  readonly telemetry: TelemetryPort;
  /** Resolved tool registry port. */
  readonly tools: ToolRegistryPort;
  /** Resolved embedding provider port. */
  readonly embeddings: EmbeddingProviderPort;
  /** Resolved vision provider port. */
  readonly vision: VisionProviderPort;
  /** Resolved MCP transport port. */
  readonly mcp: McpTransportPort;
  /** Resolved skill loader port. */
  readonly skills: SkillLoaderPort;
  /** Resolved agent loop port. */
  readonly agentLoop: AgentLoopPort;
  /** Resolved agent memory port. */
  readonly memory: AgentMemoryPort;
  /** The configured default provider id, if any. */
  readonly defaultModelProvider?: string;
  /**
   * Resolve a model provider from the global registry. Falls back to
   * {@linkcode defaultModelProvider} when `id` is omitted.
   *
   * @throws {AiNotConfiguredError} When no id is given and no default is set.
   * @throws {import('../contracts/errors.ts').ModelProviderNotFoundError} When the id is unregistered.
   */
  getModelProvider(id?: string, config?: ModelProviderConfig): ModelProviderPort;
  /**
   * Resolve a model reference to a handle via the global registry.
   */
  getModel(ref: ModelRef, config?: ModelProviderConfig): Promise<ModelHandle>;
}

/**
 * Compose an {@linkcode AiRuntime} from the given config, defaulting every
 * unspecified port. Pure wiring — no IO, no global mutation.
 */
export function createAiRuntime(config: AiRuntimeConfig = {}): AiRuntime {
  const defaultModelProvider = config.defaultModelProvider;
  return {
    telemetry: config.telemetry ?? createNoopTelemetryPort(),
    tools: config.tools ?? createNoopToolRegistry(),
    embeddings: config.embeddings ?? createUnconfiguredEmbeddingProvider(),
    vision: config.vision ?? createUnconfiguredVisionProvider(),
    mcp: config.mcp ?? createUnconfiguredMcpTransport(),
    skills: config.skills ?? createNoopSkillLoader(),
    agentLoop: config.agentLoop ?? createUnconfiguredAgentLoop(),
    memory: config.memory ?? createNoopAgentMemory(),
    defaultModelProvider,
    getModelProvider(id?: string, providerConfig?: ModelProviderConfig): ModelProviderPort {
      const resolved = id ?? defaultModelProvider;
      if (!resolved) {
        throw new AiNotConfiguredError(
          'modelProvider',
          'No provider id passed and no defaultModelProvider configured.',
        );
      }
      return getModelProvider(resolved, providerConfig);
    },
    getModel(ref: ModelRef, providerConfig?: ModelProviderConfig): Promise<ModelHandle> {
      return getModel(ref, providerConfig);
    },
  };
}

// ---------------------------------------------------------------------------
// Process singleton — kv-`getKv`-shaped: lazy, reused, resettable.
// ---------------------------------------------------------------------------
let singleton: AiRuntime | null = null;

/**
 * Resolve the shared {@linkcode AiRuntime} singleton, constructing it on first
 * access with the supplied config. Subsequent calls return the same instance
 * and ignore their config argument (call {@linkcode resetAiRuntime} first to
 * reconfigure).
 */
export function getAiRuntime(config?: AiRuntimeConfig): AiRuntime {
  if (!singleton) {
    singleton = createAiRuntime(config);
  }
  return singleton;
}

/**
 * Whether the runtime singleton has been constructed.
 */
export function isAiRuntimeInitialized(): boolean {
  return singleton !== null;
}

/**
 * Clear the runtime singleton. Intended for test isolation.
 */
export function resetAiRuntime(): void {
  singleton = null;
}
