import { assertEquals, assertStringIncludes } from '@std/assert';
import { defaultOptions, normalizeCommandOptions, runSmoke } from './scaffold-e2e-test.ts';

Deno.test('scaffold diagnostic cleans up by default with explicit opt-out', () => {
  assertEquals(defaultOptions().cleanup, true);
  assertEquals(normalizeCommandOptions({}).cleanup, true);
  assertEquals(normalizeCommandOptions({ noCleanup: true }).cleanup, false);
});

Deno.test('missing Aspire binary becomes a structured failed step', async () => {
  const root = await Deno.makeTempDir();
  try {
    const options = normalizeCommandOptions({
      repo: root,
      cli: new URL('./scaffold-e2e-test.ts', import.meta.url).pathname,
      smokeRoot: root,
      logFile: `${root}/smoke.log`,
      aspireCommand: 'netscript-guaranteed-missing-aspire-binary',
      format: 'json',
    });
    const report = await runSmoke(options);
    assertEquals(report.ok, false);
    const step = report.steps.find((candidate) => candidate.id === 'preflight-aspire-version');
    assertEquals(step?.status, 'failed');
    assertStringIncludes(step?.error ?? '', 'Failed to spawn');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('consumer mode selects the exact released CLI without a framework clone', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(`${root}/.llm/tools`, { recursive: true });
    await Deno.writeTextFile(
      `${root}/.llm/tools/release.json`,
      '{"cli":"jsr:@netscript/cli@0.0.3"}\n',
    );
    const options = normalizeCommandOptions({
      repo: root,
      name: 'consumer-smoke',
      dryRun: true,
      format: 'json',
      logFile: `${root}/smoke.log`,
    });
    assertEquals(options.cli, 'jsr:@netscript/cli@0.0.3');
    assertEquals(options.source, 'starter');
    assertStringIncludes(options.smokeRoot, root);
    assertStringIncludes(options.logFile, root);
    const report = await runSmoke(options);
    const init = report.steps.find((step) => step.id === 'init-project');
    assertStringIncludes(JSON.stringify(init?.details), '"--minimum-dependency-age=0"');
    const worker = report.steps.find((step) => step.id === 'plugin-add-workers');
    assertStringIncludes(JSON.stringify(worker?.details), '"plugin","install","worker"');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('generated host-port validation is critical and inspects the final pre-runtime artifact', async () => {
  const root = await Deno.makeTempDir();
  try {
    const options = normalizeCommandOptions({
      repo: Deno.cwd(),
      smokeRoot: root,
      name: 'host-port-order',
      dryRun: true,
      format: 'json',
      logFile: `${root}/smoke.log`,
    });
    const report = await runSmoke(options);
    const validatorIndex = report.steps.findIndex(
      (step) => step.id === 'validate-generated-host-ports',
    );
    const registryIndex = report.steps.findIndex((step) => step.id === 'generate-plugin-registry');
    const typeCheckIndex = report.steps.findIndex(
      (step) => step.id === 'deno-check-generated-workspaces',
    );
    const aspireIndex = report.steps.findIndex((step) => step.id === 'aspire-start');
    assertEquals(registryIndex < validatorIndex, true);
    assertEquals(typeCheckIndex + 1, validatorIndex);
    assertEquals(validatorIndex + 1, aspireIndex);
    const validator = report.steps[validatorIndex];
    assertEquals(validator.critical, true);
    assertStringIncludes(JSON.stringify(validator.details), 'check-aspire-host-ports.ts');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
