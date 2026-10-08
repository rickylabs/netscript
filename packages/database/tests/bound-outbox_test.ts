import { assertEquals, assertThrows } from '@std/assert';
import * as postgres from '../commands-postgres.ts';

Deno.test('bound outbox rejects lifecycle and root clients before any write', () => {
  const factory = Reflect.get(postgres, 'bindPostgresCommandOutbox');
  assertEquals(typeof factory, 'function');
  let writes = 0;
  const root = {
    $transaction() {},
    $queryRawUnsafe<T>(): Promise<T> {
      writes++;
      throw new Error('unexpected root query');
    },
    $executeRawUnsafe() {
      writes++;
      return Promise.resolve(1);
    },
  };
  if (typeof factory !== 'function') throw new Error('missing binding');
  assertThrows(() => factory(root), TypeError, 'callback');
  assertEquals(writes, 0);
});
