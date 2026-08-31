import {
  baseContract,
  type BaseContractMeta,
  type BaseContractOutputRoute,
  type BaseContractRoute,
  CursorPaginationInputSchema,
  type NetScriptAuthenticationRequirement,
  type NetScriptProcedureMeta,
  SuccessSchema,
} from '@netscript/contracts';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true
  : false;
type Assert<T extends true> = T;

type BaseErrorMap = typeof baseContract['~orpc']['errorMap'];
type BaseMeta = typeof baseContract['~orpc']['meta'];

type _BaseMetaRemainsExact = Assert<Equal<BaseMeta, BaseContractMeta>>;

type InputOutputRoute = BaseContractRoute<
  typeof CursorPaginationInputSchema,
  typeof SuccessSchema
>;
type OutputRoute = BaseContractOutputRoute<typeof SuccessSchema>;

type _InputOutputRouteErrorsRemainExact = Assert<
  Equal<InputOutputRoute['~orpc']['errorMap'], BaseErrorMap>
>;
type _InputOutputRouteMetaRemainsExact = Assert<
  Equal<InputOutputRoute['~orpc']['meta'], BaseContractMeta>
>;
type _OutputRouteErrorsRemainExact = Assert<
  Equal<OutputRoute['~orpc']['errorMap'], BaseErrorMap>
>;
type _OutputRouteMetaRemainsExact = Assert<
  Equal<OutputRoute['~orpc']['meta'], BaseContractMeta>
>;

const publicMeta: NetScriptProcedureMeta = {
  access: {
    authentication: 'required',
    authorization: {
      scopes: ['items:read'],
      roles: ['operator'],
    },
  },
};

const authenticatedRoute: InputOutputRoute = baseContract
  .route({ method: 'GET', path: '/items' })
  .input(CursorPaginationInputSchema)
  .output(SuccessSchema)
  .meta(publicMeta);

const validAuthentication: NetScriptAuthenticationRequirement = 'optional';
// @ts-expect-error TS2322: authentication accepts only the public NetScript literals.
const invalidAuthentication: NetScriptAuthenticationRequirement = 'sometimes';

baseContract.meta({
  access: {
    authentication: 'none',
    authorization: { scopes: ['items:read'], roles: ['operator'] },
  },
});
// @ts-expect-error TS2322: access metadata must use the public object shape.
baseContract.meta({ access: 'none' });
// @ts-expect-error TS2353: access metadata has no parallel public-policy vocabulary.
baseContract.meta({ access: { public: true } });
// @ts-expect-error TS2339: declared scopes are immutable.
publicMeta.access?.authorization?.scopes?.push('items:write');

void authenticatedRoute;
void validAuthentication;
void invalidAuthentication;
