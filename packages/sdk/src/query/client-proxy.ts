/**
 * Internal oRPC client proxy helpers.
 *
 * @module
 */

import type { ProcedureInput, ProcedureOutput } from '../interfaces/query-factory.ts';
import type {
  ContractLike,
  ContractProcedureNames,
  ServiceClient,
} from '../interfaces/service-client.ts';

/**
 * Invoke a named procedure on an oRPC proxy client.
 *
 * This centralizes the single dynamic property lookup required by the proxy-
 * based oRPC client surface so the rest of the SDK stays strongly typed.
 *
 * @param client - Typed oRPC client proxy.
 * @param procedureName - Procedure name to invoke.
 * @param input - Procedure input payload.
 * @returns Procedure output payload.
 */
export function invokeClientProcedure<
  TContract extends ContractLike,
  TAction extends ContractProcedureNames<TContract>,
>(
  client: ServiceClient<TContract>,
  procedureName: TAction,
  input: ProcedureInput<TContract, TAction>,
): Promise<ProcedureOutput<TContract, TAction>> {
  const candidate = Reflect.get(client as object, procedureName);

  if (typeof candidate !== 'function') {
    throw new Error(`Procedure "${String(procedureName)}" was not found on the service client.`);
  }

  return (candidate as (value: ProcedureInput<TContract, TAction>) => Promise<
    ProcedureOutput<TContract, TAction>
  >)(input);
}
