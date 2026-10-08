/**
 * Raw-query subset of the consumer's generated PostgreSQL transaction client.
 * All SQL uses fixed identifiers from the reviewed command migration and bound values.
 */
export interface PostgresCommandClient {
  /** Execute parameterized SQL on this transaction, never on the root client. */
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
  /** Execute parameterized SQL and return affected rows. */
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number>;
}
