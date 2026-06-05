/**
 * Triggers Plugin Contracts — Version 1
 *
 * @module
 */

import { implement } from '@orpc/server';
export * from './triggers.contract.ts';
import { triggersContract } from './triggers.contract.ts';

export const triggersContractV1 = implement(triggersContract);
