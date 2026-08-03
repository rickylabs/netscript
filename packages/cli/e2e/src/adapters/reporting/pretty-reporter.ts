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
      await this.output(`  ${event.result.verdict.toUpperCase()} ${event.result.durationMs}ms\n`);
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
        `Summary: passed=${event.report.summary.passed} failed=${event.report.summary.failed}\n`,
      );
    }
  }
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
