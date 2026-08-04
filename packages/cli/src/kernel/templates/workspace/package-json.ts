/**
 * @module templates/workspace/package-json
 *
 * Root package manifest generator for Deno runtime compatibility metadata.
 */

import { SCAFFOLD_DEFAULTS } from '../../constants/scaffold/scaffold-defaults.ts';

/** Generate the private root package manifest with the supported Deno pin. */
export function generatePackageJson(): string {
  return JSON.stringify(
    {
      private: true,
      engines: {
        deno: SCAFFOLD_DEFAULTS.DENO_VERSION,
      },
    },
    null,
    2,
  ) + '\n';
}
