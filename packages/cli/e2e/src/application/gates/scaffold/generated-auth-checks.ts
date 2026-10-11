import { assert, assertEquals } from '@std/assert';
import { GATE } from '../../../domain/cli-surface.ts';
import { judgeHttpResponse, readBoundedBody } from '../../../domain/http-contract.ts';
import { probeExchange } from './runtime/probe-plugin-resource.ts';

/** Named cases executed inside the generated project's native-session probe. */
export const GENERATED_AUTH_CASES = [
  GATE.BEHAVIOR_AUTH_SESSION_AUTHENTICATED,
  GATE.BEHAVIOR_AUTH_SIGNOUT_UNAUTHENTICATED,
  GATE.BEHAVIOR_AUTH_RPC_UNAUTHENTICATED,
  GATE.BEHAVIOR_SERVICE_API_UNAUTHENTICATED,
  GATE.BEHAVIOR_SERVICE_API_AUTHENTICATED,
  GATE.BEHAVIOR_AUTH_SIGNOUT_FOREIGN_SESSION,
] as const;

export type GeneratedAuthCase = typeof GENERATED_AUTH_CASES[number];

/** Credentials stay in-process; only named case verdicts reach the command output. */
export interface GeneratedAuthProbeContext {
  readonly authUrl: string;
  readonly serviceUrl: string;
  readonly caller: string;
  readonly denied: string;
  readonly foreign: string;
}

export function parseGeneratedAuthCase(value: string): GeneratedAuthCase {
  const match = GENERATED_AUTH_CASES.find((candidate) => candidate === value);
  if (!match) throw new Error('Unsupported generated-auth case');
  return match;
}

/** Assert one named runtime contract using the same exact exchange primitive as HttpGate. */
export async function checkGeneratedAuthCase(
  id: GeneratedAuthCase,
  context: GeneratedAuthProbeContext,
): Promise<void> {
  switch (id) {
    case GATE.BEHAVIOR_AUTH_SESSION_AUTHENTICATED:
      for (const route of ['session', 'me']) {
        await probeExchange([context.authUrl], '/api/v1/auth/' + route, {
          method: 'GET',
          expectStatus: 200,
          expectBody: { kind: 'json-equals', value: { authenticated: false } },
        });
        await assertActive(context.authUrl, route, context.caller);
      }
      break;
    case GATE.BEHAVIOR_AUTH_SIGNOUT_UNAUTHENTICATED:
      await probeExchange([context.authUrl], '/api/v1/auth/signout', {
        method: 'POST',
        expectStatus: 401,
      });
      break;
    case GATE.BEHAVIOR_AUTH_RPC_UNAUTHENTICATED:
      await probeExchange([context.authUrl], '/api/rpc/v1/auth/signout', {
        method: 'POST',
        expectStatus: 401,
      });
      break;
    case GATE.BEHAVIOR_SERVICE_API_UNAUTHENTICATED:
      await assertUsers(context.serviceUrl, undefined, 401);
      break;
    case GATE.BEHAVIOR_SERVICE_API_AUTHENTICATED:
      await assertUsers(context.serviceUrl, context.denied, 403);
      await assertUsers(context.serviceUrl, context.caller, 200);
      break;
    case GATE.BEHAVIOR_AUTH_SIGNOUT_FOREIGN_SESSION:
      for (const rpc of [false, true]) {
        const path = rpc ? '/api/rpc/v1/auth/signout' : '/api/v1/auth/signout';
        // The selector is session metadata, never a substitute for the caller's credential.
        const input = { sessionId: context.foreign };
        const response = await fetch(context.authUrl + path, {
          method: 'POST',
          redirect: 'manual',
          signal: AbortSignal.timeout(5_000),
          headers: {
            authorization: 'Bearer ' + context.caller,
            'content-type': 'application/json',
          },
          body: JSON.stringify(rpc ? { json: input } : input),
        });
        const outcome = await judgeHttpResponse({ method: 'POST', expectStatus: 401 }, response);
        assertEquals(outcome.kind, 'matched', id + ': foreign selector must be refused');
        await assertActive(context.authUrl, 'session', context.caller);
        await assertActive(context.authUrl, 'session', context.foreign);
      }
      break;
  }
  console.info(id + ' PASS; native credentials kept in-process');
}

async function assertUsers(baseUrl: string, token: string | undefined, expectStatus: number) {
  for (const path of ['/api/users/private', '/api/rpc/v1/users/protected']) {
    await probeExchange([baseUrl], path, {
      method: 'GET',
      expectStatus,
      headers: token === undefined ? {} : { authorization: 'Bearer ' + token },
    });
  }
}

async function assertActive(baseUrl: string, route: string, credential: string) {
  const response = await fetch(baseUrl + '/api/v1/auth/' + route, {
    headers: { authorization: 'Bearer ' + credential },
    redirect: 'manual',
    signal: AbortSignal.timeout(5_000),
  });
  if (response.status !== 200) {
    await judgeHttpResponse({ method: 'GET', expectStatus: 200 }, response);
  }
  assertEquals(response.status, 200, route + ': authenticated introspection status');
  const { body, bodyTruncated } = await readBoundedBody(response);
  assertEquals(bodyTruncated, false);
  const result = JSON.parse(body);
  assertEquals(result.authenticated, true, route + ': credential must authenticate');
  assert(result.session, route + ': active session must be returned');
  assert(result.session.id === credential, route + ': session must match the credential');
}
