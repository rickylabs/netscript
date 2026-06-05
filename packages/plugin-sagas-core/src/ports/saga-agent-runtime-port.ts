import type { SagaContext } from '../domain/mod.ts';

/** Branded AI agent identifier reserved for the future agent plugin. */
export type SagaAgentId<TId extends string = string> = TId & { readonly __brand: 'SagaAgentId' };

/** Branded agent conversation identifier reserved for T3-backed agent history. */
export type SagaAgentConversationId<TId extends string = string> = TId & {
  readonly __brand: 'SagaAgentConversationId';
};

/** Agent input payload accepted by the reserved agent runtime axis. */
export type SagaAgentInput = Readonly<Record<string, unknown>>;

/** Serialized agent runtime state reserved for T3 history. */
export type SagaAgentRuntimeState = Readonly<Record<string, unknown>>;

/** Agent step result emitted back into saga orchestration. */
export type SagaAgentStepResult = Readonly<{
  output: unknown;
  state: SagaAgentRuntimeState;
  cascaded?: readonly unknown[];
}>;

/** Reserved AI-agent runtime boundary for future plugin integration. */
export interface SagaAgentRuntimePort {
  readonly id: string;
  runStep(
    agentId: SagaAgentId,
    conversationId: SagaAgentConversationId,
    input: SagaAgentInput,
    context: SagaContext,
  ): Promise<SagaAgentStepResult>;
  serializeState(state: SagaAgentRuntimeState): Promise<Uint8Array>;
  deserializeState(bytes: Uint8Array): Promise<SagaAgentRuntimeState>;
}
