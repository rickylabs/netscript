/** User-owned definitions for the consumer acceptance workflows. @module */
import { join } from '@std/path';
import { command } from './scaffold.ts';

/** The same identity is used at authoring, dispatch and persisted-effect assertions. */
export const PROOF = {
  job: 'kv-proof-job',
  saga: 'kv-proof-saga',
  trigger: 'kv-proof-trigger',
  correlation: 'kv-only-acceptance',
} as const;

/** Use installed plugin CLIs to author and register real consumer definitions. */
export async function installDefinitions(root: string): Promise<void> {
  for (
    const args of [
      ['@netscript/plugin-workers/cli', 'add', 'job', PROOF.job],
      ['@netscript/plugin-sagas/cli', 'add', 'saga', PROOF.saga, '--message-type=KvProofStarted'],
      [
        '@netscript/plugin-triggers/cli',
        'add-webhook',
        PROOF.trigger,
        '--path=kv-proof',
        '--verifier=memory',
        `--job=${PROOF.job}`,
      ],
    ]
  ) {
    await command(Deno.execPath(), ['run', '--no-lock', '-A', ...args], root);
  }
  await Deno.writeTextFile(
    join(root, 'sagas', `${PROOF.saga}-saga.ts`),
    `
import { defineSaga, sagaComplete } from '@netscript/plugin-sagas-core';

type State = { phase: 'initial' | 'working' | 'completed'; count: number };

export const kvProofSaga = defineSaga('${PROOF.saga}')
  .durability('t1')
  .state<State>({ phase: 'initial', count: 0 })
  .on('KvProofStarted', (saga) => {
    saga.state.phase = 'working';
    saga.state.count++;
    return [];
  })
  .on('KvProofAdvanced', (saga) => {
    saga.state.count++;
    return [];
  })
  .on('KvProofFinished', (saga) => {
    saga.state.phase = 'completed';
    saga.state.count++;
    return [sagaComplete()];
  })
  .compensate('KvProofUndo', (saga) => {
    saga.state.phase = 'initial';
    saga.state.count = 0;
    return [];
  })
  .build();

export default kvProofSaga;
`,
  );
}
