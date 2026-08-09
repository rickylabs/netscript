import type { Reporter, ReportEvent } from '../../ports/reporter.ts';

const encoder = new TextEncoder();

/** Human-readable reporter for local smoke runs. */
export class PrettyReporter implements Reporter {
  constructor(private readonly output: (text: string) => Promise<unknown> = write) {}

  async emit(event: ReportEvent): Promise<void> {
    if (event.type === 'suite-start') {
      await write(`Running ${event.suiteId}\n`);
    } else if (event.type === 'gate-start') {
      await write(`> ${event.gateId}: ${event.title}\n`);
    } else if (event.type === 'gate-end') {
      await this.output(formatVerdict(event.result));
      if (event.result.verdict === 'failed') {
        if (event.result.error) await this.output(indent(event.result.error));
        const command = event.result.evidence.find((item) => item.kind === 'command');
        if (command?.kind === 'command') {
          const detail = readString(command.data, 'stderrTail') ||
            readString(command.data, 'stdoutTail');
          if (detail) await this.output(indent(detail));
        }
      }
    } else {
      await write(
        `Summary: passed=${event.report.summary.passed} failed=${event.report.summary.failed} skipped=${event.report.summary.skipped}\n`,
      );
    }
  }
}

function formatVerdict(
  result: Extract<ReportEvent, { readonly type: 'gate-end' }>['result'],
): string {
  const verdict = result.verdict.toUpperCase();
  if (!result.retried) return `  ${verdict} ${result.durationMs}ms\n`;
  const durations = result.attempts.map((attempt) => formatDuration(attempt.durationMs)).join(
    ' + ',
  );
  if (result.verdict === 'passed') {
    const previous = result.attempts[result.attempts.length - 2];
    return `  ${verdict} (attempt ${result.attempts.length}/${result.attempts.length} after ${previous.failureClass} attempt ${previous.attempt}, ${durations})\n`;
  }
  const failureClass = result.attempts.at(-1)?.failureClass;
  const classification = failureClass ? `; failure class: ${failureClass}` : '';
  return `  ${verdict} ${result.durationMs}ms (attempt durations: ${durations}${classification})\n`;
}

function formatDuration(durationMs: number): string {
  if (durationMs < 1_000) return `${durationMs}ms`;
  const seconds = durationMs / 1_000;
  return `${Number.isInteger(seconds) ? seconds : seconds.toFixed(1)}s`;
}

function indent(text: string): string {
  return `${text.trimEnd().split('\n').map((line) => `    ${line}`).join('\n')}\n`;
}

function readString(value: unknown, key: string): string {
  if (!value || typeof value !== 'object') return '';
  const field = Reflect.get(value, key);
  return typeof field === 'string' ? field : '';
}

function write(text: string): Promise<number> {
  return Deno.stdout.write(encoder.encode(text));
}
