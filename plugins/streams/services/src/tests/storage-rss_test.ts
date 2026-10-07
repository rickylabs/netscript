import { assert, assertEquals } from '@std/assert';
import { fileURLToPath } from 'node:url';
import { createBoundedFileBackedStreamStore } from '../bounded-file-store.ts';

const GIB = 1024 * 1024 * 1024;
const PAYLOAD_BYTES = 1024 * 1024;
const FRAME_BYTES = PAYLOAD_BYTES + 5;
const FRAME_COUNT = 1024;
// Absolute per-process RSS, including Deno, LMDB, I/O windows and the 1 MiB tail.
const RSS_CEILING = 512 * 1024 * 1024;

interface RssMeasurement {
  mode: string;
  baselineRss: number;
  recoveryPeakRss: number;
  peakRss: number;
  ceiling: number;
  logBytes: number;
  recoveredOffset: string;
}

async function measure(
  mode: string,
  dir: string,
  bytes: number,
): Promise<{ code: number; result: RssMeasurement }> {
  const child = new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '--frozen',
      '--allow-all',
      fileURLToPath(new URL('./test_utils/storage-rss-worker.ts', import.meta.url)),
      mode,
      dir,
      String(bytes),
      String(bytes - FRAME_BYTES),
      String(RSS_CEILING),
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();
  const timeout = setTimeout(() => child.kill('SIGKILL'), 120_000);
  try {
    const output = await child.output();
    const stdout = new TextDecoder().decode(output.stdout);
    const stderr = new TextDecoder().decode(output.stderr);
    const line = stdout.split('\n').find((value) => value.startsWith('RSS_RESULT:'));
    assert(line, `${mode}: exit ${output.code}, ${stderr}\n${stdout}`);
    const result: RssMeasurement = JSON.parse(line.slice('RSS_RESULT:'.length));
    console.log(`STORAGE_RSS ${JSON.stringify({ ...result, exitCode: output.code })}`);
    return { code: output.code, result };
  } finally {
    clearTimeout(timeout);
  }
}

Deno.test({
  name:
    'streams durable storage: >=1 GiB recovery/tail RSS ceiling rejects both old full-buffer paths',
  ignore: Deno.build.os !== 'linux',
  async fn() {
    const dir = await Deno.makeTempDir({ prefix: 'streams-rss-' });
    try {
      const store = createBoundedFileBackedStreamStore(dir);
      try {
        await store.create('/large', { contentType: 'application/octet-stream' });
      } finally {
        await store.close();
      }
      const segment = Array.from(Deno.readDirSync(`${dir}/streams`)).find((entry) =>
        entry.name.endsWith('.log')
      );
      assert(segment);
      const frame = new Uint8Array(FRAME_BYTES).fill(97);
      new DataView(frame.buffer).setUint32(0, PAYLOAD_BYTES, false);
      frame[FRAME_BYTES - 1] = 10;
      const file = await Deno.open(`${dir}/streams/${segment.name}`, {
        write: true,
        truncate: true,
      });
      try {
        // Generate a real, fully framed log with one reusable 1 MiB buffer.
        for (let i = 0; i < FRAME_COUNT; i++) {
          let written = 0;
          while (written < frame.length) {
            const count = await file.write(frame.subarray(written));
            assert(count > 0);
            written += count;
          }
        }
        await file.sync();
      } finally {
        file.close();
      }
      const bytes = (await Deno.stat(`${dir}/streams/${segment.name}`)).size;
      assert(bytes >= GIB);
      assertEquals(bytes, FRAME_COUNT * FRAME_BYTES);
      // Both native negative controls run first; each fails the same ceiling while
      // returning the native offset. They allocate real log buffers, not simulated RSS.
      const oldRecovery = await measure('old-recovery', dir, bytes);
      assertEquals(oldRecovery.code, 1);
      assert(oldRecovery.result.recoveryPeakRss > RSS_CEILING);
      const oldTail = await measure('old-tail', dir, bytes);
      assertEquals(oldTail.code, 1);
      assert(oldTail.result.recoveryPeakRss < RSS_CEILING);
      assert(oldTail.result.peakRss > RSS_CEILING);
      const bounded = await measure('bounded', dir, bytes);
      assertEquals(bounded.code, 0);
      assert(bounded.result.recoveryPeakRss < RSS_CEILING);
      assert(bounded.result.peakRss < RSS_CEILING);
      assertEquals(bounded.result.recoveredOffset, oldRecovery.result.recoveredOffset);
      const reportPath = Deno.env.get('NETSCRIPT_STORAGE_RSS_REPORT');
      if (reportPath) {
        await Deno.writeTextFile(
          reportPath,
          JSON.stringify(
            {
              logBytes: bytes,
              ceilingBytes: RSS_CEILING,
              oldRecovery: oldRecovery.result,
              oldTail: oldTail.result,
              bounded: bounded.result,
              exitCodes: {
                oldRecovery: oldRecovery.code,
                oldTail: oldTail.code,
                bounded: bounded.code,
              },
            },
            null,
            2,
          ) + '\n',
        );
      }
    } finally {
      await Deno.remove(dir, { recursive: true });
    }
  },
});
