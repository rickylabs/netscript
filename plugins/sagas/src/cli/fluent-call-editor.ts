/** Fluent builder call update anchored to one constructor function. */
export type FluentCallUpdate = Readonly<{
  anchor: string;
  method: string;
  argument: string;
}>;

/** Insert or replace one fluent builder call without touching strings or comments. */
export function upsertFluentCall(source: string, update: FluentCallUpdate): string {
  const masked = maskNonCode(source);
  const anchor = findCallStart(masked, update.anchor, 0);
  if (anchor < 0) throw new Error(`Could not find ${update.anchor}(...) builder call.`);
  const build = findMethodCall(masked, 'build', anchor);
  if (!build) throw new Error(`Could not find .build() after ${update.anchor}(...).`);
  const existing = findMethodCall(masked, update.method, anchor, build.start);
  const replacement = `.${update.method}(${update.argument})`;
  if (existing) return source.slice(0, existing.start) + replacement + source.slice(existing.end);
  return source.slice(0, build.start) + `${replacement}\n  ` + source.slice(build.start);
}

type CallSpan = Readonly<{ start: number; end: number }>;

function findCallStart(masked: string, name: string, from: number): number {
  const pattern = new RegExp(`\\b${escapeRegExp(name)}\\s*\\(`, 'g');
  pattern.lastIndex = from;
  return pattern.exec(masked)?.index ?? -1;
}

function findMethodCall(
  masked: string,
  method: string,
  from: number,
  before = masked.length,
): CallSpan | undefined {
  const pattern = new RegExp(`\\.\\s*${escapeRegExp(method)}\\s*\\(`, 'g');
  pattern.lastIndex = from;
  const match = pattern.exec(masked);
  if (!match || match.index >= before) return undefined;
  const open = masked.indexOf('(', match.index);
  const close = matchingParen(masked, open);
  if (close < 0 || close >= before) throw new Error(`Unbalanced .${method}(...) builder call.`);
  return { start: match.index, end: close + 1 };
}

function matchingParen(masked: string, open: number): number {
  let depth = 0;
  for (let index = open; index < masked.length; index++) {
    if (masked[index] === '(') depth++;
    else if (masked[index] === ')' && --depth === 0) return index;
  }
  return -1;
}

function maskNonCode(source: string): string {
  const output = [...source];
  let state: 'code' | 'single' | 'double' | 'template' | 'line' | 'block' = 'code';
  for (let index = 0; index < output.length; index++) {
    const char = source[index];
    const next = source[index + 1];
    if (state === 'code') {
      if (char === '/' && next === '/') {
        output[index] = output[index + 1] = ' ';
        index++;
        state = 'line';
      } else if (char === '/' && next === '*') {
        output[index] = output[index + 1] = ' ';
        index++;
        state = 'block';
      } else if (char === "'") {
        output[index] = ' ';
        state = 'single';
      } else if (char === '"') {
        output[index] = ' ';
        state = 'double';
      } else if (char === '`') {
        output[index] = ' ';
        state = 'template';
      }
      continue;
    }
    if (char !== '\n' && char !== '\r') output[index] = ' ';
    if (state === 'line' && (char === '\n' || char === '\r')) state = 'code';
    else if (state === 'block' && char === '*' && next === '/') {
      output[index + 1] = ' ';
      index++;
      state = 'code';
    } else if (
      (state === 'single' && char === "'") || (state === 'double' && char === '"') ||
      (state === 'template' && char === '`')
    ) {
      if (!isEscaped(source, index)) state = 'code';
    }
  }
  return output.join('');
}

function isEscaped(source: string, index: number): boolean {
  let slashes = 0;
  for (let cursor = index - 1; cursor >= 0 && source[cursor] === '\\'; cursor--) slashes++;
  return slashes % 2 === 1;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
