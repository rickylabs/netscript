import { workersCli } from '@netscript/plugin-workers/cli';
import { sagasCli } from '@netscript/plugin-sagas/cli';
import type { PluginCli, PluginCliArgs, PluginCliResult } from '@netscript/plugin/cli';

const correlationId = `cli-e2e-${crypto.randomUUID()}`;

const trigger = await run(workersCli, {
  command: 'trigger',
  values: ['health-check'],
  flags: { payload: JSON.stringify({ source: 'durable-cli-parity' }) },
});
assertSuccess(trigger, 'workers trigger');

await poll('workers executions', async () => {
  const result = await run(workersCli, {
    command: 'executions',
    flags: { limit: 20, json: true },
  });
  assertSuccess(result, 'workers executions');
  const executions = recordArray(result.data, 'executions');
  return executions.some((execution) =>
    execution.jobId === 'health-check' && execution.status === 'completed'
  );
});

const publish = await run(sagasCli, {
  command: 'publish',
  values: ['user.registered'],
  flags: {
    payload: JSON.stringify({ correlationId, subject: 'cli-e2e' }),
    'correlation-key': correlationId,
    'idempotency-key': `${correlationId}:started`,
  },
});
assertSuccess(publish, 'sagas publish');

await poll('saga instance', async () => {
  const result = await run(sagasCli, {
    command: 'list',
    flags: { instances: true, json: true },
  });
  assertSuccess(result, 'sagas list --instances');
  const instances = recordArray(result.data, 'instances');
  return instances.some((instance) => instance.correlationKey === correlationId);
});

console.info(`durable CLI parity passed for correlation ${correlationId}`);

async function run(cli: PluginCli, args: PluginCliArgs): Promise<PluginCliResult> {
  const command = cli.commands().find((candidate) => candidate.name === args.command);
  if (!command) throw new Error(`CLI command ${args.command} is not registered.`);
  return await command.run(args);
}

function assertSuccess(result: PluginCliResult, label: string): void {
  if (result.code !== 0) throw new Error(`${label} failed: ${result.message ?? 'unknown error'}`);
}

function recordArray(value: unknown, key: string): readonly Record<string, unknown>[] {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`Expected ${key} response object.`);
  }
  const records = (value as Record<string, unknown>)[key];
  if (!Array.isArray(records) || !records.every(isRecord)) {
    throw new Error(`Expected ${key} response array.`);
  }
  return records;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function poll(label: string, check: () => Promise<boolean>): Promise<void> {
  for (let attempt = 1; attempt <= 30; attempt++) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`${label} did not reach the expected state after 30 attempts.`);
}
