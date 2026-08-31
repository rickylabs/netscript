import {
  baseContract,
  type BaseContractErrors,
  type BaseContractMeta,
  type BaseContractRoute,
  CursorPaginationInputSchema,
  SuccessSchema,
} from '@netscript/contracts';
import { defineServices } from '@netscript/sdk';
import type { ProcedureMetaFromNode, ServiceClient } from '@netscript/sdk/ports';
import type { ProcedureMeta } from '@netscript/sdk/query';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true
  : false;
type Assert<T extends true> = T;

type ListRoute = BaseContractRoute<
  typeof CursorPaginationInputSchema,
  typeof SuccessSchema
>;

const listRoute: ListRoute = baseContract
  .route({ method: 'GET', path: '/orders' })
  .input(CursorPaginationInputSchema)
  .output(SuccessSchema)
  .meta({ access: { authentication: 'required' } });

const ordersContract = { list: listRoute };
declare const directClient: ServiceClient<typeof ordersContract>;

type DirectContract = NonNullable<typeof directClient.__netscriptServiceContract>;
type DirectMeta = ProcedureMetaFromNode<DirectContract['list']>;
type DirectErrors = DirectContract['list']['~orpc']['errorMap'];
type _DirectClientMetaRemainsExact = Assert<Equal<DirectMeta, BaseContractMeta>>;
type _DirectClientErrorsRemainExact = Assert<Equal<DirectErrors, BaseContractErrors>>;

type ExpectedErrorCode =
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'SERVICE_UNAVAILABLE';
type DirectMethodError = NonNullable<ReturnType<typeof directClient.list>['__error']>['type'];
type _DirectClientErrorCodesRemainExact = Assert<
  Equal<Extract<DirectMethodError, { readonly defined: true }>['code'], ExpectedErrorCode>
>;
type _DirectNotFoundStatusRemainsExact = Assert<Equal<DirectErrors['NOT_FOUND']['status'], 404>>;
type _DirectNotFoundMessageRemainsExact = Assert<
  Equal<DirectErrors['NOT_FOUND']['message'], 'Resource not found'>
>;
type _DirectNotFoundDataRemainsExact = Assert<
  Equal<DirectErrors['NOT_FOUND']['data'], BaseContractErrors['NOT_FOUND']['data']>
>;

const services = defineServices({
  orders: { contract: ordersContract },
});

type GeneratedContract = NonNullable<
  typeof services.clients.orders.__netscriptServiceContract
>;
type GeneratedMeta = ProcedureMetaFromNode<GeneratedContract['list']>;
type GeneratedErrors = GeneratedContract['list']['~orpc']['errorMap'];
type QueryMeta = NonNullable<
  typeof services.queries.orders.list.__netscriptProcedureMeta
>;
type _GeneratedClientMetaRemainsExact = Assert<Equal<GeneratedMeta, BaseContractMeta>>;
type _GeneratedClientErrorsRemainExact = Assert<Equal<GeneratedErrors, BaseContractErrors>>;
type _GeneratedQueryMetaRemainsExact = Assert<Equal<QueryMeta, BaseContractMeta>>;
type _QueryExtractorMetaRemainsExact = Assert<
  Equal<ProcedureMeta<typeof ordersContract, 'list'>, BaseContractMeta>
>;

const validMeta: ProcedureMeta<typeof ordersContract, 'list'> = {
  access: { authentication: 'optional' },
};
const invalidAuthentication: ProcedureMeta<typeof ordersContract, 'list'> = {
  // @ts-expect-error TS2322: SDK metadata preserves the public authentication literal union.
  access: { authentication: 'sometimes' },
};
// @ts-expect-error TS2322: SDK metadata preserves the public nested object shape.
const invalidAccess: ProcedureMeta<typeof ordersContract, 'list'> = { access: 'required' };

void directClient;
void services;
void validMeta;
void invalidAuthentication;
void invalidAccess;
