/** The end of a quoted JS/CSS token, respecting escapes and template interpolation. */
export function quotedEnd(source: string, start: number): number {
  const quote = source[start];
  let i = start + 1;
  while (i < source.length) {
    if (source[i] === '\\') {
      i += 2;
      continue;
    }
    if (source[i] === quote) return i + 1;
    if (quote === '`' && source.slice(i, i + 2) === '${') {
      i = balancedEnd(source, i + 1);
      continue;
    }
    i++;
  }
  throw new Error('Unterminated quoted token');
}

/** Read a balanced expression without interpreting or executing it. */
export function balancedEnd(source: string, start: number): number {
  const close = ({ '{': '}', '(': ')', '[': ']' } as Record<string, string>)[source[start]];
  let i = start + 1;
  while (i < source.length) {
    const skipped = skipToken(source, i);
    if (skipped !== i) {
      i = skipped;
      continue;
    }
    if ('{(['.includes(source[i])) {
      i = balancedEnd(source, i);
      continue;
    }
    if (source[i] === close) return i + 1;
    i++;
  }
  throw new Error('Unterminated balanced expression');
}

/** Skip strings/comments. This intentionally does not parse arbitrary JS expressions. */
export function skipToken(source: string, start: number): number {
  if ('\'"`'.includes(source[start])) return quotedEnd(source, start);
  if (source.slice(start, start + 2) === '//') {
    const end = source.indexOf('\n', start + 2);
    return end < 0 ? source.length : end;
  }
  if (source.slice(start, start + 2) === '/*') {
    const end = source.indexOf('*/', start + 2);
    if (end < 0) throw new Error('Unterminated comment');
    return end + 2;
  }
  if (source[start] === '/') {
    const prefix = source.slice(0, start).trimEnd();
    if (!prefix || /[=(:,[!&|?;{}]$/.test(prefix) || /(?:return|throw|case|=>)$/.test(prefix)) {
      let i = start + 1;
      let characterClass = false;
      while (i < source.length) {
        if (source[i] === '\\') {
          i += 2;
          continue;
        }
        if (source[i] === '[') characterClass = true;
        if (source[i] === ']') characterClass = false;
        if (source[i] === '/' && !characterClass) {
          i++;
          while (/[a-z]/i.test(source[i] ?? '')) i++;
          return i;
        }
        if (source[i] === '\n') throw new Error('Unsupported unterminated regular expression');
        i++;
      }
      throw new Error('Unsupported unterminated regular expression');
    }
  }
  return start;
}

/** Opening JSX tags with exact byte ranges; text and JS strings are never searched as markup. */
export function openingTags(source: string): readonly { start: number; end: number }[] {
  const tags: { start: number; end: number }[] = [];
  function code(start: number, stopAtBrace = false): number {
    let i = start;
    while (i < source.length) {
      const skipped = skipToken(source, i);
      if (skipped !== i) {
        i = skipped;
        continue;
      }
      if (source[i] === '}' && stopAtBrace) return i + 1;
      if (source[i] === '{') {
        i = code(i + 1, true);
        continue;
      }
      if (source[i] === '<' && /[A-Za-z>]/.test(source[i + 1] ?? '')) {
        const end = tagEnd(i);
        const name = /^<([\w.:-]+)/.exec(source.slice(i, end))?.[1] ?? '';
        // An unadorned TypeScript generic is not an opening JSX tag.
        if (source[end - 2] === '/' || name === '' || source.includes(`</${name}`, end)) {
          tags.push({ start: i, end });
          i = source[end - 2] === '/' ? end : children(end);
          continue;
        }
      }
      i++;
    }
    return i;
  }
  function tagEnd(start: number): number {
    let i = start + 1;
    while (i < source.length) {
      if (source[i] === '"' || source[i] === "'") {
        i = quotedEnd(source, i);
        continue;
      }
      if (source[i] === '{') {
        i = balancedEnd(source, i);
        continue;
      }
      if (source[i] === '>') return i + 1;
      i++;
    }
    throw new Error('Unterminated JSX tag');
  }
  function children(start: number): number {
    let i = start;
    while (i < source.length) {
      if (source[i] === '{') {
        i = code(i + 1, true);
        continue;
      }
      if (source.slice(i, i + 2) === '</') return tagEnd(i);
      if (source[i] === '<' && /[A-Za-z>]/.test(source[i + 1] ?? '')) {
        const end = tagEnd(i);
        tags.push({ start: i, end });
        i = source[end - 2] === '/' ? end : children(end);
        continue;
      }
      i++;
    }
    return i;
  }
  code(0);
  return tags;
}
