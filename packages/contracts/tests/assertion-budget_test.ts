import { assertEquals, assertNotEquals } from 'jsr:@std/assert@^1';

interface AssertionBudget {
  readonly file: URL;
  readonly expected: number;
}

const CONTRACT_ASSERTION_BUDGETS: readonly AssertionBudget[] = [
  {
    file: new URL('../src/application/contract-primitives.ts', import.meta.url),
    expected: 0,
  },
  {
    file: new URL('../src/domain/procedure-meta.ts', import.meta.url),
    expected: 0,
  },
];

type SourceSegmentKind = 'code' | 'comment' | 'string';

interface SourceSegment {
  readonly kind: SourceSegmentKind;
  readonly text: string;
}

function segmentSource(source: string): SourceSegment[] {
  const segments: SourceSegment[] = [];
  let index = 0;
  let codeStart = 0;

  const take = (kind: SourceSegmentKind, end: number): void => {
    if (index > codeStart) {
      segments.push({ kind: 'code', text: source.slice(codeStart, index) });
    }
    segments.push({ kind, text: source.slice(index, end) });
    index = end;
    codeStart = end;
  };

  while (index < source.length) {
    const character = source[index];
    const next = source[index + 1];

    if (character === '/' && next === '/') {
      const newline = source.indexOf('\n', index);
      take('comment', newline === -1 ? source.length : newline);
      continue;
    }

    if (character === '/' && next === '*') {
      const close = source.indexOf('*/', index + 2);
      take('comment', close === -1 ? source.length : close + 2);
      continue;
    }

    if (character === "'" || character === '"' || character === '`') {
      let end = index + 1;
      while (end < source.length && source[end] !== character) {
        end += source[end] === '\\' ? 2 : 1;
      }
      take('string', Math.min(end + 1, source.length));
      continue;
    }

    index += 1;
  }

  if (index > codeStart) {
    segments.push({ kind: 'code', text: source.slice(codeStart, index) });
  }
  return segments;
}

/** Blanks every segment of the given kinds, preserving offsets and line breaks. */
function maskSource(source: string, masked: ReadonlySet<SourceSegmentKind>): string {
  return segmentSource(source)
    .map(({ kind, text }) => masked.has(kind) ? text.replace(/[^\n]/g, ' ') : text)
    .join('');
}

function stripCommentsAndStrings(source: string): string {
  return maskSource(source, new Set(['comment', 'string']));
}

function stripComments(source: string): string {
  return maskSource(source, new Set(['comment']));
}

function countMatches(source: string, pattern: RegExp): number {
  return Array.from(source.matchAll(pattern)).length;
}

function countTypeAssertions(source: string): number {
  const stripped = stripCommentsAndStrings(source);
  const asAssertions = countMatches(stripped, /\bas\s+(?!const\b)/g);
  const angleBracketAssertions = countMatches(
    stripped,
    /(?:^|[=([{,:;!?&|]\s*)<\s*[A-Za-z_$][\w$]*(?:\s*(?:[.|,&]\s*)[A-Za-z_$][\w$]*)*\s*>\s*(?=[A-Za-z_$0-9([{:])/gm,
  );
  return asAssertions + angleBracketAssertions;
}

Deno.test('assertion scanner recognizes assertions without counting comments or literals', () => {
  assertEquals(countTypeAssertions('const value = source as Target;'), 1);
  assertEquals(countTypeAssertions('const value = source as const;'), 0);
  assertEquals(countTypeAssertions('const value = <Target> source;'), 1);
  assertEquals(countTypeAssertions('function identity<T>(value: T): T { return value; }'), 0);
  assertEquals(countTypeAssertions('// source as Target\nconst text = "value as Target";'), 0);
});

for (const budget of CONTRACT_ASSERTION_BUDGETS) {
  Deno.test(`type assertion budget remains ${budget.expected}: ${budget.file.pathname}`, async () => {
    const source = await Deno.readTextFile(budget.file);
    assertEquals(countTypeAssertions(source), budget.expected);
  });
}

Deno.test('contracts metadata boundary has no imports or explicit any tokens', async () => {
  const primitives = stripCommentsAndStrings(
    await Deno.readTextFile(CONTRACT_ASSERTION_BUDGETS[0].file),
  );
  const metadata = stripCommentsAndStrings(
    await Deno.readTextFile(CONTRACT_ASSERTION_BUDGETS[1].file),
  );

  assertEquals(countMatches(metadata, /\bimport\s/g), 0);
  assertEquals(countMatches(primitives, /\bany\b/g), 0);
  assertEquals(countMatches(metadata, /\bany\b/g), 0);
});

const PINNED_BASE_CONTRACT_INITIALIZER =
  'oc.$meta<NetScriptProcedureMeta>({}).errors(commonErrorMap)';

interface PinnedBinding {
  readonly name: string;
  readonly declaration: RegExp;
}

/** The only declaration each identifier in the pinned initializer may be bound to. */
const BASE_CONTRACT_BINDINGS: readonly PinnedBinding[] = [
  { name: 'oc', declaration: /\bimport\s*\{\s*oc\s*\}\s*from\s*'@orpc\/contract'\s*;/g },
  {
    name: 'NetScriptProcedureMeta',
    declaration:
      /\bimport\s+type\s*\{\s*NetScriptProcedureMeta\s*\}\s*from\s*'\.\.\/domain\/procedure-meta\.ts'\s*;/g,
  },
  {
    name: 'commonErrorMap',
    declaration: /\bexport\s+const\s+commonErrorMap\s*:\s*CommonErrorMap\s*=/g,
  },
];

/**
 * Returns the initializer of the single `export const <name>` statement in code-only source, or
 * `undefined` when that declaration is missing, duplicated, or unbalanced. Bracket depth is tracked
 * so a `=` or `;` inside the type annotation (a default type parameter, an object type member) is
 * neither taken as the initializer nor as the end of the statement.
 */
function extractExportedConstInitializer(code: string, name: string): string | undefined {
  const anchors = Array.from(code.matchAll(new RegExp(`\\bexport\\s+const\\s+${name}\\b`, 'g')));
  if (anchors.length !== 1) return undefined;

  let depth = 0;
  let initializerStart = -1;
  for (let index = anchors[0].index + anchors[0][0].length; index < code.length; index += 1) {
    const character = code[index];
    if (character === '=' && code[index + 1] === '>') {
      index += 1;
    } else if ('<({['.includes(character)) {
      depth += 1;
    } else if ('>)}]'.includes(character)) {
      depth -= 1;
      if (depth < 0) return undefined;
    } else if (depth === 0 && character === '=' && initializerStart === -1) {
      initializerStart = index + 1;
    } else if (depth === 0 && character === ';') {
      return initializerStart === -1 ? undefined : code.slice(initializerStart, index);
    }
  }
  return undefined;
}

/** Counts every site that binds `name`: declarations, import specifiers, and `as` renames. */
function countBindingSites(code: string, name: string): number {
  return countMatches(
    code,
    new RegExp(
      `\\b(?:const|let|var|function|class|type|interface|enum|namespace|import)\\s+${name}\\b` +
        `|[{,]\\s*(?:type\\s+)?${name}\\s*[,}]|\\bas\\s+${name}\\b`,
      'g',
    ),
  );
}

/** Counts matches that begin in code rather than inside a string literal. */
function countCodeMatches(code: string, codeAndStrings: string, pattern: RegExp): number {
  return Array.from(codeAndStrings.matchAll(pattern))
    .filter((match) => code[match.index] === codeAndStrings[match.index]).length;
}

/** Names every base contract pin the source violates; an empty list means the pin holds. */
function baseContractPinViolations(source: string): string[] {
  const code = stripCommentsAndStrings(source);
  const codeAndStrings = stripComments(source);
  const violations: string[] = [];

  const initializer = extractExportedConstInitializer(code, 'baseContract');
  if (initializer?.replace(/\s+/g, '') !== PINNED_BASE_CONTRACT_INITIALIZER) {
    violations.push('baseContract initializer');
  }
  if (countMatches(code, /\bimport\s*\(/g) !== 0) {
    violations.push('import() type');
  }
  for (const { name, declaration } of BASE_CONTRACT_BINDINGS) {
    if (
      countBindingSites(code, name) !== 1 ||
      countCodeMatches(code, codeAndStrings, declaration) !== 1
    ) {
      violations.push(`${name} binding`);
    }
  }
  return violations;
}

interface PinFixture {
  readonly name: string;
  readonly perturb: (source: string) => string;
  readonly violations: readonly string[];
}

const B2_INITIALIZER =
  'oc.$meta<NetScriptProcedureMeta & { readonly extra?: string }>({}).errors(commonErrorMap)';

/** Perturbations of the real source; each must keep failing (or passing) the pin as listed. */
const BASE_CONTRACT_PIN_FIXTURES: readonly PinFixture[] = [
  {
    name: 'H-1 rebinding NetScriptProcedureMeta to an import() type',
    perturb: (source) =>
      source.replace(
        /import type \{ NetScriptProcedureMeta \} from '\.\.\/domain\/procedure-meta\.ts';/,
        () =>
          "type NetScriptProcedureMeta = import('../domain/procedure-meta.ts').NetScriptProcedureMeta & { readonly extra?: string };",
      ),
    violations: ['import() type', 'NetScriptProcedureMeta binding'],
  },
  {
    name: 'H-1 rebinding oc to a local wrapper',
    perturb: (source) =>
      source.replace(
        /import \{ oc \} from '@orpc\/contract';/,
        () => "import { oc as upstream } from '@orpc/contract';\nconst oc = upstream;",
      ),
    violations: ['oc binding'],
  },
  {
    name: 'H-1 rebinding NetScriptProcedureMeta behind a decoy import string',
    perturb: (source) =>
      source.replace(
        /import type \{ NetScriptProcedureMeta \} from '\.\.\/domain\/procedure-meta\.ts';/,
        () =>
          "type NetScriptProcedureMeta = { readonly extra?: string };\nconst _decoy = `import type { NetScriptProcedureMeta } from '../domain/procedure-meta.ts';`;",
      ),
    violations: ['NetScriptProcedureMeta binding'],
  },
  {
    name: 'perturbation B2 plus a dead decoy carrying the pinned text',
    perturb: (source) =>
      source.replace(PINNED_BASE_CONTRACT_INITIALIZER, () => B2_INITIALIZER) +
      `\nconst _legacyBase = ${PINNED_BASE_CONTRACT_INITIALIZER};\nvoid _legacyBase;\n`,
    violations: ['baseContract initializer'],
  },
  {
    name: 'perturbation B2 plus the pinned text in a trailing comment',
    perturb: (source) =>
      source.replace(PINNED_BASE_CONTRACT_INITIALIZER, () => B2_INITIALIZER) +
      `\n// export const baseContract: X = ${PINNED_BASE_CONTRACT_INITIALIZER};\n`,
    violations: ['baseContract initializer'],
  },
  {
    name: 'H-2 default type parameter and object type member in the annotation',
    perturb: (source) =>
      source.replace(
        /BaseContractMeta\s*>\s*=\s*oc\./,
        () => 'BaseContractMeta & { readonly probe?: <T = unknown>() => T; }\n> = oc.',
      ),
    violations: [],
  },
];

Deno.test('base contract initializer remains pinned to NetScript procedure metadata', async () => {
  const source = await Deno.readTextFile(CONTRACT_ASSERTION_BUDGETS[0].file);

  assertEquals(baseContractPinViolations(source), []);
});

for (const fixture of BASE_CONTRACT_PIN_FIXTURES) {
  Deno.test(`base contract pin fixture: ${fixture.name}`, async () => {
    const source = await Deno.readTextFile(CONTRACT_ASSERTION_BUDGETS[0].file);
    const perturbed = fixture.perturb(source);

    assertNotEquals(perturbed, source, 'perturbation no longer applies to the real source');
    assertEquals(baseContractPinViolations(perturbed), fixture.violations);
  });
}
