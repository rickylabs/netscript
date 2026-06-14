/**
 * Forward-declared service transport contracts.
 *
 * @module
 */

/**
 * Transport abstraction reserved for future in-process vs HTTP client modes.
 */
export interface ServiceTransport {
  /** Transport mode identifier. */
  readonly mode: 'http' | 'in-process';
  /**
   * Invoke a named procedure over the transport.
   *
   * @param procedureName - Procedure identifier.
   * @param input - Procedure input payload.
   * @param context - Optional transport-specific context.
   * @returns Procedure output payload.
   */
  invoke<TInput, TOutput>(
    procedureName: string,
    input: TInput,
    context?: Record<string, unknown>,
  ): Promise<TOutput>;
}
