import type {
  SagaAgentConversationId,
  SagaAgentId,
  SagaAgentInput,
  SagaAgentRuntimePort,
  SagaAgentRuntimeState,
  SagaAgentStepResult,
} from '../ports/mod.ts';
import type { SagaContext } from '../domain/mod.ts';

/** Stub-only base for the reserved saga agent runtime extension axis. */
export abstract class AbstractAgentRuntime implements SagaAgentRuntimePort {
  /** Stable adapter identifier. */
  abstract readonly id: string;

  /** Execute one agent-runtime step. */
  abstract runStep(
    agentId: SagaAgentId,
    conversationId: SagaAgentConversationId,
    input: SagaAgentInput,
    context: SagaContext,
  ): Promise<SagaAgentStepResult>;

  /** Serialize persisted agent runtime state. */
  abstract serializeState(state: SagaAgentRuntimeState): Promise<Uint8Array>;

  /** Deserialize persisted agent runtime state. */
  abstract deserializeState(bytes: Uint8Array): Promise<SagaAgentRuntimeState>;
}
