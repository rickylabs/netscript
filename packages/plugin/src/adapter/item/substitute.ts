/**
 * Type-checked source stub with declared named tokens.
 *
 * @typeParam TToken Token names accepted by the stub.
 *
 * @example
 * ```ts
 * const stub = defineStub({
 *   source: 'export const %%NAME%% = "%%VALUE%%";',
 *   tokens: ['NAME', 'VALUE'] as const,
 * });
 * ```
 */
export interface StubSource<TToken extends string> {
  /** Source text containing `%%TOKEN%%` markers. */
  readonly source: string;
  /** Declared token names that callers must provide. */
  readonly tokens: readonly TToken[];
}

/**
 * Token values required by a declared stub source.
 *
 * @typeParam TStub Stub whose token list drives the required keys.
 *
 * @example
 * ```ts
 * const stub = defineStub({ source: '%%NAME%%', tokens: ['NAME'] as const });
 * const values: TokenValues<typeof stub> = { NAME: 'worker' };
 * ```
 */
export type TokenValues<TStub extends StubSource<string>> = {
  readonly [K in TStub['tokens'][number]]: string;
};

/**
 * Declare a type-checked source stub.
 *
 * @param stub Stub source and token declarations.
 * @returns The same stub with literal token names preserved.
 *
 * @example
 * ```ts
 * const stub = defineStub({ source: 'const name = "%%NAME%%";', tokens: ['NAME'] as const });
 * console.log(stub.tokens);
 * ```
 */
export function defineStub<const TToken extends string>(
  stub: StubSource<TToken>,
): StubSource<TToken> {
  return stub;
}

/**
 * Substitute named `%%TOKEN%%` markers in a declared source stub.
 *
 * @param stub Type-checked source stub.
 * @param values Replacement values keyed by the stub's declared tokens.
 * @returns Source text with all declared token markers substituted.
 *
 * @example
 * ```ts
 * const stub = defineStub({ source: 'export const %%NAME%% = 1;', tokens: ['NAME'] as const });
 * const source = substituteTokens(stub, { NAME: 'count' });
 * console.log(source);
 * ```
 */
export function substituteTokens<const TStub extends StubSource<string>>(
  stub: TStub,
  values: TokenValues<TStub>,
): string {
  const tokenValues: Readonly<Record<string, string>> = values;
  let output = '';
  let cursor = 0;

  while (cursor < stub.source.length) {
    const start = stub.source.indexOf('%%', cursor);
    if (start < 0) {
      output += stub.source.slice(cursor);
      break;
    }

    const end = stub.source.indexOf('%%', start + 2);
    if (end < 0) {
      output += stub.source.slice(cursor);
      break;
    }

    const token = stub.source.slice(start + 2, end);
    output += stub.source.slice(cursor, start);
    output += tokenValues[token] ?? stub.source.slice(start, end + 2);
    cursor = end + 2;
  }

  return output;
}
