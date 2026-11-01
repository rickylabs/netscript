/** Default completed-record window shared by command outbox and saga replay retention. */
export const COMMAND_RETENTION_DEFAULT_DAYS = 7 as const;
/** Maximum primary-key rows examined per family by one retention page. */
export const COMMAND_RETENTION_MAX_PAGE_SIZE = 100 as const;

/** One bounded scan over the outbox primary key, with an explicit clock. */
export type CommandOutboxRetentionRequest = Readonly<{
  /** Detached current instant. */
  now: Date;
  /** Positive finite terminal window, default seven days. */
  completedRetentionDays?: number;
  /** Maximum rows examined and deleted, from 1 to 100. */
  limit: number;
  /** Resume after this ID; omit to begin a new sweep. */
  afterId?: string;
}>;

/** Progress of one bounded outbox scan; carry the cursor to the next invocation. */
export type CommandOutboxRetentionResult = Readonly<{
  /** Rows examined, including retained rows. */
  scanned: number;
  /** Settled, unleased rows actually deleted. */
  deleted: number;
  /** Next page; absence finishes the sweep. Start a later sweep without a cursor. */
  nextAfterId?: string;
}>;

/** Optional retention seam independent of the relay claim/settlement contract. */
export interface CommandOutboxRetentionStore {
  /** Prune only expired published/terminal rows, rechecking state and leases at deletion. */
  pruneSettled(
    request: CommandOutboxRetentionRequest,
    signal?: AbortSignal,
  ): Promise<CommandOutboxRetentionResult>;
}
