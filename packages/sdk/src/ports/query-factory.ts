/**
 * Query-factory contracts built on top of service-client contracts.
 *
 * @module
 */

import type { CachedEntry } from './cache-entry.ts';
import type { QueryParams } from './query-options.ts';
import type {
  ActionMutationOptions,
  ActionQueryOptions,
  MutationOptionsResult,
  QueryOptionsWithInitialData,
} from '../query-client/types.ts';
import type {
  ContractLike,
  ContractProcedureNames,
  ProcedureInputFromNode,
  ProcedureOutputFromNode,
  ServiceClient,
} from './service-client.ts';

/**
 * Input payload for a contract procedure.
 */
export type ProcedureInput<
  TContract extends ContractLike,
  TAction extends ContractProcedureNames<TContract>,
> = ProcedureInputFromNode<TContract[TAction]>;

/**
 * Output payload for a contract procedure.
 */
export type ProcedureOutput<
  TContract extends ContractLike,
  TAction extends ContractProcedureNames<TContract>,
> = ProcedureOutputFromNode<TContract[TAction]>;

/**
 * Query helper bound to a specific resource action.
 */
export interface ActionMethod<
  TContract extends ContractLike,
  TAction extends ContractProcedureNames<TContract>,
> {
  /**
   * Execute the action with cache-aware query semantics.
   */
  (
    props: ProcedureInput<TContract, TAction>,
    options?: QueryParams,
  ): Promise<ProcedureOutput<TContract, TAction>>;

  /** Invalidate all cached queries for this action. */
  invalidate: () => Promise<void>;

  /** Generate the canonical cache key for this action invocation. */
  key: (
    props: ProcedureInput<TContract, TAction>,
  ) => readonly [string, TAction, string];

  /** Prefetch this action in the background. */
  prefetch: (props: ProcedureInput<TContract, TAction>, options?: QueryParams) => void;

  /** Return cached data without fetching. */
  getCachedData: (
    props: ProcedureInput<TContract, TAction>,
  ) => Promise<ProcedureOutput<TContract, TAction> | null>;

  /** Return cached data along with its cache timestamp. */
  getCachedEntry: (
    props: ProcedureInput<TContract, TAction>,
  ) => Promise<CachedEntry<ProcedureOutput<TContract, TAction>> | null>;

  // === TanStack Query extensions (RFC 17) ===

  /** TanStack queryOptions with typed queryKey and queryFn from the contract. */
  queryOptions: (
    props: ProcedureInput<TContract, TAction>,
    options?: ActionQueryOptions,
  ) => QueryOptionsWithInitialData<ProcedureOutput<TContract, TAction>>;

  /** TanStack mutationOptions with typed mutationKey and mutationFn. */
  mutationOptions: (
    options?: ActionMutationOptions,
  ) => MutationOptionsResult<ProcedureOutput<TContract, TAction>, ProcedureInput<TContract, TAction>>;

  /** Client-side query key for TanStack invalidation (prefix-matchable). */
  clientKey: (
    props?: ProcedureInput<TContract, TAction>,
  ) => readonly unknown[];
}

/**
 * Generated query helpers for a contract resource.
 */
export type QueryFactory<TContract extends ContractLike> =
  & {
    /** Resource identifier used for cache grouping. */
    resource: string;
    /** Invalidate every cached query for the resource. */
    invalidate: () => Promise<void>;
  }
  & {
    [K in ContractProcedureNames<TContract>]: ActionMethod<TContract, K>;
  };

/**
 * Configuration for a single query factory.
 */
export interface FactoryConfig<TContract extends ContractLike> {
  /** Contract used to discover resource actions. */
  contract: TContract;
  /** Typed service client matching the contract. */
  client: ServiceClient<TContract>;
  /** Default cache policy for generated action helpers. */
  options?: QueryParams;
}

/**
 * Composite query helper contract used for multi-endpoint aggregations.
 */
export interface CompositeQuery<TProps, TOutput, TKey extends readonly string[]> {
  /**
   * Execute the composite query with cache-aware semantics.
   */
  (props: TProps, options?: QueryParams): Promise<TOutput>;
  /** Invalidate all cached entries under the composite key prefix. */
  invalidate: () => Promise<void>;
  /** Return cached data without fetching. */
  getCachedData: (props: TProps) => Promise<TOutput | null>;
  /** Return cached data with cache timestamp metadata. */
  getCachedEntry: (props: TProps) => Promise<CachedEntry<TOutput> | null>;
  /** Generate the canonical composite query key. */
  key: (props: TProps) => readonly [...TKey, string];
  /** Prefetch the composite query in the background. */
  prefetch: (props: TProps, options?: QueryParams) => void;
}
