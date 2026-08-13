import {
  canonicalRequest,
  type ChildReportEvidence,
  type GateReceipt,
  type GateRequest,
  RECEIPT_SCHEMA_VERSION,
  sha256,
} from './contract.ts';
import { runProcess } from './process-runner.ts';
import { LifecycleMemoryStore, type ReceiptStore } from './receipt-store.ts';
import { isAbsolute, resolve } from '@std/path';

export interface LifecycleOptions {
  store: ReceiptStore;
  memory?: LifecycleMemoryStore<GateReceipt>;
  signal?: AbortSignal;
  childReport?: string;
  skipReason?: string;
}

interface ChildReportSnapshot extends ChildReportEvidence {
  inode?: number;
}

function childReportPath(path: string, cwd: string): string {
  return isAbsolute(path) ? path : resolve(cwd, path);
}

async function snapshotChildReport(path: string, cwd: string): Promise<ChildReportSnapshot> {
  const absolute = childReportPath(path, cwd);
  const [text, info] = await Promise.all([Deno.readTextFile(absolute), Deno.stat(absolute)]);
  JSON.parse(text);
  return {
    path,
    bytes: new TextEncoder().encode(text).length,
    sha256: await sha256(text),
    modifiedAt: info.mtime?.toISOString(),
    inode: info.ino ?? undefined,
  };
}

function sameSnapshot(
  before: ChildReportSnapshot | undefined,
  after: ChildReportSnapshot,
): boolean {
  return before !== undefined &&
    before.bytes === after.bytes &&
    before.sha256 === after.sha256 &&
    before.modifiedAt === after.modifiedAt &&
    before.inode === after.inode;
}

async function existingChildReport(
  path: string | undefined,
  cwd: string,
): Promise<ChildReportSnapshot | undefined> {
  if (!path) return undefined;
  try {
    return await snapshotChildReport(path, cwd);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return undefined;
    // A malformed prior report is still a prior file. Track enough metadata so an unchanged stale
    // file cannot become accepted merely because the child exits successfully.
    try {
      const absolute = childReportPath(path, cwd);
      const [text, info] = await Promise.all([Deno.readTextFile(absolute), Deno.stat(absolute)]);
      return {
        path,
        bytes: new TextEncoder().encode(text).length,
        sha256: await sha256(text),
        modifiedAt: info.mtime?.toISOString(),
        inode: info.ino ?? undefined,
      };
    } catch {
      return undefined;
    }
  }
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

    const priorChildReport = await existingChildReport(options.childReport, request.cwd);
    await options.store.write({ ...base, outcome: 'RUNNING', startedAt: new Date().toISOString() });
    const result = await runProcess(request.argv, {
      cwd: request.cwd,
      timeoutMs: request.timeoutMs,
      signal: options.signal,
    });
    let childReportEvidence: ChildReportEvidence | undefined;
    let childReportFailure: string | undefined;
    if (options.childReport) {
      try {
        const report = await snapshotChildReport(options.childReport, request.cwd);
        if (sameSnapshot(priorChildReport, report)) {
          childReportFailure =
            `Child report ${options.childReport} was not refreshed by this invocation`;
        } else {
          const { inode: _, ...evidence } = report;
          childReportEvidence = evidence;
        }
      } catch (error) {
        childReportFailure = error instanceof Deno.errors.NotFound
          ? `Child report ${options.childReport} was not created`
          : `Child report ${options.childReport} is not valid JSON: ${
            error instanceof Error ? error.message : String(error)
          }`;
      }
    }
    const terminal: GateReceipt = {
      ...base,
      ...result,
      childReportEvidence,
      outcome: childReportFailure && result.outcome === 'PASS' ? 'FAIL' : result.outcome,
      exitCode: childReportFailure && result.exitCode === 0 ? 1 : result.exitCode,
      reason: [result.reason, childReportFailure].filter(Boolean).join('; ') || undefined,
    };
    await options.store.write(terminal);
    return terminal;
  });
}
