import type { Reporter, ReportEvent } from '../../ports/reporter.ts';

const encoder = new TextEncoder();

/** Human-readable reporter for local smoke runs. */
export class PrettyReporter implements Reporter {
  async emit(event: ReportEvent): Promise<void> {
    if (event.type === 'suite-start') {
      await write(`Running ${event.suiteId}\n`);
    } else if (event.type === 'gate-start') {
      await write(`> ${event.gateId}: ${event.title}\n`);
    } else if (event.type === 'gate-end') {
      await write(`  ${event.result.verdict.toUpperCase()} ${event.result.durationMs}ms\n`);
    } else {
      await write(
        `Summary: passed=${event.report.summary.passed} failed=${event.report.summary.failed}\n`,
      );
    }
  }
}

function write(text: string): Promise<number> {
  return Deno.stdout.write(encoder.encode(text));
}
