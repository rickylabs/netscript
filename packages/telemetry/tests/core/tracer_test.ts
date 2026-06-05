import { assertStrictEquals } from '@std/assert';
import { getTracer } from '../../tracer.ts';

Deno.test('getTracer returns cached tracer instances for the same name/version', () => {
  const tracerA = getTracer('@netscript/test', '1.0.0');
  const tracerB = getTracer('@netscript/test', '1.0.0');

  assertStrictEquals(tracerA, tracerB);
});
