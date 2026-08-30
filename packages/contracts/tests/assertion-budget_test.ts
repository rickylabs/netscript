import { assertEquals } from 'jsr:@std/assert@^1';

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

function stripCommentsAndStrings(source: string): string {
  let result = '';
  let index = 0;

  while (index < source.length) {
    const character = source[index];
    const next = source[index + 1];

    if (character === '/' && next === '/') {
      while (index < source.length && source[index] !== '\n') {
        result += ' ';
        index += 1;
      }
      continue;
    }

    if (character === '/' && next === '*') {
      result += '  ';
      index += 2;
      while (
        index < source.length &&
        !(source[index] === '*' && source[index + 1] === '/')
      ) {
        result += source[index] === '\n' ? '\n' : ' ';
        index += 1;
      }
      if (index < source.length) {
        result += '  ';
        index += 2;
      }
      continue;
    }

    if (character === "'" || character === '"' || character === '`') {
      const quote = character;
      result += ' ';
      index += 1;
      while (index < source.length) {
        if (source[index] === '\\') {
          result += '  ';
          index += 2;
          continue;
        }
        if (source[index] === quote) {
          result += ' ';
          index += 1;
          break;
        }
        result += source[index] === '\n' ? '\n' : ' ';
        index += 1;
      }
      continue;
    }

    result += character;
    index += 1;
  }

  return result;
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

Deno.test('base contract initializer remains pinned to NetScript procedure metadata', async () => {
  const primitives = stripCommentsAndStrings(
    await Deno.readTextFile(CONTRACT_ASSERTION_BUDGETS[0].file),
  );

  assertEquals(
    countMatches(
      primitives,
      /oc\.\$meta<NetScriptProcedureMeta>\(\{\}\)\.errors\(commonErrorMap\)/g,
    ),
    1,
  );
});
