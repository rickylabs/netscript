/**
 * Dispatch-equivalent path-pattern parsing and symmetric intersection checking for stream
 * endpoint overlap detection against Hono routes (`:param`, `:param{regex}`, `:param?`, `*`),
 * OpenAPI templates (`{param}`), and `rou3` patterns (`**`, `**:name`).
 *
 * @module
 */

import { normalizePath } from './contract-path.ts';

const OPENAPI_PARAM_SEGMENT_PATTERN = /^\{([A-Za-z_][A-Za-z0-9_]*)\}$/;

/** Parsed segment of a route template used for symmetric pattern-intersection checking. */
export type NormalizedPatternSegment =
  | { readonly kind: 'static'; readonly value: string }
  | { readonly kind: 'param' }
  | {
    readonly kind: 'regex-param';
    readonly regex: RegExp;
    readonly source: string;
    readonly canSpanSlash: boolean;
  }
  | {
    readonly kind: 'optional-param';
    readonly regex?: RegExp;
    readonly source?: string;
    readonly canSpanSlash?: boolean;
  }
  | { readonly kind: 'wildcard' };

/** Joins an API mount prefix (`/api`) with a relative `rou3` pattern (`/streams/:id`). */
export function joinMountPattern(mountPrefix: string, relativePattern: string): string {
  const cleanMount = mountPrefix.replace(/\/+$/, '');
  const cleanRel = relativePattern.startsWith('/') ? relativePattern : `/${relativePattern}`;
  if (cleanMount.length === 0 || cleanMount === '/') return normalizePath(cleanRel);
  if (cleanRel === '/') return cleanMount;
  return `${cleanMount}${cleanRel}`;
}

/**
 * Splits a routing pattern into segments without splitting on `/` inside balanced `{...}`
 * Hono regex constraint blocks (e.g., `/api/:sub{streams/projects}/:id{[0-9]{1,3}}`).
 * Returns `null` if braces are unbalanced (caller fails closed as wildcard).
 */
function splitRoutingSegments(pattern: string): readonly string[] | null {
  const withLeading = pattern.startsWith('/') ? pattern : `/${pattern}`;
  let trimmed = withLeading;
  while (trimmed.length > 1 && trimmed.endsWith('/')) {
    trimmed = trimmed.slice(0, -1);
  }
  if (trimmed === '/') return [];

  const segments: string[] = [];
  let current = '';
  let braceDepth = 0;
  let inCharClass = false;
  let escaped = false;

  for (let i = 1; i < trimmed.length; i += 1) {
    const ch = trimmed[i]!;
    if (braceDepth > 0) {
      current += ch;
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (inCharClass) {
        if (ch === ']') inCharClass = false;
        continue;
      }
      if (ch === '[') {
        inCharClass = true;
      } else if (ch === '{') {
        braceDepth += 1;
      } else if (ch === '}') {
        braceDepth -= 1;
      }
      continue;
    }

    if (ch === '/') {
      if (current.length > 0) {
        segments.push(current);
        current = '';
      }
      continue;
    }

    if (ch === '{' && current.startsWith(':')) {
      braceDepth = 1;
      current += ch;
      continue;
    }

    current += ch;
  }

  if (braceDepth !== 0 || inCharClass || escaped) return null;
  if (current.length > 0) segments.push(current);
  return segments;
}

/**
 * Conservatively reports whether a Hono parameter regex `source` may match a string containing `/`.
 * Returns `false` ONLY when every atom and character class in `source` is provably incapable of
 * matching `/` (`0x2f`), failing closed (`true`) on `.`, `/`, `\D`, `\W`, `\S`, `\p`, `\P`,
 * hex/unicode/octal escapes, ranges spanning `0x2f`, or unclosed classes.
 */
export function regexSourceCanMatchSlash(source: string): boolean {
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i]!;
    if (ch === '\\') {
      const next = source[i + 1];
      if (next === undefined) return true;
      i += 1;
      if (
        next === '/' ||
        next === 'D' ||
        next === 'W' ||
        next === 'S' ||
        next === 'p' ||
        next === 'P' ||
        next === 'x' ||
        next === 'u' ||
        next === 'c' ||
        (next >= '0' && next <= '7')
      ) {
        return true;
      }
      continue;
    }
    if (ch === '.' || ch === '/') return true;
    if (ch === '[') {
      const classResult = analyzeCharClassSlash(source, i);
      if (classResult.canMatchSlash) return true;
      i = classResult.endIndex;
    }
  }
  return false;
}

function analyzeCharClassSlash(
  source: string,
  openIndex: number,
): { readonly canMatchSlash: boolean; readonly endIndex: number } {
  let i = openIndex + 1;
  if (i >= source.length) return { canMatchSlash: true, endIndex: source.length };
  const negated = source[i] === '^';
  if (negated) i += 1;

  let slashExplicitlyMatched = false;
  let slashUncertain = false;
  let prevCharCode: number | null = null;
  let expectRangeEnd = false;
  let isFirstMember = true;

  while (i < source.length) {
    const ch = source[i]!;
    if (ch === ']' && !isFirstMember) {
      if (negated) {
        // Negated class [^...] cannot match '/' ONLY when '/' is provably listed inside it.
        return { canMatchSlash: !slashExplicitlyMatched, endIndex: i };
      }
      return { canMatchSlash: slashExplicitlyMatched || slashUncertain, endIndex: i };
    }
    isFirstMember = false;

    if (ch === '-' && !expectRangeEnd && prevCharCode !== null && source[i + 1] !== ']') {
      expectRangeEnd = true;
      i += 1;
      continue;
    }

    let currentCode: number | null = null;
    if (ch === '\\') {
      const next = source[i + 1];
      if (next === undefined) return { canMatchSlash: true, endIndex: source.length };
      i += 2;
      if (next === '/') {
        currentCode = 0x2f;
        slashExplicitlyMatched = true;
      } else if (next === 'D' || next === 'W' || next === 'S') {
        slashExplicitlyMatched = true;
        prevCharCode = null;
        expectRangeEnd = false;
        continue;
      } else if (
        next === 'd' || next === 'w' || next === 's' || next === 'b'
      ) {
        prevCharCode = null;
        expectRangeEnd = false;
        continue;
      } else if (
        next === 'p' || next === 'P' || next === 'x' || next === 'u' || next === 'c' ||
        (next >= '0' && next <= '7')
      ) {
        slashUncertain = true;
        prevCharCode = null;
        expectRangeEnd = false;
        continue;
      } else {
        currentCode = next.charCodeAt(0);
      }
    } else {
      currentCode = ch.charCodeAt(0);
      i += 1;
    }

    if (currentCode === 0x2f) {
      slashExplicitlyMatched = true;
    }
    if (expectRangeEnd) {
      if (prevCharCode !== null && currentCode !== null) {
        const low = Math.min(prevCharCode, currentCode);
        const high = Math.max(prevCharCode, currentCode);
        if (low <= 0x2f && 0x2f <= high) {
          slashExplicitlyMatched = true;
        }
      } else {
        slashUncertain = true;
      }
      prevCharCode = null;
      expectRangeEnd = false;
    } else {
      prevCharCode = currentCode;
    }
  }

  return { canMatchSlash: true, endIndex: source.length };
}

function parseHonoParamSegment(segment: string): NormalizedPatternSegment | null {
  if (!segment.startsWith(':')) return null;
  const optional = segment.endsWith('?');
  const body = optional ? segment.slice(0, -1) : segment;
  if (body.length < 2) return null;

  const braceStart = body.indexOf('{');
  if (braceStart === -1) {
    if (body.includes('}') || body.includes('*')) return null;
    return optional ? { kind: 'optional-param' } : { kind: 'param' };
  }

  if (braceStart === 1 || !body.endsWith('}')) return null;
  const source = body.slice(braceStart + 1, -1);
  let regex: RegExp;
  try {
    regex = new RegExp(`^(?:${source})$`);
  } catch {
    return { kind: 'wildcard' };
  }
  const canSpanSlash = regexSourceCanMatchSlash(source);
  if (optional) {
    return { kind: 'optional-param', regex, source, canSpanSlash };
  }
  return { kind: 'regex-param', regex, source, canSpanSlash };
}

/** Parses OpenAPI (`{param}`), Hono (`:param`, `:param{re}`, `:param?`, `*`), or `rou3` (`**`) patterns. */
export function parsePathPatternSegments(pattern: string): readonly NormalizedPatternSegment[] {
  const rawSegments = splitRoutingSegments(pattern);
  if (rawSegments === null) {
    return Object.freeze([{ kind: 'wildcard' }]);
  }
  const parsed: NormalizedPatternSegment[] = [];
  for (const segment of rawSegments) {
    if (
      segment === '*' ||
      segment === '**' ||
      segment.startsWith('**:') ||
      segment.startsWith('**{')
    ) {
      parsed.push({ kind: 'wildcard' });
      continue;
    }
    if (OPENAPI_PARAM_SEGMENT_PATTERN.test(segment)) {
      parsed.push({ kind: 'param' });
      continue;
    }
    const honoParam = parseHonoParamSegment(segment);
    if (honoParam !== null) {
      parsed.push(honoParam);
      continue;
    }
    if (segment.includes('*')) {
      parsed.push({ kind: 'wildcard' });
      continue;
    }
    parsed.push({ kind: 'static', value: segment });
  }
  return Object.freeze(parsed);
}

function regexCanMatchConcreteSegment(regex: RegExp, value: string): boolean {
  return regex.test(value);
}

function regexCanMatchSegmentSlice(
  regex: RegExp,
  segments: readonly NormalizedPatternSegment[],
  start: number,
  count: number,
): boolean {
  let allStatic = true;
  const parts: string[] = [];
  for (let offset = 0; offset < count; offset += 1) {
    const seg = segments[start + offset];
    if (seg === undefined || seg.kind !== 'static') {
      allStatic = false;
      break;
    }
    parts.push(seg.value);
  }
  if (allStatic) {
    return regex.test(parts.join('/'));
  }
  return true;
}

function singleSegmentIntersects(
  left: NormalizedPatternSegment,
  right: NormalizedPatternSegment,
): boolean {
  if (left.kind === 'static' && right.kind === 'static') {
    return left.value === right.value;
  }
  if (left.kind === 'regex-param' && right.kind === 'static') {
    return regexCanMatchConcreteSegment(left.regex, right.value);
  }
  if (right.kind === 'regex-param' && left.kind === 'static') {
    return regexCanMatchConcreteSegment(right.regex, left.value);
  }
  if (left.kind === 'optional-param' && left.regex && right.kind === 'static') {
    return regexCanMatchConcreteSegment(left.regex, right.value);
  }
  if (right.kind === 'optional-param' && right.regex && left.kind === 'static') {
    return regexCanMatchConcreteSegment(right.regex, left.value);
  }
  return true;
}

/**
 * Dispatch-equivalent symmetric unification determining whether there exists at least one concrete
 * request pathname matched by both `leftPattern` and `rightPattern`.
 */
export function patternsIntersect(leftPattern: string, rightPattern: string): boolean {
  const left = parsePathPatternSegments(leftPattern);
  const right = parsePathPatternSegments(rightPattern);
  const memo = new Map<number, boolean>();
  const stride = right.length + 1;

  function match(i: number, j: number): boolean {
    const key = i * stride + j;
    const cached = memo.get(key);
    if (cached !== undefined) return cached;

    let result = false;
    const l = i < left.length ? left[i] : undefined;
    const r = j < right.length ? right[j] : undefined;

    if (i === left.length && j === right.length) {
      result = true;
    } else if (l?.kind === 'wildcard') {
      result = match(i + 1, j) || (j < right.length && match(i, j + 1));
    } else if (r?.kind === 'wildcard') {
      result = match(i, j + 1) || (i < left.length && match(i + 1, j));
    } else if (l?.kind === 'optional-param') {
      if (match(i + 1, j)) {
        result = true;
      } else if (l.regex && l.canSpanSlash) {
        for (let k = 1; j + k <= right.length; k += 1) {
          if (regexCanMatchSegmentSlice(l.regex, right, j, k) && match(i + 1, j + k)) {
            result = true;
            break;
          }
        }
      } else if (r !== undefined && singleSegmentIntersects(l, r)) {
        result = match(i + 1, j + 1);
      }
    } else if (r?.kind === 'optional-param') {
      if (match(i, j + 1)) {
        result = true;
      } else if (r.regex && r.canSpanSlash) {
        for (let k = 1; i + k <= left.length; k += 1) {
          if (regexCanMatchSegmentSlice(r.regex, left, i, k) && match(i + k, j + 1)) {
            result = true;
            break;
          }
        }
      } else if (l !== undefined && singleSegmentIntersects(l, r)) {
        result = match(i + 1, j + 1);
      }
    } else if (l?.kind === 'regex-param' && l.canSpanSlash) {
      for (let k = 1; j + k <= right.length; k += 1) {
        if (regexCanMatchSegmentSlice(l.regex, right, j, k) && match(i + 1, j + k)) {
          result = true;
          break;
        }
      }
    } else if (r?.kind === 'regex-param' && r.canSpanSlash) {
      for (let k = 1; i + k <= left.length; k += 1) {
        if (regexCanMatchSegmentSlice(r.regex, left, i, k) && match(i + k, j + 1)) {
          result = true;
          break;
        }
      }
    } else if (l !== undefined && r !== undefined) {
      result = singleSegmentIntersects(l, r) && match(i + 1, j + 1);
    }

    memo.set(key, result);
    return result;
  }

  return match(0, 0);
}
