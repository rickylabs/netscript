import { parseArgs } from 'jsr:@std/cli@1/parse-args';
import { DenoKvAdapter } from '@netscript/kv';
import { SagaKvRetention } from '../../packages/plugin-sagas-core/src/stores/saga-kv-retention.ts';
import { backfillTriggerRetention } from '../../packages/plugin-triggers-core/src/stores/trigger-kv-retention.ts';
import { readBackfillPolicy } from './contract.ts';

/** Run a capped operator batch; persisted checkpoints survive subsequent invocations. */
export async function main(args: string[]): Promise<void> {
  const flags = parseArgs(args, {
    string: ['saga-kv', 'trigger-kv', 'policy', 'passes', 'page-size', 'migration'],
    default: { passes: '1', 'page-size': '10', migration: 'legacy-terminal-v1' },
    unknown: (argument) => {
      throw new TypeError(`Unknown argument: ${argument}`);
    },
  });
  if (!flags['saga-kv'] || !flags['trigger-kv'] || !flags.policy || !flags.migration) {
    throw new TypeError('Required: --saga-kv <path> --trigger-kv <path> --policy <json-file>');
  }
  const passes = Number(flags.passes);
  const limit = Number(flags['page-size']);
  if (
    !Number.isSafeInteger(passes) || passes < 1 || passes > 1000 ||
    !Number.isSafeInteger(limit) || limit < 1 || limit > 10
  ) {
    throw new RangeError('Passes must be 1..1000 and page-size must be 1..10.');
  }
  const policy = readBackfillPolicy(JSON.parse(await Deno.readTextFile(flags.policy)));
  await using sagas = new DenoKvAdapter(await Deno.openKv(flags['saga-kv']));
  await using triggers = new DenoKvAdapter(await Deno.openKv(flags['trigger-kv']));
  const retention = new SagaKvRetention(sagas, ['sagas'], () => new Date());
  for (let pass = 1; pass <= passes; pass++) {
    const saga = await retention.backfill(
      (envelope) =>
        policy.sagas.bySaga?.[
          envelope.metadata.sagaId ?? String(envelope.metadata.instanceId).split(':')[0]!
        ] ?? policy.sagas.defaultDays,
      flags.migration,
      limit,
    );
    const trigger = await backfillTriggerRetention(
      {
        kv: triggers,
        kvRetentionDays: (id) => policy.triggers.byTrigger?.[id] ?? policy.triggers.defaultDays,
      },
      flags.migration,
      limit,
    );
    console.log(JSON.stringify({ pass, saga, trigger }));
    if (saga.done && trigger.done) return;
  }
}

if (import.meta.main) await main(Deno.args);
