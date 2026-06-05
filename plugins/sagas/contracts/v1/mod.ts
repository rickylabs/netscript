/**
 * Sagas Plugin Contracts - Version 1
 *
 * @module
 */

import { implement } from '@orpc/server';
export * from './sagas.contract.ts';
import { sagasContract } from './sagas.contract.ts';

const implementedSagasContract: ReturnType<typeof implement<typeof sagasContract>> = implement(
  sagasContract,
);

export type SagasContractV1 = typeof implementedSagasContract;

export const sagasContractV1: SagasContractV1 = implementedSagasContract;
