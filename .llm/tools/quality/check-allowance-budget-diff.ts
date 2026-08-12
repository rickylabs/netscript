#!/usr/bin/env -S deno run --allow-run

const QUALITY_TASKS = ['quality:scan', 'quality:scan:repo'] as const;

/** One quality task whose allowance ceiling rose in a pull-request diff. */
export interface AllowanceBudgetIncrease {
  readonly task: (typeof QUALITY_TASKS)[number];
  readonly before: number;
  readonly after: number;
}

/** Verdict for the same-diff allowance-budget issue-link predicate. */
export interface AllowanceBudgetDiffResult {
  readonly ok: boolean;
  readonly increases: readonly AllowanceBudgetIncrease[];
  readonly issueLinked: boolean;
}

function taskCommand(source: string, task: (typeof QUALITY_TASKS)[number]): string | undefined {
  const parsed = JSON.parse(source) as { tasks?: Record<string, string | { command?: string }> };
  const value = parsed.tasks?.[task];
  return typeof value === 'string' ? value : value?.command;
}

function allowanceCeiling(command: string | undefined): number | undefined {
  if (!command) return undefined;
  const match = /(?:^|\s)--max-allow(?:=|\s+)(\d+)(?:\s|$)/.exec(command);
  return match ? Number(match[1]) : undefined;
}

function addedLines(diff: string): string {
  return diff.split(/\r?\n/)
    .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
    .map((line) => line.slice(1))
    .join('\n');
}

/** Require an issue link on an added diff line whenever an existing allowance ceiling rises. */
export function checkAllowanceBudgetDiff(
  baseDenoJson: string,
  headDenoJson: string,
  diff: string,
): AllowanceBudgetDiffResult {
  const increases = QUALITY_TASKS.flatMap((task): AllowanceBudgetIncrease[] => {
    const before = allowanceCeiling(taskCommand(baseDenoJson, task));
    const after = allowanceCeiling(taskCommand(headDenoJson, task));
    if (before === undefined || after === undefined || after <= before) return [];
    return [{ task, before, after }];
  });
  const additions = addedLines(diff);
  const issueLinked =
    /(?:^|[^\w])#[1-9]\d*\b|https:\/\/github\.com\/[^\s/]+\/[^\s/]+\/issues\/[1-9]\d*\b/m
      .test(additions);
  return { ok: increases.length === 0 || issueLinked, increases, issueLinked };
}

async function gitText(args: readonly string[]): Promise<string> {
  const output = await new Deno.Command('git', { args: [...args] }).output();
  if (!output.success) throw new Error(new TextDecoder().decode(output.stderr).trim());
  return new TextDecoder().decode(output.stdout);
}

if (import.meta.main) {
  const [base, head] = Deno.args.filter((arg) => arg !== '--pretty');
  if (!base || !head) {
    console.error('usage: check-allowance-budget-diff.ts <base> <head> [--pretty]');
    Deno.exit(2);
  }
  const [baseDenoJson, headDenoJson, diff] = await Promise.all([
    gitText(['show', `${base}:deno.json`]),
    gitText(['show', `${head}:deno.json`]),
    gitText(['diff', '--unified=0', `${base}...${head}`]),
  ]);
  const result = checkAllowanceBudgetDiff(baseDenoJson, headDenoJson, diff);
  console.log(JSON.stringify(result, null, Deno.args.includes('--pretty') ? 2 : undefined));
  if (!result.ok) Deno.exit(1);
}
