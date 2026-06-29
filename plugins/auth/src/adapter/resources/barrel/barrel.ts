/** Auth userland barrel install scaffolder.
 *
 * @module
 */

import {
  type ItemScaffolder,
  type ScaffoldArtifact,
  substituteTokens,
  textArtifact,
} from '@netscript/plugin/adapter';
import type { AuthBarrelInput } from '../input.ts';
import { authBarrelStub } from './barrel.stub.ts';

/** Canonical auth barrel input emitted during auth install. */
export const DEFAULT_AUTH_BARREL_INPUT: AuthBarrelInput = {
  coreContractsSpecifier: '@netscript/plugin-auth-core/contracts/v1',
};

/** Auth barrel scaffolder emitted during install. */
export const authBarrelScaffolder: ItemScaffolder<AuthBarrelInput> = {
  name: 'barrel',
  emit(input: AuthBarrelInput): readonly ScaffoldArtifact[] {
    return [
      textArtifact(
        'auth/mod.ts',
        substituteTokens(authBarrelStub, {
          AUTH_CORE_CONTRACTS: input.coreContractsSpecifier,
        }),
      ),
    ];
  },
};
