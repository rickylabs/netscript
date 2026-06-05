import type { RegistryEmission } from '../sdk/mod.ts';

/** Inspect emitted walker output for diagnostics. */
export function inspectWalkerOutput(output: RegistryEmission): Record<string, unknown> {
  return {
    path: output.path,
    bytes: output.text.length,
  };
}
