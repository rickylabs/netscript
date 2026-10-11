import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import {
  checkGeneratedAuthCase,
  GENERATED_AUTH_CASES,
  type GeneratedAuthCase,
} from '../../../src/application/gates/scaffold/generated-auth-checks.ts';
import { GATE } from '../../../src/domain/cli-surface.ts';

// This is the owner's allowed negative control: make one guarded projection public.
// The same named check called by the runtime command must then fail. The native,
// generated-project positive proof lives in generated-guarded-service_test.ts.
for (const id of GENERATED_AUTH_CASES) {
  Deno.test(`${id}: guarded-to-public HTTP fixture is red`, async () => {
    await withFixture(id, 'public', async (context) => {
      const error = await assertRejects(() => checkGeneratedAuthCase(id, context), Error);
      assertStringIncludes(
        error.message,
        id === GATE.BEHAVIOR_AUTH_SESSION_AUTHENTICATED
          ? 'credential must authenticate'
          : id === GATE.BEHAVIOR_AUTH_SIGNOUT_FOREIGN_SESSION
          ? 'foreign selector must be refused'
          : 'served 200',
      );
    });
  });
}

Deno.test('foreign signout refusal also fails if either session was revoked', async () => {
  await withFixture(GATE.BEHAVIOR_AUTH_SIGNOUT_FOREIGN_SESSION, 'revoked', async (context) => {
    const error = await assertRejects(() =>
      checkGeneratedAuthCase(GATE.BEHAVIOR_AUTH_SIGNOUT_FOREIGN_SESSION, context)
    );
    assertStringIncludes(
      error instanceof Error ? error.message : String(error),
      'credential must authenticate',
    );
  });
});

Deno.test('authenticated users case requires the permitted 200 after denied 403', async () => {
  await withFixture(GATE.BEHAVIOR_SERVICE_API_AUTHENTICATED, 'deny-all', async (context) => {
    const error = await assertRejects(() =>
      checkGeneratedAuthCase(GATE.BEHAVIOR_SERVICE_API_AUTHENTICATED, context)
    );
    assertStringIncludes(
      error instanceof Error ? error.message : String(error),
      'expected HTTP 200, served 403',
    );
  });
});

Deno.test('each RPC refusal check fires independently of the REST result', async () => {
  for (
    const id of [
      GATE.BEHAVIOR_SERVICE_API_UNAUTHENTICATED,
      GATE.BEHAVIOR_SERVICE_API_AUTHENTICATED,
      GATE.BEHAVIOR_AUTH_SIGNOUT_FOREIGN_SESSION,
    ]
  ) {
    await withFixture(id, 'rpc-public', async (context) => {
      await assertRejects(() => checkGeneratedAuthCase(id, context), Error);
    });
  }
});

type FixtureFault = 'public' | 'rpc-public' | 'revoked' | 'deny-all';

async function withFixture(
  id: GeneratedAuthCase,
  fault: FixtureFault,
  check: (
    context: {
      authUrl: string;
      serviceUrl: string;
      caller: string;
      denied: string;
      foreign: string;
    },
  ) => Promise<void>,
): Promise<void> {
  const server = Deno.serve({ hostname: '127.0.0.1', port: 0, onListen: () => {} }, (request) => {
    const path = new URL(request.url).pathname;
    const credential = request.headers.get('authorization')?.replace('Bearer ', '');
    const publicRoute = fault === 'public' || (fault === 'rpc-public' && path.includes('/rpc/'));
    if (path.endsWith('/session') || path.endsWith('/me')) {
      return Response.json(
        credential && !publicRoute && fault !== 'revoked'
          ? { authenticated: true, session: { id: credential } }
          : { authenticated: false },
      );
    }
    if (publicRoute) return Response.json({ ok: true });
    if (path.endsWith('/signout')) return new Response(null, { status: 401 });
    const status = credential === 'permitted' && fault !== 'deny-all'
      ? 200
      : credential
      ? 403
      : 401;
    return new Response(null, { status });
  });
  try {
    const url = `http://127.0.0.1:${server.addr.port}`;
    await check({
      authUrl: url,
      serviceUrl: url,
      caller: 'permitted',
      denied: 'denied',
      foreign: 'foreign',
    });
  } finally {
    await server.shutdown();
  }
  assertEquals(GENERATED_AUTH_CASES.includes(id), true);
}
