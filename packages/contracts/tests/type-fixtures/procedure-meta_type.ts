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
  access: { authentication: 'required' },
};

const authenticatedRoute: InputOutputRoute = baseContract
  .route({ method: 'GET', path: '/items' })
  .input(CursorPaginationInputSchema)
  .output(SuccessSchema)
  .meta(publicMeta);

const validAuthentication: NetScriptAuthenticationRequirement = 'optional';
// @ts-expect-error TS2322: authentication accepts only the public NetScript literals.
const invalidAuthentication: NetScriptAuthenticationRequirement = 'sometimes';

baseContract.meta({ access: { authentication: 'none' } });
// @ts-expect-error TS2322: access metadata must use the public object shape.
baseContract.meta({ access: 'none' });

void authenticatedRoute;
void validAuthentication;
void invalidAuthentication;
