/**
 * @module
 *
 * Behavior gate for #1447: the **running** service resource carries the
 * environment its config declared, and the generated infrastructure value it
 * collides with still won.
 *
 * Reads the live topology through `aspire describe --format Json` rather than
 * the generated source, because the question this gate answers is not "did the
 * generator emit a line" — the generator tests answer that — but "did the value
 * survive into the resource the AppHost is actually running".
 *
 * It also fails on a terminal resource state, which is the exact symptom #1447
 * reported: without the declared transport switch the service fell back to
 * stdio, read EOF, and exited successfully within a second, so Aspire showed it
 * as `Finished` while the config still looked valid.
 *
 * The parse and the verdict live in `service-env-evidence.ts` so they are
 * testable without an AppHost.
 */

import { DECLARED_SERVICE_ENV, GENERATED_DATABASE_URL_KEY } from './service-env-contract.ts';
import {
  collectServiceEnvironmentFailures,
  readDescribedResource,
} from './service-env-evidence.ts';

const [appHost, serviceName] = Deno.args;
if (!appHost || !serviceName) {
  throw new Error('AppHost path and service name are required');
}

const output = await new Deno.Command('aspire', {
  args: [
    'describe',
    '--apphost',
    appHost,
    '--format',
    'Json',
    '--include-hidden',
    '--non-interactive',
    '--nologo',
  ],
  stdout: 'piped',
  stderr: 'piped',
}).output();
const stdout = new TextDecoder().decode(output.stdout);
const stderr = new TextDecoder().decode(output.stderr);
if (!output.success) {
  throw new Error(`aspire describe failed (${output.code}): ${stderr || stdout}`);
}

const failures = collectServiceEnvironmentFailures(
  readDescribedResource(stdout, serviceName),
  serviceName,
);
if (failures.length > 0) {
  throw new Error(
    `running resource ${serviceName} does not honor its declared environment:\n` +
      failures.map((failure) => `  - ${failure}`).join('\n'),
  );
}

console.info(
  `${serviceName} runs with its declared environment (${
    Object.keys(DECLARED_SERVICE_ENV).join(', ')
  }) and the AppHost-allocated ${GENERATED_DATABASE_URL_KEY}`,
);
