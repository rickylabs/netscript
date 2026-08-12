import { assertEquals } from '@std/assert';
import { createPackageBackedPluginDoctorGates } from '../../../../src/application/gates/scaffold/behavior-plugins-health-gate.ts';
import { PACKAGE_BACKED_DOCTOR_UNPUBLISHED_MESSAGE } from '../../../../src/application/gates/scaffold/package-backed-plugin-version.ts';
import type { RunContext } from '../../../../src/domain/run-context.ts';
import { NETSCRIPT_RELEASE_VERSION } from '../../../../../src/kernel/constants/jsr-specifiers.ts';

Deno.test('package-backed doctor uses the tree version locally and names its unpublished skip', () => {
  const gate = createPackageBackedPluginDoctorGates()[0];
  if (gate.kind !== 'command') throw new Error('Expected command gate.');

  const command = gate.command(context('packages/cli/bin/netscript-dev.ts'));
  assertEquals(command.at(-1), NETSCRIPT_RELEASE_VERSION);
  assertEquals(gate.critical, true);
  assertEquals(gate.skip, {
    exitCode: 78,
    message: PACKAGE_BACKED_DOCTOR_UNPUBLISHED_MESSAGE,
  });
});

Deno.test('package-backed doctor follows the exact published CLI version', () => {
  const gate = createPackageBackedPluginDoctorGates()[0];
  if (gate.kind !== 'command') throw new Error('Expected command gate.');

  const command = gate.command(context('jsr:@netscript/cli@0.0.4/cli'));
  assertEquals(command.at(-1), '0.0.4');
});

function context(cliEntrypoint: string): RunContext {
  return {
    request: {
      suiteId: 'scaffold.runtime',
      options: {
        repoRoot: '/repo',
        cliEntrypoint,
        smokeRoot: '/repo/.llm/tmp/cli-e2e',
        projectName: 'package-doctor-test',
        database: 'postgres',
        packageSource: 'local',
        plugins: [],
        samples: false,
        cache: true,
        cleanup: true,
        format: 'pretty',
        commandTimeoutMs: 120_000,
        httpTimeoutMs: 10_000,
      },
    },
    project: {
      repoRoot: '/repo',
      cliEntrypoint,
      smokeRoot: '/repo/.llm/tmp/cli-e2e',
      projectName: 'package-doctor-test',
      projectRoot: '/repo/.llm/tmp/cli-e2e/package-doctor-test',
      appHost: '/repo/.llm/tmp/cli-e2e/package-doctor-test/aspire/apphost.mts',
    },
  };
}
