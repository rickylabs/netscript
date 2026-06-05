import type {
  SagaBusPort,
  SagaPublishOptions,
  SagaQueryDispatch,
  SagaSignalDispatch,
} from '../ports/mod.ts';
import type { CascadedMessage, SagaDefinition, SagaMessage } from '../domain/mod.ts';

/** Stub-only base for the named saga bus adapter extension axis. */
export abstract class AbstractSagaBus implements SagaBusPort {
  abstract readonly id: string;

  abstract start(): Promise<void>;

  abstract stop(reason?: string): Promise<void>;

  abstract register(definitions: readonly SagaDefinition[]): Promise<void>;

  abstract publish(
    message: SagaMessage,
    options?: SagaPublishOptions,
  ): Promise<void>;

  abstract dispatchCascaded(messages: readonly CascadedMessage[]): Promise<void>;

  abstract signal<TPayload, TName extends string>(
    dispatch: SagaSignalDispatch<TPayload, TName>,
  ): Promise<void>;

  abstract query<TResult, TName extends string>(
    dispatch: SagaQueryDispatch<TResult, TName>,
  ): Promise<TResult>;
}
