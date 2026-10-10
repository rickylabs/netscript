/** Run isolated and paired DLQ regressions in fresh processes, retaining every wrapper verdict. */
import { join } from '@std/path';
import type { TestReport } from '../run-deno-test.ts';

const typedTests = 'packages/queue/tests/typed-queue_test.ts';
const pairedTests = 'packages/sdk/tests/cache/cache-query-kv-limit_test.ts';

async function main(): Promise<void> {
  const iterationsArg = Deno.args.indexOf('--iterations');
  const outputArg = Deno.args.indexOf('--out-dir');
  const iterations = iterationsArg < 0 ? 200 : Number(Deno.args[iterationsArg + 1]);
  const outDir = outputArg < 0 ? '.llm/tmp/typed-dlq-stress' : Deno.args[outputArg + 1];
  if (!Number.isInteger(iterations) || iterations < 1 || !outDir) {
    throw new Error(
      'Usage: stress-typed-dlq.ts [--iterations <positive integer>] [--out-dir <path>]',
    );
  }
  await Deno.mkdir(outDir, { recursive: true });
  const head = await new Deno.Command('git', { args: ['rev-parse', 'HEAD'], stdout: 'piped' })
    .output();
  if (!head.success) throw new Error('Cannot determine source head');
  const summary = {
    schemaVersion: 1,
    headSha: new TextDecoder().decode(head.stdout).trim(),
    iterations,
    retries: 0,
    isolated: { runs: 0, passed: 0, failed: 0 },
    paired: { runs: 0, passed: 0, failed: 0 },
  };
  for (let iteration = 1; iteration <= iterations; iteration++) {
    for (const mode of ['isolated', 'paired'] as const) {
      const output = join(outDir, `${mode}-${iteration}.json`);
      const result = await new Deno.Command(Deno.execPath(), {
        args: [
          'run',
          '--allow-read',
          '--allow-write',
          '--allow-run',
          '.llm/tools/run-deno-test.ts',
          '--output',
          output,
          '--',
          '--frozen',
          '--allow-all',
          typedTests,
          ...(mode === 'paired' ? [pairedTests] : []),
        ],
        stdout: 'piped',
        stderr: 'piped',
      }).output();
      const report: TestReport = JSON.parse(await Deno.readTextFile(output));
      summary[mode].runs++;
      summary[mode].passed += report.summary.passed;
      summary[mode].failed += report.summary.failed;
      const ok = result.success && report.exitCode === 0 && report.summary.failed === 0 &&
        report.summary.passed >= 5;
      await Deno.writeTextFile(join(outDir, 'summary.json'), `${JSON.stringify(summary)}\n`);
      if (!ok) {
        console.error(JSON.stringify({ mode, iteration, exitCode: result.code, report: output }));
        Deno.exit(1);
      }
    }
    if (iteration % 20 === 0) console.log(JSON.stringify(summary));
  }
  console.log(JSON.stringify(summary));
}

if (import.meta.main) await main();
