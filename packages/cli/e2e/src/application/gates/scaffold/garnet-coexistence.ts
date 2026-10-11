import type { SuiteLeaseManager } from '../../runner/suite-lease.ts';
import { SCAFFOLD } from '../../../domain/cli-surface.ts';

/** Exactly two owned generated projects participate in the concurrent proof. */
export type GarnetFixtureSide = 'first' | 'second';

/** Runtime evidence, including the process's actual listen port rather than only its proxy. */
export interface GarnetEndpointEvidence {
  readonly pid: number;
  readonly listenPort: number;
  readonly publishedPort: number;
  readonly listenPong: boolean;
  readonly publishedPong: boolean;
}

/** Effects for the bounded generated-AppHost fixture. */
export interface GarnetCoexistenceDriver {
  prepare(side: GarnetFixtureSide): Promise<void>;
  start(side: GarnetFixtureSide): Promise<void>;
  observe(side: GarnetFixtureSide): Promise<GarnetEndpointEvidence>;
  stop(side: GarnetFixtureSide): Promise<void>;
  pinSecondListenPort(port: number): Promise<void>;
  assertSecondBindCollision(): Promise<void>;
}

/** Receipt stays failed unless both positive observations, the control and cleanup complete. */
export interface GarnetCoexistenceReceipt {
  readonly contract: 'garnet-executable-coexistence-v1';
  readonly verdict: 'passed' | 'failed';
  readonly leased: true;
  readonly cacheMode: 'Executable';
  readonly isolated: true;
  readonly endpoints: readonly GarnetEndpointEvidence[];
  readonly literalPortNegativeControl: boolean;
  readonly cleanup: readonly GarnetFixtureSide[];
  readonly errors: readonly string[];
}

/** Reject proxy-only success, one shared process, and literal listen-port collisions. */
export function assertGarnetCoexistence(endpoints: readonly GarnetEndpointEvidence[]): void {
  if (endpoints.length !== 2) throw new Error('coexistence requires exactly two observations');
  for (const endpoint of endpoints) {
    if (
      !Number.isSafeInteger(endpoint.pid) || endpoint.pid <= 0 ||
      !validPort(endpoint.listenPort) || !validPort(endpoint.publishedPort) ||
      !endpoint.listenPong || !endpoint.publishedPong
    ) throw new Error('both owned Garnet processes must answer RESP at listen and published ports');
  }
  const [first, second] = endpoints;
  if (
    first.pid === second.pid || first.listenPort === second.listenPort ||
    first.publishedPort === second.publishedPort
  ) {
    throw new Error(
      'isolated Garnet processes must have distinct PIDs, listen and published ports',
    );
  }
}

function validPort(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0 && value <= 65535;
}

/** Acquire the existing runtime lease before any effects; stop every attempted owned start. */
export async function runGarnetCoexistence(
  worktree: string,
  leaseManager: SuiteLeaseManager,
  driver: GarnetCoexistenceDriver,
  retain: (receipt: GarnetCoexistenceReceipt) => Promise<void>,
): Promise<GarnetCoexistenceReceipt> {
  const lease = await leaseManager.acquire(SCAFFOLD.RUNTIME_SQLITE, worktree);
  const attempted = new Set<GarnetFixtureSide>();
  const endpoints: GarnetEndpointEvidence[] = [];
  const cleanup: GarnetFixtureSide[] = [];
  const errors: string[] = [];
  let literalPortNegativeControl = false;
  try {
    try {
      for (const side of ['first', 'second'] as const) {
        await driver.prepare(side);
        attempted.add(side); // A failed start may still leave a resident AppHost.
        await driver.start(side);
        endpoints.push(await driver.observe(side));
      }
      assertGarnetCoexistence(endpoints);
      // Re-observe first while second is resident: sequential start success alone is insufficient.
      endpoints[0] = await driver.observe('first');
      assertGarnetCoexistence(endpoints);
      await driver.stop('second');
      attempted.delete('second');
      await driver.pinSecondListenPort(endpoints[0].listenPort);
      attempted.add('second');
      await driver.assertSecondBindCollision();
      literalPortNegativeControl = true;
      endpoints[0] = await driver.observe('first');
      assertGarnetCoexistence(endpoints);
    } catch (error) {
      errors.push(String(error));
    } finally {
      for (const side of [...attempted].reverse()) {
        try {
          await driver.stop(side);
          cleanup.push(side);
        } catch (error) {
          errors.push(`cleanup ${side}: ${String(error)}`);
        }
      }
    }
    const receipt: GarnetCoexistenceReceipt = {
      contract: 'garnet-executable-coexistence-v1',
      verdict: errors.length === 0 ? 'passed' : 'failed',
      leased: true,
      cacheMode: 'Executable',
      isolated: true,
      endpoints,
      literalPortNegativeControl,
      cleanup,
      errors,
    };
    await retain(receipt);
    if (receipt.verdict !== 'passed') throw new Error(errors.join('\n'));
    return receipt;
  } finally {
    await lease.release();
  }
}
