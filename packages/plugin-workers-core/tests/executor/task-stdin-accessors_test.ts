import { assertEquals, assertThrows } from '@std/assert';
import { encodeTaskStdin } from '../../src/executor/task-stdin.ts';

Deno.test('stdin array: rejects an indexed getter without calling it', () => {
  const payload = [7];
  let getterCalls = 0;
  Object.defineProperty(payload, '0', {
    get() {
      getterCalls++;
      return 7;
    },
  });
  assertThrows(() => encodeTaskStdin(payload), Error, 'InvalidStdinPayload');
  assertEquals(getterCalls, 0);
});

Deno.test('stdin array: rejects an inherited indexed getter without calling it', () => {
  const payload: number[] = [];
  payload.length = 1;
  let getterCalls = 0;
  Object.setPrototypeOf(
    payload,
    Object.create(Array.prototype, {
      '0': {
        get() {
          getterCalls++;
          return 7;
        },
      },
    }),
  );
  assertThrows(() => encodeTaskStdin(payload), Error, 'InvalidStdinPayload');
  assertEquals(getterCalls, 0);
});

Deno.test('stdin array: ignores custom iterator accessors and iterators', () => {
  const payload = [7];
  let getterCalls = 0;
  let iteratorCalls = 0;
  Object.defineProperty(payload, Symbol.iterator, {
    get() {
      getterCalls++;
      return function* (): Generator<number> {
        iteratorCalls++;
        yield 99;
      };
    },
  });
  assertEquals(new TextDecoder().decode(encodeTaskStdin(payload)), '[7]');
  assertEquals(getterCalls, 0);
  assertEquals(iteratorCalls, 0);
});
