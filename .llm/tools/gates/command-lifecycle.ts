import {
  canonicalRequest,
  type GateReceipt,
  type GateRequest,
  RECEIPT_SCHEMA_VERSION,
  sha256,
} from './contract.ts';
import { runProcess } from './process-runner.ts';
import { LifecycleMemoryStore, type ReceiptStore } from './receipt-store.ts';

export interface LifecycleOptions {
  store: ReceiptStore;
  memory?: LifecycleMemoryStore<GateReceipt>;
  signal?: AbortSignal;
  childReport?: string;
  skipReason?: string;
}

export async function executeGate(
  request: GateRequest,
  options: LifecycleOptions,
): Promise<GateReceipt> {
  const requestHash = await sha256(canonicalRequest(request));
  const memory = options.memory ?? new LifecycleMemoryStore<GateReceipt>();
  return await memory.run(request.invocationId, requestHash, async () => {
    const claimedAt = new Date().toISOString();
    const base: GateReceipt = {
      ...request,
      schemaVersion: RECEIPT_SCHEMA_VERSION,
      requestHash,
      lifecycleId: `${request.runnerIdentity}:${request.invocationId}:${request.attempt}`,
      outcome: 'CLAIMED',
      claimedAt,
      childReport: options.childReport,
    };
    await options.store.write(base);

    if (options.skipReason) {
      const skipped: GateReceipt = {
        ...base,
        outcome: 'SKIPPED',
        finishedAt: new Date().toISOString(),
        durationMs: 0,
        reason: options.skipReason,
      };
      await options.store.write(skipped);
      return skipped;
    }

    await options.store.write({ ...base, outcome: 'RUNNING', startedAt: new Date().toISOString() });
    const result = await runProcess(request.argv, {
      cwd: request.cwd,
      timeoutMs: request.timeoutMs,
      signal: options.signal,
    });
    const terminal: GateReceipt = { ...base, ...result };
    await options.store.write(terminal);
    return terminal;
  });
}
