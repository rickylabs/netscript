/** CLI edge that writes the validated, secret-safe rollout canary matrix. */

import { runRolloutCanaries } from './rollout-canary-runner.ts';

interface Args {
  readonly worktree: string;
  readonly output: string;
}
function usage(): string {
  return 'Usage: deno task agentic:rollout-canary --worktree <native-ext4-path> --output <json-path>';
}
export function parseRolloutArgs(args: readonly string[]): Args {
  const values = new Map<string, string>();
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];
    if (
      !['--worktree', '--output'].includes(key) || !value || value.startsWith('--') ||
      values.has(key)
    ) {
      throw new Error(usage());
    }
    values.set(key, value);
  }
  const worktree = values.get('--worktree');
  const output = values.get('--output');
  if (!worktree?.startsWith('/') || !output) throw new Error(usage());
  return { worktree, output };
}

async function main(): Promise<number> {
  try {
    const args = parseRolloutArgs(Deno.args);
    const outcome = await runRolloutCanaries(args.worktree, new Date().toISOString());
    await Deno.writeTextFile(args.output, `${JSON.stringify(outcome, null, 2)}\n`);
    console.log(JSON.stringify({
      schemaVersion: outcome.schemaVersion,
      overallStatus: outcome.overallStatus,
      promotionRecommendation: outcome.promotionRecommendation,
      canaryCount: outcome.canaries.length,
      output: args.output,
    }));
    return outcome.overallStatus === 'fail'
      ? 5
      : outcome.overallStatus === 'conditional_pass'
      ? 4
      : 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : usage());
    return 3;
  }
}
if (import.meta.main) Deno.exitCode = await main();
