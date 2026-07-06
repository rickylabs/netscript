import type {
  InstrumentationContext,
  InstrumentationEntry,
  InstrumentationRegistration,
} from './types.ts';

/** Error thrown when an instrumentation registration name is duplicated. */
export class DuplicateInstrumentationError extends Error {
  /**
   * Create an error for a duplicate instrumentation registration name.
   *
   * @param name - Duplicate registration name.
   */
  constructor(name: string) {
    super(`Instrumentation "${name}" is already registered.`);
    this.name = 'DuplicateInstrumentationError';
  }
}

/** Registry for telemetry instrumentation lifecycle hooks. */
export class InstrumentationRegistry {
  readonly #registrations = new Map<string, InstrumentationRegistration>();

  /**
   * Register an instrumentation component by name.
   *
   * @param registration - Instrumentation lifecycle hooks to register.
   * @returns Void.
   */
  register(registration: InstrumentationRegistration): void {
    if (this.#registrations.has(registration.name)) {
      throw new DuplicateInstrumentationError(registration.name);
    }
    this.#registrations.set(registration.name, registration);
  }

  /**
   * Resolve an instrumentation registration by name.
   *
   * @param name - Registration name to resolve.
   * @returns The matching registration, or undefined when absent.
   */
  resolve(name: string): InstrumentationRegistration | undefined {
    return this.#registrations.get(name);
  }

  /**
   * List registered instrumentation in insertion order.
   *
   * @returns Diagnostic snapshots for registered instrumentation.
   */
  list(): readonly InstrumentationEntry[] {
    return [...this.#registrations.values()].map((registration) => ({
      name: registration.name,
      hasSetup: registration.setup !== undefined,
      hasTeardown: registration.teardown !== undefined,
    }));
  }

  /**
   * Run every setup hook in registration order.
   *
   * @param context - Shared instrumentation context.
   * @returns Promise that resolves after every setup hook has completed.
   */
  async setupAll(context: InstrumentationContext): Promise<void> {
    for (const registration of this.#registrations.values()) {
      await registration.setup?.(context);
    }
  }

  /**
   * Run every teardown hook in reverse registration order.
   *
   * @param context - Shared instrumentation context.
   * @returns Promise that resolves after every teardown hook has completed.
   */
  async teardownAll(context: InstrumentationContext): Promise<void> {
    const registrations = [...this.#registrations.values()].reverse();
    for (const registration of registrations) {
      await registration.teardown?.(context);
    }
  }
}
