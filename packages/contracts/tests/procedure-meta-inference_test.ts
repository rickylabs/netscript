import {
  type BaseContractErrors,
  type BaseContractMeta,
  type NetScriptProcedureMeta,
} from '@netscript/contracts';
import { oc } from '@orpc/contract';
import { commonErrorMap } from '../src/application/contract-primitives.ts';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true
  : false;
type Assert<T extends true> = T;

const inferredBaseContract = oc.$meta<NetScriptProcedureMeta>({}).errors(commonErrorMap);

type InferredBaseMeta = typeof inferredBaseContract['~orpc']['meta'];
type InferredBaseErrors = typeof inferredBaseContract['~orpc']['errorMap'];
type _InferredBaseMetaRemainsExact = Assert<Equal<InferredBaseMeta, BaseContractMeta>>;
type _InferredBaseErrorsRemainExact = Assert<Equal<InferredBaseErrors, BaseContractErrors>>;

Deno.test('unannotated base contract preserves the exact metadata and error-map types', () => {});
