import { DenoProcess } from './deno-process.ts';

/** Stage a frozen lock outside the consumer; never grant the renderer project write permission. */
async function main(): Promise<void> {
  let size = 0;
  const bounded = Deno.stdin.readable.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        size += chunk.byteLength;
        if (size > 20 * 1024 * 1024) {
          throw new Error('Plugin inspection request capacity exceeded.');
        }
        controller.enqueue(chunk);
      },
    }),
  );
  const request: unknown = JSON.parse(await new Response(bounded).text());
  if (typeof request !== 'object' || request === null) {
    throw new Error('Invalid inspection request.');
  }
  const payload = request as Record<string, unknown>;
  if (
    typeof payload.lock !== 'string' || typeof payload.root !== 'string' ||
    !Array.isArray(payload.args) || !payload.args.every((arg) => typeof arg === 'string')
  ) {
    throw new Error('Invalid inspection request.');
  }
  const staging = await Deno.makeTempDir({ dir: Deno.args[0] });
  try {
    const lock = `${staging}/deno.lock`;
    await Deno.writeTextFile(lock, payload.lock);
    const result = await new DenoProcess().exec('deno', [
      payload.args[0],
      `--lock=${lock}`,
      '--frozen',
      ...payload.args.slice(1),
    ], { cwd: payload.root, timeoutMs: 25_000, maxOutputBytes: 16 * 1024 * 1024 });
    await Deno.stdout.write(new TextEncoder().encode(result.stdout));
    await Deno.stderr.write(new TextEncoder().encode(result.stderr));
    Deno.exitCode = result.code;
  } finally {
    await Deno.remove(staging, { recursive: true });
  }
}
if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exitCode = 1;
  }
}
