import { readRoutingStates, renderRoutingStateHuman } from './routing-state.ts';

function equal(actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error('values differ');
}

Deno.test('routing state human edge is finite for an empty machine-local store', async () => {
  const home = await Deno.makeTempDir();
  try {
    equal(await readRoutingStates(home), []);
    equal(renderRoutingStateHuman([]), 'No persisted routing transitions.');
  } finally {
    await Deno.remove(home, { recursive: true });
  }
});
