/**
 * @module
 *
 * The #1447 declared-service-environment gates, as a role-named registry module.
 *
 * They live here rather than in `runtime-gates.ts` for the reason recorded in
 * arch-debt `scaffold-runtime-a8-f16-1333`: that file is already 906 lines
 * against a 500-line cap and its stop condition is "before the next scaffold
 * runtime gate or probe is added". Adding these two gates in the recorded
 * remediation shape — role-named module, probe scripts behind one bounded
 * subdirectory — is what keeps this slice from deepening the entry.
 *
 * Neither gate is told which service to look at. The fixture discovers the
 * subject from the generated `appsettings.json` and the verifier rediscovers it
 * from the same file plus the running topology, so a scaffold that renames or
 * adds a service moves the gate with it instead of invalidating it.
 */

import { GATE, GATE_PHASE } from '../../../../domain/cli-surface.ts';
import { PACKAGE_SOURCE } from '../../../../domain/extension-axes.ts';
import type { GateDefinition } from '../../../../domain/gate-definition.ts';
import type { RunContext } from '../../../../domain/run-context.ts';
import { resolve } from '@std/path';
import { commandGate } from '../gate-factory.ts';

/** Directory holding the two gate entrypoints, relative to the repository root. */
const GATE_DIR = 'packages/cli/e2e/src/application/gates/scaffold/service-env';

/** How the fixture must invoke the CLI: from JSR, or from this checkout. */
function packageMode(context: RunContext): string {
  return context.request.options.packageSource === PACKAGE_SOURCE.JSR ? 'published' : 'local';
}

/** The CLI entrypoint the fixture regenerates through, absolute unless it is a JSR specifier. */
function cliEntrypoint(context: RunContext): string {
  const { cliEntrypoint: entrypoint, repoRoot } = context.project;
  return entrypoint.startsWith('jsr:') ? entrypoint : resolve(repoRoot, entrypoint);
}

/**
 * Returns the pre-start fixture and the post-start verification gate for the
 * declared service environment.
 *
 * @returns Gate definitions, in no particular order — the suite lists own order.
 */
export function createServiceEnvironmentGates(): readonly GateDefinition[] {
  return [
    commandGate(
      GATE.RUNTIME_SERVICE_ENV_FIXTURE,
      'Declare service environment and regenerate on the consumer path',
      GATE_PHASE.RUNTIME,
      (context) => [
        'deno',
        'run',
        '--allow-read',
        '--allow-write',
        '--allow-run=deno',
        '--allow-env',
        `${GATE_DIR}/configure-service-env.ts`,
        context.project.projectRoot,
        packageMode(context),
        cliEntrypoint(context),
      ],
    ),
    commandGate(
      GATE.BEHAVIOR_SERVICE_ENV,
      'The AppHost-started service process observes its declared environment',
      GATE_PHASE.BEHAVIOR,
      (context) => [
        'deno',
        'run',
        // `--allow-read` covers both appsettings.json and `/proc/<pid>/environ`:
        // the process environment is the only evidence that the value reached
        // the service rather than only the resource model.
        '--allow-read',
        '--allow-run=aspire',
        `${context.project.repoRoot}/${GATE_DIR}/verify-service-env.ts`,
        context.project.projectRoot,
        context.project.appHost,
      ],
      (context) => context.project.projectRoot,
    ),
  ];
}
