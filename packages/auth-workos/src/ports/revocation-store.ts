/** Durable subject fence and upstream revocation work item. */
export interface WorkosRevocationJob {
  /** Unique identity of this global logout. */
  readonly id: string;
  /** WorkOS user whose sessions are being ended. */
  readonly subject: string;
  /** Inclusive cutoff for session creation. */
  readonly revokedAt: string;
  /** Cursor of the next upstream page. */
  readonly after?: string;
  /** Failed deliveries of the current page. */
  readonly attempt: number;
  /** Earliest delivery time in epoch milliseconds. */
  readonly dueAt: number;
}

/** Optimistic version used to checkpoint one durable delivery. */
export interface WorkosRevocationDelivery {
  /** Persisted work item. */
  readonly job: WorkosRevocationJob;
  /** Storage version observed by the consumer. */
  readonly versionstamp: string | null;
}

/** Storage seam shared by authentication, logout, and the background worker. */
export interface WorkosRevocationStore {
  /** Atomically persist a monotonic subject fence and a durable pending job. */
  revokeSubject(subject: string, revokedAt: string): Promise<WorkosRevocationJob>;
  /**
   * Refuse old credentials, or every credential while upstream cleanup is pending/failed.
   * Per-session tombstones also refuse access tokens rotated after the subject cutoff.
   */
  isRevoked(
    subject: string,
    sessionId: string | undefined,
    issuedAt: number | undefined,
  ): Promise<boolean>;
  /** Return at most one due job; never enumerate all jobs. */
  nextDelivery(now: number): Promise<WorkosRevocationDelivery | undefined>;
  /** Persist a permanent tombstone before ending a session upstream. */
  revokeSession(subject: string, sessionId: string): Promise<void>;
  /** CAS checkpoint/retry, or finish this job without clearing a newer subject fence. */
  checkpoint(delivery: WorkosRevocationDelivery, next?: WorkosRevocationJob): Promise<boolean>;
  /** Retain terminal failure evidence; authentication stays fenced until an operator retries. */
  fail(delivery: WorkosRevocationDelivery, reason: string): Promise<boolean>;
}

/** Minimal official WorkOS SDK boundary needed by the revocation worker. */
export interface WorkosRevocationClient {
  /** WorkOS service-identity operations, never caller credentials. */
  readonly userManagement: {
    /** Fetch exactly one bounded page (do not use SDK autoPagination). */
    listSessions(
      subject: string,
      options: { limit: number; after?: string; order: 'asc' },
    ): Promise<{
      readonly data: readonly {
        readonly id: string;
        readonly userId: string;
        readonly createdAt: string;
      }[];
      readonly listMetadata: { readonly after?: string | null };
    }>;
    /** End one upstream session; duplicate delivery must be safe. */
    revokeSession(input: { sessionId: string }): Promise<unknown>;
  };
}
