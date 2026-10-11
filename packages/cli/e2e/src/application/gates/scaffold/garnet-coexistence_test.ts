import { assertEquals, assertRejects, assertThrows } from '@std/assert';
import {
  assertGarnetCoexistence,
  type GarnetCoexistenceDriver,
  type GarnetCoexistenceReceipt,
  type GarnetEndpointEvidence,
  runGarnetCoexistence,
} from './garnet-coexistence.ts';
import { pinGarnetListenPort } from './garnet-coexistence-fixture.ts';
import { garnetPong } from './garnet-coexistence-resp.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../../src/kernel/application/registries/template-registry.ts';
import { generateRegisterInfrastructure } from '../../../../../src/kernel/templates/aspire/helpers/register/generate-register-infrastructure.ts';

const first: GarnetEndpointEvidence = {
  pid: 101,
  listenPort: 12001,
  publishedPort: 22001,
  listenPong: true,
  publishedPong: true,
};
const second: GarnetEndpointEvidence = {
  pid: 102,
  listenPort: 12002,
  publishedPort: 22002,
  listenPong: true,
  publishedPong: true,
};

function fixture() {
  const events: string[] = [];
  let receipt: GarnetCoexistenceReceipt | undefined;
  const driver: GarnetCoexistenceDriver = {
    prepare: (side) => {
      events.push(`prepare:${side}`);
      return Promise.resolve();
    },
    start: (side) => {
      events.push(`start:${side}`);
      return Promise.resolve();
    },
    observe: (side) => {
      events.push(`observe:${side}`);
      return Promise.resolve(side === 'first' ? first : second);
    },
    stop: (side) => {
      events.push(`stop:${side}`);
      return Promise.resolve();
    },
    pinSecondListenPort: (port) => {
      events.push(`pin:${port}`);
      return Promise.resolve();
    },
    assertSecondBindCollision: () => {
      events.push('collision');
      return Promise.resolve();
    },
  };
  const leases = {
    acquire: () => {
      events.push('lease');
      return Promise.resolve({
        release: () => {
          events.push('release');
          return Promise.resolve();
        },
      });
    },
  };
  const retain = (value: GarnetCoexistenceReceipt) => {
    receipt = value;
    events.push('retain');
    return Promise.resolve();
  };
  return { driver, leases, retain, events, receipt: () => receipt };
}

Deno.test('coexistence keeps first resident, rechecks it, proves control, cleans up under lease', async () => {
  const f = fixture();
  const receipt = await runGarnetCoexistence('worktree', f.leases, f.driver, f.retain);
  assertEquals(receipt.verdict, 'passed');
  assertEquals(receipt.literalPortNegativeControl, true);
  assertEquals(receipt.cleanup, ['second', 'first']);
  assertEquals(f.events, [
    'lease',
    'prepare:first',
    'start:first',
    'observe:first',
    'prepare:second',
    'start:second',
    'observe:second',
    'observe:first',
    'stop:second',
    'pin:12001',
    'collision',
    'observe:first',
    'stop:second',
    'stop:first',
    'retain',
    'release',
  ]);
});

Deno.test('literal listen port regression fails even when distinct proxies both answer PONG', () => {
  assertThrows(
    () => assertGarnetCoexistence([first, { ...second, listenPort: first.listenPort }]),
    Error,
    'distinct',
  );
  assertThrows(
    () => assertGarnetCoexistence([first, { ...second, pid: first.pid }]),
    Error,
    'distinct',
  );
  assertThrows(
    () => assertGarnetCoexistence([first, { ...second, publishedPort: first.publishedPort }]),
    Error,
    'distinct',
  );
});

Deno.test('RESP and complete valid observations are mandatory', () => {
  for (
    const invalid of [
      { ...second, listenPong: false },
      { ...second, publishedPong: false },
      { ...second, listenPort: 0 },
      { ...second, listenPort: 65536 },
      { ...second, pid: NaN },
    ]
  ) assertThrows(() => assertGarnetCoexistence([first, invalid]));
  assertThrows(() => assertGarnetCoexistence([first]));
});

Deno.test('partial start failure stops both attempted AppHosts and retains failure before release', async () => {
  const f = fixture();
  f.driver.start = (side) =>
    side === 'second' ? Promise.reject(new Error('start failed')) : Promise.resolve();
  await assertRejects(
    () => runGarnetCoexistence('worktree', f.leases, f.driver, f.retain),
    Error,
    'start failed',
  );
  assertEquals(f.receipt()?.cleanup, ['second', 'first']);
  assertEquals(f.receipt()?.verdict, 'failed');
  assertEquals(f.events.slice(-2), ['retain', 'release']);
});

Deno.test('cleanup failure does not prevent other owned stop and cannot become PASS', async () => {
  const f = fixture();
  f.driver.assertSecondBindCollision = () => Promise.reject(new Error('control failed'));
  f.driver.stop = (side) => {
    f.events.push(`stop:${side}`);
    return side === 'first' ? Promise.reject(new Error('survivor')) : Promise.resolve();
  };
  await assertRejects(
    () => runGarnetCoexistence('worktree', f.leases, f.driver, f.retain),
    Error,
    'survivor',
  );
  assertEquals(f.receipt()?.verdict, 'failed');
  assertEquals(f.receipt()?.literalPortNegativeControl, false);
  assertEquals(f.receipt()?.cleanup, ['second']);
  assertEquals(f.events.at(-1), 'release');
});

Deno.test('live lease contention performs no fixture effects and fabricates no receipt', async () => {
  const f = fixture();
  f.leases.acquire = () => Promise.reject(new Error('lease held'));
  await assertRejects(
    () => runGarnetCoexistence('worktree', f.leases, f.driver, f.retain),
    Error,
    'lease held',
  );
  assertEquals(f.events, []);
  assertEquals(f.receipt(), undefined);
});

Deno.test('receipt write failure still releases lease after cleanup', async () => {
  const f = fixture();
  await assertRejects(() =>
    runGarnetCoexistence(
      'worktree',
      f.leases,
      f.driver,
      () => Promise.reject(new Error('write failed')),
    )
  );
  assertEquals(f.events.slice(-3), ['stop:second', 'stop:first', 'release']);
});

Deno.test('negative control mutates exactly the real generated executable argv, leaving endpoint allocation', async () => {
  await DEFAULT_TEMPLATE_REGISTRY.hydrate();
  const source = generateRegisterInfrastructure({
    databases: {},
    caches: { garnet: { Enabled: true, Engine: 'Garnet', Mode: 'Executable' } },
    primaryCache: 'garnet',
  });
  const pinned = pinGarnetListenPort(source, 12001);
  assertEquals(pinned.includes("args.add('12001')"), true);
  assertEquals(pinned.includes("withEndpoint({ name: 'tcp', scheme: 'tcp' })"), true);
  assertThrows(() => pinGarnetListenPort(pinned, 12002));
  assertThrows(() => pinGarnetListenPort(source + source, 12002));
  assertThrows(() => pinGarnetListenPort(source, 0));
});

Deno.test('RESP proof uses a real TCP exchange and accepts a fragmented PONG', async () => {
  const listener = Deno.listen({ hostname: '127.0.0.1', port: 0 });
  const serve = (async () => {
    const connection = await listener.accept();
    try {
      const request = new Uint8Array(64);
      await connection.read(request);
      await connection.write(new TextEncoder().encode('+PO'));
      await connection.write(new TextEncoder().encode('NG\r\n'));
    } finally {
      connection.close();
    }
  })();
  try {
    assertEquals(await garnetPong(listener.addr.port), true);
  } finally {
    listener.close();
    await serve;
  }
});

Deno.test('RESP proof rejects a listener that accepts TCP but never answers PING', async () => {
  const listener = Deno.listen({ hostname: '127.0.0.1', port: 0 });
  const serve = (async () => {
    const connection = await listener.accept();
    try {
      const request = new Uint8Array(64);
      await connection.read(request);
      await connection.read(request); // Probe timeout closes its peer.
    } finally {
      connection.close();
    }
  })();
  try {
    assertEquals(await garnetPong(listener.addr.port, 30), false);
  } finally {
    listener.close();
    await serve;
  }
});
