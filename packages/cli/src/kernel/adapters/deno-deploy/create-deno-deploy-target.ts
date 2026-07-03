import {
  DenoDeployTarget,
  type DenoDeployTargetDefaults,
} from '../../domain/deploy/deno-deploy-target.ts';
import { DenoDeployCliAdapter } from './deno-deploy-cli.ts';
import { DenoDeployPreflightReader } from './deno-deploy-preflight.ts';
import { DenoProcess } from '../runtime/process/deno-process.ts';

/**
 * Compose a {@link DenoDeployTarget} wired with the concrete `deno deploy` CLI
 * adapter (ProcessPort-backed) and the filesystem preflight reader.
 *
 * This is the single composition point for the Deno Deploy target: the default
 * registry uses it with no baked defaults, and the CLI surface uses it with the
 * config-resolved defaults (org/app/prod/entrypoint/envFile). Keeping the wiring
 * here means neither the registry nor the command surface reaches for
 * `Deno.Command` (F-CLI-16); they consume a ready target.
 */
export function createDenoDeployTarget(defaults?: DenoDeployTargetDefaults): DenoDeployTarget {
  return new DenoDeployTarget({
    cli: new DenoDeployCliAdapter(new DenoProcess()),
    preflight: new DenoDeployPreflightReader(),
    defaults,
  });
}
