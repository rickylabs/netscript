/** Long-lived E2E controller for the synthetic Postgres TCP and Garnet RESP listeners. */

export const LISTENER_FAULT_CONTROLLER_DIR = '.netscript/e2e/listener-fault-controller';
export const LISTENER_FAULT_STATE_FILE = `${LISTENER_FAULT_CONTROLLER_DIR}/state.json`;
export const LISTENER_FAULT_ACK_FILE = `${LISTENER_FAULT_CONTROLLER_DIR}/ack.json`;
export const POSTGRES_TEST_LISTENER_PORT = 18_998;
export const GARNET_TEST_LISTENER_PORT = 18_999;
export const TEST_ONLY_POSTGRES_HEALTH_KEY = 'test_only_postgres_listener';
export const TEST_ONLY_GARNET_HEALTH_KEY = 'test_only_garnet_resp';

const CONTROL_POLL_MS = 50;
const PONG = new TextEncoder().encode('+PONG\r\n');

/** Revisioned desired state written by the controlling E2E fixture. */
export interface ListenerFaultState {
  readonly revision: number;
  readonly postgresOpen: boolean;
  readonly garnetOpen: boolean;
}

/** Socket bindings used by the controller; tests pass port zero for ephemeral listeners. */
export interface ListenerFaultControllerOptions {
  readonly hostname: string;
  readonly postgresPort: number;
  readonly garnetPort: number;
}

/** Owns the two synthetic listeners and applies monotonic open/close state revisions. */
export class ListenerFaultController {
  readonly #options: ListenerFaultControllerOptions;
  readonly #postgresConnections = new Set<Deno.TcpConn>();
  readonly #garnetConnections = new Set<Deno.TcpConn>();
  #postgresListener: Deno.TcpListener | undefined;
  #garnetListener: Deno.TcpListener | undefined;
  #postgresAddress: Deno.NetAddr | undefined;
  #garnetAddress: Deno.NetAddr | undefined;
  #state: ListenerFaultState = {
    revision: -1,
    postgresOpen: false,
    garnetOpen: false,
  };

  constructor(options: ListenerFaultControllerOptions) {
    this.#options = options;
  }

  /** Apply a newer desired-state revision, ignoring duplicate or stale revisions. */
  async applyState(desired: ListenerFaultState): Promise<ListenerFaultState> {
    assertListenerFaultState(desired);
    if (desired.revision <= this.#state.revision) return this.#state;

    this.#setPostgresOpen(desired.postgresOpen);
    this.#setGarnetOpen(desired.garnetOpen);
    this.#state = { ...desired };
    await Promise.resolve();
    return this.#state;
  }

  /** Return the currently applied desired state. */
  state(): ListenerFaultState {
    return this.#state;
  }

  /** Return the latest bound Postgres listener address. */
  postgresAddress(): Deno.NetAddr {
    if (!this.#postgresAddress) throw new Error('Postgres test listener has not been opened');
    return this.#postgresAddress;
  }

  /** Return the latest bound Garnet listener address. */
  garnetAddress(): Deno.NetAddr {
    if (!this.#garnetAddress) throw new Error('Garnet test listener has not been opened');
    return this.#garnetAddress;
  }

  /** Report accepted Postgres connections retained by the controller (focused-test seam). */
  postgresConnectionCount(): number {
    return this.#postgresConnections.size;
  }

  /** Close both listeners and every accepted connection. */
  async close(): Promise<void> {
    this.#closePostgres();
    this.#closeGarnet();
    await Promise.resolve();
  }

  #setPostgresOpen(open: boolean): void {
    if (open && !this.#postgresListener) {
      const listener = Deno.listen({
        transport: 'tcp',
        hostname: this.#options.hostname,
        port: this.#options.postgresPort,
      });
      this.#postgresListener = listener;
      this.#postgresAddress = listener.addr as Deno.NetAddr;
      void this.#acceptPostgres(listener);
    } else if (!open) {
      this.#closePostgres();
    }
  }

  #setGarnetOpen(open: boolean): void {
    if (open && !this.#garnetListener) {
      const listener = Deno.listen({
        transport: 'tcp',
        hostname: this.#options.hostname,
        port: this.#options.garnetPort,
      });
      this.#garnetListener = listener;
      this.#garnetAddress = listener.addr as Deno.NetAddr;
      void this.#acceptGarnet(listener);
    } else if (!open) {
      this.#closeGarnet();
    }
  }

  async #acceptPostgres(listener: Deno.TcpListener): Promise<void> {
    while (this.#postgresListener === listener) {
      try {
        const connection = await listener.accept();
        if (this.#postgresListener !== listener) {
          connection.close();
          return;
        }
        this.#postgresConnections.add(connection);
        void this.#drainPostgres(connection);
      } catch {
        return;
      }
    }
  }

  async #drainPostgres(connection: Deno.TcpConn): Promise<void> {
    try {
      const buffer = new Uint8Array(64);
      while (this.#postgresConnections.has(connection)) {
        if (await connection.read(buffer) === null) return;
      }
    } catch {
      // The health-check client destroys immediately after connect; closure is expected.
    } finally {
      this.#postgresConnections.delete(connection);
      closeConnection(connection);
    }
  }

  async #acceptGarnet(listener: Deno.TcpListener): Promise<void> {
    while (this.#garnetListener === listener) {
      try {
        const connection = await listener.accept();
        if (this.#garnetListener !== listener) {
          connection.close();
          return;
        }
        this.#garnetConnections.add(connection);
        void this.#serveResp(connection);
      } catch {
        return;
      }
    }
  }

  async #serveResp(connection: Deno.TcpConn): Promise<void> {
    try {
      const buffer = new Uint8Array(256);
      while (this.#garnetConnections.has(connection)) {
        const read = await connection.read(buffer);
        if (read === null) return;
        if (new TextDecoder().decode(buffer.subarray(0, read)).includes('\n')) {
          await connection.write(PONG);
          return;
        }
      }
    } catch {
      // Closing a listener also closes accepted connections and ends their handlers.
    } finally {
      this.#garnetConnections.delete(connection);
      closeConnection(connection);
    }
  }

  #closePostgres(): void {
    closeListener(this.#postgresListener);
    this.#postgresListener = undefined;
    closeConnections(this.#postgresConnections);
  }

  #closeGarnet(): void {
    closeListener(this.#garnetListener);
    this.#garnetListener = undefined;
    closeConnections(this.#garnetConnections);
  }
}

/** Run the file-polled controller until its Aspire-managed task is stopped. */
export async function runListenerFaultController(
  statePath = 'state.json',
  acknowledgementPath = 'ack.json',
): Promise<never> {
  const controller = new ListenerFaultController({
    hostname: 'localhost',
    postgresPort: POSTGRES_TEST_LISTENER_PORT,
    garnetPort: GARNET_TEST_LISTENER_PORT,
  });
  let acknowledgedRevision = -1;
  try {
    while (true) {
      const desired = parseListenerFaultState(await Deno.readTextFile(statePath));
      const applied = await controller.applyState(desired);
      if (applied.revision !== acknowledgedRevision) {
        await writeJsonAtomically(acknowledgementPath, applied);
        acknowledgedRevision = applied.revision;
      }
      await delay(CONTROL_POLL_MS);
    }
  } finally {
    await controller.close();
  }
}

/** Parse and validate one controller state file. */
export function parseListenerFaultState(source: string): ListenerFaultState {
  const parsed: unknown = JSON.parse(source);
  assertListenerFaultState(parsed);
  return parsed;
}

async function writeJsonAtomically(path: string, value: unknown): Promise<void> {
  const temporary = `${path}.tmp-${Deno.pid}`;
  await Deno.writeTextFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await Deno.rename(temporary, path);
}

function assertListenerFaultState(value: unknown): asserts value is ListenerFaultState {
  if (
    !isRecord(value) ||
    !Number.isSafeInteger(value.revision) ||
    typeof value.postgresOpen !== 'boolean' ||
    typeof value.garnetOpen !== 'boolean'
  ) {
    throw new Error('listener fault state is invalid');
  }
}

function closeConnections(connections: Set<Deno.TcpConn>): void {
  for (const connection of connections) closeConnection(connection);
  connections.clear();
}

function closeConnection(connection: Deno.TcpConn): void {
  try {
    connection.close();
  } catch {
    // The peer or listener shutdown may already have closed it.
  }
}

function closeListener(listener: Deno.TcpListener | undefined): void {
  try {
    listener?.close();
  } catch {
    // Repeated desired-state revisions are intentionally idempotent.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

if (import.meta.main) await runListenerFaultController();
