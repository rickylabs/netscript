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
  abstract readonly id: string;

  abstract runStep(
    agentId: SagaAgentId,
    conversationId: SagaAgentConversationId,
    input: SagaAgentInput,
    context: SagaContext,
  ): Promise<SagaAgentStepResult>;

  abstract serializeState(state: SagaAgentRuntimeState): Promise<Uint8Array>;

  abstract deserializeState(bytes: Uint8Array): Promise<SagaAgentRuntimeState>;
}
