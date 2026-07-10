import { readRoutingStates, renderRoutingStateHuman } from './routing-state.ts';
import { assertEquals as equal } from '@std/assert';

Deno.test('routing state human edge is finite for an empty machine-local store', async () => {
  const home = await Deno.makeTempDir();
  try {
    equal(await readRoutingStates(home), []);
    equal(renderRoutingStateHuman([]), 'No persisted routing transitions.');
  } finally {
    await Deno.remove(home, { recursive: true });
  }
});
