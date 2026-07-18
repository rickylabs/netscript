/** Execution platforms understood by platform-aware E2E gates. */
export const EXECUTION_PLATFORMS = {
  LINUX: 'linux',
  WINDOWS: 'windows',
  DARWIN: 'darwin',
} as const;

/** Host platform on which an E2E gate can execute. */
export type ExecutionPlatform = typeof EXECUTION_PLATFORMS[keyof typeof EXECUTION_PLATFORMS];

/** Machine-readable status used when rendering native desktop suite evidence. */
export const NATIVE_DESKTOP_SUITE_STATUSES = {
  PASS: 'PASS',
  FAIL: 'FAIL',
  NOT_RUN: 'NOT_RUN',
} as const;

/** Native desktop suite evidence status. */
export type NativeDesktopSuiteStatus =
  typeof NATIVE_DESKTOP_SUITE_STATUSES[keyof typeof NATIVE_DESKTOP_SUITE_STATUSES];
