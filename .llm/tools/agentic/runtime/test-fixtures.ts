import type { InstallableFoundationComponentId } from './contract.ts';
import { TEST_COMPONENT_VERSIONS } from '../config/versions.ts';

/**
 * Shared value-only component versions for runtime-controller tests.
 * Single source: `config/versions.ts` (`TEST_COMPONENT_VERSIONS`).
 */
export const RUNTIME_TEST_COMPONENT_VERSIONS: Readonly<
  Record<InstallableFoundationComponentId, string>
> = Object.freeze({ ...TEST_COMPONENT_VERSIONS });
