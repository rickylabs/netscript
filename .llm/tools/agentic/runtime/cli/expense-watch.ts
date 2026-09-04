/** Structured pre-dispatch subscription expense check. */

import { resolve } from 'node:path';
import { normalizeTaskArguments } from '../../lib/task-arguments.ts';
import {
  evaluateSubscriptionExpense,
  EXPENSE_PROVIDERS,
  type ExpenseProvider,
  parseExpenseUsageSnapshot,
} from '../subscription-expense.ts';
import {
  fetchOpenCodeGoUsageSnapshot,
  type OpenCodeGoUsageDependencies,
} from '../provider-usage.ts';

interface Options {
  readonly provider: ExpenseProvider;
  readonly model?: string;
  readonly snapshotPath?: string;
  readonly estimatedCostUsd: number;
  readonly now: string;
  readonly pretty: boolean;
}

function value(args: readonly string[], index: number, flag: string): string {
  const result = args[index + 1];
  if (!result?.trim()) throw new Error(`${flag} requires a value`);
  return result;
}

function parse(args: readonly string[]): Options {
  args = normalizeTaskArguments(args);
  let provider: ExpenseProvider | undefined;
  let snapshotPath: string | undefined;
  let model: string | undefined;
  let estimatedCostUsd: number | undefined;
  let now = new Date().toISOString();
  let pretty = false;
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === '--provider') {
      const candidate = value(args, index++, argument);
      if (!EXPENSE_PROVIDERS.includes(candidate as ExpenseProvider)) {
        throw new Error('--provider must be opencode_go, ollama, or openrouter');
      }
      provider = candidate as ExpenseProvider;
    } else if (argument === '--snapshot') {
      snapshotPath = value(args, index++, argument);
    } else if (argument === '--model') {
      model = value(args, index++, argument);
    } else if (argument === '--estimated-cost-usd') {
      estimatedCostUsd = Number(value(args, index++, argument));
    } else if (argument === '--now') {
      now = value(args, index++, argument);
    } else if (argument === '--pretty') {
      pretty = true;
    } else throw new Error(`unknown argument: ${argument}`);
  }
  if (!provider || !estimatedCostUsd || estimatedCostUsd <= 0) {
    throw new Error(
      'Usage: expense-watch --provider <provider> --model <model> or --snapshot <json> ' +
        '--estimated-cost-usd <positive-number> [--now <iso>] [--pretty]',
    );
  }
  if (provider === 'opencode_go' ? !model : !snapshotPath) {
    throw new Error(
      provider === 'opencode_go'
        ? 'OpenCode Go expense watch requires --model'
        : `${provider} expense watch requires --snapshot`,
    );
  }
  return {
    provider,
    estimatedCostUsd,
    now,
    pretty,
    ...(model ? { model } : {}),
    ...(snapshotPath ? { snapshotPath } : {}),
  };
}

export async function runExpenseWatch(
  args: readonly string[],
  dependencies: OpenCodeGoUsageDependencies = {},
): Promise<number> {
  let options: Options;
  try {
    options = parse(args);
    const snapshot = options.provider === 'opencode_go'
      ? await fetchOpenCodeGoUsageSnapshot(options.model!, {
        ...dependencies,
        now: () => options.now,
      })
      : parseExpenseUsageSnapshot(
        await (dependencies.readTextFile ?? Deno.readTextFile)(resolve(options.snapshotPath!)),
      );
    const decision = evaluateSubscriptionExpense({
      provider: options.provider,
      model: options.model,
      snapshot,
      estimatedCostUsd: options.estimatedCostUsd,
      now: options.now,
    });
    console.log(JSON.stringify(decision, null, options.pretty ? 2 : undefined));
    return decision.allowed ? 0 : 4;
  } catch (error) {
    console.log(JSON.stringify({
      allowed: false,
      reason: 'usage_unproven',
      error: error instanceof Error ? error.message : String(error),
    }));
    return 4;
  }
}

if (import.meta.main) Deno.exitCode = await runExpenseWatch(Deno.args);
