/**
 * Report malformed ADO.NET key=value syntax without exposing credentials.
 *
 * @example
 * ```ts
 * import { AdoNetConnectionStringSyntaxError } from '@netscript/database/adapters/mssql';
 * const error = new AdoNetConnectionStringSyntaxError();
 * console.log(error.name);
 * ```
 */
export class AdoNetConnectionStringSyntaxError extends Error {
  /** Construct a syntax failure without including the connection string. */
  constructor() {
    super('Invalid ADO.NET connection string syntax.');
    this.name = 'AdoNetConnectionStringSyntaxError';
  }
}

/** Tokenize semicolon-separated key=value pairs, preserving quoted delimiters. */
export function* tokenizeAdoNetConnectionString(
  input: string,
): Generator<{ key: string; value: string }> {
  let index = 0;
  while (index < input.length) {
    while (index < input.length && (input[index] === ';' || /\s/.test(input[index]))) index++;
    if (index === input.length) return;

    const keyStart = index;
    while (index < input.length && input[index] !== '=' && input[index] !== ';') index++;
    const key = input.slice(keyStart, index).trim().toLowerCase();
    if (!key || input[index] !== '=') throw new AdoNetConnectionStringSyntaxError();
    index++;
    while (index < input.length && /\s/.test(input[index])) index++;

    let value: string;
    const quote = input[index];
    if (quote === '"' || quote === "'") {
      index++;
      value = '';
      let closed = false;
      while (index < input.length) {
        const char = input[index++];
        if (char !== quote) {
          value += char;
        } else if (input[index] === quote) {
          value += quote;
          index++;
        } else {
          closed = true;
          break;
        }
      }
      if (!closed) throw new AdoNetConnectionStringSyntaxError();
      while (index < input.length && /\s/.test(input[index])) index++;
      if (index < input.length && input[index] !== ';') {
        throw new AdoNetConnectionStringSyntaxError();
      }
    } else {
      const valueStart = index;
      while (index < input.length && input[index] !== ';') index++;
      value = input.slice(valueStart, index).trim();
    }

    yield { key, value };
  }
}
