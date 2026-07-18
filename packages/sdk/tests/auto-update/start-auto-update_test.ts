import { assertEquals, assertThrows } from '@std/assert';
import {
  type NativeAutoUpdateOptions,
  resolveDenoAutoUpdateRuntimeFrom,
} from '../../src/auto-update/adapters/deno-auto-update-adapter.ts';
import type { RollbackTelemetryPort } from '../../src/auto-update/adapters/netscript-rollback-telemetry.ts';
import {
  type AutoUpdateScheduler,
  startAutoUpdate,
  startAutoUpdateWithDependencies,
} from '../../src/auto-update/application/start-auto-update.ts';
import type {
  AutoUpdateReleaseConfig,
  AutoUpdateRollbackEvent,
} from '../../src/auto-update/domain/types.ts';

const RELEASE: AutoUpdateReleaseConfig = {
  baseUrl: 'https://releases.example.com/my-app',
  publicKey: 'base64-ed25519-public-key',
  manualUpdateUrl: 'https://example.com/downloads/my-app',
};

const NOOP_TELEMETRY: RollbackTelemetryPort = {
  reportRollback(): void {},
};

function immediateScheduler(): AutoUpdateScheduler {
  return {
    schedule(callback: () => void): void {
      callback();
    },
  };
}

Deno.test('plain deno run disables native auto-update without invoking release config', () => {
  const result = startAutoUpdate({
    release: { ...RELEASE, baseUrl: 'not-a-url' },
    policy: { checkOnLaunch: true },
  });

  assertEquals(result, { status: 'disabled', reason: 'not-desktop' });
});

Deno.test('legacy top-level resolver forwards launch options and callbacks', () => {
  let received: NativeAutoUpdateOptions | undefined;
  const resolution = resolveDenoAutoUpdateRuntimeFrom({
    build: { os: 'linux', arch: 'x86_64' },
    desktopVersion: '1.2.3',
    autoUpdate(options: NativeAutoUpdateOptions): void {
      received = options;
    },
  });

  const readyEvents: unknown[] = [];
  const result = startAutoUpdateWithDependencies({
    release: RELEASE,
    policy: { checkOnLaunch: true, intervalMs: 60_000 },
    onUpdateReady: (event): void => {
      readyEvents.push(event);
    },
  }, {
    resolveRuntime: () => resolution,
    scheduler: immediateScheduler(),
    telemetry: NOOP_TELEMETRY,
  });

  assertEquals(result, {
    status: 'started',
    updateUrl: 'https://releases.example.com/my-app/stable/linux-x86_64',
  });
  assertEquals(received?.url, 'https://releases.example.com/my-app/stable/linux-x86_64');
  assertEquals(received?.interval, 60_000);
  assertEquals(received?.publicKey, RELEASE.publicKey);
  received?.onUpdateReady?.('1.2.4');
  assertEquals(readyEvents, [{ applyMode: 'automatic', version: '1.2.4' }]);
});

Deno.test('proposed namespace wins and Windows surfaces a manual installer event', () => {
  const calls: NativeAutoUpdateOptions[] = [];
  const resolution = resolveDenoAutoUpdateRuntimeFrom({
    build: { os: 'windows', arch: 'x86_64' },
    desktopVersion: 'legacy-version',
    autoUpdate(): void {
      throw new Error('legacy updater must not win');
    },
    desktop: {
      appVersion: '2.0.0',
      autoUpdate(options: NativeAutoUpdateOptions): void {
        calls.push(options);
      },
    },
  });

  const readyEvents: unknown[] = [];
  const result = startAutoUpdateWithDependencies({
    release: RELEASE,
    policy: { checkOnLaunch: true },
    onUpdateReady: (event): void => {
      readyEvents.push(event);
    },
  }, {
    resolveRuntime: () => resolution,
    scheduler: immediateScheduler(),
    telemetry: NOOP_TELEMETRY,
  });

  assertEquals(result.status, 'started');
  assertEquals(calls.length, 1);
  calls[0].onUpdateReady?.('2.1.0');
  assertEquals(readyEvents, [{
    applyMode: 'manual',
    version: '2.1.0',
    manualUpdateUrl: 'https://example.com/downloads/my-app',
  }]);
});

Deno.test('resolver falls back to a valid legacy updater when proposed shape is incomplete', () => {
  let legacyCalled = false;
  const resolution = resolveDenoAutoUpdateRuntimeFrom({
    build: { os: 'linux', arch: 'x86_64' },
    desktopVersion: '1.0.0',
    autoUpdate(): void {
      legacyCalled = true;
    },
    desktop: { appVersion: null },
  });

  if (resolution.enabled) {
    resolution.runtime.autoUpdate({
      url: 'https://releases.example.com',
      publicKey: RELEASE.publicKey,
    });
  }
  assertEquals(resolution.enabled, true);
  assertEquals(legacyCalled, true);
});

Deno.test('interval-only policy delays native updater installation then preserves recurrence', () => {
  let scheduledDelay = 0;
  let scheduledCallback: (() => void) | undefined;
  const calls: NativeAutoUpdateOptions[] = [];
  const result = startAutoUpdateWithDependencies({
    release: RELEASE,
    policy: { checkOnLaunch: false, intervalMs: 5_000 },
  }, {
    resolveRuntime: () =>
      resolveDenoAutoUpdateRuntimeFrom({
        build: { os: 'darwin', arch: 'aarch64' },
        desktopVersion: '3.0.0',
        autoUpdate(options: NativeAutoUpdateOptions): void {
          calls.push(options);
        },
      }),
    scheduler: {
      schedule(callback: () => void, delayMs: number): void {
        scheduledCallback = callback;
        scheduledDelay = delayMs;
      },
    },
    telemetry: NOOP_TELEMETRY,
  });

  assertEquals(result, {
    status: 'scheduled',
    updateUrl: 'https://releases.example.com/my-app/stable/darwin-aarch64',
    firstCheckInMs: 5_000,
  });
  assertEquals(scheduledDelay, 5_000);
  assertEquals(calls, []);
  scheduledCallback?.();
  assertEquals(calls.length, 1);
  assertEquals(calls[0].interval, 5_000);
});

Deno.test('interval policy rejects non-positive or non-finite intervals', () => {
  const dependencies = {
    resolveRuntime: (): ReturnType<typeof resolveDenoAutoUpdateRuntimeFrom> =>
      resolveDenoAutoUpdateRuntimeFrom({}),
    scheduler: immediateScheduler(),
    telemetry: NOOP_TELEMETRY,
  };

  assertThrows(
    () =>
      startAutoUpdateWithDependencies({
        release: RELEASE,
        policy: { checkOnLaunch: false, intervalMs: 0 },
      }, dependencies),
    TypeError,
    'intervalMs must be a positive finite number',
  );
  assertThrows(
    () =>
      startAutoUpdateWithDependencies({
        release: RELEASE,
        policy: { checkOnLaunch: true, intervalMs: Number.POSITIVE_INFINITY },
      }, dependencies),
    TypeError,
    'intervalMs must be a positive finite number',
  );
});

Deno.test('rollback telemetry is reported before the consumer callback', () => {
  const order: string[] = [];
  let received: NativeAutoUpdateOptions | undefined;
  const rollbackEvents: AutoUpdateRollbackEvent[] = [];
  startAutoUpdateWithDependencies({
    release: RELEASE,
    policy: { checkOnLaunch: true },
    onRollback: (event): void => {
      order.push('consumer');
      rollbackEvents.push(event);
    },
  }, {
    resolveRuntime: () =>
      resolveDenoAutoUpdateRuntimeFrom({
        build: { os: 'linux', arch: 'aarch64' },
        desktop: {
          appVersion: '4.0.0',
          autoUpdate(options: NativeAutoUpdateOptions): void {
            received = options;
          },
        },
      }),
    scheduler: immediateScheduler(),
    telemetry: {
      reportRollback(event: AutoUpdateRollbackEvent): void {
        order.push('telemetry');
        rollbackEvents.push(event);
      },
    },
  });

  received?.onRollback?.('failed health check');
  assertEquals(order, ['telemetry', 'consumer']);
  assertEquals(rollbackEvents, [
    { reason: 'failed health check', currentVersion: '4.0.0' },
    { reason: 'failed health check', currentVersion: '4.0.0' },
  ]);
});

Deno.test('structural resolver returns explicit disabled reasons', () => {
  assertEquals(
    resolveDenoAutoUpdateRuntimeFrom({
      build: { os: 'linux', arch: 'x86_64' },
      desktopVersion: null,
      autoUpdate(): void {},
    }),
    { enabled: false, reason: 'missing-version' },
  );
  assertEquals(
    resolveDenoAutoUpdateRuntimeFrom({
      build: { os: 'linux', arch: 'x86_64' },
      desktop: { appVersion: '1.0.0' },
    }),
    { enabled: false, reason: 'missing-updater' },
  );
});
