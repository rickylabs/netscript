import { dirname } from '@std/path';
import type { SenderLeaseEvictionEvidence, SenderLeaseRepairPort } from '../sender-lease-repair.ts';
import {
  type PidProbeState,
  type RolloutLeaseEvidence,
  SENDER_PID_DEBOUNCE_MS,
  type SenderLeaseStalenessObservation,
  type SenderOwnershipRecord,
  type ThreadWriterEvidence,
  type ThreadWriterState,
} from '../sender-ownership.ts';
import { LocalSenderOwnershipAdapter } from './local-sender-ownership-adapter.ts';

export interface LocalSenderLeaseRepairAdapterOptions {
  readonly ownership: LocalSenderOwnershipAdapter;
  readonly evidenceDirectory: string;
  readonly sessionRoot: string;
  /** Set only when activation metadata independently binds these roots to this record. */
  readonly provenanceBound?: boolean;
  readonly processAlive?: (pid: number) => boolean;
  readonly debounce?: (milliseconds: number) => Promise<void>;
  readonly readThread?: (sessionId: string) => Promise<Readonly<{ state: ThreadWriterState }>>;
}

interface RolloutFile {
  readonly path: string;
  readonly modified: number;
}

async function exactRolloutFiles(root: string, sessionId: string): Promise<RolloutFile[]> {
  const matches: RolloutFile[] = [];
  async function walk(directory: string): Promise<void> {
    for await (const entry of Deno.readDir(directory)) {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory) await walk(path);
      else if (entry.isFile && entry.name.endsWith(`-${sessionId}.jsonl`)) {
        matches.push({ path, modified: (await Deno.stat(path)).mtime?.getTime() ?? 0 });
      }
    }
  }
  await walk(root);
  return matches.sort((a, b) => b.modified - a.modified);
}

function pidProbe(probe: (pid: number) => boolean, pid: number): PidProbeState {
  try {
    return probe(pid) ? 'alive' : 'dead';
  } catch {
    return 'unknown';
  }
}

async function digest(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), (entry) => entry.toString(16).padStart(2, '0')).join('');
}

/** Local strict-evidence adapter for one exact sender lease. */
export class LocalSenderLeaseRepairAdapter implements SenderLeaseRepairPort {
  private readonly processAlive: (pid: number) => boolean;
  private readonly debounce: (milliseconds: number) => Promise<void>;
  private readonly readThread: (
    sessionId: string,
  ) => Promise<Readonly<{ state: ThreadWriterState }>>;

  constructor(private readonly options: LocalSenderLeaseRepairAdapterOptions) {
    this.processAlive = options.processAlive ?? ((pid) => options.ownership.isProcessAlive(pid));
    this.debounce = options.debounce ??
      ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
    const codexHome = dirname(options.sessionRoot);
    this.readThread = options.readThread ?? (async (sessionId) => {
      const { readCodexThreadState } = await import('../../codex/codex-thread-read.ts');
      return await readCodexThreadState(sessionId, { codexHome });
    });
  }

  private async rollout(record: SenderOwnershipRecord): Promise<RolloutLeaseEvidence> {
    try {
      const files = await exactRolloutFiles(this.options.sessionRoot, record.sessionId!);
      const exact = files[0];
      if (!exact) {
        return {
          state: 'absent',
          provenance: this.options.provenanceBound ? 'matched' : 'unknown',
        };
      }
      const content = await Deno.readTextFile(exact.path);
      const stat = await Deno.stat(exact.path);
      const { deriveCodexLiveSnapshot } = await import('../../codex/codex-rollout-live.ts');
      const snapshot = deriveCodexLiveSnapshot(
        content,
        exact.path,
        new Date(),
        5 * 60_000,
        stat.mtime ?? undefined,
      );
      const provenance = snapshot.threadId === record.sessionId && snapshot.cwd === record.worktree
        ? 'matched'
        : 'mismatched';
      return {
        state: snapshot.state,
        provenance,
        sessionId: snapshot.threadId,
        ...(snapshot.cwd ? { worktree: snapshot.cwd } : {}),
      };
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return {
          state: 'absent',
          provenance: this.options.provenanceBound ? 'matched' : 'unknown',
        };
      }
      return { state: 'unknown', provenance: 'unknown' };
    }
  }

  private async thread(
    record: SenderOwnershipRecord,
    provenanceBound: boolean,
  ): Promise<ThreadWriterEvidence> {
    try {
      const observed = await this.readThread(record.sessionId!);
      return {
        state: observed.state,
        provenance: provenanceBound ? 'matched' : 'unknown',
        sessionId: record.sessionId,
      };
    } catch {
      return { state: 'unknown', provenance: 'unknown', sessionId: record.sessionId };
    }
  }

  async observe(
    worktree: string,
    record: SenderOwnershipRecord,
  ): Promise<SenderLeaseStalenessObservation> {
    const current = await this.options.ownership.read(worktree);
    if (
      !current || current.leaseToken !== record.leaseToken || current.worktree !== record.worktree
    ) {
      throw new Error('sender lease mismatch');
    }
    const first = pidProbe(this.processAlive, record.ownerPid);
    if (first === 'alive') {
      const thread = await this.thread(record, false);
      return {
        record: current,
        pid: { first, second: 'unknown', elapsedMs: 0 },
        rollout: { state: 'unknown', provenance: 'unknown' },
        thread,
      };
    }
    const started = performance.now();
    await this.debounce(SENDER_PID_DEBOUNCE_MS);
    const second = pidProbe(this.processAlive, record.ownerPid);
    const elapsedMs = Math.max(SENDER_PID_DEBOUNCE_MS, performance.now() - started);
    const rollout = await this.rollout(record);
    const thread = await this.thread(
      record,
      this.options.provenanceBound === true || rollout.provenance === 'matched',
    );
    return { record: current, pid: { first, second, elapsedMs }, rollout, thread };
  }

  async persistEvidence(evidence: SenderLeaseEvictionEvidence): Promise<void> {
    const serialized = `${JSON.stringify(evidence, null, 2)}\n`;
    if (serialized.includes('"leaseToken"')) {
      throw new Error('sender evidence contains lease token');
    }
    await Deno.mkdir(this.options.evidenceDirectory, { recursive: true, mode: 0o700 });
    const path = `${this.options.evidenceDirectory}/sender-lease-${await digest(
      evidence.worktree,
    )}.json`;
    const temporary = `${path}.${crypto.randomUUID()}.tmp`;
    await Deno.writeTextFile(temporary, serialized, { mode: 0o600 });
    await Deno.rename(temporary, path);
  }

  evict(worktree: string, leaseToken: string): Promise<void> {
    return this.options.ownership.release(worktree, leaseToken);
  }

  now(): string {
    return new Date().toISOString();
  }
}
