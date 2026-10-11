import { runChildHealthProcess } from '../../../src/health/mod.ts';

await runChildHealthProcess(async (health, signal) => {
  if (Deno.args[0] === 'leaked-handle') {
    setInterval(() => undefined, 60_000);
    throw new Error('dependency startup left a live handle');
  }
  if (Deno.args[0] === 'registry-failed') throw new Error('secret-token=registry-password');
  health.registryLoaded();
  if (Deno.args[0] === 'dependency-failed') throw new Error('secret-token=dependency-password');
  health.dependenciesReady();
  health.running();
  if (Deno.args[0] === 'crash-loop') {
    for (let i = 0; i < 3; i++) health.restarting();
    health.dependenciesReady();
    health.running();
  }
  if (Deno.args[0] === 'completed') return;
  console.error('fixture-ready');
  await new Promise<void>((resolve) => {
    if (signal.aborted) resolve();
    else signal.addEventListener('abort', () => resolve(), { once: true });
  });
});
