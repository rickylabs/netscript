/** Extract one complete JSON value from Aspire banner or trailer noise. */
export function extractAspireJson(text: string): string {
  const trimmed = text.trim();
  const positions = [trimmed.indexOf('{'), trimmed.indexOf('[')].filter((index) => index >= 0);
  if (positions.length === 0) throw new SyntaxError('no JSON object or array was emitted');
  const start = Math.min(...positions);
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  for (let index = start; index < trimmed.length; index++) {
    const character = trimmed[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') {
      inString = true;
      continue;
    }
    if (character === '{' || character === '[') stack.push(character);
    if (character === '}' || character === ']') {
      const expected = character === '}' ? '{' : '[';
      if (stack.pop() !== expected) throw new SyntaxError('JSON delimiters were mismatched');
      if (stack.length === 0) return trimmed.slice(start, index + 1);
    }
  }
  throw new SyntaxError('JSON output was incomplete');
}

/** Read a field while tolerating casing drift in machine-readable Aspire output. */
export function aspireField(record: unknown, ...names: readonly string[]): unknown {
  if (!isAspireRecord(record)) return undefined;
  const keys = Object.keys(record);
  for (const name of names) {
    const key = keys.find((candidate) => candidate.toLowerCase() === name.toLowerCase());
    if (key !== undefined) return record[key];
  }
  return undefined;
}

/** Read a non-empty string field from machine-readable Aspire output. */
export function aspireStringField(
  record: Record<string, unknown>,
  ...names: readonly string[]
): string | undefined {
  const value = aspireField(record, ...names);
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/** Read a process identity field without assuming whether the CLI encodes it as JSON text or number. */
export function aspireIdentityField(
  record: Record<string, unknown>,
  ...names: readonly string[]
): number | string | undefined {
  const value = aspireField(record, ...names);
  return typeof value === 'number' || typeof value === 'string' ? value : undefined;
}

/** Test whether an unknown Aspire JSON value is an object record. */
export function isAspireRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
