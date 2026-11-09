/**
 * Typed SDK clients for the real graph. Discovery is the Aspire convention
 * (`services__<name>__http__0`), projected into this process by the
 * supervisor, so `createServiceClient` and `resolveServiceUrl` work unchanged —
 * the same code runs against an Aspire-hosted or a remote deployment.
 *
 * @module
 */

import { createServiceClient } from '@netscript/sdk/client';
import { UsersContractV1 } from '@workspace/contracts';
import { workersContract } from '@netscript/plugin-workers-core/contracts/v1';
import { sagasContract } from '@netscript/plugin-sagas-core/contracts/v1';
import { triggersContract } from '@netscript/plugin-triggers-core/contracts/v1';
import { buildStreamUrl } from '@netscript/plugin-streams-core';

/** Project discovery env the way Aspire does for a referencing resource. */
export function projectDiscovery(urls: Readonly<Record<string, string>>): void {
  for (const [name, url] of Object.entries(urls)) Deno.env.set(`services__${name}__http__0`, url);
}

export function createStackClients() {
  return {
    users: createServiceClient({ contract: UsersContractV1, serviceName: 'users', routerName: 'users' }),
    workers: createServiceClient({ contract: workersContract, serviceName: 'workers-api', routerName: 'workers' }),
    sagas: createServiceClient({ contract: sagasContract, serviceName: 'sagas-api', routerName: 'sagas' }),
    triggers: createServiceClient({ contract: triggersContract, serviceName: 'triggers-api', routerName: 'triggers' }),
  };
}

export type StackClients = ReturnType<typeof createStackClients>;

/** Public record-activity topic the scaffold's users service publishes to. */
export const ACTIVITY_STREAM_PATH = '/scaffold/users/records';

export function streamUrl(path: string): string {
  const base = Deno.env.get('services__streams__http__0');
  if (!base) throw new Error('streams is not discovered');
  return buildStreamUrl(path, base);
}
