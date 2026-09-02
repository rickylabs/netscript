import { assert } from '@std/assert';

/**
 * `consume-flow-b-stream.ts` is a top-level-await script that only runs against a live AppHost,
 * so its module evaluation order is not covered by an ordinary unit test. The hosted TC-14 run at
 * `ecce4af0a` failed with `ReferenceError: Cannot access 'flowBTracerProvider' before
 * initialization` because the `let` binding sat below the `await provider.register()` that
 * assigns it. This guard pins the declaration above that await.
 */
Deno.test('consume-flow-b-stream declares flowBTracerProvider before provider.register()', async () => {
  const source = await Deno.readTextFile(
    new URL('./consume-flow-b-stream.ts', import.meta.url),
  );
  const declaration = source.indexOf('let flowBTracerProvider');
  const register = source.indexOf('await provider.register()');
  assert(declaration >= 0, 'flowBTracerProvider declaration missing');
  assert(register >= 0, 'provider.register() call missing');
  assert(
    declaration < register,
    'flowBTracerProvider must be declared before the top-level provider.register() await',
  );
});
