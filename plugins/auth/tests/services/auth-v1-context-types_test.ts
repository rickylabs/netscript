import { assert } from 'jsr:@std/assert@^1';
import { authContractV1 } from '@netscript/plugin-auth-core/contracts/v1';
import type { AuthServiceContext } from '../../services/src/routers/v1-types.ts';

Deno.test('auth v1 handlers infer contract input context and errors', () => {
  const router = authContractV1.$context<AuthServiceContext>();
  const signin = router.signin.handler(({ input, context, errors }) => {
    void input.redirectTo;
    void context.registry.resolveBackend;
    errors.AUTH_PROVIDER_ERROR({
      message: 'provider failed',
      data: { reason: 'provider failed' },
    });
    // @ts-expect-error signin input does not accept session lookup fields.
    input.sessionId;
    return { started: true };
  });

  assert(signin);
});
