import type { InstallableFoundationComponentId } from './contract.ts';
import { TEST_COMPONENT_VERSIONS } from '../config/versions.ts';
import { ROUTING_MODEL_IDS } from '../config/models.ts';

/** Attested connector fixture uses centralized spellings, never derived slugs. */
export const COPILOT_CATALOG_FIXTURE: string = [
  ROUTING_MODEL_IDS.fable51Copilot,
  ROUTING_MODEL_IDS.gemini38FlashCopilot,
  ROUTING_MODEL_IDS.kimiK3Copilot,
  ROUTING_MODEL_IDS.grok46Copilot,
].join('\n');

/**
 * Shared value-only component versions for runtime-controller tests.
 * Single source: `config/versions.ts` (`TEST_COMPONENT_VERSIONS`).
 */
export const RUNTIME_TEST_COMPONENT_VERSIONS: Readonly<
  Record<InstallableFoundationComponentId, string>
> = Object.freeze({ ...TEST_COMPONENT_VERSIONS });
