import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';

import { DenoDeployTarget, type DenoDeployTargetDefaults } from './deno-deploy-target.ts';
import type {
  DenoDeployCliPort,
  DenoDeployCliResult,
  DenoDeployInvocation,
  DenoDeployPreflightPort,
} from './deno-deploy-cli-port.ts';
import type { UnstableApiScanInput } from './unstable-api-guard.ts';
import { DEFAULT_DEPLOY_TARGETS } from '../../application/registries/deploy-target-registry.ts';

class FakeCli implements DenoDeployCliPort {
  readonly calls: { op: string; invocation: DenoDeployInvocation }[] = [];
  constructor(private readonly result: DenoDeployCliResult = { code: 0, stdout: '', stderr: '' }) {}
  #record(op: string, invocation: DenoDeployInvocation): Promise<DenoDeployCliResult> {
    this.calls.push({ op, invocation });
    return Promise.resolve(this.result);
  }
  deploy(i: DenoDeployInvocation) {
    return this.#record('deploy', i);
  }
  logs(i: DenoDeployInvocation) {
    return this.#record('logs', i);
  }
  remove(i: DenoDeployInvocation) {
    return this.#record('remove', i);
  }
  status(i: DenoDeployInvocation) {
    return this.#record('status', i);
  }
}

class FakePreflight implements DenoDeployPreflightPort {
  constructor(private readonly input: UnstableApiScanInput) {}
  readGuardInputs(): Promise<UnstableApiScanInput> {
    return Promise.resolve(this.input);
  }
}

function makeTarget(
  input: UnstableApiScanInput,
  defaults?: DenoDeployTargetDefaults,
  result?: DenoDeployCliResult,
): { target: DenoDeployTarget; cli: FakeCli } {
  const cli = new FakeCli(result);
  const target = new DenoDeployTarget({
    cli,
    preflight: new FakePreflight(input),
    defaults,
  });
  return { target, cli };
}

const CLEAN: UnstableApiScanInput = { denoJson: {}, sources: [] };
const KV: UnstableApiScanInput = {
  denoJson: {},
  sources: [{ path: 'main.ts', content: 'await Deno.openKv();' }],
};

Deno.test('DenoDeployTarget: declares the supported canonical op subset (no rollback/secrets)', () => {
  const { target } = makeTarget(CLEAN);
  assertEquals(target.key, 'deno-deploy');
  assertEquals(target.operations, ['plan', 'up', 'down', 'status', 'logs']);
  assertEquals((target as { rollback?: unknown }).rollback, undefined);
  assertEquals((target as { secrets?: unknown }).secrets, undefined);
});

Deno.test('DenoDeployTarget: plan reports guard violations without shelling', async () => {
  const { target, cli } = makeTarget(KV);
  const result = await target.plan({ projectRoot: '/p' });
  assertEquals(result.operation, 'plan');
  assertEquals(result.message.includes('--unstable-kv'), true);
  assertEquals(cli.calls.length, 0);
});

Deno.test('DenoDeployTarget: plan on a clean project reports Deploy-ready', async () => {
  const { target } = makeTarget(CLEAN);
  const result = await target.plan({ projectRoot: '/p' });
  assertEquals(result.message.includes('Deploy-ready'), true);
});

Deno.test('DenoDeployTarget: up refuses a production push with unstable-API violations', async () => {
  const { target, cli } = makeTarget(KV, { prod: true, app: 'orders' });
  await assertRejects(() => target.up({ projectRoot: '/p' }), Error, 'production push blocked');
  assertEquals(cli.calls.length, 0);
});

Deno.test('DenoDeployTarget: up proceeds on a preview push despite violations (warns)', async () => {
  const { target, cli } = makeTarget(KV, { app: 'orders' });
  const result = await target.up({ projectRoot: '/p' });
  assertEquals(cli.calls[0]?.op, 'deploy');
  assertEquals(cli.calls[0]?.invocation.app, 'orders');
  assertEquals(result.message.includes('warning'), true);
});

Deno.test('DenoDeployTarget: up pushes cleanly and forwards resolved defaults', async () => {
  const { target, cli } = makeTarget(CLEAN, { prod: true, org: 'acme', app: 'orders' });
  const result = await target.up({ projectRoot: '/p' });
  assertEquals(cli.calls[0]?.invocation, {
    projectRoot: '/p',
    org: 'acme',
    app: 'orders',
    prod: true,
    entrypoint: undefined,
    envFile: undefined,
  });
  assertEquals(result.message.includes('production'), true);
});

Deno.test('DenoDeployTarget: down/status/logs delegate to the CLI port', async () => {
  const { target, cli } = makeTarget(CLEAN, undefined, {
    code: 0,
    stdout: 'deployment-x',
    stderr: '',
  });
  await target.down({ projectRoot: '/p' });
  await target.status({ projectRoot: '/p' });
  await target.logs({ projectRoot: '/p' });
  assertEquals(cli.calls.map((c) => c.op), ['remove', 'status', 'logs']);
});

Deno.test('DenoDeployTarget: a non-zero CLI exit code throws', async () => {
  const { target } = makeTarget(CLEAN, { app: 'orders' }, {
    code: 1,
    stdout: '',
    stderr: 'boom',
  });
  await assertRejects(() => target.up({ projectRoot: '/p' }), Error, 'exit 1');
});

Deno.test('DEFAULT_DEPLOY_TARGETS: registers the deno-deploy target', () => {
  const keys = DEFAULT_DEPLOY_TARGETS.map(([key]) => key);
  assertEquals(keys.includes('deno-deploy'), true);
  const entry = DEFAULT_DEPLOY_TARGETS.find(([key]) => key === 'deno-deploy');
  assertEquals(entry?.[1].key, 'deno-deploy');
  assertEquals(entry?.[1].operations, ['plan', 'up', 'down', 'status', 'logs']);
});
