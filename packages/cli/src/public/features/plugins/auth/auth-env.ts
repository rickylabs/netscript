/** POSIX literal assignments for the auth environment seam. @module */

interface Assignment {
  readonly key?: string;
  readonly text: string;
}

function hasOpenQuote(text: string): boolean {
  let quote = '';
  let escaped = false;
  for (const character of text) {
    if (quote === "'") {
      if (character === "'") quote = '';
    } else if (escaped) {
      escaped = false;
    } else if (character === '\\') {
      escaped = true;
    } else if (quote === '"') {
      if (character === '"') quote = '';
    } else if (character === "'" || character === '"') {
      quote = character;
    }
  }
  return quote !== '';
}

function assignments(content: string): Assignment[] {
  const lines = content.split('\n');
  if (lines.at(-1) === '') lines.pop();
  const result: Assignment[] = [];
  for (let index = 0; index < lines.length; index++) {
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(lines[index]);
    let text = lines[index];
    if (match && /^["']/.test(match[2])) {
      while (hasOpenQuote(text.slice(text.indexOf('=') + 1)) && index + 1 < lines.length) {
        text += `\n${lines[++index]}`;
      }
      if (hasOpenQuote(text.slice(text.indexOf('=') + 1))) {
        throw new TypeError('Auth environment contains an unterminated quoted assignment.');
      }
    }
    result.push({ key: match?.[1], text });
  }
  return result;
}

function literal(value: string): string {
  if (value.includes('\0')) throw new TypeError('Auth environment values cannot contain NUL.');
  return `'${value.replaceAll("'", "'\\''")}'`;
}

/** Replace all occurrences of reconciled keys while preserving unrelated entries. */
export function reconcileAuthEnv(
  current: string,
  values: Readonly<Record<string, string>>,
): string {
  const pending = new Map(
    Object.entries(values).map(([key, value]) => [key, `${key}=${literal(value)}`]),
  );
  const updatedKeys = new Set(pending.keys());
  const lines: string[] = [];
  for (const entry of assignments(current)) {
    if (!entry.key || !updatedKeys.has(entry.key)) {
      lines.push(entry.text);
    } else if (pending.has(entry.key)) {
      lines.push(pending.get(entry.key)!);
      pending.delete(entry.key);
    }
  }
  lines.push(...pending.values());
  return `${lines.join('\n')}\n`;
}

/** Read the finite backend selector without executing environment content. */
export function readAuthEnvBackend(content: string): string | undefined {
  const entry = assignments(content).findLast((entry) => entry.key === 'NETSCRIPT_AUTH_BACKEND');
  if (!entry) return undefined;
  const value = entry.text.slice(entry.text.indexOf('=') + 1).trim();
  return /^(['"]).*\1$/s.test(value) ? value.slice(1, -1) : value;
}
