/**
 * Type definitions for the MySQL adapter.
 */

/**
 * MySQL connection configuration options.
 */
export interface MySqlConnectionConfig {
  /** MySQL server hostname */
  hostname?: string;
  /** MySQL server port (default: 3306) */
  port?: number;
  /** Database username */
  username?: string;
  /** Database password */
  password?: string;
  /** Database name */
  db?: string;
  /** Connection pool size (default: 1) */
  poolSize?: number;
  /** Connection timeout in milliseconds */
  timeout?: number;
  /** TLS configuration */
  tls?: {
    /**
     * Legacy TLS selector.
     *
     * `verify_identity` is deprecated because its name does not match its behavior. Without
     * non-empty `caCerts`, `ssl` is left unset and the connection is plaintext. With non-empty
     * `caCerts`, only the joined `ssl.ca` value is forwarded; mysql2 hostname identity verification
     * is not enabled. Runtime behavior is unchanged for compatibility.
     *
     * @deprecated Do not select `verify_identity`; changing or removing its legacy behavior requires
     * a separately scoped breaking change.
     */
    mode?: 'disabled' | 'verify_identity';
    /** CA certificates forwarded only for the deprecated `verify_identity` legacy branch. */
    caCerts?: string[];
  };
}

/**
 * Adapter options for PrismaMySql.
 */
export interface PrismaMySqlOptions {
  /** Database schema name */
  database?: string;
  /**
   * Observes driver errors that `isConnectionError` classifies as connection failures: fatal
   * handshake/transport errors, server-capacity errors 1040/1203, and the adapter's closed set of
   * transport/pool codes. Authentication, access, and missing-database errors 1045/1044/1049 fire
   * only when driver-fatal; callback failure is contained and never replaces the primary error.
   */
  onConnectionError?: (err: Error) => void;
}

/**
 * Capabilities of the connected MySQL server.
 */
export interface MySqlCapabilities {
  /** Whether the server supports relation joins (MySQL 8.0.13+) */
  supportsRelationJoins: boolean;
}
