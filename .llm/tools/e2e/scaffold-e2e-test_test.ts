import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { join } from '@std/path';
import {
  defaultOptions,
  normalizeCommandOptions,
  resourceUrlFromDescribeOutput,
  runSmoke,
} from './scaffold-e2e-test.ts';

Deno.test('scaffold diagnostic cleans up by default with explicit opt-out', () => {
  assertEquals(defaultOptions().cleanup, true);
  assertEquals(normalizeCommandOptions({}).cleanup, true);
  assertEquals(normalizeCommandOptions({ noCleanup: true }).cleanup, false);
});

Deno.test('plugin endpoint defaults come from Aspire describe resources', () => {
  assertEquals(defaultOptions().workersUrl, undefined);
  assertEquals(normalizeCommandOptions({}).sagasUrl, undefined);
  assertEquals(
    resourceUrlFromDescribeOutput(
      `banner\n{"resources":[{"name":"workers-api-instance","displayName":"workers-api","urls":[{"url":"http://127.0.0.1:49152"}]}]}`,
      'workers-api',
    ),
    'http://127.0.0.1:49152',
  );
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
    const authEntrypoint = report.steps.find((step) => step.id === 'auth-entrypoint-generated');
    assertStringIncludes(JSON.stringify(authEntrypoint?.details), 'auth/mod.ts');
    assertEquals(
      report.steps.some((step) => JSON.stringify(step.details).includes('scaffold.plugin.json')),
      false,
    );
    const typeCheck = report.steps.find((step) => step.id === 'deno-check-generated-workspaces');
    assertEquals(JSON.stringify(typeCheck?.details).includes('"./packages"'), false);
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
    const offlineCodegenIndex = report.steps.findIndex(
      (step) => step.id === 'db-codegen-offline',
    );
    const dbInitIndex = report.steps.findIndex((step) => step.id === 'db-init');
    const dbStatusIndex = report.steps.findIndex((step) => step.id === 'db-status-after-init');
    const restartIndex = report.steps.findIndex(
      (step) => step.id === 'aspire-restart-after-db',
    );
    assertEquals(offlineCodegenIndex < typeCheckIndex, true);
    assertEquals(registryIndex < validatorIndex, true);
    assertEquals(typeCheckIndex + 1, validatorIndex);
    assertEquals(validatorIndex + 1, aspireIndex);
    assertEquals(aspireIndex < dbInitIndex, true);
    assertEquals(dbStatusIndex < restartIndex, true);
    const validator = report.steps[validatorIndex];
    assertEquals(validator.critical, true);
    assertStringIncludes(JSON.stringify(validator.details), 'check-aspire-host-ports.ts');
    assertStringIncludes(JSON.stringify(validator.details), '--generated-project');
    const init = report.steps.find((step) => step.id === 'init-project');
    assertEquals(JSON.stringify(init?.details).includes('service-port'), false);
    const offlineCodegen = report.steps[offlineCodegenIndex];
    assertStringIncludes(JSON.stringify(offlineCodegen.details), 'deno","task","db:generate');
    assertEquals(JSON.stringify(offlineCodegen.details).includes('jsr:@netscript/cli'), false);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('legacy scaffold smoke isolates init host detection without starting resources', async () => {
  const scratch = await Deno.makeTempDir();
  const markers = {
    CLAUDECODE: '1',
    OPENCODE: '1',
    OPENCODE_FIXTURE: '1',
    TERM_PROGRAM: 'vscode',
    VSCODE_FIXTURE: '1',
    CURSOR_FIXTURE: '1',
    ZED_TERM: 'true',
  };
  const previous = new Map(
    [...Object.keys(markers), 'NETSCRIPT_TEST_RETAINED'].map((name) => [name, Deno.env.get(name)]),
  );
  const NativeCommand = Deno.Command;
  const observed: Deno.CommandOptions[] = [];
  Deno.Command = class extends NativeCommand {
    readonly options: Deno.CommandOptions;
    constructor(command: string | URL, options: Deno.CommandOptions = {}) {
      super(command, options);
      this.options = options;
    }
    override output(): Promise<Deno.CommandOutput> {
      const init = this.options.args?.includes('init') ?? false;
      if (init) observed.push(this.options);
      return Promise.resolve({
        code: init ? 1 : 0,
        success: !init,
        signal: null,
        stdout: new TextEncoder().encode('fixture version'),
        stderr: new Uint8Array(),
      });
    }
  };
  try {
    for (const [name, value] of Object.entries(markers)) Deno.env.set(name, value);
    Deno.env.set('NETSCRIPT_TEST_RETAINED', 'retained');
    const report = await runSmoke({
      ...defaultOptions(),
      format: 'json',
      smokeRoot: scratch,
      name: 'hermetic-smoke',
      logFile: join(scratch, 'smoke.log'),
    });
    assertEquals(report.startedAspire, false);
    assertEquals(observed.length, 1);
    assertEquals(observed[0].clearEnv, true);
    const env = observed[0].env;
    assert(env);
    for (const name of Object.keys(markers)) assertEquals(env[name], undefined, name);
    assertEquals(env.NETSCRIPT_TEST_RETAINED, 'retained');
  } finally {
    Deno.Command = NativeCommand;
    for (const [name, value] of previous) {
      if (value === undefined) Deno.env.delete(name);
      else Deno.env.set(name, value);
    }
    await Deno.remove(scratch, { recursive: true });
  }
});
