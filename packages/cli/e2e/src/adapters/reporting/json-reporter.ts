import type { Reporter, ReportEvent } from '../../ports/reporter.ts';

const encoder = new TextEncoder();

/** Single JSON report writer. */
export class JsonReporter implements Reporter {
  async emit(event: ReportEvent): Promise<void> {
    if (event.type !== 'suite-end') return;
    await Deno.stdout.write(encoder.encode(`${JSON.stringify(event.report, null, 2)}\n`));
  }
}
