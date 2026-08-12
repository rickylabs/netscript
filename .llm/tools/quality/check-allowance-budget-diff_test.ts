import { assertEquals } from '@std/assert';
import { checkAllowanceBudgetDiff } from './check-allowance-budget-diff.ts';

function config(defaultMax: number, repoMax: number): string {
  return JSON.stringify({
    tasks: {
      'quality:scan': `deno run scanner.ts --max-allow ${defaultMax}`,
      'quality:scan:repo': `deno run scanner.ts --max-allow ${repoMax}`,
    },
  });
}

Deno.test('allowance budget increase without a same-diff issue link is RED', () => {
  assertEquals(
    checkAllowanceBudgetDiff(
      config(7, 8),
      config(7, 9),
      ['diff --git a/deno.json b/deno.json', '+  "quality:scan:repo": "--max-allow 9"'].join('\n'),
    ),
    {
      ok: false,
      increases: [{ task: 'quality:scan:repo', before: 8, after: 9 }],
      issueLinked: false,
    },
  );
});

Deno.test('allowance budget increase with a same-diff issue link is GREEN', () => {
  assertEquals(
    checkAllowanceBudgetDiff(
      config(7, 8),
      config(8, 9),
      [
        'diff --git a/deno.json b/deno.json',
        '+  "quality:scan": "--max-allow 8"',
        '+Budget increase is tracked by #1549.',
      ].join('\n'),
    ),
    {
      ok: true,
      increases: [
        { task: 'quality:scan', before: 7, after: 8 },
        { task: 'quality:scan:repo', before: 8, after: 9 },
      ],
      issueLinked: true,
    },
  );
});

Deno.test('unchanged or falling allowance budgets need no issue link', () => {
  assertEquals(checkAllowanceBudgetDiff(config(7, 8), config(6, 8), ''), {
    ok: true,
    increases: [],
    issueLinked: false,
  });
});
