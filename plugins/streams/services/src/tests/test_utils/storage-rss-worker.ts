/** Subprocess fixture so native allocations and peak RSS are measured independently. @module */
import { FileBackedStreamStore } from '@durable-streams/server';
import { createStreamsServer } from '../../bounded-file-store.ts';
import { frameOffset } from '../../bounded-segment-log.ts';

const [mode, dir, byteLength, startByte, ceiling] = Deno.args;
if (!['bounded', 'old-recovery', 'old-tail'].includes(mode)) throw new Error('Unknown RSS mode');

function peakRss(): number {
  const match = Deno.readTextFileSync('/proc/self/status').match(/^VmHWM:\s+(\d+)\s+kB$/m);
  if (!match) throw new Error('Linux VmHWM unavailable');
  return Number(match[1]) * 1024;
}

const baselineRss = peakRss();
// Exercise the production service seam, including bounded native constructor recovery.
const server = mode === 'old-recovery' ? undefined : createStreamsServer({ port: 0, dataDir: dir });
const store = server?.store ?? new FileBackedStreamStore({ dataDir: dir });
try {
  const recoveredOffset = store.getCurrentOffset('/large');
  if (recoveredOffset !== frameOffset(Number(byteLength))) {
    throw new Error(`Wrong recovered offset: ${recoveredOffset}`);
  }
  const recoveryPeakRss = peakRss();
  if (mode === 'old-tail') {
    // Negative control: call the unchanged native full-file read on the recovered
    // store without paying the old recovery allocation first.
    const hook = Object.getOwnPropertyDescriptor(
      FileBackedStreamStore.prototype,
      'readMessagesFromSegmentFile',
    )?.value;
    if (typeof hook !== 'function') throw new Error('Native read hook unavailable');
    const segment = Array.from(Deno.readDirSync(`${dir}/streams`)).find((entry) =>
      entry.name.endsWith('.log')
    );
    if (!segment) throw new Error('Synthetic log missing');
    Reflect.apply(hook, store, [`${dir}/streams/${segment.name}`, Number(startByte), 0]);
  } else {
    const tail = store.read('/large', frameOffset(Number(startByte)));
    if (
      tail.messages.length !== 1 || tail.messages[0].offset !== recoveredOffset ||
      tail.messages[0].data.length !== 1024 * 1024
    ) {
      throw new Error('Incorrect synthetic tail');
    }
    if (tail.messages[0].data[0] !== 97 || tail.messages[0].data.at(-1) !== 97) {
      throw new Error('Incorrect tail payload');
    }
    if (store.read('/large', recoveredOffset).messages.length !== 0) {
      throw new Error('Read at end is not empty');
    }
  }
  const measuredPeakRss = peakRss();
  console.log(
    `RSS_RESULT:${
      JSON.stringify({
        mode,
        baselineRss,
        recoveryPeakRss,
        peakRss: measuredPeakRss,
        ceiling: Number(ceiling),
        logBytes: Number(byteLength),
        recoveredOffset,
      })
    }`,
  );
  if (measuredPeakRss > Number(ceiling)) {
    console.error(`RSS ceiling exceeded: ${measuredPeakRss} > ${ceiling}`);
    Deno.exitCode = 1;
  }
} finally {
  if (store instanceof FileBackedStreamStore) await store.close();
}
