import type { InstallableFoundationComponentId } from './contract.ts';

/** Shared value-only component versions for runtime-controller tests. */
export const RUNTIME_TEST_COMPONENT_VERSIONS: Readonly<
  Record<InstallableFoundationComponentId, string>
> = Object.freeze({
  node: '26.5.0',
  claude: '2.1.206',
  gemini: '0.50.0',
});
