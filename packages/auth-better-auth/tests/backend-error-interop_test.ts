import { assert, assertEquals } from '@std/assert';
import {
  AuthBackendOperationUnsupportedError as BetterAuthUnsupportedOperationError,
} from '../mod.ts';
import {
  AuthBackendOperationUnsupportedError as WorkosUnsupportedOperationError,
} from '../../auth-workos/mod.ts';

Deno.test('backend unsupported-operation errors share one runtime class', () => {
  const workosError = new WorkosUnsupportedOperationError(
    'workos',
    'sessions.createSession',
    'WorkOS owns hosted session creation.',
  );
  const betterAuthError = new BetterAuthUnsupportedOperationError(
    'better-auth',
    'sessions.revokeSession',
    'better-auth revocation is request API driven.',
  );

  assert(workosError instanceof BetterAuthUnsupportedOperationError);
  assert(betterAuthError instanceof WorkosUnsupportedOperationError);
  assertEquals(workosError.name, 'AuthBackendOperationUnsupportedError');
  assertEquals(betterAuthError.name, 'AuthBackendOperationUnsupportedError');
});
