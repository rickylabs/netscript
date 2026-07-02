import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { createPluginService } from '@netscript/plugin/service';
import { router } from './router.ts';
import type { WorkersServiceRuntime } from './routers/router-context.ts';

// Gap 2 regression (issue #279): `triggerJob` / `triggerTask` must take the
// target id from the `{id}` path segment, not a required body field. Previously
// the body `id` was required and read directly, so a consumer that omitted it
// persisted a message with `id=undefined` ("Workers KV key contains unsupported
// part: undefined"). These exercise the REAL workers contract + handlers through
// the OpenAPI (REST) mount: an empty request body must still resolve the id from
// the path and drive the lookup, proving the path is the single source of truth
// and that the registry is never queried with an undefined id.

// Minimal stand-in runtime: only the relevant registry `get` is reached before
// the handler returns NOT_FOUND, so the rest of the runtime is intentionally
// absent. Test-only cast; the real runtime is wired by the host.
function buildApp(registryKey: 'jobRegistry' | 'taskRegistry', lookedUp: string[]) {
  const stubRuntime = {
    [registryKey]: {
      get(id: string): Promise<undefined> {
        lookedUp.push(id);
        return Promise.resolve(undefined);
      },
    },
  } as unknown as WorkersServiceRuntime;

  return createPluginService(router, {
    name: 'workers',
    version: '1.0.0',
    openApi: {
      title: 'Workers API',
      description: 'Workers service for job management and execution',
    },
    context: () => ({ workers: stubRuntime }),
  }).build();
}

function assertPathIdResolved(lookedUp: string[], expected: string, status: number): void {
  // The path id flowed through to the registry lookup (source of truth), and the
  // handler failed with NOT_FOUND (unknown resource) rather than persisting undefined.
  assert(
    lookedUp.includes(expected),
    `expected registry lookup for the path id, got: ${JSON.stringify(lookedUp)}`,
  );
  assert(
    !lookedUp.includes('undefined') && !lookedUp.some((id) => id === undefined),
    'registry must never be queried with an undefined id',
  );
  assertEquals(status, 404);
}

Deno.test('triggerJob resolves the target job id from the {id} path, not the body', async () => {
  const lookedUp: string[] = [];
  const app = buildApp('jobRegistry', lookedUp);

  // Empty body: the id must come from the `{id}` path segment.
  const response = await app.request('/api/v1/workers/jobs/job-from-path/trigger', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  });

  assertPathIdResolved(lookedUp, 'job-from-path', response.status);
});

Deno.test('triggerTask resolves the target task id from the {id} path, not the body', async () => {
  const lookedUp: string[] = [];
  const app = buildApp('taskRegistry', lookedUp);

  // Empty body: the id must come from the `{id}` path segment.
  const response = await app.request('/api/v1/workers/tasks/task-from-path/trigger', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  });

  assertPathIdResolved(lookedUp, 'task-from-path', response.status);
});
