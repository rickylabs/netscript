/**
 * Mock database adapter and contract tests for `@netscript/database`.
 *
 * @module
 */

import { assert, assertEquals } from 'jsr:@std/assert@1';
import type { DatabaseAdapter, DatabaseConnectionStatus, DatabaseProvider } from '../ports/mod.ts';

/**
 * In-memory database adapter used by port contract tests.
 */
export class MockDatabaseAdapter implements DatabaseAdapter<MockDatabaseAdapter> {
  /** Database provider identity reported by this mock. */
  readonly provider: DatabaseProvider;
  #connected = false;
  #queries: string[] = [];

  /**
   * Create a mock database adapter.
   *
   * @param provider - Provider identity reported by the mock adapter.
   */
  constructor(provider: DatabaseProvider = 'sqlite') {
    this.provider = provider;
  }

  /** Return the mock itself as the client. */
  getClient(): MockDatabaseAdapter {
    return this;
  }

  /** Mark the mock as connected. */
  connect(): Promise<void> {
    this.#connected = true;
    return Promise.resolve();
  }

  /** Mark the mock as disconnected. */
  disconnect(): Promise<void> {
    this.#connected = false;
    return Promise.resolve();
  }

  /** Report whether the mock is connected. */
  healthCheck(): Promise<boolean> {
    return Promise.resolve(this.#connected);
  }

  /** Return a connection status snapshot. */
  getStatus(): Promise<DatabaseConnectionStatus> {
    return Promise.resolve({
      connected: this.#connected,
      provider: this.provider,
    });
  }

  /** Record a raw query and return a typed placeholder result. */
  executeRaw<T = unknown>(query: string, ..._params: unknown[]): Promise<T> {
    this.#queries.push(query);
    return Promise.resolve({ query, rows: [] } as T);
  }

  /** Record an unsafe raw query and return a typed placeholder result. */
  executeRawUnsafe<T = unknown>(query: string, ..._params: unknown[]): Promise<T> {
    this.#queries.push(query);
    return Promise.resolve({ query, affectedRows: 0 } as T);
  }

  /** Return the recorded query text. */
  get queries(): readonly string[] {
    return this.#queries;
  }
}

/**
 * Create a new mock database adapter.
 *
 * @param provider - Optional provider identity for the mock.
 * @returns A fresh mock adapter.
 */
export function createMockDatabaseAdapter(
  provider: DatabaseProvider = 'sqlite',
): MockDatabaseAdapter {
  return new MockDatabaseAdapter(provider);
}

/**
 * Options for {@linkcode runDatabaseAdapterContract}.
 */
export interface DatabaseAdapterContractOptions {
  /** Human-readable adapter name for Deno test titles. */
  readonly name: string;
  /** Creates a fresh database adapter for each contract scenario. */
  readonly make: () => DatabaseAdapter | Promise<DatabaseAdapter>;
}

/**
 * Register the shared database adapter contract tests.
 *
 * @param options - Adapter factory and display name.
 */
export function runDatabaseAdapterContract(
  options: DatabaseAdapterContractOptions,
): void {
  Deno.test(`${options.name}: connects, reports status, executes, and disconnects`, async () => {
    const adapter = await options.make();

    await adapter.connect();
    assert(await adapter.healthCheck());

    const status = await adapter.getStatus();
    assertEquals(status.connected, true);

    await adapter.executeRaw('select 1');

    await adapter.disconnect();
    assertEquals(await adapter.healthCheck(), false);
  });
}
