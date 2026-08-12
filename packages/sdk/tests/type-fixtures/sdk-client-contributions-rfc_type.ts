/**
 * Compile-only RFC-A inference proof against the current SDK contract and query surfaces.
 *
 * This file deliberately models the proposed types locally. It is not product implementation;
 * it keeps the RFC's 16-contribution budget and compatibility claims reproducible in-tree until
 * the accepted implementation replaces the local model with public imports.
 */

import { type DefineServiceConfig, defineServices } from '../../src/presets/define-services.ts';
import type {
  ContractLike,
  ContractProcedureLike,
  ContractSchema,
  ProcedureInputFromNode,
  ProcedureOutputFromNode,
  ServiceClient,
  ServiceClientContext,
  ServiceClientContract,
} from '../../src/ports/service-client.ts';
import type {
  ServiceProcedureQueryResult,
  ServiceQueryUtils,
} from '../../src/ports/service-query-utils.ts';
import type { ActionMethod, FactoryConfig, QueryFactory } from '../../src/ports/query-factory.ts';
import { createActionQueryKey, type QueryKeyPart } from '../../src/ports/query-key.ts';
import type { CacheKey } from '../../src/ports/cache-store.ts';
import type { CreateDesktopServiceClientOptions } from '../../src/desktop/domain/types.ts';

type Assert<T extends true> = T;
type IsAssignable<TFrom, TTo> = [TFrom] extends [TTo] ? true : false;
type StringKey<T> = Extract<keyof T, string>;
type EmptyContext = Record<never, never>;

interface ListOrdersInput {
  readonly page: number;
}

interface ListOrdersOutput {
  readonly items: readonly { readonly id: string }[];
}

type Schema<TInput, TOutput> = ContractSchema & {
  readonly '~standard': {
    readonly types: {
      readonly input: TInput;
      readonly output: TOutput;
    };
  };
};

type Procedure<TInput, TOutput> = ContractProcedureLike<
  Schema<TInput, TInput>,
  Schema<TOutput, TOutput>
>;

declare const serviceContract: {
  readonly orders: {
    readonly list: Procedure<ListOrdersInput, ListOrdersOutput>;
  };
};

type _RealContract = Assert<IsAssignable<typeof serviceContract, ContractLike>>;

type RfcCacheMode = 'invariant' | 'partitioned' | 'direct-only';

type RfcContextDeclaration<TContext extends object> = {
  readonly [K in StringKey<TContext>]-?: EmptyContext extends Pick<TContext, K> ? 'optional'
    : 'required';
};

interface RfcContribution<
  TId extends string = string,
  TContext extends object = EmptyContext,
  THeaderKeys extends readonly string[] = readonly string[],
  TCacheMode extends RfcCacheMode = RfcCacheMode,
> {
  /** Compile-only stand-in for the accepted implementation's generic context identity. */
  readonly __context?: TContext;
  readonly protocol: {
    readonly family: 'netscript.sdk-client';
    readonly major: 1;
  };
  readonly id: TId;
  readonly context: RfcContextDeclaration<TContext>;
  readonly headerKeys: THeaderKeys;
  readonly responseCache: { readonly mode: TCacheMode };
  readonly prepare: (options: {
    readonly context: Readonly<TContext>;
    readonly signal?: AbortSignal;
    readonly input: unknown;
  }) => unknown;
}

interface AnyRfcContribution {
  readonly __context?: object;
  readonly protocol: {
    readonly family: 'netscript.sdk-client';
    readonly major: 1;
  };
  readonly id: string;
  readonly context: Readonly<Record<string, 'optional' | 'required'>>;
  readonly headerKeys: readonly string[];
  readonly responseCache: { readonly mode: RfcCacheMode };
}

function defineRfcContribution<TContext extends object = EmptyContext>() {
  return <
    const TId extends string,
    const THeaderKeys extends readonly string[],
    const TCacheMode extends RfcCacheMode,
  >(
    contribution: RfcContribution<TId, TContext, THeaderKeys, TCacheMode>,
  ): RfcContribution<TId, TContext, THeaderKeys, TCacheMode> => contribution;
}

type RfcIdOf<T> = T extends { readonly id: infer TId extends string } ? TId : never;
type RfcContextOf<T> = T extends { readonly __context?: infer TContext extends object } ? TContext
  : never;
type RfcContextKeysOf<T> = StringKey<RfcContextOf<T>>;
type RfcHeaderKeysOf<T> = T extends { readonly headerKeys: infer TKeys extends readonly string[] }
  ? TKeys[number]
  : never;

interface RfcConflict<TKind extends string, TKey extends string> {
  readonly __netscriptContributionConflict: `${TKind}:${TKey}`;
}

type RfcMergeTuple<
  TContributions extends readonly AnyRfcContribution[],
  TContext extends object = EmptyContext,
  TIds extends string = never,
  TContextKeys extends string = never,
  THeaderKeys extends string = 'content-type' | 'traceparent' | 'tracestate',
> = TContributions extends readonly [
  infer THead extends AnyRfcContribution,
  ...infer TTail extends AnyRfcContribution[],
] ? RfcIdOf<THead> extends TIds ? RfcConflict<'id', RfcIdOf<THead>>
  : [Extract<RfcContextKeysOf<THead>, TContextKeys>] extends [never]
    ? [Extract<RfcHeaderKeysOf<THead>, THeaderKeys>] extends [never] ? RfcMergeTuple<
        TTail,
        TContext & RfcContextOf<THead>,
        TIds | RfcIdOf<THead>,
        TContextKeys | RfcContextKeysOf<THead>,
        THeaderKeys | RfcHeaderKeysOf<THead>
      >
    : RfcConflict<'header', Extract<RfcHeaderKeysOf<THead>, THeaderKeys>>
  : RfcConflict<'context', Extract<RfcContextKeysOf<THead>, TContextKeys>>
  : TContext;

type RfcAtMostSixteen<TContributions extends readonly AnyRfcContribution[]> = TContributions extends
  readonly [
    AnyRfcContribution,
    AnyRfcContribution,
    AnyRfcContribution,
    AnyRfcContribution,
    AnyRfcContribution,
    AnyRfcContribution,
    AnyRfcContribution,
    AnyRfcContribution,
    AnyRfcContribution,
    AnyRfcContribution,
    AnyRfcContribution,
    AnyRfcContribution,
    AnyRfcContribution,
    AnyRfcContribution,
    AnyRfcContribution,
    AnyRfcContribution,
    AnyRfcContribution,
    ...AnyRfcContribution[],
  ] ? RfcConflict<'limit', 'more-than-16'>
  : unknown;

type RfcValidateTuple<TContributions extends readonly AnyRfcContribution[]> =
  RfcMergeTuple<TContributions> extends RfcConflict<string, string> ? RfcMergeTuple<TContributions>
    : RfcAtMostSixteen<TContributions>;

type RfcContributionContext<TContributions extends readonly AnyRfcContribution[]> =
  RfcMergeTuple<TContributions> extends infer TResult extends object ? TResult : never;

declare function acceptRfcContributions<
  const TContributions extends readonly AnyRfcContribution[],
>(
  contributions: TContributions & RfcValidateTuple<TContributions>,
): RfcContributionContext<TContributions>;

type RequiredKeys<TContext extends object> = {
  [K in keyof TContext]-?: EmptyContext extends Pick<TContext, K> ? never : K;
}[keyof TContext];

type RfcRequestRest<TContext extends object> = RequiredKeys<TContext> extends never
  ? [options?: { readonly context?: TContext }]
  : [options: { readonly context: TContext }];

type RfcServiceClientMethod<
  TInput,
  TOutput,
  TContext extends object = ServiceClientContext,
> = (input: TInput, ...request: RfcRequestRest<TContext>) => Promise<TOutput>;

type RfcServiceClientShape<
  TContract extends ContractLike,
  TContext extends object = ServiceClientContext,
> = TContract extends ContractProcedureLike ? RfcServiceClientMethod<
    ProcedureInputFromNode<TContract>,
    ProcedureOutputFromNode<TContract>,
    TContext
  >
  : {
    [K in keyof TContract]: TContract[K] extends ContractLike
      ? RfcServiceClient<TContract[K], TContext>
      : never;
  };

type RfcServiceClient<
  TContract extends ContractLike,
  TContext extends object = ServiceClientContext,
> = RfcServiceClientShape<TContract, TContext> & ServiceClientContract<TContract>;

declare const currentClient: ServiceClient<typeof serviceContract>;
const defaultCompatibleClient: RfcServiceClient<typeof serviceContract> = currentClient;
void defaultCompatibleClient;

type RfcProcedureQueryOptions<TInput, TContext extends object> =
  & (undefined extends TInput ? { readonly input?: TInput } : { readonly input: TInput })
  & (RequiredKeys<TContext> extends never ? { readonly context?: TContext }
    : { readonly context: TContext });

interface RfcContextualProcedureQueryUtils<TInput, TOutput, TContext extends object> {
  readonly call: RfcServiceClientMethod<TInput, TOutput, TContext>;
  queryOptions(
    options: RfcProcedureQueryOptions<TInput, TContext>,
  ): ServiceProcedureQueryResult<TOutput>;
}

type RfcServiceQueryUtils<
  TContract extends ContractLike,
  TContext extends object = EmptyContext,
> = StringKey<TContext> extends never ? ServiceQueryUtils<TContract>
  : TContract extends ContractProcedureLike ? RfcContextualProcedureQueryUtils<
      ProcedureInputFromNode<TContract>,
      ProcedureOutputFromNode<TContract>,
      TContext
    >
  : {
    [K in keyof TContract]: TContract[K] extends ContractLike
      ? RfcServiceQueryUtils<TContract[K], TContext>
      : never;
  };

declare const currentQueryUtils: ServiceQueryUtils<typeof serviceContract>;
const defaultCompatibleQueryUtils: RfcServiceQueryUtils<typeof serviceContract> = currentQueryUtils;
void defaultCompatibleQueryUtils;

const currentDefinedServices = defineServices({
  publicCatalog: { contract: serviceContract },
});
const currentDefinedQueryUtils: ServiceQueryUtils<typeof serviceContract> =
  currentDefinedServices.queryUtils.publicCatalog;
void currentDefinedQueryUtils;

type CurrentOrdersAction = ActionMethod<typeof serviceContract.orders, 'list'>;
type CurrentOrdersFactory = QueryFactory<typeof serviceContract.orders>;
type CurrentOrdersFactoryConfig = FactoryConfig<typeof serviceContract.orders>;
type _CurrentActionKeyIsExactThreeTuple = Assert<
  IsAssignable<
    ReturnType<CurrentOrdersAction['key']>,
    readonly [string, 'list', string]
  >
>;
type _CurrentFactoryKeyIsExactThreeTuple = Assert<
  IsAssignable<
    ReturnType<CurrentOrdersFactory['list']['key']>,
    readonly [string, 'list', string]
  >
>;
type _CurrentFactoryClientKeepsDefaultContext = Assert<
  IsAssignable<
    CurrentOrdersFactoryConfig['client'],
    ServiceClient<typeof serviceContract.orders>
  >
>;

const currentServerKey = createActionQueryKey('orders', 'list', { page: 1 });
const currentExactServerKey: readonly [string, string, string] = currentServerKey;
void currentExactServerKey;

type RfcServerKeySuffix =
  | readonly []
  | readonly ['$netscript.sdk-context', string];

type RfcActionQueryKey<
  TAction extends string = string,
  TSuffix extends RfcServerKeySuffix = readonly [],
> = readonly [string, TAction, string, ...TSuffix];

type _DefaultKeyPartsRemainValid = Assert<
  IsAssignable<RfcActionQueryKey<'list'>[number], QueryKeyPart>
>;
type _PartitionedServerKeyRemainsCacheKey = Assert<
  IsAssignable<
    RfcActionQueryKey<'list', readonly ['$netscript.sdk-context', string]>,
    CacheKey
  >
>;

const defaultServerKey: RfcActionQueryKey<'list'> = ['orders', 'list', '{"page":1}'];
const partitionedServerKey: RfcActionQueryKey<
  'list',
  readonly ['$netscript.sdk-context', string]
> = [
  'orders',
  'list',
  '{"page":1}',
  '$netscript.sdk-context',
  '[["app:locale","de-CH"]]',
];
void defaultServerKey;
void partitionedServerKey;

const auth = defineRfcContribution<{ auth: { readonly token: () => Promise<string> } }>()({
  protocol: { family: 'netscript.sdk-client', major: 1 },
  id: '@netscript/plugin-auth:bearer',
  context: { auth: 'required' },
  headerKeys: ['authorization'],
  responseCache: { mode: 'partitioned' },
  prepare: ({ context }) => context.auth.token(),
});

const locale = defineRfcContribution<{ locale?: string }>()({
  protocol: { family: 'netscript.sdk-client', major: 1 },
  id: 'app:locale',
  context: { locale: 'optional' },
  headerKeys: ['accept-language'],
  responseCache: { mode: 'partitioned' },
  prepare: ({ context }) => context.locale,
});

const directOnly = defineRfcContribution<{ opaqueSession: string }>()({
  protocol: { family: 'netscript.sdk-client', major: 1 },
  id: 'app:opaque-session',
  context: { opaqueSession: 'required' },
  headerKeys: ['x-session'],
  responseCache: { mode: 'direct-only' },
  prepare: ({ context }) => context.opaqueSession,
});

const rejectedDesktopOptions: CreateDesktopServiceClientOptions<typeof serviceContract> = {
  contract: serviceContract,
  // @ts-expect-error RFC-A keeps HTTP contributions off the Desktop MessagePort options surface // quality-allow: negative compile fixture proves CreateDesktopServiceClientOptions rejects RFC HTTP contributions on the MessagePort transport
  contributions: [auth],
};
void rejectedDesktopOptions;

acceptRfcContributions([auth, locale]);

const duplicateAuthContext = defineRfcContribution<{ auth?: { readonly apiKey: string } }>()({
  protocol: { family: 'netscript.sdk-client', major: 1 },
  id: 'app:other-auth',
  context: { auth: 'optional' },
  headerKeys: ['x-api-key'],
  responseCache: { mode: 'direct-only' },
  prepare: () => undefined,
});

// @ts-expect-error duplicate context ownership is rejected at the tuple boundary // quality-allow: negative compile fixture proves tuple validation rejects two contributions that both claim the auth context key
acceptRfcContributions([auth, duplicateAuthContext]);

type RfcDefineServiceConfig<
  TContract extends ContractLike,
  TContributions extends readonly AnyRfcContribution[] = readonly [],
> = DefineServiceConfig<TContract> & {
  readonly contributions?: TContributions & RfcValidateTuple<TContributions>;
};

type RfcContractOf<TConfig> = TConfig extends {
  readonly contract: infer TContract extends ContractLike;
} ? TContract
  : never;

type RfcContributionsOf<TConfig> = TConfig extends {
  readonly contributions: infer TContributions extends readonly AnyRfcContribution[];
} ? TContributions
  : readonly [];

type RfcHasDirectOnly<TContributions extends readonly AnyRfcContribution[]> = Extract<
  TContributions[number]['responseCache'],
  { readonly mode: 'direct-only' }
> extends never ? false : true;

type RfcDefinedQueryContext<TConfig> = RfcContributionsOf<TConfig> extends readonly []
  ? EmptyContext
  : ServiceClientContext & RfcContributionContext<RfcContributionsOf<TConfig>>;

type RfcDefinedServices<TServices> = {
  readonly clients: {
    readonly [K in keyof TServices]: RfcServiceClient<
      RfcContractOf<TServices[K]>,
      ServiceClientContext & RfcContributionContext<RfcContributionsOf<TServices[K]>>
    >;
  };
  readonly queryUtils: {
    readonly [
      K in keyof TServices as RfcHasDirectOnly<
        RfcContributionsOf<TServices[K]>
      > extends true ? never : K
    ]: RfcServiceQueryUtils<
      RfcContractOf<TServices[K]>,
      RfcDefinedQueryContext<TServices[K]>
    >;
  };
};

declare function rfcDefineServices<
  const TServices extends Record<
    string,
    RfcDefineServiceConfig<ContractLike, readonly AnyRfcContribution[]>
  >,
>(services: TServices): RfcDefinedServices<TServices>;

const services = rfcDefineServices({
  accounts: {
    contract: serviceContract,
    contributions: [auth, locale] as const,
  },
  publicCatalog: {
    contract: serviceContract,
  },
  desktopOnly: {
    contract: serviceContract,
    contributions: [directOnly] as const,
  },
});

const unchangedDefinedUtils: ServiceQueryUtils<typeof serviceContract> =
  services.queryUtils.publicCatalog;
void unchangedDefinedUtils;

services.clients.accounts.orders.list({ page: 1 }, {
  context: {
    auth: { token: () => Promise.resolve('secret') },
    locale: 'de-CH',
  },
});

// @ts-expect-error required auth context makes the request options mandatory // quality-allow: negative compile fixture proves a generated client call rejects omission of options when contribution context contains a required key
services.clients.accounts.orders.list({ page: 1 });

services.queryUtils.accounts.orders.list.queryOptions({
  input: { page: 1 },
  context: {
    auth: { token: () => Promise.resolve('secret') },
    locale: 'de-CH',
  },
});

// A context-bearing service uses this distinct generated shape; the implementation fixture must
// construct it through the contribution-aware wrapper rather than extending the default
// upstream-assignability assertion above to this specialization.
declare const contributedQueryUtils: RfcServiceQueryUtils<
  typeof serviceContract,
  ServiceClientContext & RfcContributionContext<readonly [typeof auth, typeof locale]>
>;
void contributedQueryUtils;

// @ts-expect-error direct-only services are omitted from the generated query-utils map // quality-allow: negative compile fixture proves mapped query-utils keys exclude a service whose contribution declares direct-only response caching
services.queryUtils.desktopOnly;

type SyntheticContribution<TNumber extends string> = RfcContribution<
  `app:c${TNumber}`,
  Record<`c${TNumber}`, string>,
  readonly [`x-c${TNumber}`],
  'invariant'
>;

type SixteenContributions = readonly [
  SyntheticContribution<'01'>,
  SyntheticContribution<'02'>,
  SyntheticContribution<'03'>,
  SyntheticContribution<'04'>,
  SyntheticContribution<'05'>,
  SyntheticContribution<'06'>,
  SyntheticContribution<'07'>,
  SyntheticContribution<'08'>,
  SyntheticContribution<'09'>,
  SyntheticContribution<'10'>,
  SyntheticContribution<'11'>,
  SyntheticContribution<'12'>,
  SyntheticContribution<'13'>,
  SyntheticContribution<'14'>,
  SyntheticContribution<'15'>,
  SyntheticContribution<'16'>,
];

declare const sixteen: SixteenContributions;
acceptRfcContributions(sixteen);

declare const seventeen: readonly [
  ...SixteenContributions,
  SyntheticContribution<'17'>,
];

// @ts-expect-error the RFC-A public inference budget is sixteen contributions per service // quality-allow: negative compile fixture proves tuple validation rejects a seventeenth contribution while accepting sixteen
acceptRfcContributions(seventeen);
