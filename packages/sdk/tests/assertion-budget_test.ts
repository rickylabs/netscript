import { assertEquals } from '@std/assert';

interface AssertionBudget {
  readonly file: URL;
  readonly expected: number;
}

const SDK_ASSERTION_BUDGETS: readonly AssertionBudget[] = [
  {
    file: new URL('../src/ports/service-client.ts', import.meta.url),
    expected: 0,
  },
  {
    file: new URL('../src/ports/query-factory.ts', import.meta.url),
    expected: 0,
  },
  {
    file: new URL('../src/presets/define-services.ts', import.meta.url),
    expected: 1,
  },
  {
    file: new URL('../src/client/service-client.ts', import.meta.url),
    expected: 1,
  },
  {
    file: new URL('../src/query/query-factory.ts', import.meta.url),
    expected: 5,
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

Deno.test('SDK assertion scanner recognizes assertions without counting comments or literals', () => {
  assertEquals(countTypeAssertions('const value = source as Target;'), 1);
  assertEquals(countTypeAssertions('const value = source as const;'), 0);
  assertEquals(countTypeAssertions('const value = <Target> source;'), 1);
  assertEquals(countTypeAssertions('function identity<T>(value: T): T { return value; }'), 0);
  assertEquals(countTypeAssertions('// source as Target\nconst text = "value as Target";'), 0);
});

for (const budget of SDK_ASSERTION_BUDGETS) {
  Deno.test(`type assertion budget remains ${budget.expected}: ${budget.file.pathname}`, async () => {
    const source = await Deno.readTextFile(budget.file);
    assertEquals(countTypeAssertions(source), budget.expected);
  });
}

Deno.test('SDK metadata boundary has no explicit any tokens', async () => {
  for (const budget of SDK_ASSERTION_BUDGETS.slice(0, 2)) {
    const source = stripCommentsAndStrings(await Deno.readTextFile(budget.file));
    assertEquals(countMatches(source, /\bany\b/g), 0, budget.file.pathname);
  }
});
