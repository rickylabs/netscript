import { assert, assertEquals } from '@std/assert';
import {
  createOtelDenoSpanLink,
  createOtelSdkProvider,
  createOtelSdkSpanLink,
  createTelemetryProvider,
  type SdkBinding,
  type SdkLoader,
} from '../../src/adapters/otel/mod.ts';

function createFakeSdk(): { calls: string[]; loadSdk: SdkLoader; loadCount: () => number } {
  const calls: string[] = [];
  let loads = 0;
  const binding: SdkBinding = {
    tracerProvider: {
      register: () => {
        calls.push('trace:register');
      },
      forceFlush: () => {
        calls.push('trace:forceFlush');
        return Promise.resolve();
      },
      shutdown: () => {
        calls.push('trace:shutdown');
        return Promise.resolve();
      },
    },
    meterProvider: {
      forceFlush: () => {
        calls.push('meter:forceFlush');
        return Promise.resolve();
      },
      shutdown: () => {
        calls.push('meter:shutdown');
        return Promise.resolve();
      },
    },
  };
  return {
    calls,
    loadCount: () => loads,
    loadSdk: () => {
      loads++;
      return Promise.resolve(binding);
    },
  };
}

Deno.test('createTelemetryProvider defaults to the zero-dependency Deno provider', () => {
  const provider = createTelemetryProvider();
  assertEquals(provider.descriptor.id, 'otel-deno');
  assertEquals(provider.descriptor.supportsLinkAttributes, false);
});

Deno.test('createTelemetryProvider selects the SDK provider by id', () => {
  const provider = createTelemetryProvider({ providerId: 'otel-sdk' });
  assertEquals(provider.descriptor.id, 'otel-sdk');
  assertEquals(provider.descriptor.supportsLinkAttributes, true);
});

Deno.test('SDK provider registers, flushes trace + meter, and shuts down', async () => {
  const fake = createFakeSdk();
  const provider = createOtelSdkProvider({ endpoint: 'http://localhost:4318' }, fake.loadSdk);

  try {
    await provider.register();
    assertEquals(fake.calls, ['trace:register']);

    await provider.forceFlush();
    assertEquals(fake.calls, ['trace:register', 'trace:forceFlush', 'meter:forceFlush']);
  } finally {
    await provider.shutdown();
  }

  assertEquals(fake.calls.slice(-2), ['trace:shutdown', 'meter:shutdown']);
});

Deno.test('SDK provider register is idempotent', async () => {
  const fake = createFakeSdk();
  const provider = createOtelSdkProvider({}, fake.loadSdk);

  try {
    await provider.register();
    await provider.register();
    assertEquals(fake.loadCount(), 1);
    assertEquals(fake.calls.filter((c) => c === 'trace:register').length, 1);
  } finally {
    await provider.shutdown();
  }
});

Deno.test('SDK provider forceFlush/shutdown are no-ops before register', async () => {
  const fake = createFakeSdk();
  const provider = createOtelSdkProvider({}, fake.loadSdk);

  await provider.forceFlush();
  await provider.shutdown();
  assertEquals(fake.calls, []);
});

Deno.test('SDK span links preserve attributes; Deno span links drop them', () => {
  const attributes = { 'netscript.link.reason': 'fan-in' } as const;

  const sdkLink = createOtelSdkSpanLink();
  assertEquals(sdkLink.supportsLinkAttributes, true);
  const preserved = sdkLink.createLink(
    { traceId: 'a'.repeat(32), spanId: 'b'.repeat(16), traceFlags: 1 },
    attributes,
  );
  assertEquals(preserved.attributes?.['netscript.link.reason'], 'fan-in');
  assertEquals(preserved.droppedAttributesCount, undefined);

  const denoLink = createOtelDenoSpanLink();
  assertEquals(denoLink.supportsLinkAttributes, false);
  const dropped = denoLink.createLink(
    { traceId: 'a'.repeat(32), spanId: 'b'.repeat(16), traceFlags: 1 },
    attributes,
  );
  assertEquals(dropped.attributes, undefined);
  assertEquals(dropped.droppedAttributesCount, 1);
  assert(dropped.context.traceId === 'a'.repeat(32));
});
