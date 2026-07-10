import {
  SENDER_OWNERSHIP_SCHEMA_VERSION,
  SENDER_OWNERSHIP_STATES,
  type SenderOwnershipRecord,
} from '../sender-ownership.ts';

/** Durable local store whose create operation is atomic across rival launchers. */
export class LocalSenderOwnershipAdapter {
  constructor(private readonly directory: string) {}

  async pathFor(worktree: string): Promise<string> {
    const bytes = new TextEncoder().encode(worktree);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const key = Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0'))
      .join('');
    return `${this.directory}/${key}.json`;
  }

  async read(worktree: string): Promise<SenderOwnershipRecord | null> {
    try {
      const value = JSON.parse(await Deno.readTextFile(await this.pathFor(worktree)));
      return parseSenderOwnershipRecord(value);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) return null;
      throw error;
    }
  }

  async create(record: SenderOwnershipRecord): Promise<boolean> {
    await Deno.mkdir(this.directory, { recursive: true, mode: 0o700 });
    try {
      const file = await Deno.open(await this.pathFor(record.worktree), {
        createNew: true,
        write: true,
        mode: 0o600,
      });
      try {
        await file.write(new TextEncoder().encode(`${JSON.stringify(record)}\n`));
      } finally {
        file.close();
      }
      return true;
    } catch (error) {
      if (error instanceof Deno.errors.AlreadyExists) return false;
      throw error;
    }
  }

  async replace(record: SenderOwnershipRecord, leaseToken: string): Promise<void> {
    const current = await this.read(record.worktree);
    if (!current || current.leaseToken !== leaseToken) throw new Error('sender lease mismatch');
    const path = await this.pathFor(record.worktree);
    const temporary = `${path}.${crypto.randomUUID()}.tmp`;
    await Deno.writeTextFile(temporary, `${JSON.stringify(record)}\n`, { mode: 0o600 });
    await Deno.rename(temporary, path);
  }

  async release(worktree: string, leaseToken: string): Promise<void> {
    const current = await this.read(worktree);
    if (!current || current.leaseToken !== leaseToken) throw new Error('sender lease mismatch');
    await Deno.remove(await this.pathFor(worktree));
  }
}

/** Strictly parses sender records and rejects payload creep that could leak prompt data. */
export function parseSenderOwnershipRecord(value: unknown): SenderOwnershipRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('sender record invalid');
  }
  const entry = value as Record<string, unknown>;
  const allowed = new Set([
    'schemaVersion',
    'worktree',
    'ownerPid',
    'leaseToken',
    'state',
    'acquiredAt',
    'updatedAt',
    'sessionId',
  ]);
  if (Object.keys(entry).some((key) => !allowed.has(key))) {
    throw new Error('sender record contains unknown field');
  }
  if (
    entry.schemaVersion !== SENDER_OWNERSHIP_SCHEMA_VERSION ||
    typeof entry.worktree !== 'string' || !entry.worktree.startsWith('/') ||
    typeof entry.ownerPid !== 'number' || !Number.isSafeInteger(entry.ownerPid) ||
    entry.ownerPid <= 0 ||
    typeof entry.leaseToken !== 'string' || !entry.leaseToken ||
    !SENDER_OWNERSHIP_STATES.includes(entry.state as never) ||
    typeof entry.acquiredAt !== 'string' || typeof entry.updatedAt !== 'string' ||
    (entry.sessionId !== undefined && typeof entry.sessionId !== 'string')
  ) throw new Error('sender record invalid');
  return entry as unknown as SenderOwnershipRecord;
}
