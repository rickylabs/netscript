/// <reference lib="webworker" />
/**
 * P2 Web Worker body: runs the MINSTD loop in this isolate and posts the result.
 * Message in: { n: number, seed: number } — message out: { acc: number, ms: number }.
 */
function runLcg(n: number, seed: number): number {
  let state = seed;
  let acc = 0;
  for (let i = 0; i < n; i++) {
    state = (state * 48271) % 2147483647;
    acc = (acc + state) % 1000000007;
  }
  return acc;
}

self.onmessage = (e: MessageEvent<{ n: number; seed: number }>) => {
  const t0 = performance.now();
  const acc = runLcg(e.data.n, e.data.seed);
  (self as unknown as Worker).postMessage({ acc, ms: performance.now() - t0 });
};
