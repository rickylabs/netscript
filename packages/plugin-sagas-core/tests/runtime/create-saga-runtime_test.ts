import { assertEquals } from '@std/assert';

import type { LoggerPort } from '../../src/runtime/logger.ts';
import { createSagaRuntime } from '../../src/runtime/mod.ts';
import { MemorySagaStore } from '../../src/testing/mod.ts';

Deno.test('createSagaRuntime warns once when native runtime is composed without a store', () => {
  const logger = new RecordingLogger();

  createSagaRuntime({ native: { logger } });
  createSagaRuntime({ native: { logger } });

  assertEquals(logger.warnings, [
    {
      message: 'Native saga runtime created without a durable SagaStorePort.',
      attributes: {
        code: 'sagas.runtime.store_missing',
        adapter: 'native',
      },
    },
  ]);
});

Deno.test('createSagaRuntime does not warn when native runtime has a store', () => {
  const logger = new RecordingLogger();

  createSagaRuntime({ native: { logger, store: new MemorySagaStore() } });
  createSagaRuntime({
    native: {
      logger,
      engineOptions: { store: new MemorySagaStore('engine-options-store') },
    },
  });

  assertEquals(logger.warnings, []);
});

class RecordingLogger implements LoggerPort {
  readonly warnings: Array<{
    message: string;
    attributes?: Readonly<Record<string, unknown>>;
  }> = [];

  debug(_message: string, _attributes?: Readonly<Record<string, unknown>>): void {}

  info(_message: string, _attributes?: Readonly<Record<string, unknown>>): void {}

  warn(message: string, attributes?: Readonly<Record<string, unknown>>): void {
    this.warnings.push({ message, attributes });
  }

  error(_message: string, _attributes?: Readonly<Record<string, unknown>>): void {}
}
