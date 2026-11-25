/**
 * Reusable `DirectoryPort` conformance runner executed by every directory adapter in one call.
 *
 * @module
 */

import type { DirectoryPort } from '../ports/mod.ts';
import type { DeterministicDirectoryClock } from './clock.ts';
import { CONFORMANCE_CASES, type ConformanceCase } from './conformance-cases.ts';

/**
 * Per-test fixture returned by an adapter factory for {@link runDirectoryConformanceSuite}.
 *
 * @example
 * ```ts
 * import {
 *   createDeterministicClock,
 *   createInMemoryDirectoryPort,
 *   DIRECTORY_CONFORMANCE_DATASET,
 *   type DirectoryConformanceFixture,
 * } from '@netscript/plugin-directory-core/testing';
 *
 * function createFixture(): DirectoryConformanceFixture {
 *   const clock = createDeterministicClock(DIRECTORY_CONFORMANCE_DATASET.initialTimeIso);
 *   const base = {
 *     directoryInstance: DIRECTORY_CONFORMANCE_DATASET.directoryInstance,
 *     clock,
 *     maxSearchLimit: 3,
 *     users: DIRECTORY_CONFORMANCE_DATASET.users,
 *     groups: DIRECTORY_CONFORMANCE_DATASET.groups,
 *   };
 *   return {
 *     clock,
 *     maxSearchLimit: 3,
 *     port: createInMemoryDirectoryPort(base),
 *     timeoutPort: createInMemoryDirectoryPort({ ...base, operationDelayMs: 250 }),
 *   };
 * }
 * console.log(typeof createFixture);
 * ```
 */
export type DirectoryConformanceFixture = Readonly<{
  /** Adapter instance under test, seeded with `DIRECTORY_CONFORMANCE_DATASET`. */
  port: DirectoryPort;
  /** Deterministic clock controlling `port` timestamps and expiry evaluation. */
  clock: DeterministicDirectoryClock;
  /**
   * Effective max search limit configured on `port`. Required (and must be `< 4`, `>= 2`) when
   * `port.capabilities.has('search')` so truncation at the ceiling is actively proven.
   */
  maxSearchLimit?: number;
  /** Slow/hanging adapter instance used to verify timeout and mid-flight abort enforcement. */
  timeoutPort: DirectoryPort;
  /** Optional adapter configured to fail with `DirectoryUnavailable` (used to verify redaction). */
  unavailablePort?: DirectoryPort;
  /** Optional adapter configured to fail with `DirectoryUnauthorized` (used to verify redaction). */
  unauthorizedPort?: DirectoryPort;
  /**
   * Sensitive strings (bind passwords, secret file paths, bind DNs, hostnames) that MUST NEVER
   * appear in `health()` payloads or thrown `DirectoryError` messages/reasons.
   */
  sensitiveValues?: readonly string[];
  /** Optional cleanup hook called after each conformance case. */
  teardown?: () => void | Promise<void>;
}>;

/**
 * Options accepted by {@link runDirectoryConformanceSuite} and {@link verifyDirectoryConformance}.
 *
 * @example
 * ```ts
 * import {
 *   createDeterministicClock,
 *   createInMemoryDirectoryPort,
 *   DIRECTORY_CONFORMANCE_DATASET,
 *   type DirectoryConformanceSuiteOptions,
 * } from '@netscript/plugin-directory-core/testing';
 *
 * const options: DirectoryConformanceSuiteOptions = {
 *   name: 'memory',
 *   createFixture: () => {
 *     const clock = createDeterministicClock(DIRECTORY_CONFORMANCE_DATASET.initialTimeIso);
 *     const base = {
 *       directoryInstance: DIRECTORY_CONFORMANCE_DATASET.directoryInstance,
 *       clock,
 *       maxSearchLimit: 3,
 *       users: DIRECTORY_CONFORMANCE_DATASET.users,
 *       groups: DIRECTORY_CONFORMANCE_DATASET.groups,
 *     };
 *     return {
 *       clock,
 *       maxSearchLimit: 3,
 *       port: createInMemoryDirectoryPort(base),
 *       timeoutPort: createInMemoryDirectoryPort({ ...base, operationDelayMs: 250 }),
 *     };
 *   },
 * };
 * console.log(options.name);
 * ```
 */
export type DirectoryConformanceSuiteOptions = Readonly<{
  /** Adapter label prefixed onto test step names. */
  name: string;
  /** Factory creating an isolated fixture per conformance case. */
  createFixture: () => DirectoryConformanceFixture | Promise<DirectoryConformanceFixture>;
}>;

/**
 * Outcome of one conformance scenario executed by {@link verifyDirectoryConformance}.
 *
 * @example
 * ```ts
 * import type { DirectoryConformanceCaseResult } from '@netscript/plugin-directory-core/testing';
 *
 * const item: DirectoryConformanceCaseResult = { name: 'primary group', passed: true };
 * console.log(item.name, item.passed);
 * ```
 */
export type DirectoryConformanceCaseResult = Readonly<{
  /** Scenario name. */
  name: string;
  /** Whether all assertions in the scenario passed. */
  passed: boolean;
  /** Error message captured when `passed` is `false`. */
  error?: string;
}>;

/**
 * Aggregate report returned by {@link verifyDirectoryConformance}.
 *
 * @example
 * ```ts
 * import type { DirectoryConformanceReport } from '@netscript/plugin-directory-core/testing';
 *
 * const report: DirectoryConformanceReport = {
 *   suiteName: 'memory',
 *   passed: 13,
 *   failed: 0,
 *   cases: [],
 * };
 * console.log(report.suiteName, report.passed, report.failed);
 * ```
 */
export type DirectoryConformanceReport = Readonly<{
  /** Adapter label passed in options. */
  suiteName: string;
  /** Total number of passing conformance scenarios. */
  passed: number;
  /** Total number of failing conformance scenarios. */
  failed: number;
  /** Ordered scenario outcomes. */
  cases: readonly DirectoryConformanceCaseResult[];
}>;

async function executeCase(
  suiteCase: ConformanceCase,
  createFixture: DirectoryConformanceSuiteOptions['createFixture'],
): Promise<void> {
  const fixture = await createFixture();
  try {
    await suiteCase.run(fixture);
  } finally {
    await fixture.teardown?.();
  }
}

/**
 * Executes every {@link DirectoryPort} conformance scenario programmatically and returns a
 * structured report capturing both passing and failing scenarios without aborting on the first
 * failure.
 *
 * @param options - Adapter name and fixture factory.
 * @returns Conformance execution report with per-scenario pass/fail status.
 *
 * @example
 * ```ts
 * import {
 *   createDeterministicClock,
 *   createInMemoryDirectoryPort,
 *   DIRECTORY_CONFORMANCE_DATASET,
 *   verifyDirectoryConformance,
 * } from '@netscript/plugin-directory-core/testing';
 *
 * const report = await verifyDirectoryConformance({
 *   name: 'memory',
 *   createFixture: () => {
 *     const clock = createDeterministicClock(DIRECTORY_CONFORMANCE_DATASET.initialTimeIso);
 *     const base = {
 *       directoryInstance: DIRECTORY_CONFORMANCE_DATASET.directoryInstance,
 *       clock,
 *       maxSearchLimit: 3,
 *       users: DIRECTORY_CONFORMANCE_DATASET.users,
 *       groups: DIRECTORY_CONFORMANCE_DATASET.groups,
 *     };
 *     return {
 *       clock,
 *       maxSearchLimit: 3,
 *       port: createInMemoryDirectoryPort(base),
 *       timeoutPort: createInMemoryDirectoryPort({ ...base, operationDelayMs: 250 }),
 *     };
 *   },
 * });
 * console.log(report.passed, report.failed);
 * ```
 */
export async function verifyDirectoryConformance(
  options: DirectoryConformanceSuiteOptions,
): Promise<DirectoryConformanceReport> {
  const results: DirectoryConformanceCaseResult[] = [];
  let passed = 0;
  let failed = 0;
  for (const suiteCase of CONFORMANCE_CASES) {
    try {
      await executeCase(suiteCase, options.createFixture);
      results.push({ name: suiteCase.name, passed: true });
      passed += 1;
    } catch (err) {
      results.push({
        name: suiteCase.name,
        passed: false,
        error: err instanceof Error ? err.message : String(err),
      });
      failed += 1;
    }
  }
  return {
    suiteName: options.name,
    passed,
    failed,
    cases: results,
  };
}

/**
 * Registers the full {@link DirectoryPort} conformance suite with `Deno.test` in one call.
 *
 * Every directory adapter (in-memory, LDAP/AD, Entra ID, SCIM) runs this suite against a factory
 * seeded with `DIRECTORY_CONFORMANCE_DATASET`.
 *
 * @param options - Adapter name and fixture factory.
 *
 * @example
 * ```ts
 * import {
 *   createDeterministicClock,
 *   createInMemoryDirectoryPort,
 *   DIRECTORY_CONFORMANCE_DATASET,
 *   runDirectoryConformanceSuite,
 * } from '@netscript/plugin-directory-core/testing';
 *
 * runDirectoryConformanceSuite({
 *   name: 'memory',
 *   createFixture: () => {
 *     const clock = createDeterministicClock(DIRECTORY_CONFORMANCE_DATASET.initialTimeIso);
 *     const base = {
 *       directoryInstance: DIRECTORY_CONFORMANCE_DATASET.directoryInstance,
 *       clock,
 *       maxSearchLimit: 3,
 *       users: DIRECTORY_CONFORMANCE_DATASET.users,
 *       groups: DIRECTORY_CONFORMANCE_DATASET.groups,
 *     };
 *     return {
 *       clock,
 *       maxSearchLimit: 3,
 *       port: createInMemoryDirectoryPort(base),
 *       timeoutPort: createInMemoryDirectoryPort({ ...base, operationDelayMs: 250 }),
 *     };
 *   },
 * });
 * ```
 */
export function runDirectoryConformanceSuite(options: DirectoryConformanceSuiteOptions): void {
  Deno.test(`${options.name}: DirectoryPort conformance suite`, async (t) => {
    for (const suiteCase of CONFORMANCE_CASES) {
      await t.step(suiteCase.name, async () => {
        await executeCase(suiteCase, options.createFixture);
      });
    }
  });
}
