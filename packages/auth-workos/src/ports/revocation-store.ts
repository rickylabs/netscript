/** Retention policy for credentials issued before upstream revocation completed. */
export interface WorkosRevocationRetention {
  /** Longest access-token lifetime configured in WorkOS, in milliseconds. Defaults to one day. */
  readonly maxAccessTokenLifetimeMs?: number;
  /** Allowed provider/local clock difference, in milliseconds. Defaults to one minute. */
  readonly clockSkewMs?: number;
  /** Local clock used for tombstone expiry. */
  readonly now?: () => number;
}

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
  /** Continuation marker for bounded retention repair after upstream cleanup; not a key cursor. */
  readonly tombstoneAfter?: string;
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
  /** Shared provider/local clock margin for paging and tombstone retention. */
  readonly clockSkewMs: number;
  /** Atomically persist a monotonic subject fence and a durable pending job. */
  revokeSubject(subject: string, revokedAt: string): Promise<WorkosRevocationJob>;
  /**
   * Refuse old credentials, or every credential while upstream cleanup is pending.
   * Per-session tombstones also refuse access tokens rotated after the subject cutoff.
   * Authenticators supply token expiry; missing/overlong expiry fails closed against retention.
   */
  isRevoked(
    subject: string,
    sessionId: string | undefined,
    issuedAt: number | undefined,
    expiresAt?: number,
  ): Promise<boolean>;
  /** Return one due job from a bounded due-only window, independent of list order. */
  nextDelivery(now: number): Promise<WorkosRevocationDelivery | undefined>;
  /** Persist a tombstone without expiry before ending a session upstream. */
  revokeSession(subject: string, sessionId: string, jobId: string): Promise<void>;
  /** Start bounded retention only after upstream revocation succeeds. */
  confirmSessionRevoked(subject: string, sessionId: string, jobId: string): Promise<void>;
  /** CAS checkpoint/retry, or finish this job without clearing a newer subject fence. */
  checkpoint(delivery: WorkosRevocationDelivery, next?: WorkosRevocationJob): Promise<boolean>;
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
