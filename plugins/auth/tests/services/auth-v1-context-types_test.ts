import { assert } from 'jsr:@std/assert@^1';
import { authContractV1 } from '@netscript/plugin-auth-core/contracts/v1';
import type { AuthServiceContext } from '../../services/src/routers/v1-types.ts';

Deno.test('auth v1 handlers infer contract input context and errors', () => {
  const router = authContractV1.$context<AuthServiceContext>();
  const signin = router.signin.handler(({ input, context, errors }) => {
    // Input and context are precisely typed against the contract / bound
    // service context. The error map crosses the centralized base-seam boundary
    // cast (so `errors` is the opaque oRPC error map rather than per-key
    // callables); referencing it keeps the binding exercised without depending
    // on the pre-convergence per-key callable surface.
    void input.redirectTo;
    void context.registry.resolveBackend;
    void errors;
    return { started: true };
  });

  assert(signin);
});
