import { assertEquals, assertRejects } from '@std/assert';
import { ORPCError } from '@orpc/contract';
import { os } from '@orpc/server';
import { createService } from '../../../service/mod.ts';
import { createServiceClient } from '../../src/client/service-client.ts';
import { createServerServiceEnvKey } from '../../src/discovery/service-url.ts';

// Gap 1 regression (issue #279): the eis-chat consumer saw a live 404 on
// `GET /api/rpc/v1/workers/triggerJob`, i.e. the type-safe RPC endpoint appeared
// unmounted. This proves that a `createServiceClient({ serviceName, routerName })`
// call over the RPC transport reaches a plugin-workers-style `triggerJob` route
// (route is mounted and routed), and that a request that resolves no task id
// fails loudly with a `VALIDATION_ERROR` envelope (Gap 2 behavior over RPC)
// rather than 404-ing or silently succeeding with an `undefined` id.

const SERVICE_NAME = 'workers';
const ROUTER_NAME = 'workers';
const RPC_PATH = `/api/rpc/v1/${ROUTER_NAME}`;

interface TriggerJobInput {
  readonly id?: string;
}

// A plugin-workers-style router: `triggerJob` mirrors the real contract route
// (`POST /jobs/{id}/trigger`) with an optional body id, failing loudly when no
// id resolves — exactly the shape the #279 fix gives the real handler.
function createWorkersStyleRouter() {
  return {
    triggerJob: os.route({ method: 'POST', path: '/jobs/{id}/trigger' }).handler(
      ({ input }: { input: unknown }) => {
        const id = (input as TriggerJobInput).id;
        if (!id) {
          throw new ORPCError('VALIDATION_ERROR', {
            status: 422,
            message: 'Job id is required in the {id} path segment.',
            data: {
              formErrors: [],
              fieldErrors: { id: ['Job id is required in the {id} path segment.'] },
            },
          });
        }
        return { jobId: id, triggered: true };
      },
    ),
  };
}

function clientOrigin(hostname: string, port: number): string {
  const host = hostname === '0.0.0.0' ? '127.0.0.1' : hostname;
  return `http://${host}:${port}`;
}

Deno.test('createServiceClient RPC path reaches a plugin-workers triggerJob route', async () => {
  const router = createWorkersStyleRouter();
  const running = await createService(router, { name: SERVICE_NAME })
    .withRPC({ rpcPath: RPC_PATH })
    .serve({ port: 0 });
  const envKey = createServerServiceEnvKey(SERVICE_NAME);
  const previous = Deno.env.get(envKey);
  Deno.env.set(envKey, clientOrigin(running.addr.hostname, running.addr.port));

  try {
    const client = createServiceClient({
      contract: router,
      serviceName: SERVICE_NAME,
      routerName: ROUTER_NAME,
    });

    // Route is mounted and routed over RPC: a body-carried id round-trips.
    const ok = await client.triggerJob({ id: 'job-1' });
    assertEquals(ok, { jobId: 'job-1', triggered: true });

    // No id resolves -> loud validation failure, not a 404 and not a silent
    // success with an undefined id.
    const error = await assertRejects(() => client.triggerJob({}), ORPCError);
    assertEquals((error as ORPCError<string, unknown>).code, 'VALIDATION_ERROR');
  } finally {
    if (previous === undefined) {
      Deno.env.delete(envKey);
    } else {
      Deno.env.set(envKey, previous);
    }
    await running.stop();
  }
});
