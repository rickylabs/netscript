/**
 * Compile-only RFC-A inference proof against the public SDK contract and query surfaces.
 */

import {
  createLocaleSdkClientContribution,
  defineSdkClientContribution,
  type LocaleSdkClientContext,
  type SdkClientContributionDefinition,
} from '../../src/client/mod.ts';
import { defineServices } from '../../src/presets/mod.ts';
import type {
  ContractLike,
  ContractProcedureLike,
  ContractSchema,
  ServiceClient,
  ServiceClientContext,
  ServiceClientMethod,
} from '../../src/ports/service-client.ts';
import type { ServiceQueryUtils } from '../../src/ports/service-query-utils.ts';
import type { ActionMethod, FactoryConfig, QueryFactory } from '../../src/ports/query-factory.ts';
import {
  type ActionQueryKey,
  createActionQueryKey,
  type QueryKeyPart,
} from '../../src/ports/query-key.ts';
import type {
  SdkClientContextDeclaration,
  SdkClientContribution,
  SdkClientContributionContext,
  SdkClientPrepareOptions,
  ValidateSdkClientContributions,
} from '../../src/ports/sdk-client-contribution.ts';
import type { CacheKey } from '../../src/ports/cache-store.ts';
import type { CreateDesktopServiceClientOptions } from '../../src/desktop/domain/types.ts';

type Assert<T extends true> = T;
type IsAssignable<TFrom, TTo> = [TFrom] extends [TTo] ? true : false;
type IsEqual<TLeft, TRight> = (<T>() => T extends TLeft ? 1 : 2) extends
  (<T>() => T extends TRight ? 1 : 2) ? true : false;

type _PrepareOptionsStayExact = Assert<
  IsEqual<
    keyof SdkClientPrepareOptions,
    'context' | 'signal' | 'procedure' | 'transport' | 'input'
  >
>;

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

declare function acceptSdkClientContributions<
  const TContributions extends readonly object[],
>(
  contributions: TContributions & ValidateSdkClientContributions<TContributions>,
): SdkClientContributionContext<TContributions>;

declare const currentClient: ServiceClient<typeof serviceContract>;
const defaultCompatibleClient: ServiceClient<typeof serviceContract> = currentClient;
void defaultCompatibleClient;

declare const currentQueryUtils: ServiceQueryUtils<typeof serviceContract>;
const defaultCompatibleQueryUtils: ServiceQueryUtils<typeof serviceContract> = currentQueryUtils;
void defaultCompatibleQueryUtils;

type PreservedClientError = Error & { readonly code: 'PRESERVED' };
type PreservedErrorMethod = ServiceClientMethod<
  ListOrdersInput,
  ListOrdersOutput,
  PreservedClientError,
  { readonly tenant: string }
>;
type _TErrorRemainsThirdAndContextIsFourth = Assert<
  IsAssignable<
    ReturnType<PreservedErrorMethod>,
    Promise<ListOrdersOutput> & { __error?: { type: PreservedClientError } }
  >
>;

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
const currentPartitionedServerKey = createActionQueryKey(
  'orders',
  'list',
  { page: 1 },
  ['$netscript.sdk-context', '[["app:locale","de-CH"]]'] as const,
);
const currentExactPartitionedServerKey: readonly [
  string,
  'list',
  string,
  '$netscript.sdk-context',
  string,
] = currentPartitionedServerKey;
void currentExactServerKey;
void currentExactPartitionedServerKey;

type _DefaultKeyPartsRemainValid = Assert<
  IsAssignable<ActionQueryKey<'list'>[number], QueryKeyPart>
>;
type _PartitionedServerKeyRemainsCacheKey = Assert<
  IsAssignable<
    ActionQueryKey<'list', readonly ['$netscript.sdk-context', string]>,
    CacheKey
  >
>;

const defaultServerKey: ActionQueryKey<'list'> = ['orders', 'list', '{"page":1}'];
const partitionedServerKey: ActionQueryKey<
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

const auth = defineSdkClientContribution<{
  auth: { readonly token: () => Promise<string> };
}>()({
  protocol: { family: 'netscript.sdk-client', major: 1 },
  id: '@netscript/plugin-auth:bearer',
  context: { auth: 'required' },
  headerKeys: ['authorization'],
  responseCache: {
    mode: 'partitioned',
    partition: () => 'auth-partition',
  },
  prepare: async ({ context }) => ({
    headers: { authorization: await context.auth.token() },
  }),
});

const locale = createLocaleSdkClientContribution();
type _CanonicalLocaleContextPreserved = Assert<
  IsAssignable<
    SdkClientContributionContext<readonly [typeof locale]>,
    LocaleSdkClientContext
  >
>;
type _CanonicalLocaleContextIsNotWidened = Assert<
  IsAssignable<
    LocaleSdkClientContext,
    SdkClientContributionContext<readonly [typeof locale]>
  >
>;

const directOnly = defineSdkClientContribution<{ opaqueSession: string }>()({
  protocol: { family: 'netscript.sdk-client', major: 1 },
  id: 'app:opaque-session',
  context: { opaqueSession: 'required' },
  headerKeys: ['x-session'],
  responseCache: { mode: 'direct-only' },
  prepare: ({ context }) => ({ headers: { 'x-session': context.opaqueSession } }),
});

const helperSignature: SdkClientContributionDefinition<{ locale?: string }> =
  defineSdkClientContribution<{ locale?: string }>();
void helperSignature;

const defineClosedContribution = defineSdkClientContribution();
const closedDescriptor = {
  protocol: { family: 'netscript.sdk-client', major: 1 },
  id: 'app:closed-shape',
  context: {},
  headerKeys: [],
  responseCache: { mode: 'invariant' },
  prepare: () => ({}),
} as const;

defineClosedContribution({
  ...closedDescriptor,
  // @ts-expect-error dependency ordering is not part of protocol major 1
  before: ['app:locale'],
});
defineClosedContribution({
  ...closedDescriptor,
  // @ts-expect-error dependency ordering is not part of protocol major 1
  after: ['app:locale'],
});
defineClosedContribution({
  ...closedDescriptor,
  // @ts-expect-error dependency ordering is not part of protocol major 1
  requires: ['app:locale'],
});
defineClosedContribution({
  ...closedDescriptor,
  // @ts-expect-error priority ordering is not part of protocol major 1
  priority: 1,
});
defineClosedContribution({
  ...closedDescriptor,
  // @ts-expect-error environment flags are not part of protocol major 1
  environment: 'browser',
});
defineClosedContribution({
  ...closedDescriptor,
  // @ts-expect-error contributions cannot supply a transport link
  link: {},
});
defineClosedContribution({
  ...closedDescriptor,
  // @ts-expect-error contributions cannot supply fetch
  fetch,
});
defineClosedContribution({
  ...closedDescriptor,
  // @ts-expect-error contributions cannot supply upstream link plugins
  plugins: [],
});
defineClosedContribution({
  ...closedDescriptor,
  // @ts-expect-error contributions cannot supply upstream interceptors
  interceptors: [],
});
defineClosedContribution({
  ...closedDescriptor,
  // @ts-expect-error contributions cannot supply upstream client interceptors
  clientInterceptors: [],
});
defineClosedContribution({
  ...closedDescriptor,
  // @ts-expect-error contributions cannot supply upstream adapter interceptors
  adapterInterceptors: [],
});
defineClosedContribution({
  ...closedDescriptor,
  // @ts-expect-error contributions cannot control retry policy
  retry: 1,
});

const rejectedDesktopOptions: CreateDesktopServiceClientOptions<typeof serviceContract> = {
  contract: serviceContract,
  // @ts-expect-error RFC-A keeps HTTP contributions off the Desktop MessagePort options surface // quality-allow: negative compile fixture proves CreateDesktopServiceClientOptions rejects RFC HTTP contributions on the MessagePort transport
  contributions: [auth],
};
void rejectedDesktopOptions;

acceptSdkClientContributions([auth, locale]);

const duplicateAuthContext = defineSdkClientContribution<{
  auth?: { readonly apiKey: string };
}>()({
  protocol: { family: 'netscript.sdk-client', major: 1 },
  id: 'app:other-auth',
  context: { auth: 'optional' },
  headerKeys: ['x-api-key'],
  responseCache: { mode: 'direct-only' },
  prepare: () => ({}),
});

// @ts-expect-error duplicate context ownership is rejected at the tuple boundary // quality-allow: negative compile fixture proves tuple validation rejects two contributions that both claim the auth context key
acceptSdkClientContributions([auth, duplicateAuthContext]);

const services = defineServices({
  accounts: {
    contract: serviceContract,
    contributions: [auth, locale] as const,
  },
  publicCatalog: {
    contract: serviceContract,
  },
  localizedCatalog: {
    contract: serviceContract,
    contributions: [locale] as const,
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

services.clients.localizedCatalog.orders.list({ page: 1 });
services.clients.localizedCatalog.orders.list({ page: 1 }, {
  context: { locale: 'fr-FR' },
});
services.queryUtils.localizedCatalog.orders.list.queryOptions({
  input: { page: 1 },
  context: { locale: 'fr-FR' },
});
services.clients.localizedCatalog.orders.list({ page: 1 }, {
  // @ts-expect-error canonical locale context remains string-typed on generated clients // quality-allow: negative compile fixture proves the locale factory preserves its inferred context through defineServices
  context: { locale: 42 },
});

// A context-bearing service uses this distinct generated shape; the implementation fixture must
// construct it through the contribution-aware wrapper rather than extending the default
// upstream-assignability assertion above to this specialization.
declare const contributedQueryUtils: ServiceQueryUtils<
  typeof serviceContract,
  ServiceClientContext & SdkClientContributionContext<readonly [typeof auth, typeof locale]>
>;
void contributedQueryUtils;

// @ts-expect-error direct-only services are omitted from the generated query-utils map // quality-allow: negative compile fixture proves mapped query-utils keys exclude a service whose contribution declares direct-only response caching
services.queryUtils.desktopOnly;

type SyntheticContribution<TNumber extends string> =
  & Omit<
    SdkClientContribution<
      `app:c${TNumber}`,
      Record<`c${TNumber}`, string>,
      SdkClientContextDeclaration<Record<`c${TNumber}`, string>>,
      readonly [`x-c${TNumber}`]
    >,
    'responseCache'
  >
  & { readonly responseCache: { readonly mode: 'invariant' } };

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
acceptSdkClientContributions(sixteen);

declare const seventeen: readonly [
  ...SixteenContributions,
  SyntheticContribution<'17'>,
];

// @ts-expect-error the RFC-A public inference budget is sixteen contributions per service // quality-allow: negative compile fixture proves tuple validation rejects a seventeenth contribution while accepting sixteen
acceptSdkClientContributions(seventeen);
